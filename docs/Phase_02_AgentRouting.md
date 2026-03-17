# Phase 02 Agent Routing

## Goal

Define the first live internal routing chain for the Phase 2 control layer.

Initial target:

- `main -> chief -> comms`
- `main/chief -> guard`

## Routing Rules

### `main`

- stays the Telegram-facing shell
- spawns `chief` first for planning and decomposition
- spawns `comms` second on the actual `chief` result for polished Telegram delivery
- spawns `guard` before endorsing risky or destructive actions
- for normal Telegram planning flows, uses a sequential orchestration pattern: `chief` draft first, `comms` polish second
- never uses the production Telegram chat as a routing test harness

### `chief`

- returns structured planning output or a strong raw draft
- spawns `guard` before approving risky plans
- does not need to handle final Telegram delivery in the normal production path
- stays grounded in the actual Hobbes/OpenClaw environment

### `comms`

- rewrites without changing the decision
- preserves uncertainty and risk
- returns Telegram-ready final text

### `guard`

- returns `SAFE`, `REVIEW`, or `DENY`
- blocks clearly destructive actions
- does not execute the action

## First Test Cases

### Delegation chain

Prompt `main` with a request that needs planning and concise delivery.

Expected behavior:

- `main` consults `chief`
- `chief` produces a plan
- `comms` rewrites the final answer

### Guarded path

Prompt `main` or `chief` with a clearly destructive action.

Expected behavior:

- `guard` is consulted
- final output preserves the `DENY` verdict

## Validation Notes

For this environment, direct gateway-side multi-agent traces are noisy.

Most reliable validation path:

- update routing prompts
- allow subagent permissions in `openclaw.json`
- raise `agents.defaults.subagents.maxSpawnDepth` to `2` for `main -> chief -> comms`
- use `sessions_spawn` for child-agent execution and `subagents` only for steering/status
- run local-mode smoke tests
- inspect relevant agent session activity if needed

## Confirmed on VPS

Live checks on the Phase 2 VPS confirmed the first routing layer works, with one caveat:

- `main -> chief -> comms` was confirmed by child session growth during a local-mode run
- `main -> guard` was confirmed by a fresh `guard` session containing a live `DENY` verdict for deleting `/etc/nginx`
- gateway health stayed `OK` during the routing checks

Observed caveat:

- false negatives can occur if the test is launched from the wrong current directory
- if `openclaw agent --local --agent main` inherits `cwd=/root`, `main` may fail with `EACCES: permission denied, chdir '/home/hobbes/.openclaw/workspace-main' -> '/root'`
- interrupted runs can also leave a short-lived session lock and make the parent `main` reply fail even though the child agent already ran
- parallel spawning of `chief` and `comms` produced weak or premature outputs; the routing contract must stay sequential: `chief` first, then `comms` on the actual `chief` result
- `comms` should receive the actual `chief` output in its task body; otherwise it may correctly ask for missing plan details instead of rewriting
- attempts to rely on ACP-style `sessions_spawn` for internal agents failed because ACP is not configured on this VPS
- the most reliable production-safe chain so far is `main -> chief`, then `main -> comms` on the returned `chief` draft

Because of that, repeatable routing checks should always:

- execute from `/home/hobbes`
- run the CLI as user `hobbes`
- use a bounded timeout and then verify child session counters
- avoid sending synthetic checks into the production Telegram dialog
