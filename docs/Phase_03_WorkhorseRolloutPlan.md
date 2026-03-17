# Phase 03 Workhorse Rollout Plan

## Purpose

This document defines the next rollout wave after the Phase 2 control layer.

Phase 3 goal:

- keep the same single VPS gateway
- keep Telegram as the user-facing front door
- add the first workhorse specialists
- move more work into artifacts, files, and structured handoffs

Phase 3 in the current roadmap means:

- `research`
- `memory`
- `booking`

This phase explicitly excludes:

- remote node host
- `device`
- `travel`
- `inbox`
- full dashboard implementation

## Why These Agents

### `research`

This agent adds source-grounded work:

- research briefs
- comparisons
- source collection
- summary artifacts

### `memory`

This agent adds durable knowledge discipline:

- fact capture
- dedupe
- memory class selection
- write governance

### `booking`

This agent adds structured real-world preparation:

- option gathering
- booking checklists
- reservation-ready payloads
- approval-ready decision packages

## Recommended Rollout Order

Install in this order:

1. `research`
2. `memory`
3. `booking`

Why:

- `research` is the safest high-leverage specialist
- `memory` depends on governance and should come after routing is already disciplined
- `booking` touches real-world transactions and should come last in this wave

## Operating Model

Keep the Phase 2 control layer:

- `main` stays the Telegram front door
- `chief` stays the internal planner
- `comms` stays the delivery shaper
- `guard` stays the risk gate

Add Phase 3 specialists behind that layer:

- `chief -> research` for source-grounded work
- `chief -> memory` for durable write proposals and memory maintenance
- `chief -> booking` for structured booking prep

For Telegram-facing output, keep the stable pattern:

- `main` gets the draft or result
- `main` uses `comms` for the final Telegram-ready wording when needed

## Artifact Rule

Phase 3 should be artifact-first.

Longer tasks should produce files before chat summaries.

Recommended artifact types:

- `summary.md`
- `sources.json`
- `decision-memo.md`
- `booking-options.md`
- `memory-write-proposal.md`
- `run-log.txt`

## Handoff Format

Every Phase 3 specialist should return:

1. short purpose
2. result summary
3. artifact path or structured payload
4. risks or missing data

This keeps the chain predictable when `chief`, `guard`, and `comms` are involved.

## Agent Responsibilities

### `research`

Owns:

- research collection
- source-grounded synthesis
- comparison tables
- source artifacts

Does not own:

- durable memory writes
- payments
- destructive execution

### `memory`

Owns:

- durable memory writes
- memory dedupe
- fact normalization
- memory class selection

Does not own:

- free-form research
- purchases
- silent policy bypass

### `booking`

Owns:

- travel or reservation preparation
- availability comparison
- required-input checklists
- approval-ready booking packages

Does not own:

- final purchase without approval
- payment execution without explicit authorization
- long-term memory ownership

## Validation Standard

Each Phase 3 agent should pass three levels:

### Level 1. Static checks

- workspace exists
- auth file exists
- agent is registered in `openclaw.json`
- ownership and permissions are correct

### Level 2. Direct invocation

- `research` can return a short source-grounded brief
- `memory` can classify a memory write and return a structured proposal
- `booking` can return a booking-prep checklist or option package

### Level 3. Routed invocation

- `chief` can call the specialist
- the specialist returns a usable result
- `main` and `comms` can turn that result into a clean Telegram answer

## Operational Rules

- do not test synthetic routing in the production Telegram chat
- validate locally first with `openclaw agent --local`
- prefer controlled smoke tests and session counters on the VPS
- use one live Telegram confirmation only after internal checks pass

## Phase 3 Exit Criteria

Phase 3 is complete when:

- `research`, `memory`, and `booking` are installed as isolated agents
- each has a workspace, contract, and repeatable install script
- each has a direct smoke test
- at least one routed path exists for each through `chief`
- durable memory ownership is explicit
- booking remains approval-gated

## Next Phase After This

Only after Phase 3 is stable should the next wave begin:

- `inbox`
- `travel`
- remote node host
- `device`
