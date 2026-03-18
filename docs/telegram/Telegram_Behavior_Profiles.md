# Telegram Behavior Profiles

Purpose:

- separate reusable behavior profiles from per-chat Telegram settings
- let the dashboard behave like a constructor instead of a raw JSON editor
- keep sharp or domain-specific tones bounded and reviewable

## Model

There are now two layers:

- `config/telegram/behavior_profiles.example.json`
  - reusable profile library
  - stores persona, tone, prompt, moderation, topic defaults, and memory defaults
- `config/telegram/chat_policies.example.json`
  - per-chat mapping
  - stores chat id, triggers, limits, memory mode, prompt override, and selected `profileId`

## Merge order

Effective chat behavior is built in this order:

1. global chat defaults
2. selected behavior profile
3. chat-level overrides

This means one profile can be reused across multiple groups while still allowing local differences.

## Memory modes

- `off`
  - do not retain chat-specific memory beyond immediate runtime context
- `chat_isolated`
  - keep memory local to a single chat or group
- `chat_plus_user`
  - allow chat memory plus optional per-user detail inside the same chat
- `shared_domain`
  - allow shared memory for a bounded domain, keyed by `sharedDomainKey`

Only `off` and `chat_isolated` should be treated as rollout-safe defaults until the live runtime consumer is verified.

## Sharp tone policy

The dashboard now supports three "хам"-style levels, but still not an unbounded abuse profile.

Available levels:

- `sharp_sarcastic_operator`
  - safe sharp tone
  - dry, ironic, controlled
- `rude_street_operator`
  - rougher and more street-like
  - heavier slang and more conversational hardness
- `unfiltered_ham`
  - the harshest available tone in the system
  - high-risk and intentionally uncomfortable

Important:

- `unfiltered_ham` is still not a bypass of core safety
- it remains bounded by anti-harassment and anti-hate guardrails

Allowed:

- dry humor
- mild sarcasm
- short dismissive rhythm when it stays useful

Not allowed:

- direct degrading insults
- harassment
- hate
- humiliation as a goal

If a chat wants a "хам" style, choose one of the three bounded profiles above instead of open-ended toxicity.

## Live rollout status

As of `2026-03-18`, the profile system is no longer only a schema draft.

Verified live on the VPS:

- `/home/hobbes/.openclaw/policies/chat_policies.json` receives dashboard-applied chat config
- `/home/hobbes/.openclaw/policies/behavior_profiles.json` must exist on the VPS for profile resolution to work
- `/usr/local/bin/compile-telegram-group-policies.py` must be the new profile-aware compiler
- `/home/hobbes/.openclaw/runtime/telegram-group-runtime.json` now contains:
  - resolved `profileId`
  - resolved `persona`
  - resolved `memoryPolicy`
  - resolved `moderation`
  - resolved `style`
  - `compiledPrompt`
- `openclaw-gateway.service` was restarted after the profile-aware rollout and returned to `active`

The `unfiltered_ham` crypto chat was verified in live runtime with:

- `profileId = unfiltered_ham`
- `persona = unfiltered_ham`
- `tone = unfiltered_ham`
- `allowSharpTone = true`
- `usesSlang = true`

## Important override behavior

Chat-level overrides still win over the selected profile.

This means a chat can accidentally "polish away" a sharp profile if the chat entry contains softer local values such as:

- `moderation.allowSharpTone = false`
- `style.tone = practical_risk_aware`
- `style.usesSlang = false`

For sharp profiles, operators should either:

- leave `style` and `moderation` empty at chat level
- or set them explicitly to match the intended sharp profile

## Practical validation note

The most reliable verification path right now is:

1. apply the config in GitHub
2. sync to VPS
3. inspect `/home/hobbes/.openclaw/runtime/telegram-group-runtime.json`
4. confirm the target chat has the expected resolved fields and `compiledPrompt`

The dashboard preview is useful, but the runtime artifact on the VPS is the final truth.

## Dashboard workflow

Recommended operator flow:

1. create or clone a profile
2. review persona and moderation
3. assign the profile to a chat
4. add chat-specific prompt override and trigger rules
5. save draft
6. apply to GitHub
7. sync runtime files to VPS

## Runtime contract

The compiler should emit:

- resolved `profileId`
- resolved `persona`
- compiled `systemPrompt`
- `memoryPolicy`
- `replyPolicy`
- `moderation`
- `topicPolicy`

That runtime artifact is the hand-off point for the installed `openClaw` Telegram runtime.
