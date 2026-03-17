# Phase 03 Memory Installation

## Goal

Install `memory` as the Phase 3 durable knowledge specialist.

Desired result:

- `memory` exists as a separate internal agent
- durable memory ownership becomes explicit
- direct smoke tests pass
- `chief` can later route write proposals to it

## Preconditions

Before installing `memory`, confirm:

- Phase 2 control layer is healthy
- `research` has already been introduced or at least planned
- memory governance rules are documented
- a fresh backup exists

## Files To Create

Agent directory:

- `/home/hobbes/.openclaw/agents/memory/agent/auth-profiles.json`
- `/home/hobbes/.openclaw/agents/memory/sessions/`

Workspace:

- `/home/hobbes/.openclaw/workspace-memory/AGENTS.md`
- `/home/hobbes/.openclaw/workspace-memory/BOOTSTRAP.md`
- `/home/hobbes/.openclaw/workspace-memory/HEARTBEAT.md`
- `/home/hobbes/.openclaw/workspace-memory/IDENTITY.md`
- `/home/hobbes/.openclaw/workspace-memory/MEMORY.md`
- `/home/hobbes/.openclaw/workspace-memory/SOUL.md`
- `/home/hobbes/.openclaw/workspace-memory/TOOLS.md`
- `/home/hobbes/.openclaw/workspace-memory/USER.md`

## Install Order

1. Create a backup.
2. Create the `memory` agent directory and workspace.
3. Write the prompt stack and governance notes.
4. Register `memory` in `openclaw.json -> agents.list`.
5. Restart `openclaw-gateway.service`.
6. Run a direct smoke test.
7. Only after that, let `chief` route durable write proposals to `memory`.

## Smoke Test

Recommended command:

```bash
bash /root/check_phase3_memory.sh
```

Expected result:

- JSON output returns successfully
- answer contains `MEMORY_OK`
- memory agent does not try to perform unrelated work

## Exit Criteria

`memory` is ready when:

- install is repeatable
- smoke test passes
- write ownership is explicit
- rollback is as simple as removing `agents/memory` and `workspace-memory`
