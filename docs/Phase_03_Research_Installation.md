# Phase 03 Research Installation

## Goal

Install `research` as the first Phase 3 workhorse specialist without changing the Telegram front door.

Desired result:

- `chief` can delegate source-grounded work
- `research` exists as a separate internal agent
- direct smoke tests pass
- the rollout is reversible

## Preconditions

Before installing `research`, confirm:

- Phase 2 control layer is healthy
- `openclaw-gateway.service` is active
- `http://127.0.0.1:18792/` returns `OK`
- a fresh backup exists

## Files To Create

Agent directory:

- `/home/hobbes/.openclaw/agents/research/agent/auth-profiles.json`
- `/home/hobbes/.openclaw/agents/research/sessions/`

Workspace:

- `/home/hobbes/.openclaw/workspace-research/AGENTS.md`
- `/home/hobbes/.openclaw/workspace-research/BOOTSTRAP.md`
- `/home/hobbes/.openclaw/workspace-research/HEARTBEAT.md`
- `/home/hobbes/.openclaw/workspace-research/IDENTITY.md`
- `/home/hobbes/.openclaw/workspace-research/MEMORY.md`
- `/home/hobbes/.openclaw/workspace-research/SOUL.md`
- `/home/hobbes/.openclaw/workspace-research/TOOLS.md`
- `/home/hobbes/.openclaw/workspace-research/USER.md`

## Install Order

1. Create a backup.
2. Create the `research` agent directory and workspace.
3. Write the workspace prompt stack.
4. Register `research` in `openclaw.json -> agents.list`.
5. Restart `openclaw-gateway.service`.
6. Run a direct smoke test.
7. Only after that, wire `chief -> research`.

## Smoke Test

Recommended command:

```bash
bash /root/check_phase3_research.sh
```

Expected result:

- JSON output returns successfully
- answer contains `RESEARCH_OK`
- no gateway restart occurs
- no provider auth error appears

## Exit Criteria

`research` is ready when:

- install is repeatable from a script
- smoke test passes
- `chief` can later call it safely
- rollback is as simple as removing `agents/research` and `workspace-research`
