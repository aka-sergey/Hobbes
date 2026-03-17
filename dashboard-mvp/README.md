# Hobbes Dashboard MVP

Fast Railway-ready observability dashboard for Hobbes.

## What is included

- `Next.js` web shell
- responsive overview screen
- live snapshot loading from Postgres when `DATABASE_URL` is configured
- mock data fallback when there is no ingested snapshot yet
- `/api/health`
- `/api/ingest` with token validation

## Recommended Railway setup

1. Create a new Railway service from `dashboard-mvp/`.
2. Add environment variables:
   - `INGEST_TOKEN`
   - `NEXT_PUBLIC_APP_NAME=Hobbes Dashboard`
   - `DATABASE_URL`
3. Deploy the service.
4. POST an `overview_snapshot` payload from the VPS on a timer.

## Next implementation steps

1. Emit recurring live snapshots from the VPS to `/api/ingest`.
2. Add event-level usage and approval ingestion.
3. Split Overview into Runs, Agents, Approvals, and Usage pages.
4. Add auth before exposing production data broadly.
