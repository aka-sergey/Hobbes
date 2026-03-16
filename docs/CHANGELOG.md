# Hobbes Changelog

## 2026-03-16

### Investigated repeated Telegram `stale-socket`

Found:
- `stale-socket` was reproducing roughly every 35 minutes
- In the installed OpenClaw build, the health monitor treats 30 minutes without events as a stale channel
- For the current Telegram usage pattern this behaves like a false-positive idle watchdog

Applied on VPS:
- patched the installed OpenClaw gateway bundle to raise the stale-event threshold from 30 minutes to a very large value
- restored the service to a clean single active systemd start after several forced restarts during diagnosis

Verification status:
- service is back up after the patch
- full 35 to 40 minute burn-in is still required to confirm the restart loop is gone

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
