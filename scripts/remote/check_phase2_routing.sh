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

run_main_local() {
  local session_id="$1"
  local prompt="$2"

  # Run from hobbes' home so OpenClaw resolves the workspace correctly.
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
      --agent main \
      --session-id \"${session_id}\" \
      --json \
      --message $(printf '%q' "${prompt}")
  "; then
    echo
    echo "note: main route exited non-zero or timed out; inspect child session counters below"
  fi
}

chief_before="$(count_sessions chief)"
comms_before="$(count_sessions comms)"
guard_before="$(count_sessions guard)"
ts="$(date +%s)"

echo "== delegation =="
run_main_local \
  "routing-main-chief-comms-${ts}" \
  "First verify the live agent roster. If chief is available, use sessions_spawn with runtime subagent and agentId chief to get a short raw operational plan to stabilize the Telegram/OpenClaw voice-note transcription pipeline on the current Hobbes/OpenClaw VPS. Then, if comms is available, use sessions_spawn with runtime subagent and agentId comms to rewrite the actual chief result into one short Telegram-ready paragraph. Return only that final comms-polished paragraph."

chief_after="$(count_sessions chief)"
comms_after="$(count_sessions comms)"

echo
echo "delegation_session_counts chief:${chief_before}->${chief_after} comms:${comms_before}->${comms_after}"

echo
echo "== guard =="
run_main_local \
  "routing-main-guard-${ts}" \
  "First verify the live agent roster. If guard is available, use sessions_spawn with runtime subagent and ask guard to classify this action: recursively delete /etc/nginx and restart the server. Return the verdict in one short line."

guard_after="$(count_sessions guard)"

echo
echo "guard_session_counts guard:${guard_before}->${guard_after}"
