# Hobbes AI Context Pack

Назначение:

- это плотная context-capsule для ИИ;
- читать, если потерян предыдущий контекст, история чата или вход выполнен с другого аккаунта;
- документ оптимизирован не под “красивое объяснение”, а под быстрое восстановление рабочей картины проекта.
- машинно-парсируемые mirrors лежат в `docs/For_AI/Hobbes_Full_Context.yaml` и `docs/For_AI/Hobbes_Full_Context.json`.

Статус:

- `active`

Дата сборки:

- `2026-03-19`

## 1. Что такое Hobbes в одном абзаце

Hobbes - это role-based AI system поверх OpenClaw, где Telegram является пользовательским входом, OpenClaw на VPS - живым runtime-контуром, `main/chief/comms/guard/research/memorykeeper/bookingprep` - агентным слоем, Railway dashboard + Postgres - контуром наблюдения и частичного управления, а GitHub - source of truth для управляемых человеком файлов и документации.

## 2. Истина и приоритет источников

Если документы противоречат друг другу, использовать такой приоритет:

1. этот файл;
2. `docs/overview/Hobbes_Current_State.md`;
3. dated current-state docs по Telegram и Search;
4. `docs/history/CHANGELOG.md`;
5. rollout closeout docs;
6. `docs/history/PROJECT-PASSPORT.md` как исторический snapshot, но не как главный current-state source.

## 3. Главная топология системы

Пользовательский путь:

1. Пользователь пишет в Telegram.
2. Сообщение попадает в OpenClaw gateway на VPS.
3. Входной агент `main` получает запрос.
4. `main` либо отвечает сам, либо отдает сложную работу в `chief`.
5. `chief` вызывает специалистов:
   - `research`
   - `bookingprep`
   - `memorykeeper`
   - при риске `guard`
6. Финальная шлифовка при необходимости проходит через `comms`.
7. `main` отправляет один итоговый ответ наружу.

Наблюдение и управление:

1. VPS snapshot script собирает состояние.
2. Snapshot уходит в dashboard через `POST /api/ingest`.
3. Dashboard кладет snapshot в Postgres.
4. Railway UI показывает состояние.
5. Control Center умеет редактировать allowlisted files.
6. Изменения идут в GitHub.
7. Затем часть изменений может уйти обратно в VPS через direct SSH sync или queued worker.

## 4. Основные слои

### Пользовательский слой

- Telegram DM - главный рабочий пользовательский вход.
- Telegram groups существуют как partially wired layer, но не считаются fully production-ready.

### Runtime layer

- OpenClaw работает на VPS.
- Есть gateway, health endpoint, agent workspaces и session state.
- Базовый сервисный слой позже концентрируется вокруг `openclaw-gateway.service`.

### Agent layer

Текущие роли:

- `main`
- `chief`
- `comms`
- `guard`
- `research`
- `memorykeeper`
- `bookingprep`

### Search layer

- `chief` является entry point для search-heavy tasks.
- Search router определяет тип запроса и preferred backend/agent.
- `research` владеет evidence-backed search.
- `bookingprep` владеет travel/booking-style retrieval.

### Dashboard layer

- Railway-hosted dashboard в `dashboard-mvp/`
- Postgres backend
- live snapshots
- Control Center
- runtime sync

### Repo / source-of-truth layer

- GitHub является каноническим домом для human-readable docs и allowlisted editable files.
- Runtime contracts агентов живут в `config/agents/**`.
- Skill manifests живут в `skills/*/SKILL.md`.

## 5. Агенты: текущий состав

Определены в repo:

- `main`
- `chief`
- `comms`
- `guard`
- `research`
- `memory`
- `booking`

Runtime stabilization / ids:

- `memory` в runtime стабилизирован как `memorykeeper`
- `booking` в runtime стабилизирован как `bookingprep`

Практически используемый current agent set:

- `main`
- `chief`
- `comms`
- `guard`
- `research`
- `memorykeeper`
- `bookingprep`

### Роли кратко

`main`

- Telegram front door
- тихая orchestration
- один итоговый ответ наружу

`chief`

- planning
- routing
- decomposition
- draft shaping

`comms`

- user-facing rewrite
- compress without losing risk/uncertainty

`guard`

- risk gate
- verdicts: `SAFE`, `REVIEW`, `DENY`
- not execution layer

`research`

- source-backed search
- current info
- docs / troubleshooting
- images / PDFs / visual extraction

`memorykeeper`

- durable memory discipline
- dedupe
- explicit memory ownership

`bookingprep`

- travel / booking prep
- structured options
- approval-aware real-world preparation

## 6. Skills: текущий состав

В `skills/` сейчас лежат:

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
- `agent-contract-linter`
- `dashboard-product`
- `openclaw-ops`
- `routing-regression`

### Практически важное разделение

Пользовательско-продуктовые:

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

Внутренние / операционные:

- `agent-contract-linter`
- `dashboard-product`
- `openclaw-ops`
- `routing-regression`

### Навыки по агентам

`main`

- `voice-notes`
- `persona-router`
- `reminders-and-followups`

`chief`

- `meeting-prep`
- `document-drafter`
- `reminders-and-followups`

`research`

- `web-research`
- `vision-intake`
- `pdf-workbench`

`memorykeeper`

- `personal-memory`
- `contacts-crm-lite`

`comms`

- `document-drafter`
- `persona-router`

## 7. Search / router слой

Есть отдельный helper:

- `scripts/remote/hobbes_search_router.py`

Задача search-router:

- классифицировать тип поискового запроса;
- выбрать preferred agent;
- выбрать preferred backend;
- указать fallback path;
- отметить, нужны ли structured filters.

Основные категории:

- `news_current`
- `general_research`
- `official_lookup`
- `technical_docs`
- `troubleshooting`
- `law_policy`
- `finance_market`
- `local_maps`
- `travel_booking`
- `shopping_product`
- `community_reviews`
- `media_search`
- `people_company_lookup`
- `internal_source_search`

Практические владельцы:

- почти весь search -> `research`
- `travel_booking` -> `bookingprep`

Слабые вертикали на сегодня:

- `local_maps`
- `travel_booking`

## 8. Dashboard / Control Center

### Назначение

Dashboard нужен не как пользовательский UI, а как operations console.

Он должен:

- показывать system health;
- показывать recent runs / events / searches;
- давать controlled editing ограниченного числа файлов;
- уметь доставлять часть изменений обратно в production.

### Реализация

Технологии:

- `Next.js`
- `Postgres`
- Railway deployment

Ключевые data objects:

- `dashboard_snapshots`
- `dashboard_events`
- `control_drafts`
- `control_runtime_sync_jobs`

### Control Center

Control Center в `dashboard-mvp/lib/control-center.ts`.

Он работает по allowlist-модели.
Главная мысль:

- нельзя редактировать произвольные production files;
- можно редактировать только разрешенные repo/docs/config/policy файлы;
- часть файлов после GitHub update можно синхронизировать в runtime.

### Allowlisted doc files

Среди человекочитаемых файлов Control Center ориентируется на:

- `docs/current-state/Telegram_Current_State_2026-03-18.md`
- `docs/current-state/Search_Current_State_2026-03-18.md`
- `docs/telegram/Telegram_Group_Policy_Kit.md`
- `docs/telegram/Telegram_Behavior_Profiles.md`
- `docs/telegram/Telegram_Test_Mode.md`
- `docs/telegram/Telegram_Bot_Test_Questionnaire.md`
- `docs/architecture/Dashboard_Control_Center_Architecture.md`

### Allowlisted runtime-sync files

JSON/policy:

- `config/telegram/chat_policies.example.json`
- `config/telegram/behavior_profiles.example.json`

Workspace policy files:

- `config/agents/main/workspace/PERSONAS.md`
- `config/agents/main/workspace/REMINDERS.md`
- `config/agents/chief/workspace/REMINDERS.md`
- `config/agents/chief/workspace/MEETING_PREP.md`
- `config/agents/chief/workspace/DOCUMENT_SHAPES.md`
- `config/agents/comms/workspace/PERSONAS.md`
- `config/agents/comms/workspace/DOCUMENT_SHAPES.md`

## 9. Runtime sync: точные remote targets

Из `dashboard-mvp/lib/runtime-sync.ts`.

Telegram policy files:

- `config/telegram/chat_policies.example.json` -> `/home/hobbes/.openclaw/policies/chat_policies.json`
- `config/telegram/behavior_profiles.example.json` -> `/home/hobbes/.openclaw/policies/behavior_profiles.json`

Agent workspace files:

- `config/agents/main/workspace/PERSONAS.md` -> `/home/hobbes/.openclaw/workspace-main/PERSONAS.md`
- `config/agents/main/workspace/REMINDERS.md` -> `/home/hobbes/.openclaw/workspace-main/REMINDERS.md`
- `config/agents/chief/workspace/REMINDERS.md` -> `/home/hobbes/.openclaw/workspace-chief/REMINDERS.md`
- `config/agents/chief/workspace/MEETING_PREP.md` -> `/home/hobbes/.openclaw/workspace-chief/MEETING_PREP.md`
- `config/agents/chief/workspace/DOCUMENT_SHAPES.md` -> `/home/hobbes/.openclaw/workspace-chief/DOCUMENT_SHAPES.md`
- `config/agents/comms/workspace/PERSONAS.md` -> `/home/hobbes/.openclaw/workspace-comms/PERSONAS.md`
- `config/agents/comms/workspace/DOCUMENT_SHAPES.md` -> `/home/hobbes/.openclaw/workspace-comms/DOCUMENT_SHAPES.md`

Post-sync behavior:

- Telegram policy files additionally trigger `python3 /usr/local/bin/compile-telegram-group-policies.py`
- most runtime sync targets restart `openclaw-gateway.service`

## 10. Порты, сервисы и сетевой контур

Важные локальные endpoints из docs:

- `127.0.0.1:18789` - OpenClaw gateway
- `127.0.0.1:18791` - browser control / token auth
- `127.0.0.1:18792` - health
- `127.0.0.1:8081` - Hobbes backend

Важно:

- старые historical docs могут еще использовать акцент на `openclaw.service`;
- operational baseline позже смещается к `openclaw-gateway.service`.

## 10A. Concrete known hosts and URLs

Ниже не абстрактные роли, а конкретные значения, которые зафиксированы в repo/docs по состоянию на `2026-03-19`.

### Railway public URL

Зафиксированный public dashboard URL:

- `https://hobbes-dashboard-web-production.up.railway.app`

Он встречается в:

- `docs/dashboard/Dashboard_LiveIngest_Installation.md`
- `docs/dashboard/Dashboard_Control_Center_Guide_RU.md`
- default `BASE_URL` в `scripts/remote/hobbes_control_sync_worker.py`

### Known VPS host label / IP used in docs and scripts

Зафиксированное значение host label:

- `72.56.112.63`

Это встречается в:

- `scripts/remote/hobbes_dashboard_snapshot.sh`
- `scripts/remote/setup_dashboard_ingest.sh`
- `docs/dashboard/Dashboard_LiveIngest_Installation.md`

Важно:

- это known value from repo/docs, а не гарантированная вечная истина;
- если инфраструктура менялась после `2026-03-19`, этот IP нужно перепроверять отдельно.

### Concrete dashboard routes

Из docs и dashboard code:

- `https://hobbes-dashboard-web-production.up.railway.app/`
- `https://hobbes-dashboard-web-production.up.railway.app/control`
- `https://hobbes-dashboard-web-production.up.railway.app/api/overview`
- `https://hobbes-dashboard-web-production.up.railway.app/api/ingest`

### Concrete OpenClaw local endpoints on VPS

- `ws://127.0.0.1:18789`
- `http://127.0.0.1:18791`
- `http://127.0.0.1:18792`
- `http://127.0.0.1:8081`

### Concrete service names currently relevant in docs

- `openclaw-gateway.service`
- `hobbes-backend.service`

Historical naming still appears in older docs:

- `openclaw.service`

### Concrete key filesystem roots on VPS

Главный runtime root:

- `/home/hobbes/.openclaw`

Важные paths:

- `/home/hobbes/.openclaw/openclaw.json`
- `/home/hobbes/.openclaw/.env`
- `/home/hobbes/.openclaw/agents/`
- `/home/hobbes/.openclaw/workspace-main`
- `/home/hobbes/.openclaw/workspace-chief`
- `/home/hobbes/.openclaw/workspace-comms`
- `/home/hobbes/.openclaw/workspace-guard`
- `/home/hobbes/.openclaw/workspace-research`
- `/home/hobbes/.openclaw/workspace-memory`
- `/home/hobbes/.openclaw/workspace-booking`
- `/home/hobbes/.openclaw/policies/`
- `/home/hobbes/.openclaw/runtime/`

### Concrete helper / operational binaries mentioned in repo

- `/usr/local/bin/hobbes-dashboard-snapshot.sh`
- `/usr/local/bin/hobbes-control-sync-worker.py`
- `/usr/local/bin/compile-telegram-group-policies.py`
- `/usr/local/bin/hobbes-search-router`
- `/usr/local/bin/hobbes-tavily-search`
- `/usr/local/bin/hobbes-health.sh`
- `/usr/local/bin/hobbes-backup.sh`

## 11. Переменные окружения и секреты

### Dashboard / Railway

- `DATABASE_URL`
- `DATABASE_PRIVATE_URL`
- `INGEST_TOKEN`
- `APP_BASE_URL`
- `NEXT_PUBLIC_APP_NAME`
- `GITHUB_TOKEN`
- `GITHUB_REPO_OWNER`
- `GITHUB_REPO_NAME`
- `GITHUB_REPO_BRANCH`
- `HOBBES_VPS_HOST`
- `HOBBES_VPS_USER`
- `HOBBES_VPS_PASSWORD`

### VPS worker / runtime sync

- `HOBBES_CONTROL_BASE_URL`
- `HOBBES_CONTROL_TOKEN`

### OpenClaw / base install

- `BOT_TOKEN`
- `GATEWAY_TOKEN`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY` when present for stronger search

## 12. Важные физические пути в repo

Документация:

- `docs/`

Agent runtime contracts:

- `config/agents/*/workspace/*.md`

OpenClaw / Telegram configs:

- `config/openclaw/`
- `config/telegram/`

Skills:

- `skills/*/SKILL.md`

Dashboard code:

- `dashboard-mvp/`

Remote scripts:

- `scripts/remote/`

## 13. Что уже реально работает

По актуальным overview/current-state docs:

- Telegram DM baseline рабочий
- multi-agent layer уже реальный, а не только идея
- dashboard live snapshots работают
- Control Center работает
- GitHub-backed editing работает
- runtime sync работает
- search router есть

## 14. Что работает частично

- Telegram groups
- reminders as durable execution
- approvals as first-class flow
- usage/cost observability
- some dashboard telemetry still snapshot-driven

## 15. Что сейчас слабое

- `local_maps`
- `travel_booking`
- routed validation harness
- memory governance depth
- approval workflow maturity
- event model maturity

## 16. Что не забыть про Project Passport

`docs/history/PROJECT-PASSPORT.md` полезен, но не является current truth.

Он:

- исторический;
- отражает более ранний degraded checkpoint;
- недооценивает later progress в dashboard, Telegram group policy и multi-agent rollout;
- должен читаться как audit snapshot, а не как верхняя truth-doc.

## 17. Что считать главным набором документов

Если нужно быстро восстановить мозаику Hobbes, открыть в таком порядке:

1. `docs/README.md`
2. `docs/overview/Hobbes_Canonical_Set.md`
3. `docs/overview/Hobbes_System_Map.md`
4. `docs/overview/Hobbes_Current_State.md`
5. `docs/overview/Hobbes_Gaps_And_Next_Steps.md`
6. `docs/architecture/BLUEPRINT-REVIEW-AND-ROADMAP.md`
7. `docs/current-state/Telegram_Current_State_2026-03-18.md`
8. `docs/current-state/Search_Current_State_2026-03-18.md`

## 18. AI operational guidance

Если контекст потерян, ИИ должен по умолчанию исходить из следующего:

- Hobbes уже не single-agent bot, а ранний multi-agent system
- `main` не должен сам тащить сложный search
- `chief` - главный router/planner
- `research` и `bookingprep` разделены не зря
- `guard` - не риторическая роль, а risk gate
- docs в `overview/` и `current-state/` важнее rollout-архива
- historical docs полезны для причин и эволюции, но не для текущей истины
- runtime contracts в `config/agents/**` важнее старых rollout contracts

## 19. Самый короткий summary

Hobbes = Telegram front door + OpenClaw runtime on VPS + role-based agent team + search router + Railway dashboard + GitHub-backed Control Center + controlled runtime sync back to VPS.
