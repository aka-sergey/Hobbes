# Hobbes Project Passport

Historical checkpoint note:

- Status: `historical`
- This document reflects a production checkpoint captured on `2026-03-16`.
- It remains useful as a recovery / audit snapshot.
- For the current cross-system view, prefer:
  - [Hobbes_Current_State.md](/Users/sergeysobolev/HobbesCodex/docs/overview/Hobbes_Current_State.md)
  - [Hobbes_System_Map.md](/Users/sergeysobolev/HobbesCodex/docs/overview/Hobbes_System_Map.md)
  - [CHANGELOG.md](/Users/sergeysobolev/HobbesCodex/docs/history/CHANGELOG.md)

Known areas now superseded by later docs:

- service naming here still emphasizes `openclaw.service`, while the later operational baseline centers on `openclaw-gateway.service`
- the topology here is intentionally earlier and more degraded than the later multi-agent rollout documents
- dashboard and observability sections here understate later progress made in the Railway dashboard and Control Center
- Telegram group behavior and search routing are both materially more advanced in later March 2026 documents than in this snapshot

Updated: 2026-03-16
Scope: production OpenClaw deployment on Timeweb VPS

## 1. Executive Snapshot

Hobbes is currently a live but partially degraded OpenClaw deployment running on a VPS.

What is working now:
- `openclaw.service` starts cleanly and exposes local gateway, browser control, and health endpoints.
- Telegram bot transport is alive and restarts automatically when the provider drops.
- `hobbes-backend.service` is up on `127.0.0.1:8081`.
- Main workspace and agent session state are readable again after config recovery.

What is still degraded:
- Telegram provider still hits `stale-socket` and is restarted by the health monitor.
- Current production topology is single-agent in practice, not the planned 9-agent architecture.
- Group Telegram messages will be silently dropped with the current policy unless allowlists are filled or policy is opened.
- Not every skill present on disk is confirmed as active in the live session snapshot.

## 2. Current Production Topology

```text
Telegram user
  |
  v
OpenClaw Gateway (localhost only)
  |- ws://127.0.0.1:18789
  |- http://127.0.0.1:18791  browser control, token auth
  |- http://127.0.0.1:18792  health
  |
  +-- Agent: main
  |     |- workspace: /home/hobbes/.openclaw/workspace-main
  |     |- provider: openai
  |     `- model: gpt-4o
  |
  `-- Telegram provider: @HobbesAI_bot

Hobbes Backend
  `- http://127.0.0.1:8081
```

External exposure:
- SSH is open on `22/tcp`
- OpenClaw and backend ports are loopback-only
- Dashboard should be accessed through SSH tunnel or a private overlay network

## 3. Live Services

Primary services:
- `openclaw.service`
- `hobbes-backend.service`

Observed listeners:
- `127.0.0.1:18789` OpenClaw gateway
- `127.0.0.1:18791` browser control
- `127.0.0.1:18792` health endpoint
- `127.0.0.1:8081` Hobbes backend

## 4. Agents and Workspaces

Current directories on disk:
- `/home/hobbes/.openclaw/agents/main`
- `/home/hobbes/.openclaw/agents/openai`
- `/home/hobbes/.openclaw/workspace-main`
- `/home/hobbes/.openclaw/workspace-openai`

Practical interpretation:
- `main` is the active production agent used through Telegram
- `openai` currently looks like a technical/provider-oriented agent directory, not a separate end-user specialist agent

This means the production system is currently closer to:
- 1 user-facing agent
- 1 restored OpenAI auth profile
- 1 main workspace

It is not yet a working multi-agent team.

## 5. Skills Status

Custom skill directories present in `workspace-main`:
- `agent-browser`
- `hobbes.rss`
- `hobbes.webhooks`
- `self-improving-agent`
- `todoist`
- `web-search`

Skills clearly visible in the active `main` session snapshot:
- `hobbes.rss`
- `self-improvement`
- bundled OpenClaw skills such as `healthcheck`, `session-logs`, `skill-creator`, `tmux`, `weather`

Operational note:
- There is a mismatch between "installed on disk" and "visible in the live session snapshot".
- `hobbes.rss` is still referenced by the live session snapshot, but `workspace-main/skills/hobbes.rss/SKILL.md` is currently missing on disk.
- Before scaling to multiple agents, each required skill should be validated in-session, not only by folder presence.

## 6. Config and Secrets Layout

Core config:
- `/home/hobbes/.openclaw/openclaw.json`

Auth profiles:
- `/home/hobbes/.openclaw/agents/main/agent/auth-profiles.json`
- `/home/hobbes/.openclaw/agents/openai/agent/auth-profiles.json`

Reference docs already present on VPS:
- `/home/hobbes/.openclaw/PROJECT-PASSPORT.md`
- `/home/hobbes/.openclaw/SECRETS-REFERENCE.md`

Important config facts after recovery:
- gateway bind: loopback
- gateway reload mode: off
- Telegram network config explicitly prefers IPv4
- default model: `openai/gpt-4o`
- default image model: `openai/gpt-4.1-mini`

## 7. Known Risks

P1 reliability:
- Telegram provider still restarts with `stale-socket`

P1 behavior:
- `channels.telegram.groupPolicy` is `allowlist` while allowlists are empty, so group messages are silently dropped

P1 architecture gap:
- The blueprint target assumes isolated agents, separate workspaces, routing, guardrails, and node-host support, but none of that is yet implemented in production

P2 operability:
- There is no dedicated status dashboard for queues, task state, agent health, token spend, or skill execution outcomes

P2 skill readiness:
- Presence of a skill folder does not yet prove runtime readiness, tool availability, or environment completion
- Some skill directories are missing their `SKILL.md` manifest while old session state still references them

## 8. Operating Notes

Useful health checks:
- `curl http://127.0.0.1:18792/`
- `journalctl -u openclaw.service -n 200 --no-pager`
- `tail -n 200 /tmp/openclaw/openclaw-YYYY-MM-DD.log`

Safe dashboard access pattern:
- `ssh -N -L 18789:127.0.0.1:18789 -L 18791:127.0.0.1:18791 root@<server>`

## 9. Current Conclusion

The deployment is no longer broken at bootstrap level, but it is not yet production-stable.

Best description of the current state:
- restored
- usable for direct Telegram work
- still transport-fragile
- not yet multi-agent
- not yet observable enough for long unattended operation
