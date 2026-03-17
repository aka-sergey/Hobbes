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

comms_before="$(count_sessions comms)"
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
  timeout 180s env \
    HOME=/home/hobbes \
    OPENAI_API_KEY=\"\$OPENAI_API_KEY\" \
    XDG_RUNTIME_DIR=\"\$HRUN\" \
    DBUS_SESSION_BUS_ADDRESS=\"\$HBUS\" \
    openclaw agent \
    --local \
    --agent chief \
    --session-id \"chief-comms-${ts}\" \
    --json \
    --message $(printf '%q' "Create a short operational plan to improve voice-note transcription on this VPS. This answer is going back to the Telegram user, so you must use comms for the final wording and return only the comms-polished final paragraph.")
"; then
  echo
  echo "note: chief->comms direct check exited non-zero or timed out; inspect session counters below"
fi

comms_after="$(count_sessions comms)"

echo
echo "chief_to_comms_session_counts comms:${comms_before}->${comms_after}"
