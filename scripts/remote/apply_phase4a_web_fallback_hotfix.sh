#!/usr/bin/env bash
set -euo pipefail

src_root="${1:-/root/hobbes-phase4a-web-fallback}"

install -o hobbes -g hobbes -m 644 \
  "${src_root}/skills/web-research/SKILL.md" \
  /home/hobbes/.openclaw/workspace-research/skills/web-research/SKILL.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/main/workspace/AGENTS.md" \
  /home/hobbes/.openclaw/workspace-main/AGENTS.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/chief/workspace/AGENTS.md" \
  /home/hobbes/.openclaw/workspace-chief/AGENTS.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/chief/workspace/TOOLS.md" \
  /home/hobbes/.openclaw/workspace-chief/TOOLS.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/research/workspace/AGENTS.md" \
  /home/hobbes/.openclaw/workspace-research/AGENTS.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/research/workspace/TOOLS.md" \
  /home/hobbes/.openclaw/workspace-research/TOOLS.md
install -m 755 \
  "${src_root}/scripts/remote/check_phase4a_web_research_fallback.sh" \
  /root/check_phase4a_web_research_fallback.sh

sudo -u hobbes \
  XDG_RUNTIME_DIR="/run/user/$(id -u hobbes)" \
  DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u hobbes)/bus" \
  systemctl --user restart openclaw-gateway.service

sleep 15
curl -fsS http://127.0.0.1:18792/
/root/check_phase4a_web_research_fallback.sh
