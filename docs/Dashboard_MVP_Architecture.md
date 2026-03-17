# Dashboard MVP Architecture

## Goal

Build a fast Railway-ready observability dashboard for Hobbes with:

- live agent health
- run and queue visibility
- approval tracking
- token and cost tracking
- failure visibility without reading raw logs

## Product choice

Chosen path: Variant A, fast MVP.

Implementation shape:

- one `Next.js` app on Railway
- App Router for web UI
- API routes for event ingestion and health
- Postgres as the primary store

This keeps the first version simple enough to ship fast and split later if needed.

## Core entities

### `agents`

- `id`
- `display_name`
- `runtime_id`
- `role`
- `status`
- `last_heartbeat_at`
- `last_error_at`

### `runs`

- `id`
- `root_agent_id`
- `parent_run_id`
- `status`
- `channel`
- `started_at`
- `finished_at`
- `duration_ms`
- `summary`

### `events`

- `id`
- `run_id`
- `agent_id`
- `event_type`
- `severity`
- `timestamp`
- `payload_json`

### `approvals`

- `id`
- `run_id`
- `agent_id`
- `status`
- `title`
- `risk_level`
- `requested_at`
- `resolved_at`

### `usage_rollups`

- `id`
- `run_id`
- `agent_id`
- `provider`
- `model`
- `input_tokens`
- `output_tokens`
- `cache_read_tokens`
- `total_tokens`
- `estimated_cost_usd`

## Event types

- `run_started`
- `run_finished`
- `run_failed`
- `agent_spawned`
- `agent_heartbeat`
- `approval_requested`
- `approval_resolved`
- `provider_warning`
- `provider_error`
- `tokens_recorded`

## Ingestion path

1. Hobbes emits structured JSON events.
2. Events go to `POST /api/ingest`.
3. The API validates a shared `INGEST_TOKEN`.
4. Raw events are stored.
5. Derived tables are updated for overview screens.

## Current implementation status

Implemented now:

- `dashboard-mvp` is deployed on Railway
- `POST /api/ingest` stores `overview_snapshot` payloads in Postgres
- `GET /api/overview` serves the newest stored snapshot
- `/` renders live data when a snapshot exists and falls back to mock data otherwise
- a systemd timer on the VPS pushes a fresh snapshot every 2 minutes

Current data sources:

- OpenClaw health endpoint on `127.0.0.1:18792`
- `openclaw-gateway.service` state
- agent session directories under `~/.openclaw/agents/*/sessions`
- recent gateway journal lines for operational signals

Current limitations:

- token usage and spend are still reported as `n/a`
- run chains are inferred from recent session activity, not from structured OpenClaw run events
- approvals are not yet ingested and currently show `0`
- the MVP is public by URL and still needs auth before broader production exposure

## MVP screens

### `Overview`

- global system status
- active runs
- unhealthy agents
- pending approvals
- last 10 critical events

### `Runs`

- active queue
- recent completed runs
- filters by agent, status, and channel

### `Agents`

- per-agent health
- last run
- last error
- average latency

### `Approvals`

- pending approvals first
- resolved approvals after that
- risk level and linked run

### `Usage`

- token totals by model
- estimated spend
- top expensive runs

## MVP API routes

- `GET /api/health`
- `POST /api/ingest`
- `GET /api/overview`
- `GET /api/runs`
- `GET /api/agents`
- `GET /api/approvals`
- `GET /api/usage`

## Railway services

### Required

- `hobbes-dashboard-web`
- `postgres`

### Environment variables

- `DATABASE_URL`
- `INGEST_TOKEN`
- `APP_BASE_URL`
- `NEXT_PUBLIC_APP_NAME`

## Mobile UX

The first version should be responsive, not native.

Priority order on mobile:

1. unhealthy agents
2. active runs
3. pending approvals
4. latest failures
5. usage summary

## Success criteria

- you can open one URL and tell which agents are healthy
- you can see if a run is stuck
- you can see pending approvals without logs
- you can estimate token usage and cost by run and by agent

## Next extension points

1. replace inferred runs with structured run events from Hobbes
2. ingest approvals and explicit queue state
3. record token and model usage as first-class events
4. add auth and private access before wider sharing
