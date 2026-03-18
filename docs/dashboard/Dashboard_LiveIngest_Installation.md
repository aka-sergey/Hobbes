# Dashboard Live Ingest Installation

## Goal

Connect the rebuilt Hobbes VPS to the Railway dashboard so the overview screen shows real OpenClaw state instead of mock data.

## Implemented topology

- Railway project: `Hobbes Dashboard`
- Railway services:
  - `hobbes-dashboard-web`
  - `Postgres`
- Public dashboard:
  - `https://hobbes-dashboard-web-production.up.railway.app`
- VPS sender:
  - `/usr/local/bin/hobbes-dashboard-snapshot.sh`
- VPS timer:
  - `hobbes-dashboard-snapshot.timer`

## What the live sender captures

- gateway health from `127.0.0.1:18792`
- `openclaw-gateway.service` state
- registered runtime agent ids from `~/.openclaw/openclaw.json`
- recent session activity from `~/.openclaw/agents/<agent>/sessions`
- recent operational signals from `journalctl --user -u openclaw-gateway.service`

## Files added in the repo

- `scripts/remote/hobbes_dashboard_snapshot.sh`
- `scripts/remote/setup_dashboard_ingest.sh`

## Railway requirements

Set on the web service:

- `INGEST_TOKEN`
- `APP_BASE_URL`
- `DATABASE_URL`

The dashboard reads the latest snapshot from Postgres through `GET /api/overview`.

## VPS installation flow

1. Copy `hobbes_dashboard_snapshot.sh` to `/tmp/hobbes_dashboard_snapshot.sh`
2. Copy `setup_dashboard_ingest.sh` to `/tmp/setup_dashboard_ingest.sh`
3. Run:

```bash
/tmp/setup_dashboard_ingest.sh \
  https://hobbes-dashboard-web-production.up.railway.app \
  "$INGEST_TOKEN" \
  72.56.112.63
```

4. Verify:

```bash
systemctl status hobbes-dashboard-snapshot.timer --no-pager
systemctl status hobbes-dashboard-snapshot.service --no-pager
```

5. Confirm the dashboard is live:

```bash
curl -sS https://hobbes-dashboard-web-production.up.railway.app/api/overview
```

Expected:

- `"source":"live"`
- recent `capturedAt`
- real agent list from the VPS

## Notes and limitations

- the current sender publishes overview snapshots, not full structured run telemetry
- token usage, cost, and approvals are still placeholders until explicit Hobbes events are emitted
- event filtering intentionally ignores conversational content and keeps only operational signals
