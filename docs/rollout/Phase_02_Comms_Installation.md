# Phase 02 Comms Installation

## Goal

Install the `comms` delivery agent without replacing the working Telegram front door.

Desired result:

- `main` remains the Telegram-facing shell
- `chief` remains the planner
- `comms` exists as a separate internal formatting agent
- the rollout is reversible

## Preconditions

Before installing `comms`, confirm:

- Phase 1 text flow works in Telegram
- `chief` smoke test already passes
- `openclaw-gateway.service` is active
- `http://127.0.0.1:18792/` returns `OK`
- a fresh backup exists

## Files To Create

Agent directory:

- `/home/hobbes/.openclaw/agents/comms/agent/auth-profiles.json`
- `/home/hobbes/.openclaw/agents/comms/sessions/`

Workspace:

- `/home/hobbes/.openclaw/workspace-comms/AGENTS.md`
- `/home/hobbes/.openclaw/workspace-comms/BOOTSTRAP.md`
- `/home/hobbes/.openclaw/workspace-comms/HEARTBEAT.md`
- `/home/hobbes/.openclaw/workspace-comms/IDENTITY.md`
- `/home/hobbes/.openclaw/workspace-comms/MEMORY.md`
- `/home/hobbes/.openclaw/workspace-comms/SOUL.md`
- `/home/hobbes/.openclaw/workspace-comms/TOOLS.md`
- `/home/hobbes/.openclaw/workspace-comms/USER.md`

## Install Order

1. Create a backup.
2. Create the `comms` agent directory and workspace.
3. Write the workspace prompt stack.
4. Register `comms` in `openclaw.json -> agents.list`.
5. Restart `openclaw-gateway.service` because `gateway.reload.mode=off`.
6. Run a direct local-mode smoke test with `check_phase2_comms.sh`.
7. Only after that, decide whether `main` or `chief` should start using `comms`.

## Smoke Test

Recommended command:

```bash
bash /root/check_phase2_comms.sh
```

Expected result:

- JSON result returns successfully
- response is short, clear, and Telegram-ready
- the response preserves the stated risk
- no auth/provider error appears in the journal

## Known Risks

### `openclaw agents add` may hang

In this environment, the bundled CLI is not reliable enough to be the primary installation path.

Safer fallback:

- create the directory structure manually
- register `comms` directly in `openclaw.json -> agents.list`
- restart the gateway
- validate with `openclaw agent --local --agent comms` or `check_phase2_comms.sh`

### Do not route Telegram directly to `comms`

Phase 2B is about proving `comms` works as a clean delivery layer.

Keep `main` as the user-facing bot until:

- `chief` and `comms` both pass smoke tests
- routing rules are written down
- `guard` is ready to enforce approval boundaries

## Exit Criteria

`comms` is ready for Wave 2B when:

- install is repeatable from a script
- smoke test passes
- the Phase 1 bot still answers in Telegram
- rollback is as simple as removing `agents/comms` and `workspace-comms`
