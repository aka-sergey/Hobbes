#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${BOT_TOKEN:-}" ]]; then
  echo "BOT_TOKEN is required" >&2
  exit 1
fi

if [[ -z "${GATEWAY_TOKEN:-}" ]]; then
  echo "GATEWAY_TOKEN is required" >&2
  exit 1
fi

install -d -m 755 -o hobbes -g hobbes /home/hobbes/.openclaw
install -d -m 755 -o hobbes -g hobbes /home/hobbes/.openclaw/workspace-main
install -d -m 755 -o hobbes -g hobbes /home/hobbes/.openclaw/workspace-main/memory
install -d -m 755 -o hobbes -g hobbes /home/hobbes/.openclaw/cron
install -d -m 755 -o hobbes -g hobbes /home/hobbes/.openclaw/canvas
install -d -m 755 -o hobbes -g hobbes /home/hobbes/.openclaw/agents/main/agent
install -d -m 755 -o hobbes -g hobbes /home/hobbes/.openclaw/agents/main/sessions
install -d -m 755 -o hobbes -g hobbes /home/hobbes/.config/systemd/user

hobbes_uid="$(id -u hobbes)"
hobbes_runtime_dir="/run/user/${hobbes_uid}"
hobbes_bus="unix:path=${hobbes_runtime_dir}/bus"

run_as_hobbes() {
  sudo -u hobbes env \
    HOME=/home/hobbes \
    XDG_RUNTIME_DIR="${hobbes_runtime_dir}" \
    DBUS_SESSION_BUS_ADDRESS="${hobbes_bus}" \
    "$@"
}

cat >/home/hobbes/.openclaw/openclaw.json <<EOF
{
  "meta": {
    "lastTouchedVersion": "2026.3.13",
    "lastTouchedAt": "$(date -u +%FT%TZ)"
  },
  "auth": {
    "profiles": {
      "openai:default": {
        "provider": "openai",
        "mode": "api_key"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-4o-mini",
        "fallbacks": [
          "openai/gpt-4o-mini",
          "openai/gpt-4o"
        ]
      },
      "imageModel": {
        "primary": "openai/gpt-4.1-mini"
      },
      "workspace": "/home/hobbes/.openclaw/workspace-main"
    }
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto",
    "restart": true,
    "ownerDisplay": "raw"
  },
  "tools": {
    "media": {
      "audio": {
        "enabled": true,
        "maxBytes": 20971520,
        "language": "ru",
        "echoTranscript": true,
        "echoFormat": "📝 {transcript}",
        "scope": {
          "default": "deny",
          "rules": [
            {
              "action": "allow",
              "match": {
                "chatType": "direct"
              }
            }
          ]
        },
        "models": [
          {
            "provider": "openai",
            "model": "gpt-4o-mini-transcribe"
          }
        ]
      }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "pairing",
      "groupPolicy": "disabled",
      "streaming": "partial",
      "botToken": "${BOT_TOKEN}",
      "network": {
        "autoSelectFamily": false,
        "dnsResultOrder": "ipv4first"
      }
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "channelHealthCheckMinutes": 0,
    "reload": {
      "mode": "off"
    },
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}"
    },
    "tailscale": {
      "mode": "off",
      "resetOnExit": false
    }
  }
}
EOF

cat >/home/hobbes/.openclaw/workspace-main/AGENTS.md <<'EOF'
# Hobbes Phase 1

Base install complete. This workspace will become the primary Hobbes agent workspace in phase 2.
EOF

cat >/home/hobbes/.openclaw/workspace-main/SOUL.md <<'EOF'
Name: Hobbes
Persona: calm operational assistant
Tone: concise, reliable, pragmatic
EOF

cat >/home/hobbes/.openclaw/workspace-main/TOOLS.md <<'EOF'
Use tools carefully. Prefer files for long outputs. Keep operational changes reversible.
EOF

cat >/home/hobbes/.openclaw/workspace-main/USER.md <<'EOF'
Primary user: Sergey
EOF

cat >/home/hobbes/.openclaw/workspace-main/MEMORY.md <<'EOF'
# Memory

Phase 1 fresh install.
EOF

cat >/home/hobbes/.openclaw/workspace-main/HEARTBEAT.md <<'EOF'
If nothing needs attention, reply HEARTBEAT_OK.
EOF

cat >/home/hobbes/.openclaw/workspace-main/BOOTSTRAP.md <<'EOF'
This is a clean VPS installation for Hobbes.
EOF

cat >/home/hobbes/.openclaw/agents/main/agent/auth-profiles.json <<'EOF'
{
  "profiles": {}
}
EOF

chown -R hobbes:hobbes /home/hobbes/.openclaw
chmod 600 /home/hobbes/.openclaw/openclaw.json
chmod 600 /home/hobbes/.openclaw/agents/main/agent/auth-profiles.json

if [[ ! -f /home/hobbes/.openclaw/.env ]]; then
  cat >/home/hobbes/.openclaw/.env <<'EOF'
# Provider API keys for the OpenClaw daemon.
# Example:
# OPENAI_API_KEY=sk-...
EOF
fi
if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  cat >/home/hobbes/.openclaw/.env <<EOF
OPENAI_API_KEY=${OPENAI_API_KEY}
EOF
fi
chown hobbes:hobbes /home/hobbes/.openclaw/.env
chmod 600 /home/hobbes/.openclaw/.env

cat >/usr/local/bin/hobbes-health.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

uid="$(id -u hobbes)"
runtime_dir="/run/user/$uid"
bus="unix:path=$runtime_dir/bus"

run_as_hobbes() {
  sudo -u hobbes env \
    HOME=/home/hobbes \
    XDG_RUNTIME_DIR="$runtime_dir" \
    DBUS_SESSION_BUS_ADDRESS="$bus" \
    "$@"
}

echo "== systemd =="
run_as_hobbes systemctl --user is-active openclaw-gateway.service
echo "== health =="
curl -fsS http://127.0.0.1:18792/ || exit 1
echo
echo "== recent logs =="
run_as_hobbes journalctl --user-unit=openclaw-gateway.service -n 20 --no-pager
EOF

cat >/usr/local/bin/hobbes-backup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ts="$(date -u +%Y%m%dT%H%M%SZ)"
dest="/root/hobbes-backups"
mkdir -p "$dest"
tar -czf "$dest/openclaw-$ts.tgz" \
  /home/hobbes/.openclaw \
  /home/hobbes/.config/systemd/user/openclaw-gateway.service
echo "$dest/openclaw-$ts.tgz"
EOF

chmod 755 /usr/local/bin/hobbes-health.sh /usr/local/bin/hobbes-backup.sh

cat >/home/hobbes/.config/systemd/user/openclaw-gateway.service <<'EOF'
[Unit]
Description=OpenClaw Gateway
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
WorkingDirectory=%h
Environment=HOME=%h
Environment=PATH=/usr/bin:/bin
EnvironmentFile=-%h/.openclaw/.env
ExecStart=/usr/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

chown hobbes:hobbes /home/hobbes/.config/systemd/user/openclaw-gateway.service
chmod 644 /home/hobbes/.config/systemd/user/openclaw-gateway.service

loginctl enable-linger hobbes
systemctl start "user@${hobbes_uid}.service"

if [[ -f /etc/systemd/system/openclaw.service ]]; then
  systemctl disable --now openclaw.service || true
  rm -f /etc/systemd/system/openclaw.service
  systemctl daemon-reload
fi

pkill -u hobbes -f openclaw || true
run_as_hobbes systemctl --user daemon-reload
run_as_hobbes systemctl --user enable --now openclaw-gateway.service
