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

run_chief_local() {
  local session_id="$1"
  local prompt="$2"

  if ! sudo -u hobbes bash -lc "
    set -euo pipefail
    cd /home/hobbes
    set -a
    . /home/hobbes/.openclaw/.env
    set +a
    HUID=\$(id -u)
    HRUN=/run/user/\$HUID
    HBUS=unix:path=\$HRUN/bus
    timeout 180s env \
      HOME=/home/hobbes \
      OPENAI_API_KEY=\"\$OPENAI_API_KEY\" \
      XDG_RUNTIME_DIR=\"\$HRUN\" \
      DBUS_SESSION_BUS_ADDRESS=\"\$HBUS\" \
      openclaw agent \
      --local \
      --agent chief \
      --session-id \"${session_id}\" \
      --json \
      --message $(printf '%q' "${prompt}") \
      </dev/null
  "; then
    echo
    echo "note: chief route exited non-zero or timed out; inspect child session counters below"
  fi
}

research_before="$(count_sessions research)"
memory_before="$(count_sessions memorykeeper)"
booking_before="$(count_sessions bookingprep)"
ts="$(date +%s)"

echo "== research =="
run_chief_local \
  "phase3-chief-research-${ts}" \
  "Use sessions_spawn with runtime subagent and agentId research to handle this task: create one short research-oriented brief about how to improve source quality for future Hobbes reports. Return only the resulting draft."
research_after="$(count_sessions research)"
echo "research_session_counts research:${research_before}->${research_after}"

echo
echo "== memory =="
run_chief_local \
  "phase3-chief-memory-${ts}" \
  "Use sessions_spawn with runtime subagent and agentId memorykeeper to classify this durable fact for Hobbes: Sergey prefers short Telegram answers with clear action steps. Return only the resulting structured memory draft."
memory_after="$(count_sessions memorykeeper)"
echo "memory_session_counts memory:${memory_before}->${memory_after}"

echo
echo "== booking =="
run_chief_local \
  "phase3-chief-booking-${ts}" \
  "Use sessions_spawn with runtime subagent and agentId bookingprep to prepare a short checklist of inputs needed before booking travel for a future work trip. Return only the resulting draft."
booking_after="$(count_sessions bookingprep)"
echo "booking_session_counts booking:${booking_before}->${booking_after}"
