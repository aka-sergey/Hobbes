---
name: openclaw-ops
description: Use when operating the Hobbes OpenClaw deployment on VPS servers: health checks, systemd restarts, log inspection, backups, config validation, and safe production troubleshooting without polluting the live Telegram chat.
---

# OpenClaw Ops

Use this skill for Hobbes/OpenClaw production operations.

## Goals

- keep the VPS healthy
- validate agent and gateway health
- inspect logs without guesswork
- make changes in a safe order

## Safe workflow

1. Check `health=OK`, service status, memory, and disk before changing anything.
2. If config changed, restart only the required service.
3. Wait for `127.0.0.1:18792` to return `OK` before running smoke checks.
4. Prefer direct internal checks over live Telegram tests.
5. Back up config or session state before destructive or stateful changes.

## Rules

- Do not use the production Telegram chat for synthetic routing tests.
- Prefer user `systemd --user` control for `openclaw-gateway.service`.
- Treat slow startup after restart as normal until health stays down longer than the normal recovery window.
- Call out OOM, polling stall, and session lock issues explicitly.

## Standard checks

- service: `systemctl --user status openclaw-gateway.service`
- health: `curl -fsS http://127.0.0.1:18792/`
- config: inspect `~/.openclaw/openclaw.json`
- logs: `journalctl --user -u openclaw-gateway.service`
- sessions: count `.jsonl` files in per-agent `sessions/`

## When to stop and escalate

- repeated OOM kills
- Telegram transport instability after config fixes
- direct smoke checks pass but routed flows keep timing out
- unexpected messages leaking into the live Telegram chat
