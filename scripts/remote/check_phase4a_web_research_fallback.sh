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

output="$(
  sudo -u hobbes bash -lc "
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
      --session-id \"phase4a-web-research-fallback-${ts}\" \
      --thinking off \
      --json \
      --message $(printf '%q' \"Use sessions_spawn with runtime subagent and agentId research. Find a short recent update about shipping or tankers in the Strait of Hormuz. If direct search is unavailable, do a trusted-source fallback using browser or web_fetch with a very small set of strong public sources such as Reuters or AP. Return a short Russian digest with links. Do not end with a missing-key refusal.\") \
      </dev/null
  " || true
)"

printf '%s\n' "$output"

research_after="$(count_sessions research)"

echo "web_research_fallback_session_counts research:${research_before}->${research_after}"

if [[ "$research_after" -le "$research_before" ]]; then
  echo "WEB_RESEARCH_FALLBACK_ROUTING_NOT_CONFIRMED" >&2
  exit 1
fi

if grep -qiE 'missing.*key|Brave Search API key|web search is unavailable|прямой веб-поиск' <<<"$output"; then
  echo "WEB_RESEARCH_FALLBACK_STILL_REFUSING" >&2
  exit 1
fi

echo "WEB_RESEARCH_FALLBACK_OK"
