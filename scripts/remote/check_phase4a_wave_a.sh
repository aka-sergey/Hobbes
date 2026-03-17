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

for path in \
  /home/hobbes/.openclaw/workspace-main/skills/voice-notes/SKILL.md \
  /home/hobbes/.openclaw/workspace-research/skills/vision-intake/SKILL.md \
  /home/hobbes/.openclaw/workspace-research/skills/pdf-workbench/SKILL.md \
  /home/hobbes/.openclaw/workspace-research/skills/web-research/SKILL.md
do
  test -f "$path"
done

jq -e '
  .commands.nativeSkills == "auto"
  and .tools.media.audio.enabled == true
  and .agents.defaults.imageModel.primary == "openai/gpt-4.1-mini"
' /home/hobbes/.openclaw/openclaw.json >/dev/null

set -a
. /home/hobbes/.openclaw/.env
set +a

chief_before="$(count_sessions chief)"
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
  timeout 120s env \
    HOME=/home/hobbes \
    OPENAI_API_KEY=\"\$OPENAI_API_KEY\" \
    XDG_RUNTIME_DIR=\"\$HRUN\" \
    DBUS_SESSION_BUS_ADDRESS=\"\$HBUS\" \
    openclaw agent \
    --local \
    --agent main \
    --session-id \"phase4a-main-chief-research-${ts}\" \
    --json \
    --message $(printf '%q' "Check the live agent roster. If chief is available, spawn chief. Chief must use research, not direct image/pdf/web tools, for this task: create one short evidence-first workflow paragraph for how Hobbes should handle a Telegram screenshot of a receipt and what current web info should be verified next. Return one concise final paragraph.") \
    </dev/null
"; then
  echo
  echo "note: phase4a routed check exited non-zero or timed out; inspect child session counters below"
fi

chief_after="$(count_sessions chief)"
research_after="$(count_sessions research)"

echo "wave4a_session_counts chief:${chief_before}->${chief_after} research:${research_before}->${research_after}"

if [[ "$chief_after" -le "$chief_before" || "$research_after" -le "$research_before" ]]; then
  echo "WAVE4A_ROUTING_NOT_CONFIRMED" >&2
  exit 1
fi

echo "WAVE4A_OK"
