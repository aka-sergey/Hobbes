---
name: dashboard-product
description: Use when designing or implementing the Hobbes observability dashboard: event schema, queue and run visibility, agent health UX, approvals, token and cost views, and Railway-ready MVP screens for desktop and mobile.
---

# Dashboard Product

Use this skill for Hobbes observability and dashboard work.

## Product goals

- show which agents are healthy
- show what is running right now
- make failures and approvals obvious
- show token usage and cost without forcing log diving

## MVP screens

1. `Overview`
2. `Runs`
3. `Agents`
4. `Approvals`
5. `Usage`

## UX rules

- use status color sparingly and consistently
- make the active queue readable in under 10 seconds
- show chain context like `main -> chief -> comms`
- separate current incidents from historical runs
- on mobile, prioritize runs, failures, and approvals over dense charts

## Event model

Track at least:

- `run_started`
- `run_finished`
- `run_failed`
- `agent_spawned`
- `approval_requested`
- `approval_resolved`
- `provider_warning`
- `tokens_recorded`

## Build rules

- web-first before native app
- responsive layout from day one
- keep ingestion idempotent
- preserve raw event payloads for later drill-down
