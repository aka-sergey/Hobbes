#!/usr/bin/env bash
set -euo pipefail

src_root="${1:-/tmp/hobbes-wave4b}"
openclaw_home="/home/hobbes/.openclaw"
main_workspace="${openclaw_home}/workspace-main"
chief_workspace="${openclaw_home}/workspace-chief"
comms_workspace="${openclaw_home}/workspace-comms"

if [[ ! -d "$src_root" ]]; then
  echo "source root not found: $src_root" >&2
  exit 1
fi

install -d -m 755 -o hobbes -g hobbes \
  "${main_workspace}/skills/reminders-and-followups" \
  "${main_workspace}/skills/persona-router" \
  "${chief_workspace}/skills/reminders-and-followups" \
  "${chief_workspace}/skills/meeting-prep" \
  "${chief_workspace}/skills/document-drafter" \
  "${comms_workspace}/skills/persona-router" \
  "${comms_workspace}/skills/document-drafter"

install -o hobbes -g hobbes -m 644 "${src_root}/skills/reminders-and-followups/SKILL.md" \
  "${main_workspace}/skills/reminders-and-followups/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/persona-router/SKILL.md" \
  "${main_workspace}/skills/persona-router/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/reminders-and-followups/SKILL.md" \
  "${chief_workspace}/skills/reminders-and-followups/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/meeting-prep/SKILL.md" \
  "${chief_workspace}/skills/meeting-prep/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/document-drafter/SKILL.md" \
  "${chief_workspace}/skills/document-drafter/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/persona-router/SKILL.md" \
  "${comms_workspace}/skills/persona-router/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/document-drafter/SKILL.md" \
  "${comms_workspace}/skills/document-drafter/SKILL.md"

install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/main/workspace/AGENTS.md" \
  "${main_workspace}/AGENTS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/main/workspace/TOOLS.md" \
  "${main_workspace}/TOOLS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/main/workspace/USER.md" \
  "${main_workspace}/USER.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/main/workspace/PERSONAS.md" \
  "${main_workspace}/PERSONAS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/main/workspace/REMINDERS.md" \
  "${main_workspace}/REMINDERS.md"

install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/chief/workspace/AGENTS.md" \
  "${chief_workspace}/AGENTS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/chief/workspace/TOOLS.md" \
  "${chief_workspace}/TOOLS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/chief/workspace/USER.md" \
  "${chief_workspace}/USER.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/chief/workspace/REMINDERS.md" \
  "${chief_workspace}/REMINDERS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/chief/workspace/MEETING_PREP.md" \
  "${chief_workspace}/MEETING_PREP.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/chief/workspace/DOCUMENT_SHAPES.md" \
  "${chief_workspace}/DOCUMENT_SHAPES.md"

install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/comms/workspace/AGENTS.md" \
  "${comms_workspace}/AGENTS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/comms/workspace/TOOLS.md" \
  "${comms_workspace}/TOOLS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/comms/workspace/USER.md" \
  "${comms_workspace}/USER.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/comms/workspace/PERSONAS.md" \
  "${comms_workspace}/PERSONAS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/comms/workspace/DOCUMENT_SHAPES.md" \
  "${comms_workspace}/DOCUMENT_SHAPES.md"

uid="$(id -u hobbes)"
runtime_dir="/run/user/$uid"

runuser -u hobbes -- env XDG_RUNTIME_DIR="$runtime_dir" systemctl --user restart openclaw-gateway.service
runuser -u hobbes -- env XDG_RUNTIME_DIR="$runtime_dir" systemctl --user is-active openclaw-gateway.service

echo "wave4b installed"
