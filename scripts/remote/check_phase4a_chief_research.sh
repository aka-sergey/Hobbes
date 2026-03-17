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
  timeout 90s env \
    HOME=/home/hobbes \
    OPENAI_API_KEY=\"\$OPENAI_API_KEY\" \
    XDG_RUNTIME_DIR=\"\$HRUN\" \
    DBUS_SESSION_BUS_ADDRESS=\"\$HBUS\" \
    openclaw agent \
    --local \
    --agent chief \
    --session-id \"phase4a-chief-research-${ts}\" \
    --thinking off \
    --json \
    --message $(printf '%q' "Use sessions_spawn with runtime subagent and agentId research. No file or URL is attached. Ask research for one concise evidence-first workflow paragraph describing how Hobbes should handle a future Telegram receipt screenshot and what current web information should be verified next. Return only the final paragraph from research.") \
    </dev/null
"; then
  echo
  echo "note: chief->research check exited non-zero or timed out; inspect research session counters below"
fi

research_after="$(count_sessions research)"

echo "chief_research_session_counts research:${research_before}->${research_after}"

if [[ "$research_after" -le "$research_before" ]]; then
  echo "CHIEF_RESEARCH_ROUTING_NOT_CONFIRMED" >&2
  exit 1
fi

echo "CHIEF_RESEARCH_OK"
