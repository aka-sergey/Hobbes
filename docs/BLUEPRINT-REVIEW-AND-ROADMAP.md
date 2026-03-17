# OpenClaw Blueprint Review And Roadmap

Updated: 2026-03-16
Source plan reviewed: `/Users/sergeysobolev/Downloads/openclaw_blueprint_9_agents_skills.md`

## 1. Short Verdict

The blueprint is directionally strong, but it is a target architecture, not a safe immediate rollout plan.

What is realistic:
- one VPS gateway
- layered rollout
- separate workspaces per agent
- shared and agent-local skills
- a future node host for device automation

What needs adjustment:
- do not launch 9 agents before transport stability and observability are solved
- do not treat installed skills as runtime-ready without per-agent validation
- do not expect `device` to be meaningful on a lone VPS without a real external node host
- do not overload Telegram as the only orchestration surface for long-running multi-agent work

## 2. Current Gap Versus Target

Target in blueprint:
- 1 gateway
- 9 isolated agents
- shared skills
- local skills
- guardrails
- node host
- python workers

Current production reality:
- `main` as the Telegram-facing shell
- `chief`, `comms`, and `guard` installed as control-layer agents
- 1 Telegram bot
- one rebuilt VPS baseline
- Phase 2 routing hardening in progress
- no workhorse specialists deployed yet
- no remote node host yet
- no agent health dashboard yet

So the correct next move is not "build nine personalities", but "stabilize transport, observability, and routing contracts first".

## 3. Breakdown Into Executable Phases

### Phase 0. Stabilize the base platform

Goal:
- make Telegram reliable enough for daily use
- make state and errors observable

Must-have:
- remove or sharply reduce `stale-socket`
- define restart policy and incident logging
- confirm direct-message flow end to end
- fix group policy if group usage is desired
- verify logs, health, and metrics collection

Exit criteria:
- 24 to 72 hours without destructive outages
- predictable reconnect behavior
- health checks and alerting available

### Phase 1. Single-agent production MVP

Goal:
- make Hobbes useful in Telegram every day as one reliable assistant

Scope:
- `main`
- working memory files
- working backend integrations
- validated skill set

Must-have skills for MVP:
- `hobbes.rss`
- one search capability
- one task/queue capability
- one long-run artifact pattern: file outputs, not only chat

Exit criteria:
- user can safely ask for research, triage, reminders, and summaries through Telegram
- every enabled skill has a live test case and documented dependencies

### Phase 2. Introduce control agents, not all specialists

Recommended first specialist set:
- `chief`
- `comms`
- `guard`

Why:
- these agents define routing, approvals, and tone
- they reduce risk before bookings, remote exec, or payments appear

Exit criteria:
- delegation rules are explicit
- guard can block risky actions
- Telegram routing rules are understandable and documented

### Phase 3. Add workhorse specialists

Next set:
- `research`
- `memory`
- `booking`

Why:
- these produce the biggest leverage once routing exists
- they can share artifacts and files across workspaces

Exit criteria:
- each agent has its own workspace, prompt stack, and validation checklist
- cross-agent handoff format exists
- long-run tasks write artifacts to disk and return summaries

### Phase 4. Add operational specialists

Later set:
- `inbox`
- `travel`
- `device`

Important:
- `device` should wait until a real node host exists on another machine
- otherwise it becomes either fake or dangerously overpowered on the VPS

## 4. Where The Blueprint Is Strong

- One gateway is the right simplification
- Separate workspaces per agent is the right boundary
- Shared versus local skills is the right mental model
- Layered rollout is already hinted in the plan and should become mandatory
- Guard/approval concepts are exactly what will matter once real-world actions are introduced
- Python workers are the right way to keep long jobs cheaper and more deterministic

## 5. Where You Can Be Wrong Or Get Burned

### Mistake 1. Counting agents as capability

Nine agents do not create reliability by themselves.
Without routing, health visibility, and per-agent acceptance tests, nine agents mostly create nine failure domains.

### Mistake 2. Assuming Telegram is enough for orchestration

Telegram is excellent for the human front door, but weak as the only control plane for:
- task queues
- background job status
- retries
- token accounting
- long-running agent collaboration

You need a web control plane even if Telegram stays the primary UX.

### Mistake 3. Assuming installed skills are ready

A folder inside `workspace-*/skills` is not enough.
Each skill needs:
- runtime dependency check
- auth check
- one positive live test
- one failure-mode expectation

Current production already shows this exact issue:
- session state references `hobbes.rss`
- the skill directory exists
- the `SKILL.md` manifest is missing on disk

So skill inventory must be derived from validated runtime state, not only from directories.

### Mistake 4. Starting `device` too early

On a single VPS, `device` often becomes either pointless or unsafe.
Its real value appears when it can operate an external laptop, Mac mini, or node host.

### Mistake 5. Underestimating memory discipline

If multiple agents write memory without schema and ownership rules, memory becomes noisy fast.
You need:
- memory classes
- write permissions
- dedupe rules
- time stamps
- "durable fact vs temporary note" policy

### Mistake 6. Letting guard stay conceptual

`guard` must become an explicit approval workflow, not just prompt text.
High-risk categories need machine-readable policy and auditable events.

## 6. Supplemented Implementation Plan

### Layer A. Reliability And Ops

Add:
- agent event log schema
- provider restart counters
- token usage capture
- queue/job state table
- dashboard-ready metrics endpoint or log stream
- alerting for repeated reconnect loops

### Layer B. Runtime Contracts

Add for every agent:
- unique role and allowed actions
- workspace path
- required skills
- required secrets
- acceptance tests
- rollback path

### Layer C. Artifacts-First Work

Adopt a rule:
- long tasks produce files first
- Telegram gets a short summary plus links/paths

Recommended artifact types:
- `summary.md`
- `decision-memo.md`
- `sources.json`
- `table.csv`
- `run-log.txt`

### Layer D. Memory Governance

Add:
- `people/`
- `projects/`
- `preferences/`
- `decisions/`
- `daily/`

Policy:
- only `chief` and `memory` may write durable memory by default
- everyone else proposes writes or writes to staging

### Layer E. Dashboard Readiness

Emit structured events for:
- provider connected/disconnected
- job queued/running/succeeded/failed
- agent invoked
- skill invoked
- tokens in/out
- human approval requested/resolved

## 7. Dashboard Recommendation

## Best UX shape

Use two surfaces:
- web dashboard as the primary operations console
- Android app as a thin mobile shell over the same API, not a separate product first

Why:
- web is much faster to build and iterate
- Android can come later as a wrapper or React Native/Flutter client once the backend contracts are stable

## Proposed dashboard layout

### View 1. Command Center

Show:
- agent cards with status: healthy, degraded, offline, waiting approval
- Telegram provider status
- current queue depth
- last successful action
- restart count
- token spend today

### View 2. Runs And Queue

Show:
- live job queue
- per-job state
- owning agent
- started at / duration
- artifact links
- retry button

### View 3. Agent Detail

Show:
- prompt stack summary
- enabled skills
- required secrets
- recent tasks
- last errors
- token trend
- memory writes

### View 4. Approvals

Show:
- pending high-risk actions
- who requested them
- reason
- impact preview
- approve / deny / ask follow-up

### View 5. Cost And Usage

Show:
- tokens by day
- tokens by agent
- model mix
- expensive runs
- cost anomalies

## Implementation approach

Recommended stack:
- FastAPI or Node API for event ingestion and read endpoints
- SQLite or Postgres for runs, events, approvals, and token usage
- Next.js dashboard with websocket or SSE updates
- Telegram remains the conversational front end

Best first iteration:
1. Structured logs from OpenClaw and backend into SQLite/Postgres
2. Simple dashboard with Command Center, Queue, and Approvals
3. Mobile-friendly responsive web UI
4. Optional Android wrapper using Trusted Web Activity or React Native later

## 8. Recommended Next Build Order

1. Finish transport stabilization and provider observability
2. Make single-agent Telegram MVP truly reliable
3. Add dashboard and event model
4. Add `chief`, `comms`, `guard`
5. Add `research`, `memory`, `booking`
6. Add `inbox`, `travel`
7. Add `device` only after a real node host is available

## 9. Bottom Line

Your plan is good as a destination.

For a dependable personal operator in Telegram, the most realistic path is:
- stable single-agent base
- observability
- explicit approvals
- then controlled multi-agent rollout

That path will be slower than "turn on 9 agents now", but much more likely to stay alive and useful.
