# Hobbes Dashboard MVP

Fast Railway-ready observability dashboard for Hobbes.

## What is included

- `Next.js` web shell
- responsive overview screen
- mock data for product iteration
- `/api/health`
- `/api/ingest` with token validation

## Recommended Railway setup

1. Create a new Railway service from `dashboard-mvp/`.
2. Add environment variables:
   - `INGEST_TOKEN`
   - `NEXT_PUBLIC_APP_NAME=Hobbes Dashboard`
   - later: `DATABASE_URL`
3. Deploy the service.
4. Add Postgres before replacing mock data with live queries.

## Next implementation steps

1. Add Postgres tables from the dashboard architecture doc.
2. Replace mock overview data with SQL-backed loaders.
3. Emit structured events from Hobbes to `/api/ingest`.
4. Add Runs, Agents, Approvals, and Usage pages.
