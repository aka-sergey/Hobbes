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

Current checkpoint:

- `voice-notes`, `vision-intake`, `pdf-workbench`, and `web-research` are installed as a baseline
- `web-research` has since been reworked into a search-router-driven architecture
- Telegram-facing image generation has now been added as a practical extension to the same multimodal layer
- Wave 4A should currently be treated as:
  - deployed
  - partially stabilized
  - not yet fully polished for all search verticals

Main remaining issue inside Wave 4A:

- search quality is still uneven across categories
- best current performance is in:
  - current-info
  - general research
  - known-site lookup
- weakest current performance is in:
  - `travel_booking`
  - `local_maps`
- image generation is now available as a helper-backed path, but direct Telegram binary attachment still needs explicit live validation

### Wave 4B. Delivery and operator UX

Install next:

1. `reminders-and-followups`
2. `persona-router`
3. `meeting-prep`
4. `document-drafter`

Why:

- these shape how Hobbes behaves and how useful it feels in real chats

Current checkpoint:

- Wave 4B is ready to be deployed as a behavior baseline
- the repo now carries explicit persona, reminder, meeting, and document-shape files for `main`, `chief`, and `comms`
- this should be treated as:
  - deployed baseline once installed
  - honest UX hardening
  - not yet the final reminder-scheduler or per-chat persona-persistence system

Main remaining issue inside Wave 4B:

- reminders are normalized, but durable reminder execution still needs a verified scheduler path
- persona-router is explicit and usable as a contract, but not yet a fully automated persistent chat-to-persona mapping layer
- quality of final answers still depends on the earlier Wave 4A search quality when the task is search-backed

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

## Current stop point before Wave 4B

Do not move to Wave 4B as if Wave 4A were fully complete.

The current stop point is:

1. Wave 4A is structurally deployed
2. a category-aware search router was added
3. dashboard search telemetry was extended
4. travel and local-business search still need stronger backend choices

Meaning:

- Wave 4B can be started only if we accept that search is “good enough for baseline”
- if we want search to feel genuinely strong, one more iteration on `travel_booking` and `local_maps` is recommended before heavy Wave 4B expansion
- if we proceed anyway, Wave 4B should be presented as a behavior-layer baseline rather than a claim that every downstream execution backend is complete
