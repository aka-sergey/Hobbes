# Hobbes Changelog

## 2026-03-18

### Wired Telegram group policy runtime through a compiler-backed sync path

Changed:

- promoted `config/telegram/chat_policies.example.json` from `repo_only` to `repo_and_runtime`
- added [compile_telegram_group_policies.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/compile_telegram_group_policies.py)
- taught the runtime sync layer to copy Telegram chat policies to:
  - `/home/hobbes/.openclaw/policies/chat_policies.json`
- taught the VPS worker and direct runtime sync path to run:
  - `/usr/local/bin/compile-telegram-group-policies.py`
- compiled Telegram group policies into live `openclaw.json` with:
  - top-level `channels.telegram.groupPolicy = allowlist`
  - per-group compiled entries under `channels.telegram.groups`
  - `main.groupChat.mentionPatterns` built from activation keywords
- added runtime artifacts:
  - `/home/hobbes/.openclaw/runtime/telegram-group-runtime.json`
  - `/home/hobbes/.openclaw/runtime/TELEGRAM_GROUP_POLICIES.md`
- tightened dashboard validation so duplicate `chatId` values in Telegram policy JSON are rejected

Verified:

- the compiler passed locally against `chat_policies + openclaw.phase1.example.json`
- the updated Telegram runtime compiler was installed on the VPS
- the live VPS `openclaw.json` now shows:
  - `groupPolicy: allowlist`
  - compiled group entries for the enabled chats
  - compiled `main.groupChat.mentionPatterns`
- `openclaw-gateway.service` restarted and returned to `active`

Residual risk:

- live validation is still needed in the real Telegram target group
- keyword triggers are currently compiled as a global union for `main.groupChat.mentionPatterns`, so overly broad keywords can still create noisy activation if the policy is poorly chosen

### Added a crypto exchange specialist persona template

Changed:

- added `crypto_exchange_specialist` to the `main` persona contract
- added the same persona shaping baseline to `comms`
- added a Telegram group policy example for a crypto / exchange discussion chat
- documented the persona in the Telegram group policy kit

Purpose:

- give Hobbes an explicit and safer specialist voice for crypto, exchange, P2P, OTC, and wallet discussions
- keep crypto answers practical and risk-aware without drifting into hype, guaranteed-profit language, or evasion guidance

### Enabled GitHub-backed live editing in the dashboard control center

Changed:

- upgraded the dashboard control center from draft-only editing to GitHub-backed repo editing
- added server-side GitHub integration for allowlisted files using:
  - `GITHUB_TOKEN`
  - `GITHUB_REPO_OWNER`
  - `GITHUB_REPO_NAME`
  - `GITHUB_REPO_BRANCH`
- added a new endpoint:
  - `POST /api/control/apply-repo`
- updated the control center UI to:
  - show whether a file is sourced from GitHub or local filesystem
  - keep draft save in Postgres
  - apply edited content directly to the repo through a dedicated `Применить в GitHub` action
  - show recent file commit history inside `/control`
  - allow explicit `Sync на VPS` for selected `repo_and_runtime` files
- added runtime sync support for allowlisted workspace policy files used by `main`, `chief`, and `comms`
- made validation stricter:
  - structural markdown validation for persona/reminder/meeting/document files
  - path-aware JSON validation for Telegram policy files

Verified:

- local `dashboard-mvp` build passed with the new GitHub-backed control flow and runtime sync routes

Operational note:

- the Railway dashboard can now edit the allowlisted repo files even though the service does not mount the full repository root locally
- runtime sync to the VPS is now an explicit control-center action after the GitHub version is updated
- when direct SSH from Railway cannot complete the handshake, the dashboard now falls back to a queued runtime sync job
- the VPS runtime sync worker was installed and confirmed to consume queued sync jobs successfully

### Added category-aware search routing baseline and documented the current checkpoint

Changed:

- added [hobbes_search_router.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_search_router.py)
- added repeatable verification script [check_search_router.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_search_router.sh)
- added installer [setup_search_router.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/setup_search_router.sh)
- updated `main`, `chief`, `research`, and `booking` contracts to use a router-first mental model for search-heavy tasks
- extended the dashboard search card model with:
  - `routeType`
  - `preferredBackend`
  - `preferredAgent`
- added docs:
  - [Search_Router_Taxonomy.md](/Users/sergeysobolev/HobbesCodex/docs/Search_Router_Taxonomy.md)
  - [Search_Router_Implementation.md](/Users/sergeysobolev/HobbesCodex/docs/Search_Router_Implementation.md)
  - [Search_Current_State_2026-03-18.md](/Users/sergeysobolev/HobbesCodex/docs/Search_Current_State_2026-03-18.md)

Verified:

- local router classification check passed:
  - hotel query -> `travel_booking`
  - clinic near metro -> `local_maps`
  - latest tanker news -> `news_current`
- VPS install of the helper passed with `SEARCH_ROUTER_OK`
- Railway dashboard was redeployed after router metadata changes

Known issues at this checkpoint:

- `travel_booking` is still only partially good
- `local_maps` is improved but not yet strong enough for serious trust
- the old `openclaw agent --local --agent chief` harness remains unreliable for bounded internal verification
- dashboard search telemetry is improved, but still inferred from session parsing rather than explicit structured router events

### Hardened Tavily-backed web research quality and dashboard visibility

Changed:

- taught `research` to explicitly surface mixed or conflicting evidence instead of flattening it into a single confident claim
- taught `chief` to demand that sourced summaries preserve contradictions instead of hiding them
- added `--count` as a compatibility alias in [hobbes_tavily_search.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_tavily_search.py) so older prompts no longer waste one failed helper call before recovering to `--max-results`
- extended the dashboard snapshot model and UI with a live `Searches` panel
- wired snapshot ingestion to persist recent inferred `research` search activity, including query, backend, summary, and top links

Verified:

- local `dashboard-mvp` build passed successfully
- shell/python syntax checks passed for the updated sender and helper scripts

## 2026-03-17

### Deployed the Wave 4A skills baseline on the VPS

Changed:

- installed Wave 4A skill directories into live OpenClaw workspaces:
  - `workspace-main/skills/voice-notes`
  - `workspace-research/skills/vision-intake`
  - `workspace-research/skills/pdf-workbench`
  - `workspace-research/skills/web-research`
- updated the live `main`, `chief`, and `research` workspace contracts for Wave 4A behavior
- installed `poppler-utils` and `tesseract-ocr` on the VPS

Verified:

- skill directories exist on the live VPS
- `openclaw-gateway.service` remained active after restart
- audio input stayed enabled
- the image model stayed configured

Residual issue:

- synthetic local validation for `main -> chief -> research` is still not fully deterministic
- Wave 4A should therefore be treated as a deployed install baseline, with fresh live checks still needed for screenshot, PDF, and voice-note flows

### Added the Phase 4 user-skill rollout kit

Added in repo:

- ten new product skills:
  - `vision-intake`
  - `pdf-workbench`
  - `web-research`
  - `reminders-and-followups`
  - `persona-router`
  - `voice-notes`
  - `contacts-crm-lite`
  - `meeting-prep`
  - `document-drafter`
  - `personal-memory`
- `docs/Phase_04_Skills_Rollout_Plan.md`

Planning decisions:

- selected these ten skills for immediate rollout
- explicitly postponed `mailbox-ops`
- explicitly postponed outbound calling to the final phase
- mapped the new skills to `main`, `chief`, `research`, `memorykeeper`, and `comms`

### Shipped live dashboard ingestion from VPS to Railway

Changed:

- upgraded `dashboard-mvp` from mock-only shell to Postgres-backed live overview
- added `GET /api/overview`
- extended `POST /api/ingest` to accept persisted `overview_snapshot` payloads
- added Railway runtime support for `DATABASE_URL`
- installed a recurring VPS sender via:
  - `/usr/local/bin/hobbes-dashboard-snapshot.sh`
  - `hobbes-dashboard-snapshot.timer`

Verified:

- Railway dashboard remains reachable at `hobbes-dashboard-web-production.up.railway.app`
- manual ingest smoke test was accepted with `200`
- live VPS snapshot ingestion was accepted by Railway
- `GET /api/overview` now returns `source=live`
- the overview currently shows the real seven-agent runtime from the VPS

Current limitations:

- usage/cost is still `n/a`
- approvals are not yet ingested
- run chains are still inferred from recent session activity
- dashboard access is still public by URL

Artifacts:

- implementation notes recorded in `docs/Dashboard_LiveIngest_Installation.md`

### Added initial skills and dashboard MVP foundation

Added in repo:

- four Hobbes skills:
  - `openclaw-ops`
  - `routing-regression`
  - `agent-contract-linter`
  - `dashboard-product`
- `docs/Skills_And_MCP_Plan.md`
- `docs/Dashboard_MVP_Architecture.md`
- `dashboard-mvp/` Next.js scaffold for a Railway-ready observability UI

Product direction:

- dashboard path chosen: fast web-first MVP on Railway
- one app handles both UI and ingest endpoints in the first version
- Postgres remains the next integration step after mock-data iteration

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
# 2026-03-17

- Wave 4A routing hardening:
  - strengthened `chief` rules to avoid direct `image`/`pdf`/`web_search` use when no actual file or URL is attached
  - added lightweight bounded regression script [check_phase4a_chief_research.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_phase4a_chief_research.sh)
  - added remote runner [run_phase4a_chief_research_remote.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/run_phase4a_chief_research_remote.sh)
  - confirmed live `chief -> research` delegation on VPS by session counter growth `research:3->4`
  - documented that full synthetic `main -> chief -> research` runs are unnecessarily memory-heavy for the current `3 GB RAM` baseline
- Wave 4A web-research fix:
  - hardened `main` and `chief` so they do not claim internet search is unavailable while internal `research` is available
  - clarified `research` tool contract for web-backed evidence gathering
  - added [check_phase4a_web_research.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_phase4a_web_research.sh)
  - added [apply_phase4a_web_routing_hotfix.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/apply_phase4a_web_routing_hotfix.sh)
  - confirmed VPS smoke result `WEB_RESEARCH_OK` with session counter growth `research:4->5`
- Wave 4A web-research fallback:
  - taught `research` to fall back to a trusted-source sweep with `web_fetch` or `browser` when direct search provider credentials are missing
  - taught `chief` and `main` not to surface a missing-provider error as the final user answer when fallback work is still possible
  - updated [skills/web-research/SKILL.md](/Users/sergeysobolev/HobbesCodex/skills/web-research/SKILL.md)
  - added [check_phase4a_web_research_fallback.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_phase4a_web_research_fallback.sh)
  - added [apply_phase4a_web_fallback_hotfix.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/apply_phase4a_web_fallback_hotfix.sh)
  - confirmed VPS smoke result `WEB_RESEARCH_FALLBACK_OK`
- Tavily integration scaffolding:
  - added local helper [hobbes_tavily_search.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_tavily_search.py)
  - added installer [setup_tavily_integration.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/setup_tavily_integration.sh)
  - added check script [check_tavily_integration.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_tavily_integration.sh)
  - updated `web-research`, `research`, and `chief` contracts to prefer Tavily when available
  - documented the rollout in [Tavily_Integration_Plan.md](/Users/sergeysobolev/HobbesCodex/docs/Tavily_Integration_Plan.md)
- 2026-03-17: removed Brave-style `web_search` from Hobbes production routing in practice by hardening `main`, `chief`, and `research` contracts around `Tavily-first` search, non-invented `web_fetch` fallbacks, and internal-session reset guidance for stale routing behavior.
- Added category-aware search routing baseline:
  - new helper [hobbes_search_router.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_search_router.py)
  - new docs [Search_Router_Taxonomy.md](/Users/sergeysobolev/HobbesCodex/docs/Search_Router_Taxonomy.md) and [Search_Router_Implementation.md](/Users/sergeysobolev/HobbesCodex/docs/Search_Router_Implementation.md)
  - `chief` now has an explicit router-first pattern for search-heavy tasks
  - `research` and `booking` now accept router hints and domain bias
  - dashboard search cards now include route metadata
# 2026-03-18

- Wave 4B behavior baseline prepared:
  - added [Phase_04_Wave_4B_Installation.md](/Users/sergeysobolev/HobbesCodex/docs/Phase_04_Wave_4B_Installation.md)
  - added installer [setup_phase4b_wave_b.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/setup_phase4b_wave_b.sh)
  - added checker [check_phase4b_wave_b.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_phase4b_wave_b.sh)
  - added explicit reminder, persona, meeting, and document-shape files for `main`, `chief`, and `comms`
  - updated `main`, `chief`, and `comms` contracts to default to Russian for Sergey in Telegram, keep persona behavior explicit, and avoid false reminder-scheduling claims
  - documented that Wave 4B should be treated as a behavior-layer baseline while Wave 4A search quality still remains mixed in `travel_booking` and `local_maps`
- Telegram policy and test-mode kit added:
  - added [Telegram_Current_State_2026-03-18.md](/Users/sergeysobolev/HobbesCodex/docs/Telegram_Current_State_2026-03-18.md)
  - added [Telegram_Group_Policy_Kit.md](/Users/sergeysobolev/HobbesCodex/docs/Telegram_Group_Policy_Kit.md)
  - added [Telegram_Test_Mode.md](/Users/sergeysobolev/HobbesCodex/docs/Telegram_Test_Mode.md)
  - added [Telegram_Bot_Test_Questionnaire.md](/Users/sergeysobolev/HobbesCodex/docs/Telegram_Bot_Test_Questionnaire.md)
  - added [chat_policies.example.json](/Users/sergeysobolev/HobbesCodex/config/telegram/chat_policies.example.json)
  - added [test_mode.example.json](/Users/sergeysobolev/HobbesCodex/config/telegram/test_mode.example.json)
  - expanded Telegram personas with `medical_peer_general`, `logistics_operator`, and `bot_evaluator`
- Dashboard control-center architecture added:
  - added [Dashboard_Control_Center_Architecture.md](/Users/sergeysobolev/HobbesCodex/docs/Dashboard_Control_Center_Architecture.md)
  - defined the editor UX, safety model, API surface, rollout stages, and allowlisted first file scopes for a real Hobbes operations console
- Dashboard control-center v1 implemented in `dashboard-mvp`:
  - added `/control`
  - added allowlisted control APIs for file listing, file loading, and draft saving
  - added Russian UI labels and a mini-instruction in the control panel
  - drafts are now saved in Postgres via `control_drafts`
  - v1 currently supports safe draft editing, preview, and diff summary, but not yet direct git push or VPS sync from the UI
