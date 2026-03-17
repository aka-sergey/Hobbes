# Phase 03 Closeout

## Scope

Phase 3 rolled out the first workhorse specialists on the same VPS:

- `research`
- `memory` via internal runtime id `memorykeeper`
- Booking via internal runtime id `bookingprep`

## What Was Installed

- isolated agent registration in `openclaw.json`
- dedicated workspaces for each Phase 3 specialist
- repeatable install scripts
- repeatable direct smoke tests
- Phase 3 routing permissions from `chief`

## Integrity Result

Infrastructure status at closeout:

- `openclaw-gateway.service` active
- `127.0.0.1:18792` health endpoint returned `OK`
- registered agents:
  - `main`
  - `chief`
  - `comms`
  - `guard`
  - `research`
  - `memorykeeper`
  - `bookingprep`

Direct smoke checks:

- `phase2_chief` PASS
- `phase2_comms` PASS
- `phase2_guard` PASS
- `phase3_research` PASS
- `phase3_memory` PASS
- `phase3_booking` PASS

Observed routed checks:

- `phase2_routing`
  - live delegation to `chief` and `comms` was observed
  - session counters increased
  - whole check still ended with timeout `124`
- `phase3_routing`
  - session counters increased for `research`, `memorykeeper`, and `bookingprep`
  - whole check still ended with timeout `124`

## Stability Notes

Important hardening applied during validation:

- direct `openclaw agent --local` checks now run with `stdin` redirected from `/dev/null`
- this removed false hangs that appeared only when checks were launched from an interactive SSH shell

Runtime notes:

- `memory` was stabilized by using internal runtime id `memorykeeper`
- Booking was stabilized by using internal runtime id `bookingprep`

## Outcome

Phase 3 is complete for:

- installation
- direct validation
- specialist isolation
- routing permission wiring

Phase 3 is not yet fully complete for:

- fast deterministic routed completion under a single bounded regression timeout

## Priority-Based Assessment

### 1. Integrity

Good.

The platform is consistent and the specialists are installed correctly. The biggest integrity question from this wave, Booking, is now resolved at direct-execution level.

### 2. Speed

Mixed.

Direct specialist checks are fast, roughly `1-4s`, but routed end-to-end checks still exceed the current regression timeout windows.

### 3. Cost

Acceptable for current scope.

Everything is running on `openai/gpt-4.1-mini`, but routed chains still pay a noticeable prompt-tax because `main` and `chief` carry heavy tool and workspace context.

## Recommended Next Step

Do not add more specialists yet.

The next wave should focus on routing optimization:

1. reduce prompt weight in routed chains
2. tighten specialist handoff prompts
3. shorten routed regression scenarios
4. add lightweight structured observability for child-session timing
