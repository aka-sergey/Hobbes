# Hobbes Changelog

## 2026-03-17

### Completed the Phase 3 workhorse installation baseline

Changed:

- deployed `research`, `memory`, and Booking on the VPS
- stabilized internal runtime ids as:
  - `memorykeeper` for Memory
  - `bookingprep` for Booking
- added routed permission wiring from `chief` to the three Phase 3 specialists
- hardened Phase 3 check scripts so `openclaw agent --local` runs with `stdin` redirected from `/dev/null`

Verified:

- `openclaw-gateway.service` remained healthy after the rollout
- `research` direct smoke test returned `RESEARCH_OK`
- `memorykeeper` direct smoke test returned `MEMORY_OK`
- `bookingprep` direct smoke test returned `BOOKING_OK`
- all three specialist session counters increased during validation

Residual issue:

- routed regression checks were tightened and then passed after shorter prompts, stdin hardening, and realistic bounded budgets

Artifacts:

- Phase 3 closeout recorded in `docs/Phase_03_Closeout.md`

### Prepared the Phase 3 workhorse rollout kit

Added in repo:

- `Phase_03_WorkhorseRolloutPlan.md`
- install and contract docs for `research`, `memory`, and `booking`
- workspace templates for the three Phase 3 specialists
- repeatable setup/check scripts for the three Phase 3 specialists

Design decision:

- Phase 3 follows the current roadmap and introduces `research`, `memory`, and `booking`
- remote node host and `device` remain a later phase, not part of this rollout wave

Status:

- prepared in the repo
- later deployed and validated as recorded in `docs/Phase_03_Closeout.md`

### Completed the first Phase 2 control-layer rollout

Changed:

- Installed `chief`, `comms`, and `guard` on the rebuilt VPS
- Added per-agent workspaces, contracts, and repeatable install/check scripts
- Documented Phase 2 routing for `main -> chief -> comms` and `main/chief -> guard`
- Reduced routing prompt weight for `main` and `chief`
- Switched the primary text model to `openai/gpt-4.1-mini`
- Removed the harmful fallback to `openai/gpt-4o`

Verified:

- `openclaw-gateway.service` stayed healthy through the Phase 2 rollout
- `main -> chief` worked in live Telegram use
- `main -> guard` preserved `DENY` for destructive actions
- direct and controlled routing checks confirmed `chief`, `comms`, and `guard` respond within their intended roles

Stabilization work:

- traced duplicate and "waiting" Telegram replies to a polluted long-lived `main` session
- backed up and reset the contaminated session state
- confirmed that a fresh Telegram session returned to single clean replies without duplicate output
- replaced the brittle `chief -> comms` implicit handoff with a more reliable sequential route: `main` gets a draft from `chief` and then asks `comms` to polish the real draft
- confirmed internal `chief` and `comms` session growth on the VPS after the sequential routing fix
- documented an operator rule to stop routing tests from leaking into the production Telegram chat

Artifacts:

- Phase 2 session-reset backup stored on VPS at `/root/openclaw-main-session-reset-20260316-235351`
- Phase 2 closeout recorded in `docs/Phase_02_Closeout.md`

Residual Phase 2 work:

- prove one clean live `main -> chief -> comms` chain on a fresh Telegram session
- define when `comms` is mandatory versus optional
- add lightweight structured routing and approval visibility

## 2026-03-16

### Recovered deployment from partial config loss

Changed:
- Restored `/home/hobbes/.openclaw/openclaw.json`
- Restored OpenAI auth profiles for `main` and `openai`
- Recreated gateway token-based auth in config
- Rebound OpenClaw services to the recovered local config

Verified:
- `openclaw.service` restarts cleanly
- `127.0.0.1:18789` gateway responds
- `127.0.0.1:18791` browser control is up with token auth
- `127.0.0.1:18792` health endpoint returns `OK`
- Telegram bot token is valid and provider starts
- `hobbes-backend.service` remains available on `127.0.0.1:8081`

Operational hardening applied:
- Set Telegram network `autoSelectFamily=false`
- Set Telegram network `dnsResultOrder=ipv4first`
- Disabled config hot reload to avoid false reload attempts against missing files

Artifacts:
- Recovery backup stored on VPS at `/root/openclaw-repair-20260316-141737`

Residual issue:
- Telegram provider still restarts with `health-monitor: restarting (reason: stale-socket)`

### Post-recovery observation window

Observed after recovery:
- New provider start logged normally
- No immediate bootstrap errors like `Missing config`
- No immediate `config file not found` after restart
- `stale-socket` reproduced again during the observation window, which means the deployment is recovered but not yet fully stabilized
- During the 10-minute observation window, `stale-socket` was confirmed at `2026-03-16 14:53:26 UTC`, followed by an automatic provider restart
- Skill state drift was confirmed: `hobbes.rss` is referenced by the active session snapshot, but its `SKILL.md` manifest is missing on disk

### Documentation baseline refreshed

Added:
- updated project passport
- explicit separation between live production state and target multi-agent blueprint
- implementation review and staged roadmap for the 9-agent architecture
