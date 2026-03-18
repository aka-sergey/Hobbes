"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

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
  draftContent: string;
  draftUpdatedAt: string | null;
  hasDraft: boolean;
};

type DiffSummary = {
  sourceLines: number;
  draftLines: number;
  changedLines: number;
};

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

export function ControlCenterClient() {
  const [files, setFiles] = useState<ControlFileListItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<ControlFileResponse | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/control/files", { cache: "no-store" });
      const data = await response.json();
      setFiles(data.files ?? []);
      const firstAvailable = (data.files ?? []).find((entry: ControlFileListItem) => entry.available) ?? data.files?.[0];
      if (firstAvailable) {
        setSelectedPath(firstAvailable.path);
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
      const response = await fetch(`/api/control/file?path=${encodeURIComponent(selectedPath)}`, {
        cache: "no-store"
      });
      const data = await response.json();
      setSelectedFile(data.file ?? null);
      setDraft(data.file?.draftContent ?? "");
    };

    void run();
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
              <p>Слева доступны только разрешенные документы и policy-файлы.</p>
            </div>
            <div className="help-item">
              <strong>2. Внесите правки</strong>
              <p>В центре редактируется черновик. Справа сразу видно preview и статус файла.</p>
            </div>
            <div className="help-item">
              <strong>3. Сохраните черновик</strong>
              <p>Сейчас v1 сохраняет изменения в БД dashboard. Прямой push в git и sync на VPS будут следующим этапом.</p>
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
                  {selectedFile?.available ? "файл доступен" : "файл недоступен в окружении"}
                </span>
                {selectedFile ? (
                  <span className="pill ok">
                    {selectedFile.scope === "repo_and_runtime" ? "repo + runtime" : "только repo"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="muted mono control-path">
              {selectedFile?.path ?? "—"}
            </div>

            <textarea
              className="control-editor"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Выберите файл слева, чтобы начать редактирование."
              spellCheck={false}
            />

            <div className="control-actions">
              <button className="action-button primary" type="button" onClick={() => void handleSaveDraft()} disabled={!selectedFile || saving}>
                {saving ? "Сохраняю…" : "Сохранить черновик"}
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
            <h2 className="section-title">Preview и статус</h2>
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
                Этот файл не найден в текущем окружении сервиса. Для полного control center на Railway
                сервис должен видеть корень репозитория через `HOBBES_CONTROL_ROOT`.
              </div>
            ) : null}

            <FilePreview kind={selectedFile?.kind ?? "markdown"} content={draft} />
          </aside>
        </section>
      </div>
    </main>
  );
}
