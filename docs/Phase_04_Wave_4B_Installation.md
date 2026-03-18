# Phase 04 Wave 4B Installation

## Purpose

Wave 4B adds the first behavior-layer baseline on top of the routed Hobbes stack.

This wave is about:

- reminder and follow-up intake discipline
- explicit persona contracts
- meeting-prep structure
- reusable document shapes

It is not a claim that all delivery backends are fully production-ready.

## Installed skills

### `main`

- `reminders-and-followups`
- `persona-router`

### `chief`

- `reminders-and-followups`
- `meeting-prep`
- `document-drafter`

### `comms`

- `persona-router`
- `document-drafter`

## Workspace additions

### `main`

- `PERSONAS.md`
- `REMINDERS.md`

### `chief`

- `REMINDERS.md`
- `MEETING_PREP.md`
- `DOCUMENT_SHAPES.md`

### `comms`

- `PERSONAS.md`
- `DOCUMENT_SHAPES.md`

## Behavioral intent

### `main`

- default to Russian for Sergey in Telegram
- keep persona behavior explicit instead of blending tones
- route reminders, follow-ups, meeting work, and structured drafting to `chief`
- avoid falsely claiming a reminder is already scheduled

### `chief`

- normalize reminders into explicit fields
- prepare compact meeting packets
- draft structured documents before final polish
- state clearly when reminder scheduling is normalized but not durably confirmed

### `comms`

- polish output according to explicit persona rules
- keep Russian as the default Telegram language
- shape drafts without changing their factual core

## Validation standard for this wave

Wave 4B is validated as a baseline by:

1. skill presence in the live workspaces
2. policy-file presence in the live workspaces
3. contract markers in the live workspaces
4. `openclaw-gateway.service` still running after rollout

Why not a stronger routed check:

- the current `openclaw agent --local --agent chief` harness is still unreliable for direct internal-agent validation
- Wave 4B behavior is mostly contract and policy shaping rather than a new external integration

## Honest limitations after installation

- durable reminder delivery is not yet proven as a production scheduler
- per-chat persona persistence is not yet a fully implemented chat-mapping system
- Wave 4A search quality still remains mixed in `travel_booking` and `local_maps`

## Repeatable install and check

- installer: [setup_phase4b_wave_b.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/setup_phase4b_wave_b.sh)
- checker: [check_phase4b_wave_b.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_phase4b_wave_b.sh)
