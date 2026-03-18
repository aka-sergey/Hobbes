import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, getSql, hasDatabase } from "./db";
import { getGitHubFile, hasGitHubControl, listGitHubFileHistory, updateGitHubFile } from "./github-control";
import { getRuntimeTarget, hasRuntimeSync, syncRuntimeFile } from "./runtime-sync";
import {
  parseBehaviorProfilesContent,
  parseChatPoliciesContent,
  parsePersonaIdsFromMarkdown,
  validateBehaviorProfilesDocument,
  validateChatPoliciesDocument
} from "./telegram-policies";

export type ControlFileScope = "repo_only" | "repo_and_runtime";
export type ControlFileKind = "markdown" | "json";

export type ControlFileItem = {
  path: string;
  label: string;
  section: string;
  description: string;
  kind: ControlFileKind;
  scope: ControlFileScope;
};

export type ControlDraftRow = {
  file_path: string;
  content_type: string;
  content: string;
  updated_at: string;
};

type ControlRuntimeSyncJobRow = {
  id: number;
  file_path: string;
  remote_path: string;
  content: string;
  status: string;
  created_at: string;
  claimed_at: string | null;
  applied_at: string | null;
  updated_at: string;
  last_error: string | null;
};

export type ControlSourceBackend = "github" | "filesystem";

const CHAT_POLICIES_PATH = "config/telegram/chat_policies.example.json";
const BEHAVIOR_PROFILES_PATH = "config/telegram/behavior_profiles.example.json";
const COMMS_PERSONAS_PATH = "config/agents/comms/workspace/PERSONAS.md";

const CONTROL_FILE_ITEMS: ControlFileItem[] = [
  {
    path: "docs/Telegram_Current_State_2026-03-18.md",
    label: "Текущий статус Telegram",
    section: "Документы",
    description: "Актуальный checkpoint по Telegram-слою Hobbes.",
    kind: "markdown",
    scope: "repo_only"
  },
  {
    path: "docs/Telegram_Group_Policy_Kit.md",
    label: "Политики групп Telegram",
    section: "Политики",
    description: "Правила ролей, триггеров включения и молчания бота в группах.",
    kind: "markdown",
    scope: "repo_only"
  },
  {
    path: "docs/Telegram_Behavior_Profiles.md",
    label: "Профили поведения Telegram",
    section: "Документы",
    description: "Описание новой модели профилей поведения и памяти по чатам.",
    kind: "markdown",
    scope: "repo_only"
  },
  {
    path: "docs/Telegram_Test_Mode.md",
    label: "Режим теста ботов",
    section: "Тестирование",
    description: "Описание безопасного bot evaluator режима.",
    kind: "markdown",
    scope: "repo_only"
  },
  {
    path: "docs/Telegram_Bot_Test_Questionnaire.md",
    label: "Вопросник для тестов",
    section: "Тестирование",
    description: "Набор вопросов для проверки другого Telegram-бота.",
    kind: "markdown",
    scope: "repo_only"
  },
  {
    path: "docs/Search_Current_State_2026-03-18.md",
    label: "Статус поиска",
    section: "Документы",
    description: "Честный статус search/router и открытых проблем.",
    kind: "markdown",
    scope: "repo_only"
  },
  {
    path: "docs/Dashboard_Control_Center_Architecture.md",
    label: "Архитектура пульта",
    section: "Документы",
    description: "Концепция Control Center и этапы развития.",
    kind: "markdown",
    scope: "repo_only"
  },
  {
    path: CHAT_POLICIES_PATH,
    label: "Конфиг политик чатов",
    section: "Политики",
    description: "Роли и правила реакции Hobbes по группам Telegram.",
    kind: "json",
    scope: "repo_and_runtime"
  },
  {
    path: BEHAVIOR_PROFILES_PATH,
    label: "Конфиг профилей поведения",
    section: "Политики",
    description: "Библиотека профилей поведения для разных чатов и групп.",
    kind: "json",
    scope: "repo_and_runtime"
  },
  {
    path: "config/telegram/test_mode.example.json",
    label: "Конфиг test mode",
    section: "Политики",
    description: "Настройки режима проверки другого бота.",
    kind: "json",
    scope: "repo_only"
  },
  {
    path: "config/agents/main/workspace/PERSONAS.md",
    label: "Персоны main",
    section: "Агенты",
    description: "Правила поведения и ролей фронтового Telegram-агента.",
    kind: "markdown",
    scope: "repo_and_runtime"
  },
  {
    path: "config/agents/main/workspace/REMINDERS.md",
    label: "Напоминания main",
    section: "Агенты",
    description: "Правила intake для напоминаний и follow-up.",
    kind: "markdown",
    scope: "repo_and_runtime"
  },
  {
    path: "config/agents/chief/workspace/REMINDERS.md",
    label: "Напоминания chief",
    section: "Агенты",
    description: "Нормализация reminder-задач у chief.",
    kind: "markdown",
    scope: "repo_and_runtime"
  },
  {
    path: "config/agents/chief/workspace/MEETING_PREP.md",
    label: "Meeting prep chief",
    section: "Агенты",
    description: "Пакет для подготовки встреч, созвонов и повесток.",
    kind: "markdown",
    scope: "repo_and_runtime"
  },
  {
    path: "config/agents/chief/workspace/DOCUMENT_SHAPES.md",
    label: "Шаблоны документов chief",
    section: "Агенты",
    description: "Формы предложений, memo, brief и checklist.",
    kind: "markdown",
    scope: "repo_and_runtime"
  },
  {
    path: "config/agents/comms/workspace/PERSONAS.md",
    label: "Персоны comms",
    section: "Агенты",
    description: "Финальная persona-шлифовка для ответов пользователю.",
    kind: "markdown",
    scope: "repo_and_runtime"
  },
  {
    path: "config/agents/comms/workspace/DOCUMENT_SHAPES.md",
    label: "Шаблоны документов comms",
    section: "Агенты",
    description: "Финальные формы Telegram update, proposal, memo и brief.",
    kind: "markdown",
    scope: "repo_and_runtime"
  }
];

function tryRepoRoot() {
  const envRoot = process.env.HOBBES_CONTROL_ROOT;
  if (envRoot) {
    return envRoot;
  }

  const cwd = process.cwd();
  const parent = path.resolve(cwd, "..");
  return parent;
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getControlFileItems() {
  return CONTROL_FILE_ITEMS;
}

export function resolveControlPath(relativePath: string) {
  return path.join(tryRepoRoot(), relativePath);
}

export async function getControlFiles() {
  const rows = await Promise.all(
    CONTROL_FILE_ITEMS.map(async (item) => {
      let available = false;

      if (hasGitHubControl()) {
        const githubFile = await getGitHubFile(item.path);
        available = Boolean(githubFile?.available);
      } else {
        const absolutePath = resolveControlPath(item.path);
        available = await exists(absolutePath);
      }

      return {
        ...item,
        available
      };
    })
  );

  return rows;
}

export async function getControlFile(pathValue: string) {
  const item = CONTROL_FILE_ITEMS.find((entry) => entry.path === pathValue);

  if (!item) {
    return null;
  }

  const absolutePath = resolveControlPath(item.path);
  let available = false;
  let sourceContent = "";
  let sourceBackend: ControlSourceBackend = "filesystem";
  let repoUrl: string | null = null;
  let repoBranch: string | null = null;

  if (hasGitHubControl()) {
    const githubFile = await getGitHubFile(item.path);
    available = Boolean(githubFile?.available);
    sourceContent = githubFile?.sourceContent ?? "";
    sourceBackend = "github";
    repoUrl = githubFile?.htmlUrl ?? null;
    repoBranch = githubFile?.branch ?? null;
  } else {
    available = await exists(absolutePath);
    sourceContent = available ? await readFile(absolutePath, "utf8") : "";
  }

  const draft = await getDraft(item.path);

  return {
    ...item,
    available,
    absolutePath,
    sourceContent,
    sourceBackend,
    repoUrl,
    repoBranch,
    draftContent: draft?.content ?? sourceContent,
    draftUpdatedAt: draft?.updated_at ?? null,
    hasDraft: Boolean(draft)
  };
}

export async function getControlFileHistory(pathValue: string) {
  const item = CONTROL_FILE_ITEMS.find((entry) => entry.path === pathValue);

  if (!item) {
    return null;
  }

  return listGitHubFileHistory(item.path, 10);
}

export async function applyControlFileToRepo(pathValue: string, content: string) {
  const item = CONTROL_FILE_ITEMS.find((entry) => entry.path === pathValue);

  if (!item) {
    throw new Error("file_not_allowed");
  }

  if (!hasGitHubControl()) {
    throw new Error("github_control_not_configured");
  }

  const validation = await validateControlContent(item.kind, content, item.path);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const message = `Control Center: update ${item.path}`;
  const result = await updateGitHubFile(item.path, content, message);

  return {
    ...result,
    validation
  };
}

export async function syncControlFileToRuntime(pathValue: string) {
  const item = CONTROL_FILE_ITEMS.find((entry) => entry.path === pathValue);

  if (!item) {
    throw new Error("file_not_allowed");
  }

  if (item.scope !== "repo_and_runtime") {
    throw new Error("runtime_sync_not_allowed_for_scope");
  }

  if (!hasGitHubControl()) {
    throw new Error("github_control_not_configured");
  }

  if (!hasRuntimeSync()) {
    throw new Error("runtime_sync_not_configured");
  }

  if (!getRuntimeTarget(item.path)) {
    throw new Error("runtime_target_not_allowed");
  }

  const file = await getControlFile(item.path);

  if (!file?.available) {
    throw new Error("source_not_available");
  }

  return syncRuntimeFile(item.path, file.sourceContent);
}

export async function enqueueControlRuntimeSync(pathValue: string) {
  const item = CONTROL_FILE_ITEMS.find((entry) => entry.path === pathValue);

  if (!item) {
    throw new Error("file_not_allowed");
  }

  if (item.scope !== "repo_and_runtime") {
    throw new Error("runtime_sync_not_allowed_for_scope");
  }

  const target = getRuntimeTarget(item.path);

  if (!target) {
    throw new Error("runtime_target_not_allowed");
  }

  if (!hasDatabase()) {
    throw new Error("database_not_configured");
  }

  const file = await getControlFile(item.path);

  if (!file?.available) {
    throw new Error("source_not_available");
  }

  await ensureSchema();
  const sql = getSql();

  const rows = await sql<ControlRuntimeSyncJobRow[]>`
    INSERT INTO control_runtime_sync_jobs (
      file_path,
      remote_path,
      content,
      status,
      created_at,
      updated_at
    )
    VALUES (
      ${item.path},
      ${target.remotePath},
      ${file.sourceContent},
      'pending',
      NOW(),
      NOW()
    )
    RETURNING id, file_path, remote_path, content, status, created_at, claimed_at, applied_at, updated_at, last_error
  `;

  return rows[0];
}

export async function claimNextRuntimeSyncJob() {
  if (!hasDatabase()) {
    throw new Error("database_not_configured");
  }

  await ensureSchema();
  const sql = getSql();

  const rows = await sql<ControlRuntimeSyncJobRow[]>`
    WITH next_job AS (
      SELECT id
      FROM control_runtime_sync_jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE control_runtime_sync_jobs
    SET
      status = 'in_progress',
      claimed_at = NOW(),
      updated_at = NOW()
    WHERE id IN (SELECT id FROM next_job)
    RETURNING id, file_path, remote_path, content, status, created_at, claimed_at, applied_at, updated_at, last_error
  `;

  return rows[0] ?? null;
}

export async function completeRuntimeSyncJob(id: number, status: "applied" | "failed", lastError?: string | null) {
  if (!hasDatabase()) {
    throw new Error("database_not_configured");
  }

  await ensureSchema();
  const sql = getSql();

  const rows = await sql<ControlRuntimeSyncJobRow[]>`
    UPDATE control_runtime_sync_jobs
    SET
      status = ${status},
      applied_at = CASE WHEN ${status} = 'applied' THEN NOW() ELSE applied_at END,
      updated_at = NOW(),
      last_error = ${lastError ?? null}
    WHERE id = ${id}
    RETURNING id, file_path, remote_path, content, status, created_at, claimed_at, applied_at, updated_at, last_error
  `;

  return rows[0] ?? null;
}

export async function getDraft(pathValue: string) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();

  const rows = await sql<ControlDraftRow[]>`
    SELECT file_path, content_type, content, updated_at
    FROM control_drafts
    WHERE file_path = ${pathValue}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function saveDraft(pathValue: string, kind: ControlFileKind, content: string) {
  if (!hasDatabase()) {
    throw new Error("database_not_configured");
  }

  await ensureSchema();
  const sql = getSql();

  const rows = await sql<ControlDraftRow[]>`
    INSERT INTO control_drafts (file_path, content_type, content, updated_at)
    VALUES (${pathValue}, ${kind}, ${content}, NOW())
    ON CONFLICT (file_path)
    DO UPDATE SET
      content_type = EXCLUDED.content_type,
      content = EXCLUDED.content,
      updated_at = NOW()
    RETURNING file_path, content_type, content, updated_at
  `;

  return rows[0];
}

async function loadLinkedControlContent(pathValue: string) {
  const file = await getControlFile(pathValue);
  return file?.draftContent ?? file?.sourceContent ?? "";
}

async function validateTelegramControlBundle(pathValue: string, content: string) {
  const behaviorProfilesContent =
    pathValue === BEHAVIOR_PROFILES_PATH ? content : await loadLinkedControlContent(BEHAVIOR_PROFILES_PATH);
  const chatPoliciesContent =
    pathValue === CHAT_POLICIES_PATH ? content : await loadLinkedControlContent(CHAT_POLICIES_PATH);
  const personasContent = await loadLinkedControlContent(COMMS_PERSONAS_PATH);

  const personaIds = personasContent ? parsePersonaIdsFromMarkdown(personasContent) : [];
  const behaviorProfiles = parseBehaviorProfilesContent(behaviorProfilesContent);
  const chatPolicies = parseChatPoliciesContent(chatPoliciesContent);

  const profileIssues = validateBehaviorProfilesDocument(behaviorProfiles, personaIds);
  const chatIssues = validateChatPoliciesDocument(chatPolicies, behaviorProfiles);
  const issues = [...profileIssues, ...chatIssues];
  const error = issues.find((issue) => issue.level === "error");

  if (error) {
    return {
      ok: false as const,
      message: error.message
    };
  }

  const warning = issues.find((issue) => issue.level === "warning");

  return {
    ok: true as const,
    message: warning ? `JSON валиден, но есть предупреждение: ${warning.message}` : "JSON валиден."
  };
}

export async function validateControlContent(kind: ControlFileKind, content: string, pathValue?: string) {
  if (kind === "json") {
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;

      if (pathValue === CHAT_POLICIES_PATH || pathValue === BEHAVIOR_PROFILES_PATH) {
        if (typeof parsed.version !== "number") {
          return {
            ok: false as const,
            message: "В Telegram policy JSON должен быть числовой version."
          };
        }

        return validateTelegramControlBundle(pathValue, content);
      }

      if (pathValue === "config/telegram/test_mode.example.json") {
        const requiredKeys = ["trigger", "target", "execution", "questionnaire", "report"];

        for (const key of requiredKeys) {
          if (!(key in parsed)) {
            return {
              ok: false as const,
              message: `В test mode отсутствует обязательный раздел: ${key}.`
            };
          }
        }
      }

      return {
        ok: true as const,
        message: "JSON валиден."
      };
    } catch (error) {
      return {
        ok: false as const,
      message: error instanceof Error ? `Ошибка JSON: ${error.message}` : "Ошибка JSON."
    };
  }
  }

  if (!content.trim()) {
    return {
      ok: false as const,
      message: "Markdown не должен быть пустым."
    };
  }

  if (!content.includes("# ")) {
    return {
      ok: false as const,
      message: "В Markdown должен быть хотя бы один заголовок первого уровня."
    };
  }

  if (pathValue?.endsWith("PERSONAS.md") && !content.includes("## `")) {
    return {
      ok: false as const,
      message: "В PERSONAS.md ожидаются секции персон вида ## `persona_name`."
    };
  }

  if (pathValue?.endsWith("REMINDERS.md")) {
    if (!content.includes("Normalize into:") || !content.includes("Rules:")) {
      return {
        ok: false as const,
        message: "В REMINDERS.md должны быть блоки Normalize into: и Rules:."
      };
    }
  }

  if (pathValue?.endsWith("MEETING_PREP.md") && !content.toLowerCase().includes("meeting")) {
    return {
      ok: false as const,
      message: "В MEETING_PREP.md ожидается явное упоминание meeting/встреч."
    };
  }

  if (pathValue?.endsWith("DOCUMENT_SHAPES.md") && !content.toLowerCase().includes("draft")) {
    return {
      ok: false as const,
      message: "В DOCUMENT_SHAPES.md ожидается описание draft/document shapes."
    };
  }

  return {
    ok: true as const,
    message: "Markdown выглядит корректно."
  };
}
