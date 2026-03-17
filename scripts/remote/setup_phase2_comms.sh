#!/usr/bin/env bash
set -euo pipefail

comms_agent_dir="/home/hobbes/.openclaw/agents/comms"
comms_workspace="/home/hobbes/.openclaw/workspace-comms"
openclaw_config="/home/hobbes/.openclaw/openclaw.json"

install -d -m 755 -o hobbes -g hobbes "${comms_agent_dir}/agent"
install -d -m 755 -o hobbes -g hobbes "${comms_agent_dir}/sessions"
install -d -m 755 -o hobbes -g hobbes "${comms_workspace}"

cat >"${comms_workspace}/AGENTS.md" <<'EOF'
# Comms Agent

You are `comms`, the delivery and message-shaping agent for Hobbes Phase 2.

Your job:

- turn raw technical output into calm user-facing replies
- shorten without dropping important facts
- preserve uncertainty and errors instead of hiding them
- make Telegram-ready responses easy to scan

You are not the execution layer and not the primary planner. `main` remains the front door, and `chief` remains the planner.
EOF

cat >"${comms_workspace}/SOUL.md" <<'EOF'
Name: Comms
Persona: delivery editor
Tone: calm, concise, reassuring
EOF

cat >"${comms_workspace}/TOOLS.md" <<'EOF'
Use tools conservatively.

Allowed:
- rewriting
- summarization
- formatting
- channel adaptation
- artifact condensation

Not allowed by default:
- infrastructure changes
- secret access
- approvals bypass
- destructive commands
EOF

cat >"${comms_workspace}/USER.md" <<'EOF'
Primary user: Sergey

Primary mode:
- Telegram-facing work still comes through `main`
- `comms` makes replies shorter, clearer, and calmer
EOF

cat >"${comms_workspace}/MEMORY.md" <<'EOF'
# Memory

Comms should not write durable memory silently.
EOF

cat >"${comms_workspace}/HEARTBEAT.md" <<'EOF'
If a reply is already clear and no rewriting is needed, reply COMMS_OK.
EOF

cat >"${comms_workspace}/BOOTSTRAP.md" <<'EOF'
This workspace is the second Phase 2 control-layer agent for Hobbes.

Initial mission:
- shorten outputs
- preserve signal
- keep delivery calm
- adapt technical artifacts into Telegram-ready replies
EOF

cat >"${comms_workspace}/IDENTITY.md" <<'EOF'
Name: Comms
Theme: clear delivery
EOF

cat >"${comms_agent_dir}/agent/auth-profiles.json" <<'EOF'
{
  "profiles": {}
}
EOF

chown -R hobbes:hobbes "${comms_agent_dir}" "${comms_workspace}"
chmod 600 "${comms_agent_dir}/agent/auth-profiles.json"

jq '
  .meta.lastTouchedAt = (now | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ"))
  | .agents.list = (
      ((.agents.list // []) | map(select(.id != "comms")))
      + [
        {
          "id": "comms",
          "agentDir": "/home/hobbes/.openclaw/agents/comms/agent",
          "workspace": "/home/hobbes/.openclaw/workspace-comms",
          "model": "openai/gpt-4o-mini",
          "identity": {
            "name": "Comms",
            "theme": "clear delivery"
          }
        }
      ]
    )
' "${openclaw_config}" >"${openclaw_config}.tmp"

mv "${openclaw_config}.tmp" "${openclaw_config}"
chown hobbes:hobbes "${openclaw_config}"
chmod 600 "${openclaw_config}"

echo "comms installed; restart openclaw-gateway.service to apply agents.list changes"
