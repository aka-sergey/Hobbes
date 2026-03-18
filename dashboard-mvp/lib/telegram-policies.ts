export const MEMORY_MODES = ["off", "chat_isolated", "chat_plus_user", "shared_domain"] as const;

export type MemoryMode = (typeof MEMORY_MODES)[number];

export type AnswerStyle = {
  language: string;
  tone: string;
  maxAnswerShape: string;
  usesSlang: boolean;
  stepByStep: boolean;
};

export type TopicPolicy = {
  allow: string[];
  deny: string[];
};

export type ModerationPolicy = {
  allowSharpTone: boolean;
  forbidAbuse: boolean;
  forbidHarassment: boolean;
  forbidHate: boolean;
};

export type MemoryPolicy = {
  mode: MemoryMode;
  retainRecentMessages: number;
  retainRollingSummary: boolean;
  storeFacts: boolean;
  sharedDomainKey: string;
};

export type ReplyPolicy = {
  mode: string;
  reactOnMention: boolean;
  reactOnReplyToBot: boolean;
  reactOnDirectQuestionToBot: boolean;
  reactOnKeywords: boolean;
  reactWithoutSignal: boolean;
  maxRepliesPerHour: number;
};

export type SilencePolicy = {
  staySilentIfOffTopic: boolean;
  staySilentIfNoSignal: boolean;
  staySilentIfAnotherHumanAlreadyAnsweredWell: boolean;
};

export type BehaviorProfile = {
  id: string;
  label: string;
  persona: string;
  description: string;
  systemPrompt: string;
  expertise: string[];
  style: AnswerStyle;
  moderation: ModerationPolicy;
  topicPolicy: TopicPolicy;
  memoryDefaults: MemoryPolicy;
};

export type BehaviorProfilesDocument = {
  version: number;
  notes: string[];
  defaults: {
    style: AnswerStyle;
    moderation: ModerationPolicy;
    topicPolicy: TopicPolicy;
    memoryDefaults: MemoryPolicy;
  };
  profiles: BehaviorProfile[];
};

export type ChatPolicy = {
  chatId: string;
  slug: string;
  enabled: boolean;
  profileId: string;
  persona: string;
  description: string;
  promptOverride: string;
  activationKeywords: string[];
  replyPolicy: ReplyPolicy;
  topicPolicy: TopicPolicy;
  moderation: ModerationPolicy;
  style: AnswerStyle;
  memoryPolicy: MemoryPolicy;
  silencePolicy: SilencePolicy;
};

export type ChatPoliciesDocument = {
  version: number;
  notes: string[];
  defaults: Omit<ChatPolicy, "chatId" | "slug" | "description" | "activationKeywords">;
  chats: ChatPolicy[];
};

export type ResolvedChatBehavior = {
  chatId: string;
  slug: string;
  enabled: boolean;
  profileId: string;
  persona: string;
  label: string;
  description: string;
  systemPrompt: string;
  compiledPrompt: string;
  expertise: string[];
  promptOverride: string;
  activationKeywords: string[];
  replyPolicy: ReplyPolicy;
  topicPolicy: TopicPolicy;
  moderation: ModerationPolicy;
  style: AnswerStyle;
  memoryPolicy: MemoryPolicy;
  silencePolicy: SilencePolicy;
};

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
};

export const DEFAULT_STYLE: AnswerStyle = {
  language: "ru",
  tone: "calm_operator",
  maxAnswerShape: "short_paragraph",
  usesSlang: false,
  stepByStep: false
};

export const DEFAULT_TOPIC_POLICY: TopicPolicy = {
  allow: [],
  deny: []
};

export const DEFAULT_MODERATION_POLICY: ModerationPolicy = {
  allowSharpTone: false,
  forbidAbuse: true,
  forbidHarassment: true,
  forbidHate: true
};

export const DEFAULT_MEMORY_POLICY: MemoryPolicy = {
  mode: "chat_isolated",
  retainRecentMessages: 40,
  retainRollingSummary: true,
  storeFacts: true,
  sharedDomainKey: ""
};

export const DEFAULT_REPLY_POLICY: ReplyPolicy = {
  mode: "mention_or_reply",
  reactOnMention: true,
  reactOnReplyToBot: true,
  reactOnDirectQuestionToBot: true,
  reactOnKeywords: false,
  reactWithoutSignal: false,
  maxRepliesPerHour: 12
};

export const DEFAULT_SILENCE_POLICY: SilencePolicy = {
  staySilentIfOffTopic: true,
  staySilentIfNoSignal: true,
  staySilentIfAnotherHumanAlreadyAnsweredWell: false
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

function uniqueStrings(items: unknown) {
  if (!Array.isArray(items)) {
    return [] as string[];
  }

  const seen = new Set<string>();
  const values: string[] = [];

  for (const item of items) {
    if (typeof item !== "string") {
      continue;
    }

    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    values.push(normalized);
  }

  return values;
}

function mergeUniqueStrings(...groups: Array<string[] | undefined>) {
  return uniqueStrings(groups.flatMap((group) => group ?? []));
}

function normalizeStyle(value: unknown, fallback: Partial<AnswerStyle> = {}): AnswerStyle {
  const record = isRecord(value) ? value : {};

  return {
    language: asString(record.language, fallback.language ?? DEFAULT_STYLE.language),
    tone: asString(record.tone, fallback.tone ?? DEFAULT_STYLE.tone),
    maxAnswerShape: asString(record.maxAnswerShape, fallback.maxAnswerShape ?? DEFAULT_STYLE.maxAnswerShape),
    usesSlang: asBoolean(record.usesSlang, fallback.usesSlang ?? DEFAULT_STYLE.usesSlang),
    stepByStep: asBoolean(record.stepByStep, fallback.stepByStep ?? DEFAULT_STYLE.stepByStep)
  };
}

function normalizeTopicPolicy(value: unknown, fallback: Partial<TopicPolicy> = {}): TopicPolicy {
  const record = isRecord(value) ? value : {};

  return {
    allow: uniqueStrings(record.allow ?? fallback.allow ?? DEFAULT_TOPIC_POLICY.allow),
    deny: uniqueStrings(record.deny ?? fallback.deny ?? DEFAULT_TOPIC_POLICY.deny)
  };
}

function normalizeModerationPolicy(value: unknown, fallback: Partial<ModerationPolicy> = {}): ModerationPolicy {
  const record = isRecord(value) ? value : {};

  return {
    allowSharpTone: asBoolean(record.allowSharpTone, fallback.allowSharpTone ?? DEFAULT_MODERATION_POLICY.allowSharpTone),
    forbidAbuse: asBoolean(record.forbidAbuse, fallback.forbidAbuse ?? DEFAULT_MODERATION_POLICY.forbidAbuse),
    forbidHarassment: asBoolean(record.forbidHarassment, fallback.forbidHarassment ?? DEFAULT_MODERATION_POLICY.forbidHarassment),
    forbidHate: asBoolean(record.forbidHate, fallback.forbidHate ?? DEFAULT_MODERATION_POLICY.forbidHate)
  };
}

function normalizeMemoryMode(value: unknown, fallback: MemoryMode): MemoryMode {
  if (typeof value !== "string") {
    return fallback;
  }

  return (MEMORY_MODES as readonly string[]).includes(value) ? (value as MemoryMode) : fallback;
}

function normalizeMemoryPolicy(value: unknown, fallback: Partial<MemoryPolicy> = {}): MemoryPolicy {
  const record = isRecord(value) ? value : {};

  return {
    mode: normalizeMemoryMode(record.mode, fallback.mode ?? DEFAULT_MEMORY_POLICY.mode),
    retainRecentMessages: asNumber(record.retainRecentMessages, fallback.retainRecentMessages ?? DEFAULT_MEMORY_POLICY.retainRecentMessages),
    retainRollingSummary: asBoolean(
      record.retainRollingSummary,
      fallback.retainRollingSummary ?? DEFAULT_MEMORY_POLICY.retainRollingSummary
    ),
    storeFacts: asBoolean(record.storeFacts, fallback.storeFacts ?? DEFAULT_MEMORY_POLICY.storeFacts),
    sharedDomainKey: asString(record.sharedDomainKey, fallback.sharedDomainKey ?? DEFAULT_MEMORY_POLICY.sharedDomainKey)
  };
}

function normalizeReplyPolicy(value: unknown, fallback: Partial<ReplyPolicy> = {}): ReplyPolicy {
  const record = isRecord(value) ? value : {};

  return {
    mode: asString(record.mode, fallback.mode ?? DEFAULT_REPLY_POLICY.mode),
    reactOnMention: asBoolean(record.reactOnMention, fallback.reactOnMention ?? DEFAULT_REPLY_POLICY.reactOnMention),
    reactOnReplyToBot: asBoolean(record.reactOnReplyToBot, fallback.reactOnReplyToBot ?? DEFAULT_REPLY_POLICY.reactOnReplyToBot),
    reactOnDirectQuestionToBot: asBoolean(
      record.reactOnDirectQuestionToBot,
      fallback.reactOnDirectQuestionToBot ?? DEFAULT_REPLY_POLICY.reactOnDirectQuestionToBot
    ),
    reactOnKeywords: asBoolean(record.reactOnKeywords, fallback.reactOnKeywords ?? DEFAULT_REPLY_POLICY.reactOnKeywords),
    reactWithoutSignal: asBoolean(record.reactWithoutSignal, fallback.reactWithoutSignal ?? DEFAULT_REPLY_POLICY.reactWithoutSignal),
    maxRepliesPerHour: asNumber(record.maxRepliesPerHour, fallback.maxRepliesPerHour ?? DEFAULT_REPLY_POLICY.maxRepliesPerHour)
  };
}

function normalizeSilencePolicy(value: unknown, fallback: Partial<SilencePolicy> = {}): SilencePolicy {
  const record = isRecord(value) ? value : {};

  return {
    staySilentIfOffTopic: asBoolean(
      record.staySilentIfOffTopic,
      fallback.staySilentIfOffTopic ?? DEFAULT_SILENCE_POLICY.staySilentIfOffTopic
    ),
    staySilentIfNoSignal: asBoolean(record.staySilentIfNoSignal, fallback.staySilentIfNoSignal ?? DEFAULT_SILENCE_POLICY.staySilentIfNoSignal),
    staySilentIfAnotherHumanAlreadyAnsweredWell: asBoolean(
      record.staySilentIfAnotherHumanAlreadyAnsweredWell,
      fallback.staySilentIfAnotherHumanAlreadyAnsweredWell ?? DEFAULT_SILENCE_POLICY.staySilentIfAnotherHumanAlreadyAnsweredWell
    )
  };
}

export function createEmptyBehaviorProfile(index: number): BehaviorProfile {
  return {
    id: `profile_${index}`,
    label: `Profile ${index}`,
    persona: "default_operator",
    description: "",
    systemPrompt: "",
    expertise: [],
    style: { ...DEFAULT_STYLE },
    moderation: { ...DEFAULT_MODERATION_POLICY },
    topicPolicy: { ...DEFAULT_TOPIC_POLICY, allow: [], deny: [] },
    memoryDefaults: { ...DEFAULT_MEMORY_POLICY }
  };
}

export function createEmptyChatPolicy(index: number): ChatPolicy {
  return {
    chatId: `-1000${index}`,
    slug: `new_chat_${index}`,
    enabled: false,
    profileId: "default_operator",
    persona: "",
    description: "",
    promptOverride: "",
    activationKeywords: [],
    replyPolicy: { ...DEFAULT_REPLY_POLICY },
    topicPolicy: { ...DEFAULT_TOPIC_POLICY, allow: [], deny: [] },
    moderation: { ...DEFAULT_MODERATION_POLICY },
    style: { ...DEFAULT_STYLE },
    memoryPolicy: { ...DEFAULT_MEMORY_POLICY },
    silencePolicy: { ...DEFAULT_SILENCE_POLICY }
  };
}

export function defaultBehaviorProfilesDocument(): BehaviorProfilesDocument {
  return {
    version: 1,
    notes: [],
    defaults: {
      style: { ...DEFAULT_STYLE },
      moderation: { ...DEFAULT_MODERATION_POLICY },
      topicPolicy: { ...DEFAULT_TOPIC_POLICY, allow: [], deny: [] },
      memoryDefaults: { ...DEFAULT_MEMORY_POLICY }
    },
    profiles: []
  };
}

export function defaultChatPoliciesDocument(): ChatPoliciesDocument {
  return {
    version: 1,
    notes: [],
    defaults: {
      enabled: false,
      profileId: "default_operator",
      persona: "default_operator",
      promptOverride: "",
      replyPolicy: { ...DEFAULT_REPLY_POLICY },
      topicPolicy: { ...DEFAULT_TOPIC_POLICY, allow: [], deny: [] },
      moderation: { ...DEFAULT_MODERATION_POLICY },
      style: { ...DEFAULT_STYLE },
      memoryPolicy: { ...DEFAULT_MEMORY_POLICY },
      silencePolicy: { ...DEFAULT_SILENCE_POLICY }
    },
    chats: []
  };
}

function normalizeBehaviorProfile(value: unknown, defaults: BehaviorProfilesDocument["defaults"], index: number): BehaviorProfile {
  const record = isRecord(value) ? value : {};
  const fallback = createEmptyBehaviorProfile(index + 1);

  return {
    id: asString(record.id, fallback.id),
    label: asString(record.label, fallback.label),
    persona: asString(record.persona, fallback.persona),
    description: asString(record.description),
    systemPrompt: asString(record.systemPrompt),
    expertise: uniqueStrings(record.expertise),
    style: normalizeStyle(record.style, defaults.style),
    moderation: normalizeModerationPolicy(record.moderation, defaults.moderation),
    topicPolicy: normalizeTopicPolicy(record.topicPolicy, defaults.topicPolicy),
    memoryDefaults: normalizeMemoryPolicy(record.memoryDefaults, defaults.memoryDefaults)
  };
}

function normalizeChatPolicy(value: unknown, defaults: ChatPoliciesDocument["defaults"], index: number): ChatPolicy {
  const record = isRecord(value) ? value : {};
  const fallback = createEmptyChatPolicy(index + 1);
  const legacyPersona = asString(record.persona, defaults.persona);

  return {
    chatId: asString(record.chatId, fallback.chatId),
    slug: asString(record.slug, fallback.slug),
    enabled: asBoolean(record.enabled, defaults.enabled),
    profileId: asString(record.profileId, defaults.profileId),
    persona: legacyPersona,
    description: asString(record.description),
    promptOverride: asString(record.promptOverride, defaults.promptOverride),
    activationKeywords: uniqueStrings(record.activationKeywords),
    replyPolicy: normalizeReplyPolicy(record.replyPolicy, defaults.replyPolicy),
    topicPolicy: normalizeTopicPolicy(record.topicPolicy, defaults.topicPolicy),
    moderation: normalizeModerationPolicy(record.moderation, defaults.moderation),
    style: normalizeStyle(record.style, defaults.style),
    memoryPolicy: normalizeMemoryPolicy(
      record.memoryPolicy ?? (isRecord(record) ? { mode: record.memoryScope } : undefined),
      defaults.memoryPolicy
    ),
    silencePolicy: normalizeSilencePolicy(record.silencePolicy, defaults.silencePolicy)
  };
}

export function parseBehaviorProfilesContent(content: string): BehaviorProfilesDocument {
  const parsed = JSON.parse(content) as unknown;
  const record = isRecord(parsed) ? parsed : {};
  const doc = defaultBehaviorProfilesDocument();
  const rawDefaults = isRecord(record.defaults) ? record.defaults : {};

  const defaults = {
    style: normalizeStyle(rawDefaults.style, doc.defaults.style),
    moderation: normalizeModerationPolicy(rawDefaults.moderation, doc.defaults.moderation),
    topicPolicy: normalizeTopicPolicy(rawDefaults.topicPolicy, doc.defaults.topicPolicy),
    memoryDefaults: normalizeMemoryPolicy(rawDefaults.memoryDefaults, doc.defaults.memoryDefaults)
  };

  return {
    version: asNumber(record.version, 1),
    notes: uniqueStrings(record.notes),
    defaults,
    profiles: Array.isArray(record.profiles)
      ? record.profiles.map((entry, index) => normalizeBehaviorProfile(entry, defaults, index))
      : []
  };
}

export function parseChatPoliciesContent(content: string): ChatPoliciesDocument {
  const parsed = JSON.parse(content) as unknown;
  const record = isRecord(parsed) ? parsed : {};
  const doc = defaultChatPoliciesDocument();
  const rawDefaults = isRecord(record.defaults) ? record.defaults : {};

  const defaults: ChatPoliciesDocument["defaults"] = {
    enabled: asBoolean(rawDefaults.enabled, doc.defaults.enabled),
    profileId: asString(rawDefaults.profileId, doc.defaults.profileId),
    persona: asString(rawDefaults.persona, doc.defaults.persona),
    promptOverride: asString(rawDefaults.promptOverride, doc.defaults.promptOverride),
    replyPolicy: normalizeReplyPolicy(rawDefaults.replyPolicy, doc.defaults.replyPolicy),
    topicPolicy: normalizeTopicPolicy(rawDefaults.topicPolicy, doc.defaults.topicPolicy),
    moderation: normalizeModerationPolicy(rawDefaults.moderation, doc.defaults.moderation),
    style: normalizeStyle(rawDefaults.style, doc.defaults.style),
    memoryPolicy: normalizeMemoryPolicy(rawDefaults.memoryPolicy ?? { mode: rawDefaults.memoryScope }, doc.defaults.memoryPolicy),
    silencePolicy: normalizeSilencePolicy(rawDefaults.silencePolicy, doc.defaults.silencePolicy)
  };

  return {
    version: asNumber(record.version, 1),
    notes: uniqueStrings(record.notes),
    defaults,
    chats: Array.isArray(record.chats) ? record.chats.map((entry, index) => normalizeChatPolicy(entry, defaults, index)) : []
  };
}

export function serializeBehaviorProfiles(doc: BehaviorProfilesDocument) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

export function serializeChatPolicies(doc: ChatPoliciesDocument) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

export function parsePersonaIdsFromMarkdown(content: string) {
  const matches = content.matchAll(/^##\s+`([^`]+)`/gm);
  return Array.from(new Set(Array.from(matches, (match) => match[1])));
}

export function getBehaviorProfileById(doc: BehaviorProfilesDocument, profileId: string) {
  return doc.profiles.find((profile) => profile.id === profileId) ?? null;
}

export function buildCompiledPrompt(behavior: Omit<ResolvedChatBehavior, "compiledPrompt">) {
  const lines = [
    "You are Hobbes in a Telegram chat.",
    `Primary persona: ${behavior.persona}.`,
    `Profile: ${behavior.profileId}.`,
    behavior.description ? `Chat description: ${behavior.description}` : "Chat description: not specified.",
    `Preferred answer language: ${behavior.style.language}.`,
    `Preferred tone: ${behavior.style.tone}.`,
    `Preferred answer shape: ${behavior.style.maxAnswerShape}.`,
    behavior.style.usesSlang ? "Controlled slang is allowed when it improves fit for the chat." : "Avoid unnecessary slang.",
    behavior.style.stepByStep ? "Prefer step-by-step answers when useful." : "Do not over-structure short answers.",
    `Memory mode: ${behavior.memoryPolicy.mode}.`,
    "Use concise and useful answers. Do not become noisy.",
    "Answer only within the role and topic scope of this chat.",
    "If the request is outside the allowed scope or crosses a denied boundary, refuse briefly and safely.",
    behavior.moderation.allowSharpTone
      ? "A sharp or dry tone is allowed, but never turn it into abuse or harassment."
      : "Keep the tone controlled and non-hostile.",
    "Do not pretend you are a licensed professional, regulated advisor, or guaranteed authority beyond the configured persona scope."
  ];

  if (behavior.systemPrompt) {
    lines.push("Profile system prompt:");
    lines.push(behavior.systemPrompt);
  }

  if (behavior.promptOverride) {
    lines.push("Chat-specific override:");
    lines.push(behavior.promptOverride);
  }

  if (behavior.topicPolicy.allow.length > 0) {
    lines.push("Allowed topics:");
    lines.push(...behavior.topicPolicy.allow.map((item) => `- ${item}`));
  }

  if (behavior.topicPolicy.deny.length > 0) {
    lines.push("Denied topics:");
    lines.push(...behavior.topicPolicy.deny.map((item) => `- ${item}`));
  }

  if (behavior.activationKeywords.length > 0) {
    lines.push("Typical activation keywords in this chat:");
    lines.push(...behavior.activationKeywords.map((item) => `- ${item}`));
  }

  return lines.join("\n");
}

export function resolveChatBehavior(
  chatDoc: ChatPoliciesDocument,
  profileDoc: BehaviorProfilesDocument,
  chat: ChatPolicy
): ResolvedChatBehavior {
  const profile = getBehaviorProfileById(profileDoc, chat.profileId);
  const persona = profile?.persona ?? chat.persona ?? chatDoc.defaults.persona;
  const label = profile?.label ?? chat.profileId ?? "Inline profile";
  const systemPrompt = profile?.systemPrompt ?? "";
  const style = normalizeStyle(chat.style, normalizeStyle(profile?.style, chatDoc.defaults.style));
  const moderation = normalizeModerationPolicy(
    chat.moderation,
    normalizeModerationPolicy(profile?.moderation, chatDoc.defaults.moderation)
  );
  const memoryPolicy = normalizeMemoryPolicy(
    chat.memoryPolicy,
    normalizeMemoryPolicy(profile?.memoryDefaults, chatDoc.defaults.memoryPolicy)
  );
  const topicPolicy = {
    allow: mergeUniqueStrings(chatDoc.defaults.topicPolicy.allow, profile?.topicPolicy.allow, chat.topicPolicy.allow),
    deny: mergeUniqueStrings(chatDoc.defaults.topicPolicy.deny, profile?.topicPolicy.deny, chat.topicPolicy.deny)
  };
  const resolved = {
    chatId: chat.chatId,
    slug: chat.slug,
    enabled: chat.enabled,
    profileId: chat.profileId,
    persona,
    label,
    description: chat.description,
    systemPrompt,
    expertise: profile?.expertise ?? [],
    promptOverride: chat.promptOverride,
    activationKeywords: mergeUniqueStrings(chat.activationKeywords),
    replyPolicy: normalizeReplyPolicy(chat.replyPolicy, chatDoc.defaults.replyPolicy),
    topicPolicy,
    moderation,
    style,
    memoryPolicy,
    silencePolicy: normalizeSilencePolicy(chat.silencePolicy, chatDoc.defaults.silencePolicy)
  };

  return {
    ...resolved,
    compiledPrompt: buildCompiledPrompt(resolved)
  };
}

export function validateBehaviorProfilesDocument(doc: BehaviorProfilesDocument, personaIds: string[] = []): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (const profile of doc.profiles) {
    if (!profile.id.trim()) {
      issues.push({ level: "error", message: "Каждый profile должен содержать непустой id." });
    }

    if (seenIds.has(profile.id)) {
      issues.push({ level: "error", message: `Повторяющийся profile id: ${profile.id}.` });
    }
    seenIds.add(profile.id);

    if (!profile.label.trim()) {
      issues.push({ level: "error", message: `Профиль ${profile.id || "<без id>"} должен содержать label.` });
    }

    if (!profile.persona.trim()) {
      issues.push({ level: "error", message: `Профиль ${profile.id || "<без id>"} должен содержать persona.` });
    }

    if (personaIds.length > 0 && profile.persona && !personaIds.includes(profile.persona)) {
      issues.push({
        level: "error",
        message: `Профиль ${profile.id} ссылается на persona ${profile.persona}, которой нет в PERSONAS.md.`
      });
    }

    if (profile.moderation.allowSharpTone && (!profile.moderation.forbidAbuse || !profile.moderation.forbidHarassment)) {
      issues.push({
        level: "warning",
        message: `Профиль ${profile.id} включает sharp tone без полного safety guardrails.`
      });
    }

    if (profile.id === "rude_street_operator") {
      issues.push({
        level: "warning",
        message: "Профиль rude_street_operator грубее обычного режима. Используйте его только в чатах с явным согласием на такой тон."
      });
    }

    if (profile.id === "unfiltered_ham") {
      issues.push({
        level: "warning",
        message: "Профиль unfiltered_ham является high-risk режимом. Он остаётся ограниченным guardrails, но требует особенно аккуратного применения."
      });
    }

    if (profile.memoryDefaults.mode === "shared_domain" && !profile.memoryDefaults.sharedDomainKey.trim()) {
      issues.push({
        level: "warning",
        message: `Профиль ${profile.id} использует shared_domain без sharedDomainKey.`
      });
    }
  }

  return issues;
}

export function validateChatPoliciesDocument(
  chatDoc: ChatPoliciesDocument,
  profileDoc: BehaviorProfilesDocument
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenChatIds = new Set<string>();

  for (const chat of chatDoc.chats) {
    if (!chat.chatId.trim()) {
      issues.push({ level: "error", message: "Каждый чат должен содержать непустой chatId." });
    }

    if (seenChatIds.has(chat.chatId)) {
      issues.push({ level: "error", message: `Повторяющийся chatId в chat policies: ${chat.chatId}.` });
    }
    seenChatIds.add(chat.chatId);

    if (!chat.profileId.trim() && !chat.persona.trim()) {
      issues.push({
        level: "error",
        message: `Чат ${chat.slug || chat.chatId} должен содержать profileId или legacy persona.`
      });
    }

    if (chat.profileId && !getBehaviorProfileById(profileDoc, chat.profileId) && !chat.persona.trim()) {
      issues.push({
        level: "error",
        message: `Чат ${chat.slug || chat.chatId} ссылается на отсутствующий profileId: ${chat.profileId}.`
      });
    }

    if (chat.replyPolicy.maxRepliesPerHour < 0) {
      issues.push({
        level: "error",
        message: `Чат ${chat.slug || chat.chatId} содержит отрицательный maxRepliesPerHour.`
      });
    }

    if (chat.replyPolicy.reactWithoutSignal && chat.replyPolicy.maxRepliesPerHour > 20) {
      issues.push({
        level: "warning",
        message: `Чат ${chat.slug || chat.chatId} может стать шумным: reactWithoutSignal=true и высокий maxRepliesPerHour.`
      });
    }

    if (chat.memoryPolicy.mode === "shared_domain" && !chat.memoryPolicy.sharedDomainKey.trim()) {
      issues.push({
        level: "warning",
        message: `Чат ${chat.slug || chat.chatId} использует shared_domain без sharedDomainKey.`
      });
    }

    if (chat.moderation.allowSharpTone && (!chat.moderation.forbidAbuse || !chat.moderation.forbidHarassment)) {
      issues.push({
        level: "warning",
        message: `Чат ${chat.slug || chat.chatId} разрешает sharp tone без полной защиты от abuse/harassment.`
      });
    }

    if (chat.profileId === "rude_street_operator") {
      issues.push({
        level: "warning",
        message: `Чат ${chat.slug || chat.chatId} использует грубый street-tone профиль. Проверьте, что это действительно ожидаемый стиль.`
      });
    }

    if (chat.profileId === "unfiltered_ham") {
      issues.push({
        level: "warning",
        message: `Чат ${chat.slug || chat.chatId} использует high-risk профиль unfiltered_ham. Не включайте его без явного согласия на такой стиль.`
      });
    }
  }

  return issues;
}
