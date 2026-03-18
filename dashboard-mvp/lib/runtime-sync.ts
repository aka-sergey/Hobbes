import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

type RuntimeSyncConfig = {
  host: string;
  user: string;
  password: string;
};

type RuntimeTarget = {
  remotePath: string;
  restartRequired: boolean;
};

export type RuntimeSyncResult = {
  remotePath: string;
  restarted: boolean;
  serviceState: string;
  healthState: string;
};

const RUNTIME_TARGETS: Record<string, RuntimeTarget> = {
  "config/telegram/chat_policies.example.json": {
    remotePath: "/home/hobbes/.openclaw/policies/chat_policies.json",
    restartRequired: true
  },
  "config/telegram/behavior_profiles.example.json": {
    remotePath: "/home/hobbes/.openclaw/policies/behavior_profiles.json",
    restartRequired: true
  },
  "config/agents/main/workspace/PERSONAS.md": {
    remotePath: "/home/hobbes/.openclaw/workspace-main/PERSONAS.md",
    restartRequired: true
  },
  "config/agents/main/workspace/REMINDERS.md": {
    remotePath: "/home/hobbes/.openclaw/workspace-main/REMINDERS.md",
    restartRequired: true
  },
  "config/agents/chief/workspace/REMINDERS.md": {
    remotePath: "/home/hobbes/.openclaw/workspace-chief/REMINDERS.md",
    restartRequired: true
  },
  "config/agents/chief/workspace/MEETING_PREP.md": {
    remotePath: "/home/hobbes/.openclaw/workspace-chief/MEETING_PREP.md",
    restartRequired: true
  },
  "config/agents/chief/workspace/DOCUMENT_SHAPES.md": {
    remotePath: "/home/hobbes/.openclaw/workspace-chief/DOCUMENT_SHAPES.md",
    restartRequired: true
  },
  "config/agents/comms/workspace/PERSONAS.md": {
    remotePath: "/home/hobbes/.openclaw/workspace-comms/PERSONAS.md",
    restartRequired: true
  },
  "config/agents/comms/workspace/DOCUMENT_SHAPES.md": {
    remotePath: "/home/hobbes/.openclaw/workspace-comms/DOCUMENT_SHAPES.md",
    restartRequired: true
  }
};

function getRuntimeSyncConfig(): RuntimeSyncConfig | null {
  const host = process.env.HOBBES_VPS_HOST;
  const user = process.env.HOBBES_VPS_USER;
  const password = process.env.HOBBES_VPS_PASSWORD;

  if (!host || !user || !password) {
    return null;
  }

  return { host, user, password };
}

function getPostSyncHook(pathValue: string) {
  if (
    pathValue === "config/telegram/chat_policies.example.json" ||
    pathValue === "config/telegram/behavior_profiles.example.json"
  ) {
    return "python3 /usr/local/bin/compile-telegram-group-policies.py";
  }

  return null;
}

export function hasRuntimeSync() {
  return Boolean(getRuntimeSyncConfig());
}

export function getRuntimeTarget(pathValue: string) {
  return RUNTIME_TARGETS[pathValue] ?? null;
}

type SSHClient = {
  on: (event: string, listener: (...args: any[]) => void) => SSHClient;
  connect: (config: Record<string, unknown>) => void;
  end: () => void;
  exec: (command: string, callback: (error: Error | undefined | null, stream: any) => void) => void;
  sftp: (callback: (error: Error | undefined | null, sftp: any) => void) => void;
};

async function createClient(): Promise<SSHClient> {
  const ssh2 = await import("ssh2");
  const ClientCtor = ssh2.Client as unknown as new () => SSHClient;
  return new ClientCtor();
}

async function withConnection<T>(handler: (client: SSHClient) => Promise<T>) {
  const config = getRuntimeSyncConfig();

  if (!config) {
    throw new Error("runtime_sync_not_configured");
  }

  const client = await createClient();

  return new Promise<T>((resolve, reject) => {

    client
      .on("ready", async () => {
        try {
          const result = await handler(client);
          client.end();
          resolve(result);
        } catch (error) {
          client.end();
          reject(error);
        }
      })
      .on("error", (error) => {
        reject(error);
      })
      .connect({
        host: config.host,
        username: config.user,
        password: config.password
      });
  });
}

function execCommand(client: SSHClient, command: string) {
  return new Promise<string>((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) {
        reject(error);
        return;
      }

      let stdout = "";
      let stderr = "";

      stream
        .on("close", (code: number | null) => {
          if (code === 0) {
            resolve(stdout.trim());
            return;
          }

          reject(new Error(stderr.trim() || stdout.trim() || `remote_command_failed:${code ?? "unknown"}`));
        })
        .on("data", (chunk: Buffer | string) => {
          stdout += chunk.toString();
        });

      stream.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });
    });
  });
}

function openSftp(client: SSHClient) {
  return new Promise<any>((resolve, reject) => {
    client.sftp((error, sftp) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(sftp);
    });
  });
}

function fastPut(sftp: any, localPath: string, remotePath: string) {
  return new Promise<void>((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (error: Error | undefined | null) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export async function syncRuntimeFile(pathValue: string, content: string): Promise<RuntimeSyncResult> {
  const target = getRuntimeTarget(pathValue);

  if (!target) {
    throw new Error("runtime_target_not_allowed");
  }

  const tmpBase = await mkdtemp(path.join(tmpdir(), "hobbes-control-sync-"));
  const localPath = path.join(tmpBase, path.basename(target.remotePath));

  try {
    await writeFile(localPath, content, "utf8");

    return await withConnection(async (client) => {
      const sftp = await openSftp(client);
      const remoteTmp = `/tmp/${path.basename(target.remotePath)}.${Date.now()}.tmp`;
      const remoteDir = path.dirname(target.remotePath);

      await execCommand(client, `mkdir -p ${JSON.stringify(remoteDir)}`);
      await fastPut(sftp, localPath, remoteTmp);
      await execCommand(
        client,
        `install -o hobbes -g hobbes -m 644 ${JSON.stringify(remoteTmp)} ${JSON.stringify(target.remotePath)} && rm -f ${JSON.stringify(remoteTmp)}`
      );

      const postSyncHook = getPostSyncHook(pathValue);
      if (postSyncHook) {
        await execCommand(client, postSyncHook);
      }

      let serviceState = "not_restarted";
      let healthState = "not_checked";

      if (target.restartRequired) {
        await execCommand(
          client,
          'runuser -u hobbes -- env XDG_RUNTIME_DIR="/run/user/$(id -u hobbes)" systemctl --user restart openclaw-gateway.service'
        );
        serviceState = await execCommand(
          client,
          'runuser -u hobbes -- env XDG_RUNTIME_DIR="/run/user/$(id -u hobbes)" systemctl --user is-active openclaw-gateway.service'
        );
        healthState = await execCommand(
          client,
          'bash -lc \'for i in 1 2 3 4 5 6; do if curl -fsS http://127.0.0.1:18792/ >/dev/null 2>&1; then echo OK; exit 0; fi; sleep 2; done; echo DEGRADED\''
        );
      }

      return {
        remotePath: target.remotePath,
        restarted: target.restartRequired,
        serviceState,
        healthState
      };
    });
  } finally {
    await rm(tmpBase, { recursive: true, force: true });
  }
}
