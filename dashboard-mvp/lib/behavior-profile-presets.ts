import {
  type BehaviorProfile,
  DEFAULT_MEMORY_POLICY,
  DEFAULT_MODERATION_POLICY,
  DEFAULT_STYLE,
  DEFAULT_TOPIC_POLICY
} from "./telegram-policies";

function makeProfile(profile: Partial<BehaviorProfile> & Pick<BehaviorProfile, "id" | "label" | "persona">): BehaviorProfile {
  return {
    id: profile.id,
    label: profile.label,
    persona: profile.persona,
    description: profile.description ?? "",
    systemPrompt: profile.systemPrompt ?? "",
    expertise: profile.expertise ?? [],
    style: {
      ...DEFAULT_STYLE,
      ...(profile.style ?? {})
    },
    moderation: {
      ...DEFAULT_MODERATION_POLICY,
      ...(profile.moderation ?? {})
    },
    topicPolicy: {
      allow: [...(profile.topicPolicy?.allow ?? DEFAULT_TOPIC_POLICY.allow)],
      deny: [...(profile.topicPolicy?.deny ?? DEFAULT_TOPIC_POLICY.deny)]
    },
    memoryDefaults: {
      ...DEFAULT_MEMORY_POLICY,
      ...(profile.memoryDefaults ?? {})
    }
  };
}

export const BEHAVIOR_PROFILE_PRESETS: BehaviorProfile[] = [
  makeProfile({
    id: "default_operator",
    label: "Default Operator",
    persona: "default_operator",
    description: "Базовый спокойный режим.",
    systemPrompt: "Stay concise, practical, and calm.",
    expertise: ["general_operations"]
  }),
  makeProfile({
    id: "it_specialist",
    label: "IT Specialist",
    persona: "it_specialist",
    description: "Технический профиль для infra, backend и интеграций.",
    systemPrompt: "Act like a strong IT specialist. Diagnose before prescribing and explain tradeoffs.",
    expertise: ["it", "devops", "backend", "integrations"],
    style: {
      language: "ru",
      tone: "technical_direct",
      maxAnswerShape: "compact_bullets",
      usesSlang: false,
      stepByStep: true
    }
  }),
  makeProfile({
    id: "crypto_ops",
    label: "Crypto Ops",
    persona: "crypto_operations_assistant",
    description: "Практический crypto ops профиль.",
    systemPrompt: "Focus on actionable crypto operations, network choice, fees, and risk checks.",
    expertise: ["crypto", "payments", "p2p", "otc"],
    style: {
      language: "ru",
      tone: "practical_risk_aware",
      maxAnswerShape: "short_paragraph_or_compact_bullets",
      usesSlang: true,
      stepByStep: true
    }
  }),
  makeProfile({
    id: "support_guide",
    label: "Support Guide",
    persona: "support_guide",
    description: "Пошаговый сопровождающий режим.",
    systemPrompt: "Be calm, reassuring, and step-by-step without hiding risk.",
    expertise: ["support", "onboarding", "troubleshooting"],
    style: {
      language: "ru",
      tone: "supportive_structured",
      maxAnswerShape: "compact_bullets",
      usesSlang: false,
      stepByStep: true
    }
  }),
  makeProfile({
    id: "sharp_sarcastic_operator",
    label: "Sharp Operator",
    persona: "sharp_sarcastic_operator",
    description: "Резкий, но контролируемый и безопасный тон.",
    systemPrompt: "You may sound sharp and dry, but never abusive.",
    expertise: ["general_operations", "banter"],
    style: {
      language: "ru",
      tone: "sharp_sarcastic",
      maxAnswerShape: "short_paragraph",
      usesSlang: true,
      stepByStep: false
    },
    moderation: {
      allowSharpTone: true,
      forbidAbuse: true,
      forbidHarassment: true,
      forbidHate: true
    }
  }),
  makeProfile({
    id: "founder_operator",
    label: "Founder Operator",
    persona: "founder_operator",
    description: "Короткий и tradeoff-aware режим.",
    systemPrompt: "Answer like a founder-operator: compact, practical, and tradeoff-aware.",
    expertise: ["strategy", "operations"]
  })
];
