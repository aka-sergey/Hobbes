import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, getSql, hasDatabase } from "./db";

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
    path: "config/telegram/chat_policies.example.json",
    label: "Конфиг политик чатов",
    section: "Политики",
    description: "Роли и правила реакции Hobbes по группам Telegram.",
    kind: "json",
    scope: "repo_only"
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
      const absolutePath = resolveControlPath(item.path);
      const available = await exists(absolutePath);
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
  const available = await exists(absolutePath);
  const sourceContent = available ? await readFile(absolutePath, "utf8") : "";
  const draft = await getDraft(item.path);

  return {
    ...item,
    available,
    absolutePath,
    sourceContent,
    draftContent: draft?.content ?? sourceContent,
    draftUpdatedAt: draft?.updated_at ?? null,
    hasDraft: Boolean(draft)
  };
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

export function validateControlContent(kind: ControlFileKind, content: string) {
  if (kind === "json") {
    try {
      JSON.parse(content);
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

  return {
    ok: true as const,
    message: "Markdown выглядит корректно."
  };
}
