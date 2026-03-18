"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  TelegramBehaviorProfilesBuilder,
  TelegramChatPoliciesBuilder
} from "./TelegramPolicyBuilders";

type ControlFileListItem = {
  path: string;
  label: string;
  section: string;
  description: string;
  kind: "markdown" | "json";
  scope: "repo_only" | "repo_and_runtime";
  available: boolean;
};

type ControlFileResponse = {
  path: string;
  label: string;
  section: string;
  description: string;
  kind: "markdown" | "json";
  scope: "repo_only" | "repo_and_runtime";
  available: boolean;
  absolutePath: string;
  sourceContent: string;
  sourceBackend: "github" | "filesystem";
  repoUrl: string | null;
  repoBranch: string | null;
  draftContent: string;
  draftUpdatedAt: string | null;
  hasDraft: boolean;
};

type DiffSummary = {
  sourceLines: number;
  draftLines: number;
  changedLines: number;
};

type HistoryItem = {
  sha: string;
  message: string;
  authorName: string | null;
  committedAt: string | null;
  htmlUrl: string | null;
};

type ConfigHint = {
  key: string;
  meaning: string;
};

const CHAT_POLICIES_PATH = "config/telegram/chat_policies.example.json";
const BEHAVIOR_PROFILES_PATH = "config/telegram/behavior_profiles.example.json";
const COMMS_PERSONAS_PATH = "config/agents/comms/workspace/PERSONAS.md";

function diffSummary(source: string, draft: string): DiffSummary {
  const sourceLines = source.split("\n");
  const draftLines = draft.split("\n");
  const max = Math.max(sourceLines.length, draftLines.length);
  let changedLines = 0;

  for (let index = 0; index < max; index += 1) {
    if ((sourceLines[index] ?? "") !== (draftLines[index] ?? "")) {
      changedLines += 1;
    }
  }

  return {
    sourceLines: sourceLines.length,
    draftLines: draftLines.length,
    changedLines
  };
}

function MarkdownPreview({ content }: { content: string }) {
  const blocks = content.split("\n");
  const items: ReactNode[] = [];
  let listBuffer: string[] = [];
  let codeBuffer: string[] = [];
  let inCode = false;

  const flushList = () => {
    if (listBuffer.length > 0) {
      items.push(
        <ul key={`list-${items.length}`} className="preview-list">
          {listBuffer.map((line) => (
            <li key={`${items.length}-${line}`}>{line}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      items.push(
        <pre key={`code-${items.length}`} className="preview-code">
          {codeBuffer.join("\n")}
        </pre>
      );
      codeBuffer = [];
    }
  };

  for (const rawLine of blocks) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushList();
      if (inCode) {
        flushCode();
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      continue;
    }

    flushList();

    if (!line.trim()) {
      continue;
    }

    if (line.startsWith("### ")) {
      items.push(<h3 key={`h3-${items.length}`}>{line.slice(4)}</h3>);
      continue;
    }

    if (line.startsWith("## ")) {
      items.push(<h2 key={`h2-${items.length}`}>{line.slice(3)}</h2>);
      continue;
    }

    if (line.startsWith("# ")) {
      items.push(<h1 key={`h1-${items.length}`}>{line.slice(2)}</h1>);
      continue;
    }

    items.push(<p key={`p-${items.length}`}>{rawLine}</p>);
  }

  flushList();
  flushCode();

  return <div className="preview-markdown">{items}</div>;
}

function JsonPreview({ content }: { content: string }) {
  let formatted = content;
  let valid = true;

  try {
    formatted = JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    valid = false;
  }

  return (
    <div>
      <div className={valid ? "pill ok" : "pill danger"} style={{ marginBottom: "0.75rem" }}>
        {valid ? "JSON валиден" : "Ошибка JSON"}
      </div>
      <pre className="preview-code">{formatted}</pre>
    </div>
  );
}

function FilePreview({ kind, content }: { kind: "markdown" | "json"; content: string }) {
  if (kind === "json") {
    return <JsonPreview content={content} />;
  }

  return <MarkdownPreview content={content} />;
}

function getConfigHints(path: string, kind: "markdown" | "json"): ConfigHint[] {
  if (kind !== "json") {
    return [];
  }

  if (path.includes("chat_policies")) {
    return [
      { key: "chatId", meaning: "ID Telegram-чата или группы, для которой действует правило." },
      { key: "enabled", meaning: "Включено ли правило для этого чата." },
      { key: "profileId", meaning: "Идентификатор профиля поведения, который назначен чату." },
      { key: "promptOverride", meaning: "Локальная инструкция поверх профиля только для этого чата." },
      { key: "memoryPolicy.mode", meaning: "Режим памяти: off, chat_isolated, chat_plus_user, shared_domain." },
      { key: "replyPolicy.mode", meaning: "Общий режим включения бота: по упоминанию, ответу, ключевым словам." },
      { key: "activationKeywords", meaning: "Слова-триггеры, по которым бот может включаться сам." },
      { key: "topicPolicy.allow", meaning: "Темы, на которые бот может реагировать." },
      { key: "topicPolicy.deny", meaning: "Темы, на которые бот не должен отвечать." },
      { key: "style", meaning: "Язык, тон и форма ответа." }
    ];
  }

  if (path.includes("behavior_profiles")) {
    return [
      { key: "id", meaning: "Уникальный идентификатор профиля, который назначается чатам." },
      { key: "persona", meaning: "Базовая persona, которую должен применять comms/main." },
      { key: "systemPrompt", meaning: "Основной текст профиля поведения." },
      { key: "moderation", meaning: "Границы резкого тона, abuse и harassment." },
      { key: "memoryDefaults", meaning: "Память по умолчанию для чатов, использующих профиль." },
      { key: "topicPolicy", meaning: "Базовые allow/deny темы профиля." }
    ];
  }

  if (path.includes("test_mode")) {
    return [
      { key: "enabled", meaning: "Включен ли режим тестирования других ботов." },
      { key: "allowedOperators", meaning: "Кто имеет право запускать тестовый режим." },
      { key: "targetChats", meaning: "Какие чаты или боты можно тестировать." },
      { key: "questionSet", meaning: "Какой набор вопросов использовать для проверки." },
      { key: "reporting", meaning: "Как сохранять и показывать результаты теста." }
    ];
  }

  return [
    { key: "JSON", meaning: "Конфигурационный файл. Сначала правим смысл, потом применяем в GitHub, затем при необходимости делаем Sync на VPS." }
  ];
}

function pickPreferredStartFile(files: ControlFileListItem[]) {
  const preferredOrder = [CHAT_POLICIES_PATH, BEHAVIOR_PROFILES_PATH];

  for (const pathValue of preferredOrder) {
    const match = files.find((entry) => entry.path === pathValue && entry.available);
    if (match) {
      return match;
    }
  }

  return files.find((entry) => entry.available) ?? files[0] ?? null;
}

export function ControlCenterClient() {
  const [files, setFiles] = useState<ControlFileListItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<ControlFileResponse | null>(null);
  const [linkedFiles, setLinkedFiles] = useState<Record<string, ControlFileResponse | null>>({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editorMode, setEditorMode] = useState<"constructor" | "json">("constructor");

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/control/files", { cache: "no-store" });
      const data = await response.json();
      setFiles(data.files ?? []);
      const preferredFile = pickPreferredStartFile(data.files ?? []);
      if (preferredFile) {
        setSelectedPath(preferredFile.path);
      }
      setLoading(false);
    };

    void run();
  }, []);

  useEffect(() => {
    if (!selectedPath) {
      return;
    }

    const run = async () => {
      setMessage("");
      const builderDeps =
        selectedPath === CHAT_POLICIES_PATH
          ? [BEHAVIOR_PROFILES_PATH]
          : selectedPath === BEHAVIOR_PROFILES_PATH
            ? [CHAT_POLICIES_PATH, COMMS_PERSONAS_PATH]
            : [];

      const requests = [
        fetch(`/api/control/file?path=${encodeURIComponent(selectedPath)}`, {
          cache: "no-store"
        }),
        fetch(`/api/control/history?path=${encodeURIComponent(selectedPath)}`, {
          cache: "no-store"
        }),
        ...builderDeps.map((pathValue) =>
          fetch(`/api/control/file?path=${encodeURIComponent(pathValue)}`, {
            cache: "no-store"
          })
        )
      ];
      const [fileResponse, historyResponse, ...linkedResponses] = await Promise.all(requests);

      const data = await fileResponse.json();
      const historyData = await historyResponse.json();
      const linkedEntries = await Promise.all(linkedResponses.map((response) => response.json()));
      const linkedRecord = builderDeps.reduce<Record<string, ControlFileResponse | null>>((acc, pathValue, index) => {
        acc[pathValue] = linkedEntries[index]?.file ?? null;
        return acc;
      }, {});

      setSelectedFile(data.file ?? null);
      setDraft(data.file?.draftContent ?? "");
      setHistory(historyData.history ?? []);
      setLinkedFiles(linkedRecord);
    };

    void run();
  }, [selectedPath]);

  useEffect(() => {
    if (selectedPath === CHAT_POLICIES_PATH || selectedPath === BEHAVIOR_PROFILES_PATH) {
      setEditorMode("constructor");
      return;
    }

    setEditorMode("json");
  }, [selectedPath]);

  const groupedFiles = useMemo(() => {
    return files.reduce<Record<string, ControlFileListItem[]>>((acc, file) => {
      acc[file.section] = acc[file.section] ?? [];
      acc[file.section].push(file);
      return acc;
    }, {});
  }, [files]);

  const summary = useMemo(() => {
    if (!selectedFile) {
      return null;
    }
    return diffSummary(selectedFile.sourceContent, draft);
  }, [draft, selectedFile]);

  const configHints = useMemo(() => {
    if (!selectedFile) {
      return [];
    }

    return getConfigHints(selectedFile.path, selectedFile.kind);
  }, [selectedFile]);

  const hasUnsyncedChanges = useMemo(() => {
    if (!selectedFile) {
      return false;
    }

    return draft !== selectedFile.sourceContent;
  }, [draft, selectedFile]);

  const supportsConstructor = selectedFile?.path === CHAT_POLICIES_PATH || selectedFile?.path === BEHAVIOR_PROFILES_PATH;
  const behaviorProfilesContent = linkedFiles[BEHAVIOR_PROFILES_PATH]?.draftContent ?? linkedFiles[BEHAVIOR_PROFILES_PATH]?.sourceContent ?? "";
  const chatPoliciesContent = linkedFiles[CHAT_POLICIES_PATH]?.draftContent ?? linkedFiles[CHAT_POLICIES_PATH]?.sourceContent ?? "";
  const personasContent = linkedFiles[COMMS_PERSONAS_PATH]?.draftContent ?? linkedFiles[COMMS_PERSONAS_PATH]?.sourceContent ?? "";

  async function handleSaveDraft() {
    if (!selectedFile) {
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/control/draft", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        path: selectedFile.path,
        kind: selectedFile.kind,
        content: draft
      })
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.message ?? "Не удалось сохранить черновик.");
      return;
    }

    setSelectedFile({
      ...selectedFile,
      draftContent: draft,
      draftUpdatedAt: data.draft?.updated_at ?? new Date().toISOString(),
      hasDraft: true
    });
    setMessage("Черновик сохранен в базе данных dashboard.");
  }

  async function handleApplyRepo() {
    if (!selectedFile) {
      return;
    }

    setApplying(true);
    setMessage("");

    const response = await fetch("/api/control/apply-repo", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        path: selectedFile.path,
        content: draft
      })
    });

    const data = await response.json();
    setApplying(false);

    if (!response.ok) {
      setMessage(data.message ?? "Не удалось применить изменения в GitHub.");
      return;
    }

    const [refreshedResponse, historyResponse] = await Promise.all([
      fetch(`/api/control/file?path=${encodeURIComponent(selectedFile.path)}`, {
        cache: "no-store"
      }),
      fetch(`/api/control/history?path=${encodeURIComponent(selectedFile.path)}`, {
        cache: "no-store"
      })
    ]);
    const refreshedData = await refreshedResponse.json();
    const historyData = await historyResponse.json();
    setSelectedFile(refreshedData.file ?? null);
    setDraft(refreshedData.file?.draftContent ?? draft);
    setHistory(historyData.history ?? []);

    const commitSha = data.result?.commitSha ? String(data.result.commitSha).slice(0, 7) : null;
    setMessage(commitSha ? `Изменения записаны в GitHub. Коммит: ${commitSha}` : "Изменения записаны в GitHub.");
  }

  async function handleSyncRuntime() {
    if (!selectedFile) {
      return;
    }

    if (hasUnsyncedChanges) {
      setMessage("Сначала примените правки в GitHub, затем синхронизируйте VPS.");
      return;
    }

    setSyncing(true);
    setMessage("");

    const response = await fetch("/api/control/sync-runtime", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        path: selectedFile.path
      })
    });

    const data = await response.json();
    setSyncing(false);

    if (!response.ok) {
      setMessage(data.message ?? "Не удалось синхронизировать файл на VPS.");
      return;
    }

    if (data.mode === "queued") {
      setMessage(`Задача синхронизации поставлена в очередь на VPS. Job #${data.result?.jobId ?? "?"}.`);
      return;
    }

    setMessage(`Файл отправлен на VPS. Сервис: ${data.result?.serviceState ?? "unknown"}, health: ${data.result?.healthState ?? "unknown"}.`);
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <div className="eyebrow">Пульт управления Hobbes</div>
          <h1>Редактируйте политики и документы без SSH.</h1>
          <p>
            Это безопасный v1 Control Center: только allowlisted файлы, черновики в базе,
            preview, diff и понятные подписи на русском языке.
          </p>
        </section>

        <section className="card" style={{ marginBottom: "16px" }}>
          <h2 className="section-title">Мини-инструкция</h2>
          <div className="control-help-grid">
            <div className="help-item">
              <strong>1. Выберите файл</strong>
              <p>Слева доступны только разрешенные документы и policy-файлы. По умолчанию панель открывает Telegram chat policies.</p>
            </div>
            <div className="help-item">
              <strong>2. Внесите правки</strong>
              <p>В центре редактируется черновик. Справа сразу видно preview и статус файла.</p>
            </div>
            <div className="help-item">
              <strong>3. Сохраните черновик</strong>
              <p>Черновик можно сохранить в базе, а затем отдельно применить изменения в GitHub одной кнопкой.</p>
            </div>
            <div className="help-item">
              <strong>4. Sync на VPS</strong>
              <p>Для runtime-файлов сначала примените правки в GitHub, а затем докатите их на рабочий сервер Hobbes.</p>
            </div>
          </div>
        </section>

        <section className="control-layout">
          <aside className="card control-sidebar">
            <h2 className="section-title">Файлы</h2>
            {loading ? <div className="muted">Загружаю список файлов…</div> : null}
            {Object.entries(groupedFiles).map(([section, entries]) => (
              <div key={section} style={{ marginBottom: "1rem" }}>
                <div className="control-section-label">{section}</div>
                <div className="control-file-list">
                  {entries.map((file) => (
                    <button
                      key={file.path}
                      className={`control-file-button ${selectedPath === file.path ? "active" : ""}`}
                      type="button"
                      onClick={() => setSelectedPath(file.path)}
                    >
                      <span>{file.label}</span>
                      <span className={file.available ? "pill ok" : "pill warn"}>
                        {file.available ? "доступен" : "недоступен"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <section className="card control-editor-card">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div>
                <h2 className="section-title">Редактор</h2>
                <strong>{selectedFile?.label ?? "Файл не выбран"}</strong>
                <div className="muted" style={{ marginTop: "0.35rem" }}>
                  {selectedFile?.description}
                </div>
              </div>
              <div className="control-meta">
                <span className={selectedFile?.available ? "pill ok" : "pill warn"}>
                  {selectedFile?.available ? "файл доступен" : "файл недоступен в текущем окружении"}
                </span>
                {selectedFile ? (
                  <span className="pill ok">
                    {selectedFile.sourceBackend === "github" ? "источник: GitHub" : "источник: локальный файл"}
                  </span>
                ) : null}
                {selectedFile ? (
                  <span className="pill ok">
                    {selectedFile.scope === "repo_and_runtime" ? "репозиторий + runtime" : "только репозиторий"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="muted mono control-path">
              {selectedFile?.path ?? "—"}
            </div>

            {supportsConstructor ? (
              <div className="builder-mode-toggle">
                <button
                  className={`action-button ${editorMode === "constructor" ? "primary" : ""}`}
                  type="button"
                  onClick={() => setEditorMode("constructor")}
                >
                  Конструктор
                </button>
                <button
                  className={`action-button ${editorMode === "json" ? "primary" : ""}`}
                  type="button"
                  onClick={() => setEditorMode("json")}
                >
                  JSON
                </button>
              </div>
            ) : null}

            {supportsConstructor && editorMode === "constructor" && selectedFile?.path === CHAT_POLICIES_PATH ? (
              <TelegramChatPoliciesBuilder
                content={draft}
                behaviorProfilesContent={behaviorProfilesContent}
                onChange={setDraft}
              />
            ) : null}

            {supportsConstructor && editorMode === "constructor" && selectedFile?.path === BEHAVIOR_PROFILES_PATH ? (
              <TelegramBehaviorProfilesBuilder
                content={draft}
                chatPoliciesContent={chatPoliciesContent}
                personasContent={personasContent}
                onChange={setDraft}
              />
            ) : null}

            {!supportsConstructor || editorMode === "json" ? (
              <textarea
                className="control-editor"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Выберите файл слева, чтобы начать редактирование."
                spellCheck={false}
              />
            ) : null}

            <div className="control-actions">
              <button className="action-button primary" type="button" onClick={() => void handleSaveDraft()} disabled={!selectedFile || saving}>
                {saving ? "Сохраняю…" : "Сохранить черновик"}
              </button>
              <button
                className="action-button primary"
                type="button"
                onClick={() => void handleApplyRepo()}
                disabled={!selectedFile || applying}
              >
                {applying ? "Применяю…" : "Применить в GitHub"}
              </button>
              <button
                className="action-button primary"
                type="button"
                onClick={() => void handleSyncRuntime()}
                disabled={!selectedFile || selectedFile.scope !== "repo_and_runtime" || syncing}
              >
                {syncing ? "Синхронизирую…" : "Sync на VPS"}
              </button>
              <button
                className="action-button"
                type="button"
                onClick={() => setDraft(selectedFile?.sourceContent ?? "")}
                disabled={!selectedFile}
              >
                Сбросить к исходнику
              </button>
            </div>

            {message ? <div className="control-message">{message}</div> : null}

            {hasUnsyncedChanges ? (
              <div className="control-warning" style={{ marginTop: "0.75rem" }}>
                В редакторе есть изменения, которых еще нет в GitHub. `Sync на VPS` лучше делать только после `Применить в GitHub`.
              </div>
            ) : null}

            {summary ? (
              <div className="control-summary">
                <div className="kpi">
                  <div className="kpi-label">Строк в исходнике</div>
                  <div className="kpi-value">{summary.sourceLines}</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Строк в черновике</div>
                  <div className="kpi-value">{summary.draftLines}</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Измененных строк</div>
                  <div className="kpi-value">{summary.changedLines}</div>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="card control-preview-card">
            <h2 className="section-title">Предпросмотр и статус</h2>
            {selectedFile?.draftUpdatedAt ? (
              <div className="muted" style={{ marginBottom: "0.75rem" }}>
                Последний черновик: {new Date(selectedFile.draftUpdatedAt).toLocaleString("ru-RU")}
              </div>
            ) : (
              <div className="muted" style={{ marginBottom: "0.75rem" }}>
                Сохраненного черновика еще нет.
              </div>
            )}

            {selectedFile && !selectedFile.available ? (
              <div className="control-warning">
                Этот файл сейчас недоступен для чтения. Для live-edit на Railway должен быть настроен
                GitHub-backed control или локальный корень репозитория.
              </div>
            ) : null}

            {selectedFile?.repoUrl ? (
              <div className="muted" style={{ marginBottom: "0.75rem" }}>
                GitHub:{" "}
                <a href={selectedFile.repoUrl} target="_blank" rel="noreferrer">
                  открыть файл
                </a>
                {selectedFile.repoBranch ? ` • ветка ${selectedFile.repoBranch}` : ""}
              </div>
            ) : null}

            {configHints.length > 0 ? (
              <div className="config-hints-card">
                <div className="section-title" style={{ marginBottom: "10px" }}>Расшифровка конфига</div>
                <div className="config-hints-list">
                  {configHints.map((hint) => (
                    <div key={hint.key} className="config-hint-item">
                      <strong className="mono">{hint.key}</strong>
                      <div className="muted">{hint.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <FilePreview kind={selectedFile?.kind ?? "markdown"} content={draft} />

            <div style={{ marginTop: "1.5rem" }}>
              <h3 className="section-title">История изменений</h3>
              {history.length === 0 ? (
                <div className="muted">История по этому файлу пока не найдена.</div>
              ) : (
                <div className="control-history-list">
                  {history.map((entry) => (
                    <div key={entry.sha} className="control-history-item">
                      <div className="row" style={{ justifyContent: "space-between", gap: "0.75rem" }}>
                        <strong className="mono">{entry.sha.slice(0, 7)}</strong>
                        <span className="muted">
                          {entry.committedAt ? new Date(entry.committedAt).toLocaleString("ru-RU") : "дата неизвестна"}
                        </span>
                      </div>
                      <div style={{ marginTop: "0.35rem" }}>{entry.message}</div>
                      <div className="muted" style={{ marginTop: "0.35rem" }}>
                        {entry.authorName ?? "автор неизвестен"}
                        {entry.htmlUrl ? (
                          <>
                            {" • "}
                            <a href={entry.htmlUrl} target="_blank" rel="noreferrer">
                              открыть commit
                            </a>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
