#!/usr/bin/env bash
set -euo pipefail

src_root="${1:-/tmp/hobbes-wave4a}"
openclaw_home="/home/hobbes/.openclaw"
main_workspace="${openclaw_home}/workspace-main"
chief_workspace="${openclaw_home}/workspace-chief"
research_workspace="${openclaw_home}/workspace-research"
config_path="${openclaw_home}/openclaw.json"

if [[ ! -d "$src_root" ]]; then
  echo "source root not found: $src_root" >&2
  exit 1
fi

install -d -m 755 -o hobbes -g hobbes \
  "${main_workspace}/skills/voice-notes" \
  "${research_workspace}/skills/vision-intake" \
  "${research_workspace}/skills/pdf-workbench" \
  "${research_workspace}/skills/web-research"

install -o hobbes -g hobbes -m 644 "${src_root}/skills/voice-notes/SKILL.md" \
  "${main_workspace}/skills/voice-notes/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/vision-intake/SKILL.md" \
  "${research_workspace}/skills/vision-intake/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/pdf-workbench/SKILL.md" \
  "${research_workspace}/skills/pdf-workbench/SKILL.md"
install -o hobbes -g hobbes -m 644 "${src_root}/skills/web-research/SKILL.md" \
  "${research_workspace}/skills/web-research/SKILL.md"

install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/main/workspace/AGENTS.md" \
  "${main_workspace}/AGENTS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/main/workspace/TOOLS.md" \
  "${main_workspace}/TOOLS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/main/workspace/USER.md" \
  "${main_workspace}/USER.md"

install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/chief/workspace/AGENTS.md" \
  "${chief_workspace}/AGENTS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/chief/workspace/TOOLS.md" \
  "${chief_workspace}/TOOLS.md"

install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/research/workspace/AGENTS.md" \
  "${research_workspace}/AGENTS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/research/workspace/TOOLS.md" \
  "${research_workspace}/TOOLS.md"
install -o hobbes -g hobbes -m 644 "${src_root}/config/agents/research/workspace/USER.md" \
  "${research_workspace}/USER.md"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends poppler-utils tesseract-ocr

jq '
  .commands.nativeSkills = "auto"
  | .agents.defaults.imageModel.primary = "openai/gpt-4.1-mini"
  | .tools.media.audio.enabled = true
  | .tools.media.audio.scope.default = "deny"
' "$config_path" > "${config_path}.tmp"

mv "${config_path}.tmp" "$config_path"
chown hobbes:hobbes "$config_path"
chmod 600 "$config_path"

uid="$(id -u hobbes)"
runtime_dir="/run/user/$uid"

runuser -u hobbes -- env XDG_RUNTIME_DIR="$runtime_dir" systemctl --user restart openclaw-gateway.service
runuser -u hobbes -- env XDG_RUNTIME_DIR="$runtime_dir" systemctl --user is-active openclaw-gateway.service

echo "wave4a installed"
