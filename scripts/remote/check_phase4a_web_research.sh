#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f /home/hobbes/.openclaw/.env ]]; then
  echo ".env not found at /home/hobbes/.openclaw/.env" >&2
  exit 1
fi

count_sessions() {
  local agent_id="$1"
  find "/home/hobbes/.openclaw/agents/${agent_id}/sessions" -maxdepth 1 -name '*.jsonl' | wc -l | tr -d ' '
}

set -a
. /home/hobbes/.openclaw/.env
set +a

research_before="$(count_sessions research)"
chief_before="$(count_sessions chief)"
ts="$(date +%s)"

if ! sudo -u hobbes bash -lc "
  set -euo pipefail
  cd /home/hobbes
  set -a
  . /home/hobbes/.openclaw/.env
  set +a
  HUID=\$(id -u)
  HRUN=/run/user/\$HUID
  HBUS=unix:path=\$HRUN/bus
  timeout 120s env \
    HOME=/home/hobbes \
    OPENAI_API_KEY=\"\$OPENAI_API_KEY\" \
    XDG_RUNTIME_DIR=\"\$HRUN\" \
    DBUS_SESSION_BUS_ADDRESS=\"\$HBUS\" \
    openclaw agent \
    --local \
    --agent chief \
    --session-id \"phase4a-web-research-${ts}\" \
    --thinking off \
    --json \
    --message $(printf '%q' "Use sessions_spawn with runtime subagent and agentId research. Find fresh public web information about commercial tankers that recently passed the Strait of Hormuz without being shelled from the Iranian side. Return a very short Russian digest with 2 to 4 source links. Do not say that internet search is unavailable.") \
    </dev/null
"; then
  echo
  echo "note: web-research check exited non-zero or timed out; inspect research session counters below"
fi

research_after="$(count_sessions research)"
chief_after="$(count_sessions chief)"

echo "web_research_session_counts chief:${chief_before}->${chief_after} research:${research_before}->${research_after}"
if [[ "$chief_after" -le "$chief_before" ]]; then
  echo "WEB_RESEARCH_CHIEF_NOT_CONFIRMED" >&2
  exit 1
fi
if [[ "$research_after" -le "$research_before" ]]; then
  echo "WEB_RESEARCH_ROUTING_NOT_CONFIRMED" >&2
  exit 1
fi

latest_chief="$(find /home/hobbes/.openclaw/agents/chief/sessions -maxdepth 1 -type f -name '*.jsonl' -printf '%T@ %p\n' | sort -nr | head -n 1 | cut -d' ' -f2-)"
latest_research="$(find /home/hobbes/.openclaw/agents/research/sessions -maxdepth 1 -type f -name '*.jsonl' -printf '%T@ %p\n' | sort -nr | head -n 1 | cut -d' ' -f2-)"

if grep -q '"name":"web_search"' "$latest_chief"; then
  echo "WEB_RESEARCH_CHIEF_USED_WEB_SEARCH" >&2
  exit 1
fi

if ! grep -q 'hobbes-tavily-search\|Tavily' "$latest_research"; then
  echo "WEB_RESEARCH_TAVILY_NOT_OBSERVED" >&2
  exit 1
fi

echo "WEB_RESEARCH_OK"
