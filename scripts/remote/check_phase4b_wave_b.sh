#!/usr/bin/env bash
set -euo pipefail

for path in \
  /home/hobbes/.openclaw/workspace-main/skills/reminders-and-followups/SKILL.md \
  /home/hobbes/.openclaw/workspace-main/skills/persona-router/SKILL.md \
  /home/hobbes/.openclaw/workspace-chief/skills/reminders-and-followups/SKILL.md \
  /home/hobbes/.openclaw/workspace-chief/skills/meeting-prep/SKILL.md \
  /home/hobbes/.openclaw/workspace-chief/skills/document-drafter/SKILL.md \
  /home/hobbes/.openclaw/workspace-comms/skills/persona-router/SKILL.md \
  /home/hobbes/.openclaw/workspace-comms/skills/document-drafter/SKILL.md \
  /home/hobbes/.openclaw/workspace-main/PERSONAS.md \
  /home/hobbes/.openclaw/workspace-main/REMINDERS.md \
  /home/hobbes/.openclaw/workspace-chief/REMINDERS.md \
  /home/hobbes/.openclaw/workspace-chief/MEETING_PREP.md \
  /home/hobbes/.openclaw/workspace-chief/DOCUMENT_SHAPES.md \
  /home/hobbes/.openclaw/workspace-comms/PERSONAS.md \
  /home/hobbes/.openclaw/workspace-comms/DOCUMENT_SHAPES.md
do
  test -f "$path"
done

grep -q 'Default language: Russian' /home/hobbes/.openclaw/workspace-main/USER.md
grep -q 'reminder' /home/hobbes/.openclaw/workspace-chief/AGENTS.md
grep -q 'persona' /home/hobbes/.openclaw/workspace-comms/AGENTS.md

uid="$(id -u hobbes)"
runtime_dir="/run/user/$uid"
state="$(runuser -u hobbes -- env XDG_RUNTIME_DIR="$runtime_dir" systemctl --user is-active openclaw-gateway.service)"

if [[ "$state" != "active" ]]; then
  echo "openclaw-gateway.service is not active" >&2
  exit 1
fi

echo "WAVE4B_OK"
