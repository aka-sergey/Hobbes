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

The dashboard supports a sharp profile, but not an unbounded abuse profile.

Allowed:

- dry humor
- mild sarcasm
- short dismissive rhythm when it stays useful

Not allowed:

- direct insults
- harassment
- hate
- humiliation as a goal

If a chat wants a "хам" style, the safe implementation is `sharp_sarcastic_operator`, not open-ended toxicity.

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
