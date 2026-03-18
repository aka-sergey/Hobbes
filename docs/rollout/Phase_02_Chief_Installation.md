# Phase 02 Chief Installation

## Goal

Install the first control-layer agent, `chief`, without replacing the working Telegram front door.

Desired result:

- `main` remains the Telegram-facing shell
- `chief` exists as a separate internal agent
- `chief` can answer direct smoke-test prompts
- the rollout is reversible

## Preconditions

Before installing `chief`, confirm:

- Phase 1 text flow works in Telegram
- `openclaw-gateway.service` is active
- `http://127.0.0.1:18792/` returns `OK`
- a fresh backup exists

## Files To Create

Agent directory:

- `/home/hobbes/.openclaw/agents/chief/agent/auth-profiles.json`
- `/home/hobbes/.openclaw/agents/chief/sessions/`

Workspace:

- `/home/hobbes/.openclaw/workspace-chief/AGENTS.md`
- `/home/hobbes/.openclaw/workspace-chief/BOOTSTRAP.md`
- `/home/hobbes/.openclaw/workspace-chief/HEARTBEAT.md`
- `/home/hobbes/.openclaw/workspace-chief/IDENTITY.md`
- `/home/hobbes/.openclaw/workspace-chief/MEMORY.md`
- `/home/hobbes/.openclaw/workspace-chief/SOUL.md`
- `/home/hobbes/.openclaw/workspace-chief/TOOLS.md`
- `/home/hobbes/.openclaw/workspace-chief/USER.md`

## Install Order

1. Create a backup.
2. Create the `chief` agent directory and workspace.
3. Write the workspace prompt stack.
4. Register `chief` in `openclaw.json -> agents.list`.
5. Restart `openclaw-gateway.service` because `gateway.reload.mode=off`.
6. Run a direct agent smoke test with `openclaw agent --agent chief`.
7. Only after that, decide whether `main` should start delegating to `chief`.

## Smoke Test

Recommended command:

```bash
bash /root/check_phase2_chief.sh
```

Expected result:

- JSON result returns successfully
- response contains `CHIEF_OK` or a short structured answer that reflects the `chief` contract
- no gateway restart occurs
- no auth/provider error appears in the journal

## Known Risks

### `openclaw agents add` may hang

In this environment, the bundled CLI can stall on `openclaw agents add ... --non-interactive`.

Safer fallback:

- create the directory structure manually
- register `chief` directly in `openclaw.json -> agents.list`
- restart the gateway
- validate with `openclaw agent --local --agent chief` or `check_phase2_chief.sh`

### `openclaw agents set-identity` may also stall

In the same environment, `set-identity` is not reliable enough to be the primary install path.

Safer fallback:

- keep `IDENTITY.md` as the source of truth in the workspace
- write the `identity` block directly into `agents.list`
- restart the gateway after the config change

### Do not bind Telegram to `chief` yet

Phase 2A is about proving `chief` works as an internal planner.

Keep `main` as the user-facing bot until:

- `chief` survives repeated smoke tests
- later delegation rules are defined
- `comms` and `guard` are ready

## Exit Criteria

`chief` is ready for Wave 2A when:

- install is repeatable from a script
- smoke test passes
- the Phase 1 bot still answers in Telegram
- rollback is as simple as removing `agents/chief` and `workspace-chief`
