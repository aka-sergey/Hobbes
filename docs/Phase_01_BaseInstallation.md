# Phase 01 Base Installation

## Purpose

This document captures the reproducible Phase 1 baseline for a clean Hobbes/OpenClaw installation on a fresh Ubuntu VPS.

Target state:

- OpenClaw runs under `systemd --user` as user `hobbes`
- Telegram is connected in DM-only mode with pairing enabled
- OpenAI is connected through `.env`
- Local health endpoint responds
- Backups work
- The baseline is stable enough to start Phase 2

Reference server used during this run:

- Ubuntu `24.04`
- `2 vCPU`
- `3 GB RAM`
- `25 GB NVMe`
- VPS IP kept the same after OS reinstall

## Files Used

- `scripts/remote/install_openclaw.sh`
- `scripts/remote/check_openclaw_install.sh`
- `scripts/remote/setup_phase1_base.sh`

## High-Level Sequence

1. Reinstall the OS from the provider panel instead of trying to manually clean the old VPS.
2. Log in as `root`.
3. Create the runtime user `hobbes`.
4. Install base packages and utilities.
5. Add swap.
6. Install Node.js `22`.
7. Install `openclaw` globally.
8. Apply the Phase 1 baseline config and `systemd --user` service.
9. Add Telegram bot token, gateway token, and provider API key.
10. Start the gateway and verify health.
11. Approve Telegram pairing.
12. Run smoke tests.

## Recommended Step-by-Step

### 1. Prepare the server

- Reinstall Ubuntu from the hosting panel.
- Log in over SSH as `root`.
- Update apt indexes and install baseline packages.

Recommended package group:

- `curl`
- `jq`
- `git`
- `tmux`
- `build-essential`
- `python3-venv`
- `ca-certificates`

If the server is very small, add swap before model traffic starts.

### 2. Create the dedicated runtime user

Use a separate Linux user for OpenClaw instead of running the gateway directly as `root`.

Expected runtime user:

- `hobbes`

Why:

- cleaner ownership in `~/.openclaw`
- easier `systemd --user` management
- less risk of mixing root-only state with bot state

### 3. Install Node and OpenClaw

Validated versions from this installation:

- `node v22.22.1`
- `openclaw 2026.3.13`

Install OpenClaw globally, then verify:

- `openclaw --version`
- `command -v openclaw`

Useful helper scripts:

- `scripts/remote/install_openclaw.sh`
- `scripts/remote/check_openclaw_install.sh`

These were used to start a detached global npm install and check its completion.

### 4. Apply the Phase 1 baseline

Run:

- `scripts/remote/setup_phase1_base.sh`

Required env vars for the script:

- `BOT_TOKEN`
- `GATEWAY_TOKEN`
- optional `OPENAI_API_KEY`

What the script creates:

- `/home/hobbes/.openclaw/openclaw.json`
- `/home/hobbes/.openclaw/.env`
- `/home/hobbes/.openclaw/workspace-main/*`
- `/home/hobbes/.config/systemd/user/openclaw-gateway.service`
- `/usr/local/bin/hobbes-health.sh`
- `/usr/local/bin/hobbes-backup.sh`

### 5. Baseline config that proved workable

Important gateway/channel choices:

- Telegram `dmPolicy=pairing`
- Telegram `groupPolicy=disabled`
- Telegram `streaming=partial`
- Telegram network:
  - `autoSelectFamily=false`
  - `dnsResultOrder=ipv4first`
- Gateway:
  - `bind=loopback`
  - `port=18789`
  - `channelHealthCheckMinutes=0`
  - `reload.mode=off`

Important model choice:

- `primary = openai/gpt-4o-mini`
- `fallbacks = [openai/gpt-4o-mini, openai/gpt-4o]`

This model order was changed during stabilization because `gpt-4o` hit TPM rate limits too easily for Telegram interaction on this account.

### 6. Service model

Do not use a legacy root-level `openclaw.service` if you are building a fresh baseline.

Use:

- `systemd --user`
- service name: `openclaw-gateway.service`
- user: `hobbes`

Also enable linger:

- `loginctl enable-linger hobbes`

Why this layout was kept:

- cleaner state ownership
- simpler daemon environment loading from `%h/.openclaw/.env`
- fewer leftovers from previous manual recoveries

### 7. Secrets layout

Provider secrets live in:

- `/home/hobbes/.openclaw/.env`

At minimum:

- `OPENAI_API_KEY=...`

Do not hardcode provider API keys into the `systemd` unit file.

### 8. Health and validation

Core checks:

- `sudo -u hobbes env XDG_RUNTIME_DIR=/run/user/$(id -u hobbes) systemctl --user is-active openclaw-gateway.service`
- `curl -fsS http://127.0.0.1:18792/`
- `sudo -u hobbes env XDG_RUNTIME_DIR=/run/user/$(id -u hobbes) journalctl --user -u openclaw-gateway.service -n 50 --no-pager`
- `/usr/local/bin/hobbes-health.sh`
- `/usr/local/bin/hobbes-backup.sh`

Validated good signals from this run:

- service state `active`
- health endpoint returned `OK`
- direct OpenAI call from VPS returned `OPENAI_OK`
- Telegram text replies worked
- Telegram voice messages were received by the bot, but the final validation still failed to transcribe them successfully

## Problems Encountered and Fixes

### 1. Dirty historical installation

Problem:

- Earlier the same VPS had multiple OpenClaw installs and manual resuscitation attempts.
- That left config drift, old service assumptions, and patched runtime artifacts.

Fix:

- Reinstall the OS from the provider panel.
- Rebuild the baseline from scratch.

Recommendation:

- Prefer `new VPS` or `OS reinstall` over manual cleanup when reliability matters.

### 2. Missing config / broken bootstrap after older recovery attempts

Problem:

- Earlier runs had `Missing config` and `config file not found`.

Root cause:

- OpenClaw state existed partly in runtime memory but not cleanly on disk.

Fix:

- Create `openclaw.json` explicitly.
- Create `auth-profiles.json` explicitly.
- Keep the service wired to a known file layout under `/home/hobbes/.openclaw`.

### 3. `stale-socket` restarts on Telegram

Problem:

- Older installation restarted the Telegram provider roughly every 35 minutes.

Observed cause:

- The installed bundle treated quiet Telegram sessions as stale and restarted them.

Fix on the old VPS:

- Temporary vendor hotfix in installed OpenClaw bundle.

Phase 1 decision for the clean rebuild:

- Do not carry that patched runtime forward.
- Use a clean install first and monitor before applying any vendor patch.

Current note:

- On the fresh Phase 1 baseline, no new `stale-socket` loop was observed in the tested window.

### 4. OpenAI `billing_not_active`

Problem:

- Direct API calls initially returned `billing_not_active`, even though the UI looked normal.

Fix:

- The issue eventually cleared after project/key/billing re-checks.
- Final validation was done from the VPS itself, not only from the UI.

Rule:

- Always test the provider from the server, not only from browser screenshots.

### 5. `gpt-4o` rate limit lag

Problem:

- Telegram interactions were slow and logs showed `API rate limit reached` for `gpt-4o`.

Fix:

- Change the baseline model to `openai/gpt-4o-mini`.
- Keep `gpt-4o` as fallback only.

Impact:

- Better responsiveness for the bot baseline
- lower chance of TPM throttling during normal chat

### 6. Voice messages produced PDF warnings

Problem:

- Logs showed:
  - `pdf failed: Expected PDF but got audio/ogg`

Interpretation:

- Audio files definitely reached `/home/hobbes/.openclaw/media/inbound`, but the final Telegram validation still returned a failure message instead of a transcript.
- This means voice is not yet production-ready in the Phase 1 baseline.

Phase 1 handling:

- Treat as a known residual defect.
- Revisit in Phase 2 when agent skills and media handling become first-class requirements.

### 7. SSH host key mismatch after OS reinstall

Problem:

- After reinstall, local automation hit host key mismatch errors.

Fix:

- Clear or bypass stale `known_hosts` entries during first reconnect.

Operational note:

- This is expected after OS reinstall on the same IP.

### 8. Too-fast actions during install/recovery

Problem:

- Doing config changes, restarts, pairing, and provider tests too quickly makes it hard to know which change actually fixed the issue.

Better pattern:

1. Apply one change.
2. Restart once.
3. Check `systemctl`.
4. Check `journalctl`.
5. Run one smoke test.
6. Only then move to the next change.

This matters especially for:

- OpenAI billing/provider debugging
- Telegram pairing
- service restarts
- config rewrites

## Minimal Smoke Test Checklist

Run these after every clean install:

1. `openclaw --version`
2. `systemctl --user is-active openclaw-gateway.service` as user `hobbes`
3. `curl http://127.0.0.1:18792/` returns `OK`
4. direct provider test from the VPS succeeds
5. Telegram pairing succeeds
6. send one short text to the bot and confirm a reply
7. send one voice message and confirm whether transcription actually succeeds
8. create one backup archive

## Phase 1 Exit Criteria

Phase 1 is considered complete when all of the following are true:

- OpenClaw survives restart cleanly
- `openclaw-gateway.service` is managed only through `systemd --user`
- health endpoint is green
- provider access is verified from the VPS
- Telegram DM is paired and answering
- backup script produces an archive
- no recurring `stale-socket` loop is visible in the observation window

Current reality of this exact run:

- Text baseline is ready
- Voice transcription is still not fully solved
- Phase 1 can be accepted for text-first Telegram operation, but not yet as a complete voice-capable baseline

## Hand-off to Phase 2

Only after the Phase 1 exit criteria are green should you proceed to:

- `main/chief` hardening
- first production skills
- multi-agent rollout
- dashboard and observability layer

For the next identical server, use this document together with:

- `scripts/remote/install_openclaw.sh`
- `scripts/remote/check_openclaw_install.sh`
- `scripts/remote/setup_phase1_base.sh`
