# Phase 02 Closeout

## Scope

This closeout records the actual outcome of the first Phase 2 rollout on the rebuilt Hobbes VPS.

Phase 2 focus for this wave:

- keep `main` as the Telegram front door
- introduce the first control-layer agents
- make delegation real without breaking the working user flow
- stabilize the user experience after repeated routing tests

## Completed

The following control agents are installed and active:

- `chief`
- `comms`
- `guard`

The following implementation pieces are in place:

- isolated agent directories
- per-agent workspaces
- per-agent role contracts
- direct smoke-test scripts for `chief`, `comms`, and `guard`
- routing guidance for `main -> chief -> comms`
- guarded path for risky actions through `guard`

## What Was Verified

Verified on the VPS:

- `openclaw-gateway.service` remains healthy after the Phase 2 rollout
- `main -> chief` works in live Telegram use
- `main -> guard` works and preserves `DENY` for destructive actions
- `chief -> comms` works in controlled routing checks
- the Telegram UX became clean again after resetting the polluted `main` session

Verified in the live chat after session reset:

- one user message produced one reply
- no extra "waiting" message
- no duplicate final answer
- planning-style request returned a clean short plan
- later live user traffic again produced a single normal answer after the sequential routing hardening

## Main Problems Found

The biggest issues during Phase 2 were not missing agents, but runtime behavior:

- `main` carried too much routing prompt context
- repeated tests polluted the long-lived Telegram session
- internal route tests leaked into the production Telegram chat and created operator-visible message spam
- local routing checks could give false negatives when launched from the wrong working directory
- parent sessions could fail after child work because of temporary session locks
- `main` sometimes sent both a `message` tool result and a normal assistant reply, which caused duplicates

## Fixes Applied

The following fixes were applied during the rollout:

- moved orchestration toward `main -> chief`, with `chief -> comms` inside the delegated flow
- then hardened the route further to the more reliable sequential pattern: `main -> chief` for the raw draft, then `main -> comms` for final Telegram delivery
- reduced the routing prompt footprint for `main` and `chief`
- switched the primary text model to `openai/gpt-4.1-mini`
- removed the harmful fallback to `openai/gpt-4o`
- tightened prompt rules so `main` waits silently and avoids using `message` for the same-chat final reply
- backed up and reset the polluted Telegram `main` session
- stopped using the production Telegram chat as a routing test surface

Backup path used for the session reset:

- `/root/openclaw-main-session-reset-20260316-235351`

## Honest Status

Phase 2 is in a good operational state, but not every target is fully complete.

What is complete:

- control-layer agents exist and are runnable
- `main` is stable again as the user-facing shell
- `main -> chief` is good enough for real Telegram planning tasks
- `main -> guard` works for destructive-action review
- the stabilized production-safe orchestration pattern is now: `main -> chief` for the raw draft, then `main -> comms` for the final Telegram wording
- the operator rule is now explicit: no further routing tests in the production Telegram chat

What is not yet fully closed:

- one clean live user-visible proof of the stabilized sequential route on a fresh Telegram session
- a stricter production policy for when `comms` must be used versus when `chief` may answer directly
- explicit event logging for agent routing, approvals, and failures in a dashboard-friendly format

## Closeout Decision

This Phase 2 wave should be considered:

- operationally successful
- good enough to continue
- not the final end-state of Phase 2

The correct next move is not to add more agents immediately.

The correct next move is to finish the remaining Phase 2 hardening:

1. lock down live routing behavior for `main -> chief -> comms`
2. define the production threshold for mandatory `comms`
3. add lightweight observability for routing and approvals
4. only then start the next specialist wave
