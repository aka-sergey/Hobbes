# Dashboard Control Center Architecture

## Goal

Turn the current Hobbes dashboard from a read-only observability surface into a safe control center.

The control center should let the owner:

- see live system state
- inspect agents, runs, search behavior, and failures
- edit selected markdown and policy files
- preview changes before applying them
- deploy approved changes to repo and, when appropriate, to the VPS

This is not a generic file manager.
It is a controlled operations console for Hobbes.

## Product principle

The best control panel for Hobbes should feel like:

- a cockpit
- a policy editor
- a deployment gate
- a debugging lens

It should not feel like:

- raw SSH in a browser
- unrestricted code editor on prod
- direct mutable access to every file

## UX vision

### Primary sections

1. `Overview`
2. `Agents`
3. `Search`
4. `Policies`
5. `Docs`
6. `Deploy`
7. `History`
8. `Test Mode`

### Overview

Show:

- overall health
- active runs
- recent failures
- search mix by route
- current data source freshness
- warning banners for degraded subsystems

### Agents

Show:

- each agent
- role
- workspace
- last activity
- recent error
- active route responsibilities

Useful actions:

- open workspace policies
- inspect latest session metadata
- compare current contract vs repo baseline

### Search

Show:

- recent queries
- route type
- selected backend
- preferred agent
- fallback usage
- source list
- search quality flags

Useful actions:

- inspect route decision
- inspect source mix
- see where low-quality answers came from

### Policies

This is the most important new area.

It should cover:

- Telegram group policies
- personas
- reminder behavior
- search-router behavior
- document shapes

Main interaction:

- pick a policy file
- edit markdown or JSON
- preview
- diff
- save draft
- apply to repo
- optionally sync to VPS

### Docs

For:

- operational docs
- rollout docs
- current-state docs
- test plans

This can use the same editor foundation as Policies, but with fewer deployment risks.

### Deploy

Show:

- repo changes waiting to be applied
- runtime files waiting to be synced to VPS
- last successful deploy
- last failed deploy
- rollback points

### History

Show:

- recent edits
- author
- file paths
- diff summary
- whether change reached repo
- whether change reached VPS

### Test Mode

Show:

- bot-evaluator configuration
- target bot
- questionnaire suite
- latest test runs
- score summaries
- raw answers and flagged failures

## Editor UX

## Core layout

Recommended 3-column layout:

- left: file tree and sections
- center: editor
- right: preview and metadata

Bottom panel:

- diff
- validation errors
- apply results

### File tree

First editable scopes:

- `docs/`
- `config/telegram/`
- `config/agents/main/workspace/PERSONAS.md`
- `config/agents/main/workspace/REMINDERS.md`
- `config/agents/chief/workspace/REMINDERS.md`
- `config/agents/chief/workspace/MEETING_PREP.md`
- `config/agents/chief/workspace/DOCUMENT_SHAPES.md`
- `config/agents/comms/workspace/PERSONAS.md`
- `config/agents/comms/workspace/DOCUMENT_SHAPES.md`
- selected `skills/*/SKILL.md`

Not editable in v1:

- secrets
- `.env`
- arbitrary shell scripts
- openclaw runtime JSON without a dedicated safe form
- any unrestricted path on VPS

### Preview

For markdown:

- rendered markdown
- headings navigator
- internal link preview if possible

For JSON:

- formatted view
- schema validation result
- semantic warnings

### Diff

Every save and apply flow should show:

- current version
- proposed version
- line diff
- changed sections summary

### Buttons

Implemented in the current baseline:

- `Сохранить черновик`
- `Применить в GitHub`
- `Sync на VPS`
- `Сбросить к исходнику`
- история commit'ов по выбранному файлу

Current behavior:

- drafts are stored in Postgres
- source-of-truth editing on Railway is now GitHub-backed, not filesystem-backed
- allowlisted files can be read from GitHub and committed back through the dashboard
- selected `repo_and_runtime` files can be explicitly synced to the Hobbes VPS from the same UI

Still not in scope of the current baseline:

- arbitrary file editing outside the allowlist
- secret management
- destructive operations without a dedicated safe workflow

## Source of truth model

For the control center, the source of truth is now:

1. GitHub repo for editable policy/docs/config files
2. PostgreSQL for temporary drafts and UI state
3. VPS runtime only after an explicit sync/deploy action

This separation is intentional:

- it keeps edits reviewable
- it avoids mutating Railway container files
- it prevents the dashboard from pretending that repo edits and live runtime edits are the same thing

## Current limitation

`repo_and_runtime` files can now be edited safely in the repo from the dashboard and then propagated to the VPS runtime through an explicit sync action.

That means the current control center is suitable for:

- editing docs
- editing policies
- editing agent behavior contracts
- committing changes safely to GitHub
- syncing selected runtime-facing policy files to the live Hobbes VPS

But not yet sufficient for:

- runtime rollback on the VPS
- full deployment orchestration from the dashboard
Recommended buttons:

- `Save Draft`
- `Validate`
- `Apply To Repo`
- `Sync To VPS`
- `Commit & Push`
- `Rollback`

Important:

- `Sync To VPS` should be disabled unless the file is in a runtime-allowlist
- `Commit & Push` should never bypass draft and diff

## Safety model

### Allowlist only

The control center should edit only allowlisted files.

That allowlist should be explicit and versioned.

### Two destinations

Every file should have one of these scopes:

- `repo_only`
- `repo_and_runtime`

Examples:

- `docs/*.md` -> `repo_only`
- `config/telegram/*.json` -> `repo_only` until wiring is live
- `config/agents/*/workspace/*.md` -> `repo_and_runtime`

### Two-step apply

Recommended flow:

1. save draft
2. validate
3. apply to repo
4. optionally sync to VPS

Do not collapse these into one destructive button.

### Rollback

Need:

- repo commit reference
- VPS backup path if runtime sync happened

## Recommended API surface

### Read APIs

- `GET /api/control/files`
- `GET /api/control/file?path=...`
- `GET /api/control/history?path=...`
- `GET /api/control/diff?path=...`

### Validation APIs

- `POST /api/control/validate-markdown`
- `POST /api/control/validate-json`
- `POST /api/control/validate-policy`

### Write APIs

- `POST /api/control/save-draft`
- `POST /api/control/apply-repo`
- `POST /api/control/sync-vps`
- `POST /api/control/commit-push`

### Runtime APIs

- `GET /api/control/deploy-status`
- `GET /api/control/runtime-health`
- `POST /api/control/rollback`

## Backend behavior

### Repo editing

Use local workspace files as the repo source of truth.

When applying to repo:

- write the file
- create a diff summary
- optionally commit

### VPS sync

When syncing to VPS:

- create a timestamped backup first
- upload only the relevant file set
- run a targeted verifier if one exists
- record the backup path and outcome

### Validation

Examples:

- markdown: parse + render check
- JSON: schema + semantic check
- persona policy: ensure allowed persona IDs
- telegram policy: ensure each enabled chat has persona, triggers, topic scope

## Data model additions

Recommended tables in dashboard storage:

### `control_drafts`

- `id`
- `path`
- `content`
- `author`
- `created_at`
- `updated_at`
- `status`

### `control_applies`

- `id`
- `path`
- `target`
- `status`
- `summary`
- `backup_path`
- `commit_sha`
- `created_at`

### `control_history`

- `id`
- `path`
- `action`
- `actor`
- `details`
- `created_at`

## Rollout order

### Stage 1. Editor foundation

Build:

- file tree
- markdown editor
- preview
- diff
- allowlist

Target scope:

- `docs/`
- `config/telegram/`

### Stage 2. Policy editor

Add:

- persona and reminders workspace files
- validation
- repo apply flow

### Stage 3. Runtime sync

Add:

- selected workspace files sync to VPS
- backup path display
- success and rollback records

### Stage 4. Test mode panel

Add:

- questionnaire selection
- run launcher
- result view

## Best v1 definition

If we optimize for value, the best first real control-center release is:

- live overview
- policy file editor
- markdown preview
- JSON validation
- diff and apply
- repo commit and push

That already gives you a real management console.

VPS sync can be stage 2 if we want to keep v1 safer.
