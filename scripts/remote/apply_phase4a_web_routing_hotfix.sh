#!/usr/bin/env bash
set -euo pipefail

src_root="${1:-/root/hobbes-phase4a-web-hotfix}"

install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/main/workspace/AGENTS.md" \
  /home/hobbes/.openclaw/workspace-main/AGENTS.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/main/workspace/TOOLS.md" \
  /home/hobbes/.openclaw/workspace-main/TOOLS.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/chief/workspace/AGENTS.md" \
  /home/hobbes/.openclaw/workspace-chief/AGENTS.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/chief/workspace/TOOLS.md" \
  /home/hobbes/.openclaw/workspace-chief/TOOLS.md
install -o hobbes -g hobbes -m 644 \
  "${src_root}/config/agents/research/workspace/TOOLS.md" \
  /home/hobbes/.openclaw/workspace-research/TOOLS.md
install -m 755 \
  "${src_root}/scripts/remote/check_phase4a_web_research.sh" \
  /root/check_phase4a_web_research.sh

sudo -u hobbes \
  XDG_RUNTIME_DIR="/run/user/$(id -u hobbes)" \
  DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u hobbes)/bus" \
  systemctl --user restart openclaw-gateway.service

sleep 5
curl -fsS http://127.0.0.1:18792/
/root/check_phase4a_web_research.sh
