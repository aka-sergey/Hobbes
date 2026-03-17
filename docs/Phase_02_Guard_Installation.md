# Phase 02 Guard Installation

## Goal

Install the `guard` policy agent without replacing the working Telegram front door.

Desired result:

- `main` remains the Telegram-facing shell
- `chief` remains the planner
- `comms` remains the delivery layer
- `guard` exists as a separate internal approval/risk agent
- the rollout is reversible

## Preconditions

Before installing `guard`, confirm:

- Phase 1 text flow works in Telegram
- `chief` smoke test already passes
- `comms` smoke test already passes
- `openclaw-gateway.service` is active
- `http://127.0.0.1:18792/` returns `OK`
- a fresh backup exists

## Files To Create

Agent directory:

- `/home/hobbes/.openclaw/agents/guard/agent/auth-profiles.json`
- `/home/hobbes/.openclaw/agents/guard/sessions/`

Workspace:

- `/home/hobbes/.openclaw/workspace-guard/AGENTS.md`
- `/home/hobbes/.openclaw/workspace-guard/BOOTSTRAP.md`
- `/home/hobbes/.openclaw/workspace-guard/HEARTBEAT.md`
- `/home/hobbes/.openclaw/workspace-guard/IDENTITY.md`
- `/home/hobbes/.openclaw/workspace-guard/MEMORY.md`
- `/home/hobbes/.openclaw/workspace-guard/SOUL.md`
- `/home/hobbes/.openclaw/workspace-guard/TOOLS.md`
- `/home/hobbes/.openclaw/workspace-guard/USER.md`

## Install Order

1. Create a backup.
2. Create the `guard` agent directory and workspace.
3. Write the workspace prompt stack.
4. Register `guard` in `openclaw.json -> agents.list`.
5. Restart `openclaw-gateway.service` because `gateway.reload.mode=off`.
6. Run a direct local-mode smoke test with `check_phase2_guard.sh`.
7. Only after that, decide where `guard` enters the delegation chain.

## Smoke Test

Recommended command:

```bash
bash /root/check_phase2_guard.sh
```

Expected result:

- JSON result returns successfully
- response contains a clear verdict and reason
- obviously destructive action is classified as `DENY` or strict `REVIEW`
- no auth/provider error appears in the journal

## Known Risks

### `openclaw agents add` may hang

In this environment, the bundled CLI is not reliable enough to be the primary installation path.

Safer fallback:

- create the directory structure manually
- register `guard` directly in `openclaw.json -> agents.list`
- restart the gateway
- validate with `openclaw agent --local --agent guard` or `check_phase2_guard.sh`

### Do not overroute through `guard` too early

Phase 2C is about proving `guard` works as a risk gate.

Avoid putting every message through it until:

- the verdicts are consistent
- the approval policy is documented
- the first guarded path is chosen intentionally

## Exit Criteria

`guard` is ready for Wave 2C when:

- install is repeatable from a script
- smoke test passes
- the Phase 1 bot still answers in Telegram
- rollback is as simple as removing `agents/guard` and `workspace-guard`
