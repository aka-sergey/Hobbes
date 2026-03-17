# Phase 02 Agent Rollout Plan

## Purpose

This document defines the Phase 2 rollout plan for Hobbes after the Phase 1 base platform is up.

Phase 2 goal:

- keep the same single VPS gateway
- keep Telegram as the user-facing front door
- introduce the first control agents safely
- avoid launching all specialist agents too early

This phase explicitly excludes:

- remote node host
- device automation on an external machine
- full dashboard implementation
- the full 9-agent target architecture

## Starting Assumptions

Phase 1 should already provide:

- working `openclaw-gateway.service`
- healthy local gateway
- working Telegram text flow
- backup and health scripts
- baseline config in repo
- repeatable install scripts in repo

Current recommended baseline:

- single VPS
- one OpenClaw gateway
- one Telegram bot
- one stable `main` workspace
- model default `openai/gpt-4.1-mini`

## Phase 2 Strategy

Do not start with all specialist agents.

Start with the control layer:

1. `chief`
2. `comms`
3. `guard`

Why this order:

- `chief` becomes the orchestration brain
- `comms` controls user-facing output style and delivery discipline
- `guard` introduces machine-readable safety and approval boundaries before higher-risk agents exist

Only after these three are working should later phases add:

- `research`
- `memory`
- `booking`

And only after that:

- `inbox`
- `travel`
- `device`

## Phase 2 Deliverables

At the end of Phase 2, the system should have:

- isolated agent directories for `chief`, `comms`, `guard`
- per-agent workspaces
- per-agent prompt stack
- explicit routing/delegation rules
- shared skill policy
- validation checklist per agent
- rollback path for each agent

## Installation Plan

### Step 1. Freeze the Phase 1 baseline

Before introducing agents:

- create a fresh backup archive
- export current `openclaw.json`
- confirm service is healthy
- confirm Telegram still works

Why:

- Phase 2 should be reversible
- if routing breaks, you must be able to restore the known-good text baseline quickly

### Step 2. Create the Phase 2 directory structure

Create per-agent directories under:

- `/home/hobbes/.openclaw/agents/chief`
- `/home/hobbes/.openclaw/agents/comms`
- `/home/hobbes/.openclaw/agents/guard`

Create matching workspaces:

- `/home/hobbes/.openclaw/workspace-chief`
- `/home/hobbes/.openclaw/workspace-comms`
- `/home/hobbes/.openclaw/workspace-guard`

Minimum workspace files for each:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `USER.md`
- `MEMORY.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`
- `IDENTITY.md`

Also create:

- `agent/auth-profiles.json`
- `sessions/`

Wave 2A note:

- start with `chief` only
- use a repeatable install script instead of manual one-off commands
- prove direct `openclaw agent --agent chief` execution before wiring delegation

### Step 3. Define role contracts before skill install

Do not install skills first.

First define for every agent:

- role
- allowed actions
- forbidden actions
- expected outputs
- whether the agent can write durable memory
- whether the agent may request approval

Recommended contracts:

#### `chief`

Purpose:

- receive high-level user tasks
- decide whether to answer directly or delegate
- produce the final task plan

Allowed:

- delegation
- summarization
- artifact planning
- memory write proposals

Not allowed:

- raw unsafe exec by default
- external purchases
- silent durable memory writes

#### `comms`

Purpose:

- rewrite outputs into a user-facing format
- make final Telegram replies shorter, clearer, and calmer

Allowed:

- message drafting
- artifact summarization
- channel-specific formatting

Not allowed:

- infrastructure changes
- secrets access
- approvals bypass

#### `guard`

Purpose:

- policy enforcement
- approval gating
- risk labeling

Allowed:

- block risky actions
- ask for human approval
- classify actions into safe / review / deny

Not allowed:

- perform the risky action itself
- mutate unrelated state

### Step 4. Add shared and local skill policy

Use a two-layer skill model:

- shared skills for common utilities
- local skills for agent-specific behavior

Phase 2 recommendation:

- keep shared skill count low
- only enable skills that have a live validation path

Initial shared skills worth validating first:

- one search skill
- one filesystem/artifact skill
- one health/log inspection skill

Agent-local examples:

- `chief`: routing policy, task decomposition
- `comms`: reply formatting, report condensation
- `guard`: approval workflow, risk classifier

Do not attach every legacy skill from the old VPS immediately.

### Step 5. Define routing rules

Before users can rely on multi-agent behavior, define:

- which incoming tasks stay in `main`
- which tasks are delegated to `chief`
- whether `main` remains the Telegram-facing shell or is replaced by `chief`

Recommended safe rollout:

1. keep Telegram front door on `main`
2. let `main` escalate planning tasks to `chief`
3. let `main` send the actual `chief` draft to `comms` for final formatting
4. let `guard` only review risky actions, not every message

This avoids breaking the already working user entrypoint.

Operational rule:

- never run routing experiments in the production Telegram chat
- use local-mode checks, session counters, and VPS-side validation first
- use the live Telegram chat only for one controlled confirmation after internal checks pass

## Proposed Rollout Waves

### Wave 2A. Install `chief`

What to do:

- create agent directory and workspace
- add role prompt stack
- bind minimal validated shared skills
- test direct invocation

Validation:

- `chief` can turn a user request into a short action plan
- `chief` can propose artifacts
- `chief` does not attempt risky actions directly

Exit criteria:

- three clean direct test cases
- one delegated path from `main` to `chief`

### Wave 2B. Install `comms`

What to do:

- create agent directory and workspace
- add output-formatting prompts
- test it against messy technical outputs

Validation:

- converts long technical output into concise Telegram-ready reply
- preserves facts without inventing them
- does not hide errors

Exit criteria:

- clean formatting for at least three artifact types:
  - summary
  - incident note
  - recommendation

### Wave 2C. Install `guard`

What to do:

- create agent directory and workspace
- define machine-readable approval categories
- connect it only to risky command classes

Initial categories:

- safe
- review
- deny

Examples of `review`:

- package installs
- system config changes
- file deletion outside workspace
- network-facing exposure

Examples of `deny`:

- destructive reset
- secret exfiltration
- mass deletion

Exit criteria:

- `guard` can classify sample actions consistently
- at least one approval-required path works end to end

## Recommended Files To Add In Repo

For each Phase 2 agent:

- `config/agents/<agent>/workspace/*`
- `config/agents/<agent>/agent/auth-profiles.example.json`
- prompt/contract docs per agent

For routing:

- `docs/Phase_02_AgentRouting.md`

For approvals:

- `docs/Phase_02_GuardPolicies.md`

## Testing Plan

Each agent should have three levels of tests.

### Level 1. Static checks

- files exist
- ownership and permissions are correct
- auth file exists
- workspace path is valid

### Level 2. Direct invocation checks

- run the agent directly with a known prompt
- verify answer style and boundaries

### Level 3. Delegation checks

- start from Telegram-facing flow
- confirm routing to the intended agent
- confirm artifact/result comes back to the user cleanly

## Observability Needed Before Wider Rollout

Even before the dashboard exists, add structured visibility for:

- agent invoked
- agent succeeded
- agent failed
- skill invoked
- approval requested
- approval resolved

Minimum acceptable storage:

- append-only log files
- predictable filenames
- timestamps on every event

## Risks If You Skip The Sequence

### Risk 1. Too many agents too early

You will not know whether failures come from:

- transport
- routing
- prompts
- skills
- missing secrets

### Risk 2. Installing skills before contracts

Agents become bags of tools without clear boundaries.

### Risk 3. Letting `guard` stay prompt-only

Then it is advisory, not operational.

### Risk 4. Replacing `main` too early

You may break the already working Telegram entrypoint.

## Phase 2 Exit Criteria

Phase 2 is complete when:

- `chief`, `comms`, and `guard` exist as isolated agents
- each has a workspace and auth profile file
- routing logic is documented
- at least one delegation chain works:
  - `main -> chief -> comms`
- at least one approval chain works:
  - `main/chief -> guard -> user decision`
- rollback to Phase 1 baseline is documented and tested

## Current Status After Initial Rollout

Already completed:

- `chief`, `comms`, and `guard` are installed
- per-agent workspaces and contracts exist
- `main -> chief` is working in live Telegram usage
- `main -> guard` is working for destructive-action review
- the polluted Phase 2 test session was backed up and reset, which restored clean Telegram UX

Still to finish inside Phase 2:

- prove one clean fresh-session live chain for the sequential route `main -> chief draft -> main -> comms polish`
- decide when `chief` may answer directly and when `comms` is mandatory
- add lightweight structured logging for routing, approval, and failure events
- document the rollback and revalidation procedure for future repeats on a new VPS

## Recommended Next Move

Do not add new specialist agents yet.

Finish the remaining hardening work for the control layer first:

1. make the sequential route `main -> chief draft -> main -> comms polish` deterministic in live Telegram use
2. define the production routing rule for `comms`
3. add minimal observability before moving to the next wave

Best practical sequence:

1. scaffold `chief`
2. validate direct invocation
3. wire one simple delegation path
4. scaffold `comms`
5. scaffold `guard`

That gives you a stable Phase 2 foundation without pretending the whole 9-agent system already exists.

## Working Documents

Use these during Phase 2A:

- `docs/Phase_02_Chief_Contract.md`
- `docs/Phase_02_Chief_Installation.md`

Use these during Phase 2B:

- `docs/Phase_02_Comms_Contract.md`
- `docs/Phase_02_Comms_Installation.md`

Use these during Phase 2C:

- `docs/Phase_02_Guard_Contract.md`
- `docs/Phase_02_Guard_Installation.md`
