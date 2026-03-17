#!/usr/bin/env bash
set -euo pipefail

src_root="${1:-/tmp/hobbes-tavily}"

install -m 755 \
  "${src_root}/scripts/remote/hobbes_tavily_search.py" \
  /usr/local/bin/hobbes-tavily-search

install -o hobbes -g hobbes -m 644 \
  "${src_root}/skills/web-research/SKILL.md" \
  /home/hobbes/.openclaw/workspace-research/skills/web-research/SKILL.md
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

if ! grep -q '^TAVILY_API_KEY=' /home/hobbes/.openclaw/.env; then
  printf '\n# Tavily web research\nTAVILY_API_KEY=\n' >>/home/hobbes/.openclaw/.env
  chown hobbes:hobbes /home/hobbes/.openclaw/.env
fi

sudo -u hobbes \
  XDG_RUNTIME_DIR="/run/user/$(id -u hobbes)" \
  DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u hobbes)/bus" \
  systemctl --user restart openclaw-gateway.service

echo "TAVILY_INTEGRATION_INSTALLED"
