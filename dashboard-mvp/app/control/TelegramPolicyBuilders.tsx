"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { BEHAVIOR_PROFILE_PRESETS } from "../../lib/behavior-profile-presets";
import {
  buildCompiledPrompt,
  createEmptyBehaviorProfile,
  createEmptyChatPolicy,
  defaultBehaviorProfilesDocument,
  defaultChatPoliciesDocument,
  formatChatUsername,
  getPreferredChatLabel,
  parseBehaviorProfilesContent,
  parseChatPoliciesContent,
  parsePersonaIdsFromMarkdown,
  resolveChatBehavior,
  serializeBehaviorProfiles,
  serializeChatPolicies,
  type BehaviorProfile,
  type ChatPolicy,
  type MemoryMode
} from "../../lib/telegram-policies";

type BuilderProps = {
  content: string;
  onChange: (nextContent: string) => void;
};

type ChatPoliciesBuilderProps = BuilderProps & {
  behaviorProfilesContent: string;
};

type BehaviorProfilesBuilderProps = BuilderProps & {
  chatPoliciesContent: string;
  personasContent: string;
};

const MEMORY_MODE_OPTIONS: MemoryMode[] = ["off", "chat_isolated", "chat_plus_user", "shared_domain"];
const REPLY_MODE_OPTIONS = [
  "mention_or_reply",
  "mention_or_reply_or_keyword",
  "reply_only",
  "manual_only"
];
const ANSWER_SHAPE_OPTIONS = [
  "short_paragraph",
  "short_paragraph_or_compact_bullets",
  "compact_bullets",
  "structured_checklist"
];

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function arrayToLines(values: string[]) {
  return values.join("\n");
}

function BuilderSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="builder-section">
      <div className="builder-section-title">{title}</div>
      <div className="builder-form-grid">{children}</div>
    </section>
  );
}

function BuilderField({
  label,
  children,
  description,
  fullWidth = false
}: {
  label: string;
  children: ReactNode;
  description?: string;
  fullWidth?: boolean;
}) {
  return (
    <label className={`builder-field ${fullWidth ? "full-width" : ""}`.trim()}>
      <span className="builder-field-label">{label}</span>
      {children}
      {description ? <span className="builder-field-description">{description}</span> : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`builder-input ${props.className ?? ""}`.trim()} />;
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="number" className={`builder-input ${props.className ?? ""}`.trim()} />;
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`builder-input ${props.className ?? ""}`.trim()} />;
}

function TextAreaInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`builder-textarea ${props.className ?? ""}`.trim()} />;
}

function CheckboxInput({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="builder-checkbox">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function BuilderError({ message }: { message: string }) {
  return <div className="control-warning">{message}</div>;
}

function ChatPreview({ chat, behaviorProfilesContent }: { chat: ChatPolicy; behaviorProfilesContent: string }) {
  const profileDoc = useMemo(() => {
    try {
      return parseBehaviorProfilesContent(behaviorProfilesContent);
    } catch {
      return defaultBehaviorProfilesDocument();
    }
  }, [behaviorProfilesContent]);

  const chatDoc = useMemo(() => {
    const base = defaultChatPoliciesDocument();
    return {
      ...base,
      chats: [chat]
    };
  }, [chat]);

  const resolved = useMemo(() => resolveChatBehavior(chatDoc, profileDoc, chat), [chat, chatDoc, profileDoc]);

  return (
    <div className="builder-preview-card">
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div>
          <strong>{getPreferredChatLabel(resolved)}</strong>
          <div className="muted" style={{ marginTop: "0.35rem" }}>
            {[resolved.chatTitle, formatChatUsername(resolved.chatUsername), resolved.chatType].filter(Boolean).join(" • ") || resolved.chatId}
          </div>
          <div className="muted" style={{ marginTop: "0.35rem" }}>{resolved.label} • {resolved.persona}</div>
        </div>
        <span className={resolved.enabled ? "pill ok" : "pill warn"}>{resolved.enabled ? "включен" : "выключен"}</span>
      </div>
      <div className="builder-pill-row">
        <span className="pill ok">memory: {resolved.memoryPolicy.mode}</span>
        <span className="pill ok">tone: {resolved.style.tone}</span>
        <span className="pill ok">reply: {resolved.replyPolicy.mode}</span>
      </div>
      <pre className="preview-code builder-preview-code">{resolved.compiledPrompt}</pre>
    </div>
  );
}

export function TelegramChatPoliciesBuilder({ content, behaviorProfilesContent, onChange }: ChatPoliciesBuilderProps) {
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const parsed = useMemo(() => {
    try {
      return {
        doc: parseChatPoliciesContent(content),
        profileDoc: parseBehaviorProfilesContent(behaviorProfilesContent),
        error: null
      };
    } catch (error) {
      return {
        doc: defaultChatPoliciesDocument(),
        profileDoc: defaultBehaviorProfilesDocument(),
        error: error instanceof Error ? error.message : "unknown_error"
      };
    }
  }, [content, behaviorProfilesContent]);
  const { doc, profileDoc, error } = parsed;
  const profileOptions = useMemo(() => {
    const ids = profileDoc.profiles.map((profile) => profile.id);
    if (selectedChatId) {
      const selected = doc.chats.find((chat) => chat.chatId === selectedChatId)?.profileId;
      if (selected && !ids.includes(selected)) {
        ids.push(selected);
      }
    }
    return ids;
  }, [doc.chats, profileDoc.profiles, selectedChatId]);

  useEffect(() => {
    const current = doc.chats.find((chat) => chat.chatId === selectedChatId);
    if (!current) {
      setSelectedChatId(doc.chats[0]?.chatId ?? "");
    }
  }, [doc.chats, selectedChatId]);

  const selectedChat = doc.chats.find((chat) => chat.chatId === selectedChatId) ?? null;

  function commit(nextDoc: ReturnType<typeof parseChatPoliciesContent>) {
    onChange(serializeChatPolicies(nextDoc));
  }

  function updateSelectedChat(updater: (chat: ChatPolicy) => ChatPolicy) {
    if (!selectedChat) {
      return;
    }

    const nextDoc = {
      ...doc,
      chats: doc.chats.map((chat) => (chat.chatId === selectedChat.chatId ? updater(chat) : chat))
    };

    commit(nextDoc);
  }

  function addChat() {
    const nextChat = createEmptyChatPolicy(doc.chats.length + 1);
    nextChat.profileId = profileDoc.profiles[0]?.id ?? doc.defaults.profileId;
    const nextDoc = {
      ...doc,
      chats: [...doc.chats, nextChat]
    };
    commit(nextDoc);
    setSelectedChatId(nextChat.chatId);
  }

  function cloneChat() {
    if (!selectedChat) {
      return;
    }

    const clone = {
      ...selectedChat,
      chatId: `${selectedChat.chatId}_copy`,
      slug: `${selectedChat.slug}_copy`
    };
    const nextDoc = {
      ...doc,
      chats: [...doc.chats, clone]
    };
    commit(nextDoc);
    setSelectedChatId(clone.chatId);
  }

  function removeChat() {
    if (!selectedChat) {
      return;
    }

    const nextChats = doc.chats.filter((chat) => chat.chatId !== selectedChat.chatId);
    commit({
      ...doc,
      chats: nextChats
    });
    setSelectedChatId(nextChats[0]?.chatId ?? "");
  }

  return (
    <div className="builder-shell">
      {error ? <BuilderError message={`Конструктор чатов недоступен, пока JSON не исправлен: ${error}`} /> : null}
      <div className="builder-sidebar">
        <div className="builder-toolbar">
          <button className="action-button primary" type="button" onClick={addChat}>Добавить чат</button>
          <button className="action-button" type="button" onClick={cloneChat} disabled={!selectedChat}>Клонировать</button>
          <button className="action-button" type="button" onClick={removeChat} disabled={!selectedChat}>Удалить</button>
        </div>
        <div className="builder-list">
          {doc.chats.map((chat) => (
            <button
              key={chat.chatId}
              type="button"
              className={`builder-list-item ${chat.chatId === selectedChatId ? "active" : ""}`}
              onClick={() => setSelectedChatId(chat.chatId)}
            >
              <strong>{getPreferredChatLabel(chat)}</strong>
              <span className="muted">{[chat.chatTitle, formatChatUsername(chat.chatUsername), chat.chatType].filter(Boolean).join(" • ") || chat.slug}</span>
              <span className="muted mono">{chat.chatId}</span>
              <span className={chat.enabled ? "pill ok" : "pill warn"}>{chat.enabled ? "on" : "off"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="builder-main">
        {!selectedChat ? (
          <BuilderError message="Чаты пока не настроены. Добавьте первый чат, чтобы начать." />
        ) : (
          <>
            <BuilderSection title="Основное">
              <BuilderField label="Chat ID">
                <TextInput value={selectedChat.chatId} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, chatId: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Slug">
                <TextInput value={selectedChat.slug} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, slug: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Display name" description="Красивое имя для карточек панели. Если пусто, панель покажет title, username или slug.">
                <TextInput value={selectedChat.displayName} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, displayName: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Chat type" description="Например: private, group, supergroup, channel.">
                <TextInput value={selectedChat.chatType} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, chatType: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Telegram title">
                <TextInput value={selectedChat.chatTitle} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, chatTitle: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Telegram username">
                <TextInput value={selectedChat.chatUsername} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, chatUsername: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Профиль">
                <SelectInput
                  value={selectedChat.profileId}
                  onChange={(event) => updateSelectedChat((chat) => ({ ...chat, profileId: event.target.value }))}
                >
                  {profileOptions.map((profileId) => (
                    <option key={profileId} value={profileId}>
                      {profileDoc.profiles.find((profile) => profile.id === profileId)?.label ?? profileId}
                    </option>
                  ))}
                </SelectInput>
              </BuilderField>
              <BuilderField label="Включен">
                <CheckboxInput label="Разрешить ответы в этом чате" checked={selectedChat.enabled} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, enabled: next }))} />
              </BuilderField>
              <BuilderField label="Описание" description="Коротко опишите контекст чата для админов и preview." fullWidth>
                <TextAreaInput rows={3} value={selectedChat.description} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, description: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Prompt override" description="Локальная инструкция поверх выбранного профиля." fullWidth>
                <TextAreaInput rows={5} value={selectedChat.promptOverride} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, promptOverride: event.target.value }))} />
              </BuilderField>
            </BuilderSection>

            <BuilderSection title="Память">
              <BuilderField label="Memory mode">
                <SelectInput
                  value={selectedChat.memoryPolicy.mode}
                  onChange={(event) => updateSelectedChat((chat) => ({
                    ...chat,
                    memoryPolicy: {
                      ...chat.memoryPolicy,
                      mode: event.target.value as MemoryMode
                    }
                  }))}
                >
                  {MEMORY_MODE_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </SelectInput>
              </BuilderField>
              <BuilderField label="Recent messages">
                <NumberInput
                  value={selectedChat.memoryPolicy.retainRecentMessages}
                  onChange={(event) => updateSelectedChat((chat) => ({
                    ...chat,
                    memoryPolicy: {
                      ...chat.memoryPolicy,
                      retainRecentMessages: Number(event.target.value)
                    }
                  }))}
                />
              </BuilderField>
              <BuilderField label="Shared domain key">
                <TextInput
                  value={selectedChat.memoryPolicy.sharedDomainKey}
                  onChange={(event) => updateSelectedChat((chat) => ({
                    ...chat,
                    memoryPolicy: {
                      ...chat.memoryPolicy,
                      sharedDomainKey: event.target.value
                    }
                  }))}
                />
              </BuilderField>
              <BuilderField label="Flags">
                <div className="builder-checkbox-grid">
                  <CheckboxInput
                    label="Rolling summary"
                    checked={selectedChat.memoryPolicy.retainRollingSummary}
                    onChange={(next) => updateSelectedChat((chat) => ({
                      ...chat,
                      memoryPolicy: {
                        ...chat.memoryPolicy,
                        retainRollingSummary: next
                      }
                    }))}
                  />
                  <CheckboxInput
                    label="Store facts"
                    checked={selectedChat.memoryPolicy.storeFacts}
                    onChange={(next) => updateSelectedChat((chat) => ({
                      ...chat,
                      memoryPolicy: {
                        ...chat.memoryPolicy,
                        storeFacts: next
                      }
                    }))}
                  />
                </div>
              </BuilderField>
            </BuilderSection>

            <BuilderSection title="Триггеры и лимиты">
              <BuilderField label="Reply mode">
                <SelectInput
                  value={selectedChat.replyPolicy.mode}
                  onChange={(event) => updateSelectedChat((chat) => ({
                    ...chat,
                    replyPolicy: {
                      ...chat.replyPolicy,
                      mode: event.target.value
                    }
                  }))}
                >
                  {REPLY_MODE_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </SelectInput>
              </BuilderField>
              <BuilderField label="Max replies per hour">
                <NumberInput
                  value={selectedChat.replyPolicy.maxRepliesPerHour}
                  onChange={(event) => updateSelectedChat((chat) => ({
                    ...chat,
                    replyPolicy: {
                      ...chat.replyPolicy,
                      maxRepliesPerHour: Number(event.target.value)
                    }
                  }))}
                />
              </BuilderField>
              <BuilderField label="Signals">
                <div className="builder-checkbox-grid">
                  <CheckboxInput label="React on mention" checked={selectedChat.replyPolicy.reactOnMention} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, replyPolicy: { ...chat.replyPolicy, reactOnMention: next } }))} />
                  <CheckboxInput label="React on reply to bot" checked={selectedChat.replyPolicy.reactOnReplyToBot} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, replyPolicy: { ...chat.replyPolicy, reactOnReplyToBot: next } }))} />
                  <CheckboxInput label="React on direct question" checked={selectedChat.replyPolicy.reactOnDirectQuestionToBot} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, replyPolicy: { ...chat.replyPolicy, reactOnDirectQuestionToBot: next } }))} />
                  <CheckboxInput label="React on keywords" checked={selectedChat.replyPolicy.reactOnKeywords} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, replyPolicy: { ...chat.replyPolicy, reactOnKeywords: next } }))} />
                  <CheckboxInput label="React without signal" checked={selectedChat.replyPolicy.reactWithoutSignal} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, replyPolicy: { ...chat.replyPolicy, reactWithoutSignal: next } }))} />
                </div>
              </BuilderField>
              <BuilderField label="Activation keywords" description="По одному ключу на строку." fullWidth>
                <TextAreaInput
                  rows={10}
                  value={arrayToLines(selectedChat.activationKeywords)}
                  onChange={(event) => updateSelectedChat((chat) => ({ ...chat, activationKeywords: linesToArray(event.target.value) }))}
                />
              </BuilderField>
            </BuilderSection>

            <BuilderSection title="Темы и стиль">
              <BuilderField label="Allowed topics" fullWidth>
                <TextAreaInput
                  rows={7}
                  value={arrayToLines(selectedChat.topicPolicy.allow)}
                  onChange={(event) => updateSelectedChat((chat) => ({
                    ...chat,
                    topicPolicy: {
                      ...chat.topicPolicy,
                      allow: linesToArray(event.target.value)
                    }
                  }))}
                />
              </BuilderField>
              <BuilderField label="Denied topics" fullWidth>
                <TextAreaInput
                  rows={7}
                  value={arrayToLines(selectedChat.topicPolicy.deny)}
                  onChange={(event) => updateSelectedChat((chat) => ({
                    ...chat,
                    topicPolicy: {
                      ...chat.topicPolicy,
                      deny: linesToArray(event.target.value)
                    }
                  }))}
                />
              </BuilderField>
              <BuilderField label="Language">
                <TextInput value={selectedChat.style.language} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, style: { ...chat.style, language: event.target.value } }))} />
              </BuilderField>
              <BuilderField label="Tone">
                <TextInput value={selectedChat.style.tone} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, style: { ...chat.style, tone: event.target.value } }))} />
              </BuilderField>
              <BuilderField label="Answer shape">
                <SelectInput value={selectedChat.style.maxAnswerShape} onChange={(event) => updateSelectedChat((chat) => ({ ...chat, style: { ...chat.style, maxAnswerShape: event.target.value } }))}>
                  {ANSWER_SHAPE_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </SelectInput>
              </BuilderField>
              <BuilderField label="Style flags">
                <div className="builder-checkbox-grid">
                  <CheckboxInput label="Use slang" checked={selectedChat.style.usesSlang} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, style: { ...chat.style, usesSlang: next } }))} />
                  <CheckboxInput label="Step by step" checked={selectedChat.style.stepByStep} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, style: { ...chat.style, stepByStep: next } }))} />
                </div>
              </BuilderField>
            </BuilderSection>

            <BuilderSection title="Модерация">
              <BuilderField label="Safety flags" fullWidth>
                <div className="builder-checkbox-grid">
                  <CheckboxInput label="Allow sharp tone" checked={selectedChat.moderation.allowSharpTone} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, moderation: { ...chat.moderation, allowSharpTone: next } }))} />
                  <CheckboxInput label="Forbid abuse" checked={selectedChat.moderation.forbidAbuse} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, moderation: { ...chat.moderation, forbidAbuse: next } }))} />
                  <CheckboxInput label="Forbid harassment" checked={selectedChat.moderation.forbidHarassment} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, moderation: { ...chat.moderation, forbidHarassment: next } }))} />
                  <CheckboxInput label="Forbid hate" checked={selectedChat.moderation.forbidHate} onChange={(next) => updateSelectedChat((chat) => ({ ...chat, moderation: { ...chat.moderation, forbidHate: next } }))} />
                </div>
              </BuilderField>
            </BuilderSection>

            <ChatPreview chat={selectedChat} behaviorProfilesContent={behaviorProfilesContent} />
          </>
        )}
      </div>
    </div>
  );
}

function ProfilePreview({
  profile,
  chatPoliciesContent
}: {
  profile: BehaviorProfile;
  chatPoliciesContent: string;
}) {
  const chatDoc = useMemo(() => {
    try {
      return parseChatPoliciesContent(chatPoliciesContent);
    } catch {
      return defaultChatPoliciesDocument();
    }
  }, [chatPoliciesContent]);
  const usage = chatDoc.chats.filter((chat) => chat.profileId === profile.id);

  return (
    <div className="builder-preview-card">
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div>
          <strong>{profile.label}</strong>
          <div className="muted" style={{ marginTop: "0.35rem" }}>{profile.id} • {profile.persona}</div>
        </div>
        <span className="pill ok">{usage.length} chat(s)</span>
      </div>
      <div className="builder-pill-row">
        <span className="pill ok">tone: {profile.style.tone}</span>
        <span className="pill ok">shape: {profile.style.maxAnswerShape}</span>
        <span className="pill ok">memory: {profile.memoryDefaults.mode}</span>
      </div>
      <pre className="preview-code builder-preview-code">
        {buildCompiledPrompt({
          chatId: "preview",
          slug: "preview",
          displayName: profile.label,
          chatTitle: "",
          chatUsername: "",
          chatType: "preview",
          enabled: true,
          profileId: profile.id,
          persona: profile.persona,
          label: profile.label,
          description: profile.description,
          systemPrompt: profile.systemPrompt,
          expertise: profile.expertise,
          promptOverride: "",
          activationKeywords: [],
          replyPolicy: defaultChatPoliciesDocument().defaults.replyPolicy,
          topicPolicy: profile.topicPolicy,
          moderation: profile.moderation,
          style: profile.style,
          memoryPolicy: profile.memoryDefaults,
          silencePolicy: defaultChatPoliciesDocument().defaults.silencePolicy
        })}
      </pre>
      {usage.length > 0 ? (
        <div className="builder-usage-list">
          {usage.map((chat) => (
            <div key={chat.chatId} className="muted mono">{chat.slug} • {chat.chatId}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TelegramBehaviorProfilesBuilder({
  content,
  chatPoliciesContent,
  personasContent,
  onChange
}: BehaviorProfilesBuilderProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const parsed = useMemo(() => {
    try {
      return {
        doc: parseBehaviorProfilesContent(content),
        error: null
      };
    } catch (error) {
      return {
        doc: defaultBehaviorProfilesDocument(),
        error: error instanceof Error ? error.message : "unknown_error"
      };
    }
  }, [content]);
  const doc = parsed.doc;
  const personaIds = useMemo(() => parsePersonaIdsFromMarkdown(personasContent), [personasContent]);

  useEffect(() => {
    const current = doc.profiles.find((profile) => profile.id === selectedProfileId);
    if (!current) {
      setSelectedProfileId(doc.profiles[0]?.id ?? "");
    }
  }, [doc.profiles, selectedProfileId]);

  const selectedProfile = doc.profiles.find((profile) => profile.id === selectedProfileId) ?? null;
  const personaOptions = useMemo(() => {
    if (!selectedProfile) {
      return personaIds;
    }

    return Array.from(new Set([...personaIds, selectedProfile.persona])).filter(Boolean);
  }, [personaIds, selectedProfile]);

  function commit(nextDoc: ReturnType<typeof parseBehaviorProfilesContent>) {
    onChange(serializeBehaviorProfiles(nextDoc));
  }

  function updateSelectedProfile(updater: (profile: BehaviorProfile) => BehaviorProfile) {
    if (!selectedProfile) {
      return;
    }

    commit({
      ...doc,
      profiles: doc.profiles.map((profile) => (profile.id === selectedProfile.id ? updater(profile) : profile))
    });
  }

  function addEmptyProfile() {
    const next = createEmptyBehaviorProfile(doc.profiles.length + 1);
    commit({
      ...doc,
      profiles: [...doc.profiles, next]
    });
    setSelectedProfileId(next.id);
  }

  function addPreset(preset: BehaviorProfile) {
    const exists = doc.profiles.some((profile) => profile.id === preset.id);
    const next = {
      ...preset,
      id: exists ? `${preset.id}_${doc.profiles.length + 1}` : preset.id,
      label: exists ? `${preset.label} Copy` : preset.label
    };
    commit({
      ...doc,
      profiles: [...doc.profiles, next]
    });
    setSelectedProfileId(next.id);
  }

  function cloneProfile() {
    if (!selectedProfile) {
      return;
    }

    const clone = {
      ...selectedProfile,
      id: `${selectedProfile.id}_copy`,
      label: `${selectedProfile.label} Copy`
    };
    commit({
      ...doc,
      profiles: [...doc.profiles, clone]
    });
    setSelectedProfileId(clone.id);
  }

  function removeProfile() {
    if (!selectedProfile) {
      return;
    }

    const nextProfiles = doc.profiles.filter((profile) => profile.id !== selectedProfile.id);
    commit({
      ...doc,
      profiles: nextProfiles
    });
    setSelectedProfileId(nextProfiles[0]?.id ?? "");
  }

  return (
    <div className="builder-shell">
      {parsed.error ? <BuilderError message={`Конструктор профилей недоступен, пока JSON не исправлен: ${parsed.error}`} /> : null}
      <div className="builder-sidebar">
        <div className="builder-toolbar">
          <button className="action-button primary" type="button" onClick={addEmptyProfile}>Новый профиль</button>
          <button className="action-button" type="button" onClick={cloneProfile} disabled={!selectedProfile}>Клонировать</button>
          <button className="action-button" type="button" onClick={removeProfile} disabled={!selectedProfile}>Удалить</button>
        </div>
        <div className="builder-preset-list">
          {BEHAVIOR_PROFILE_PRESETS.map((preset) => (
            <button key={preset.id} type="button" className="builder-preset-button" onClick={() => addPreset(preset)}>
              {preset.label}
            </button>
          ))}
        </div>
        <div className="builder-list">
          {doc.profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={`builder-list-item ${profile.id === selectedProfileId ? "active" : ""}`}
              onClick={() => setSelectedProfileId(profile.id)}
            >
              <strong>{profile.label}</strong>
              <span className="muted mono">{profile.id}</span>
              <span className="pill ok">{profile.persona}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="builder-main">
        {!selectedProfile ? (
          <BuilderError message="Профили пока не настроены. Добавьте первый профиль или примените пресет." />
        ) : (
          <>
            <BuilderSection title="Основное">
              <BuilderField label="ID">
                <TextInput value={selectedProfile.id} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, id: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Label">
                <TextInput value={selectedProfile.label} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, label: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Persona">
                <SelectInput
                  value={selectedProfile.persona}
                  onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, persona: event.target.value }))}
                >
                  {personaOptions.map((personaId) => (
                    <option key={personaId} value={personaId}>{personaId}</option>
                  ))}
                </SelectInput>
              </BuilderField>
              <BuilderField label="Description" fullWidth>
                <TextAreaInput rows={3} value={selectedProfile.description} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, description: event.target.value }))} />
              </BuilderField>
              <BuilderField label="System prompt" fullWidth>
                <TextAreaInput rows={6} value={selectedProfile.systemPrompt} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, systemPrompt: event.target.value }))} />
              </BuilderField>
              <BuilderField label="Expertise" description="По одной доменной метке на строку." fullWidth>
                <TextAreaInput rows={5} value={arrayToLines(selectedProfile.expertise)} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, expertise: linesToArray(event.target.value) }))} />
              </BuilderField>
            </BuilderSection>

            <BuilderSection title="Стиль">
              <BuilderField label="Language">
                <TextInput value={selectedProfile.style.language} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, style: { ...profile.style, language: event.target.value } }))} />
              </BuilderField>
              <BuilderField label="Tone">
                <TextInput value={selectedProfile.style.tone} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, style: { ...profile.style, tone: event.target.value } }))} />
              </BuilderField>
              <BuilderField label="Answer shape">
                <SelectInput value={selectedProfile.style.maxAnswerShape} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, style: { ...profile.style, maxAnswerShape: event.target.value } }))}>
                  {ANSWER_SHAPE_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </SelectInput>
              </BuilderField>
              <BuilderField label="Style flags">
                <div className="builder-checkbox-grid">
                  <CheckboxInput label="Use slang" checked={selectedProfile.style.usesSlang} onChange={(next) => updateSelectedProfile((profile) => ({ ...profile, style: { ...profile.style, usesSlang: next } }))} />
                  <CheckboxInput label="Step by step" checked={selectedProfile.style.stepByStep} onChange={(next) => updateSelectedProfile((profile) => ({ ...profile, style: { ...profile.style, stepByStep: next } }))} />
                </div>
              </BuilderField>
            </BuilderSection>

            <BuilderSection title="Темы и модерация">
              <BuilderField label="Allowed topics" fullWidth>
                <TextAreaInput rows={7} value={arrayToLines(selectedProfile.topicPolicy.allow)} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, topicPolicy: { ...profile.topicPolicy, allow: linesToArray(event.target.value) } }))} />
              </BuilderField>
              <BuilderField label="Denied topics" fullWidth>
                <TextAreaInput rows={7} value={arrayToLines(selectedProfile.topicPolicy.deny)} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, topicPolicy: { ...profile.topicPolicy, deny: linesToArray(event.target.value) } }))} />
              </BuilderField>
              <BuilderField label="Moderation" fullWidth>
                <div className="builder-checkbox-grid">
                  <CheckboxInput label="Allow sharp tone" checked={selectedProfile.moderation.allowSharpTone} onChange={(next) => updateSelectedProfile((profile) => ({ ...profile, moderation: { ...profile.moderation, allowSharpTone: next } }))} />
                  <CheckboxInput label="Forbid abuse" checked={selectedProfile.moderation.forbidAbuse} onChange={(next) => updateSelectedProfile((profile) => ({ ...profile, moderation: { ...profile.moderation, forbidAbuse: next } }))} />
                  <CheckboxInput label="Forbid harassment" checked={selectedProfile.moderation.forbidHarassment} onChange={(next) => updateSelectedProfile((profile) => ({ ...profile, moderation: { ...profile.moderation, forbidHarassment: next } }))} />
                  <CheckboxInput label="Forbid hate" checked={selectedProfile.moderation.forbidHate} onChange={(next) => updateSelectedProfile((profile) => ({ ...profile, moderation: { ...profile.moderation, forbidHate: next } }))} />
                </div>
              </BuilderField>
            </BuilderSection>

            <BuilderSection title="Память по умолчанию">
              <BuilderField label="Memory mode">
                <SelectInput value={selectedProfile.memoryDefaults.mode} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, memoryDefaults: { ...profile.memoryDefaults, mode: event.target.value as MemoryMode } }))}>
                  {MEMORY_MODE_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </SelectInput>
              </BuilderField>
              <BuilderField label="Recent messages">
                <NumberInput value={selectedProfile.memoryDefaults.retainRecentMessages} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, memoryDefaults: { ...profile.memoryDefaults, retainRecentMessages: Number(event.target.value) } }))} />
              </BuilderField>
              <BuilderField label="Shared domain key">
                <TextInput value={selectedProfile.memoryDefaults.sharedDomainKey} onChange={(event) => updateSelectedProfile((profile) => ({ ...profile, memoryDefaults: { ...profile.memoryDefaults, sharedDomainKey: event.target.value } }))} />
              </BuilderField>
              <BuilderField label="Flags" fullWidth>
                <div className="builder-checkbox-grid">
                  <CheckboxInput label="Rolling summary" checked={selectedProfile.memoryDefaults.retainRollingSummary} onChange={(next) => updateSelectedProfile((profile) => ({ ...profile, memoryDefaults: { ...profile.memoryDefaults, retainRollingSummary: next } }))} />
                  <CheckboxInput label="Store facts" checked={selectedProfile.memoryDefaults.storeFacts} onChange={(next) => updateSelectedProfile((profile) => ({ ...profile, memoryDefaults: { ...profile.memoryDefaults, storeFacts: next } }))} />
                </div>
              </BuilderField>
            </BuilderSection>

            <ProfilePreview profile={selectedProfile} chatPoliciesContent={chatPoliciesContent} />
          </>
        )}
      </div>
    </div>
  );
}
