# Phase 03 Booking Installation

## Goal

Install Booking as the last Phase 3 workhorse specialist.

Desired result:

- Booking exists as a separate internal agent
- booking work stays approval-gated
- direct smoke tests pass
- later routed booking prep can happen without opening the payment path

## Preconditions

Before installing `booking`, confirm:

- Phase 2 control layer is healthy
- `guard` is already available
- a fresh backup exists

## Files To Create

Agent directory:

- `/home/hobbes/.openclaw/agents/booking/agent/auth-profiles.json`
- `/home/hobbes/.openclaw/agents/booking/sessions/`

Workspace:

- `/home/hobbes/.openclaw/workspace-booking/AGENTS.md`
- `/home/hobbes/.openclaw/workspace-booking/BOOTSTRAP.md`
- `/home/hobbes/.openclaw/workspace-booking/HEARTBEAT.md`
- `/home/hobbes/.openclaw/workspace-booking/IDENTITY.md`
- `/home/hobbes/.openclaw/workspace-booking/MEMORY.md`
- `/home/hobbes/.openclaw/workspace-booking/SOUL.md`
- `/home/hobbes/.openclaw/workspace-booking/TOOLS.md`
- `/home/hobbes/.openclaw/workspace-booking/USER.md`

## Install Order

1. Create a backup.
2. Create the Booking agent directory and workspace.
3. Write the approval-aware prompt stack.
4. Register internal runtime id `bookingprep` in `openclaw.json -> agents.list`.
5. Restart `openclaw-gateway.service`.
6. Run a direct smoke test.
7. Only after that, wire `chief -> booking` for preparation-only flows.

## Smoke Test

Recommended command:

```bash
bash /root/check_phase3_booking.sh
```

Expected result:

- JSON output returns successfully
- answer contains `BOOKING_OK`
- Booking keeps the approval boundary explicit

## Exit Criteria

Booking is ready when:

- install is repeatable
- smoke test passes
- it cannot silently finalize transactions
- rollback is as simple as removing `agents/booking` and `workspace-booking`
