# Telegram Current State

Date:

- `2026-03-18`

Purpose:

- capture the real current state of the Telegram-facing Hobbes layer
- make it obvious what is already working
- make it obvious what is not yet enabled
- leave a safe restart point before the next Telegram iteration

## Executive summary

Telegram DM operation is currently the stable baseline.

What works now:

- `main` is the live Telegram front door
- `chief`, `comms`, `guard`, `research`, `memorykeeper`, and `bookingprep` exist behind the shell
- routed Telegram work is possible
- Russian can now be treated as the default operator language for Sergey
- Wave 4B behavior contracts for persona, reminders, meeting prep, and document shaping are prepared and installed as a baseline

What is not yet production-ready:

- group-chat behavior by persona is not yet enabled in production
- durable reminders are not yet proven as a real scheduler-backed delivery system
- bot-to-bot test mode is not yet wired into a live Telegram runtime path
- search quality in Telegram still remains mixed for:
  - `travel_booking`
  - `local_maps`

## Live production facts

Current known Telegram config posture:

- DMs are the primary supported user-facing path
- group behavior should still be treated as gated
- production should not be opened to groups until explicit chat policy and trigger rules are reviewed

Reason:

- uncontrolled group activation creates spam, persona bleed, and safety drift
- the current Hobbes layer is good enough for controlled rollout, not for "answer in every group automatically"

## What Wave 4B changed for Telegram

Wave 4B added a behavior-layer baseline:

- `main`
  - explicit persona source
  - reminder intake normalization
  - Russian default for Sergey
- `chief`
  - reminder normalization
  - meeting-prep packet shaping
  - structured document draft shaping
- `comms`
  - persona-aware final polish
  - Russian default for Telegram replies

This is a real improvement in control and UX.

It is not yet the same thing as:

- persistent per-group persona routing
- durable reminder execution
- automated bot-evaluator mode

## Telegram gaps still open

### 1. Group personas are not yet activated

Needed before activation:

- explicit allowlisted chat IDs
- persona per chat
- topic allow and deny lists
- clear "when Hobbes speaks" triggers
- clear "when Hobbes stays silent" rules

### 2. Reminder execution is still partial

Current honest state:

- Hobbes can normalize reminder requests
- Hobbes should not yet promise durable reminder delivery as if a scheduler were fully verified

Needed next:

- scheduler or automation backend
- delivery confirmation path
- failure and retry handling

### 3. Bot-evaluator mode is still a design artifact, not a live runtime feature

Needed next:

- isolated test chat
- explicit command or owner-only trigger
- bounded questionnaire
- report path back to owner

### 4. Search-backed Telegram answers still depend on category quality

Good enough:

- current-info and general research

Still weak:

- local business lookup
- hotel and travel search

## Safe next Telegram step

The safest next implementation step is:

1. keep production groups disabled
2. define explicit chat policy in a config file
3. define test mode separately from normal chats
4. enable one allowlisted group at a time

## Artifacts added for the next Telegram pass

- [chat_policies.example.json](/Users/sergeysobolev/HobbesCodex/config/telegram/chat_policies.example.json)
- [test_mode.example.json](/Users/sergeysobolev/HobbesCodex/config/telegram/test_mode.example.json)
- [Telegram_Group_Policy_Kit.md](/Users/sergeysobolev/HobbesCodex/docs/Telegram_Group_Policy_Kit.md)
- [Telegram_Test_Mode.md](/Users/sergeysobolev/HobbesCodex/docs/Telegram_Test_Mode.md)
- [Telegram_Bot_Test_Questionnaire.md](/Users/sergeysobolev/HobbesCodex/docs/Telegram_Bot_Test_Questionnaire.md)
