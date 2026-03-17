# Phase 04 Skills Rollout Plan

## Purpose

This phase turns Hobbes from a routed multi-agent shell into a more useful day-to-day operator.

Chosen for immediate rollout:

1. `vision-intake`
2. `pdf-workbench`
3. `web-research`
4. `reminders-and-followups`
5. `persona-router`
6. `voice-notes`
7. `contacts-crm-lite`
8. `meeting-prep`
9. `document-drafter`
10. `personal-memory`

Explicitly postponed:

- `mailbox-ops`
- outbound calling

## Why this set

This set covers the highest-value user-facing needs right now:

- multimodal intake
- document work
- current-info research
- reminders
- per-chat behavior
- voice input
- lightweight relationship tracking
- meeting execution
- polished documents
- durable personal memory

## Agent mapping

### `main`

Gets first:

- `voice-notes`
- `persona-router`
- `reminders-and-followups`

Reason:

- `main` is the Telegram front door and needs channel-aware behavior first

### `chief`

Gets first:

- `meeting-prep`
- `document-drafter`
- `reminders-and-followups`

Reason:

- `chief` coordinates planning, briefs, and user-facing structure

### `research`

Gets first:

- `web-research`
- `vision-intake`
- `pdf-workbench`

Reason:

- `research` should own evidence gathering, extraction, and source-backed synthesis

### `memorykeeper`

Gets first:

- `personal-memory`
- `contacts-crm-lite`

Reason:

- durable memory and relationship context should stay governed

### `comms`

Gets first:

- `document-drafter`
- `persona-router`

Reason:

- `comms` should shape final answers according to audience and chat policy

## Rollout order

### Wave 4A. Inputs and evidence

Install first:

1. `voice-notes`
2. `vision-intake`
3. `pdf-workbench`
4. `web-research`

Why:

- these increase Hobbes' practical usefulness immediately
- they improve what the system can understand before adding more output complexity

### Wave 4B. Delivery and operator UX

Install next:

1. `reminders-and-followups`
2. `persona-router`
3. `meeting-prep`
4. `document-drafter`

Why:

- these shape how Hobbes behaves and how useful it feels in real chats

### Wave 4C. Durable relationship layer

Install after that:

1. `contacts-crm-lite`
2. `personal-memory`

Why:

- these require clearer schema and governance
- memory mistakes are more expensive than extraction mistakes

## Dependency notes

### `vision-intake`

Needs:

- image-capable model path
- OCR-ready workflow

### `pdf-workbench`

Needs:

- PDF parsing tools
- artifact output path

### `web-research`

Needs:

- controlled browsing/search path
- source-link output discipline

### `reminders-and-followups`

Needs:

- durable scheduler or automation backend
- delivery back into Telegram

### `persona-router`

Needs:

- per-chat config
- isolated memory scope by chat or audience

### `voice-notes`

Needs:

- stable transcription path
- optional voice-reply path later

### `contacts-crm-lite`

Needs:

- small contact schema
- explicit write policy

### `meeting-prep`

Needs:

- access to relevant memory and past notes

### `document-drafter`

Needs:

- reusable templates
- optional PDF handoff

### `personal-memory`

Needs:

- write governance
- dedupe rules
- timestamped records

## Validation standard

Every skill should pass:

1. static presence check
2. one direct happy-path test
3. one routed test through the intended agent
4. one failure-mode expectation

## Recommended next implementation order

1. `voice-notes`
2. `vision-intake`
3. `pdf-workbench`
4. `web-research`
5. `reminders-and-followups`
6. `persona-router`
7. `meeting-prep`
8. `document-drafter`
9. `contacts-crm-lite`
10. `personal-memory`
