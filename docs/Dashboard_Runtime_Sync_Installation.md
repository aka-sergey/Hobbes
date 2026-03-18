# Dashboard Runtime Sync Installation

## Purpose

Enable the dashboard `Sync на VPS` button for `repo_and_runtime` files even when Railway cannot open a direct SSH session to the VPS.

## Architecture

1. The dashboard commits repo changes to GitHub.
2. The dashboard creates a runtime sync job in Postgres.
3. A small worker on the VPS polls the dashboard queue over HTTPS.
4. The worker writes the file into the live OpenClaw workspace.
5. The worker restarts `openclaw-gateway.service`.

This is safer than mutating runtime files directly from the Railway container.

## Worker file

Install:

- [hobbes_control_sync_worker.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_control_sync_worker.py)

Target path on VPS:

- `/usr/local/bin/hobbes-control-sync-worker.py`

## Required env on VPS

Suggested env file:

- `/etc/hobbes-control-sync.env`

Variables:

- `HOBBES_CONTROL_BASE_URL`
- `HOBBES_CONTROL_TOKEN`

## Suggested systemd unit

Service:

```ini
[Unit]
Description=Hobbes dashboard runtime sync worker

[Service]
Type=oneshot
EnvironmentFile=/etc/hobbes-control-sync.env
ExecStart=/usr/bin/python3 /usr/local/bin/hobbes-control-sync-worker.py
```

Timer:

```ini
[Unit]
Description=Run Hobbes dashboard runtime sync worker every minute

[Timer]
OnBootSec=30s
OnUnitActiveSec=60s
Unit=hobbes-control-sync.service

[Install]
WantedBy=timers.target
```

## Current behavior

- direct SSH sync from Railway is still attempted first
- if Railway cannot complete the SSH handshake, the dashboard falls back to a queued runtime sync job
- the VPS worker is then expected to apply that queued job

## Readiness note

On the current VPS, `openclaw-gateway.service` may become `active` before the HTTP health endpoint is available.

For that reason, the worker currently treats the sync as successful when:

- the file is written successfully
- ownership and mode are corrected
- `openclaw-gateway.service` restarts successfully
- `systemctl --user is-active openclaw-gateway.service` returns `active`

## Scope

Only allowlisted files are eligible:

- `config/agents/main/workspace/PERSONAS.md`
- `config/agents/main/workspace/REMINDERS.md`
- `config/agents/chief/workspace/REMINDERS.md`
- `config/agents/chief/workspace/MEETING_PREP.md`
- `config/agents/chief/workspace/DOCUMENT_SHAPES.md`
- `config/agents/comms/workspace/PERSONAS.md`
- `config/agents/comms/workspace/DOCUMENT_SHAPES.md`
