#!/usr/bin/env bash
set -euo pipefail

chief_agent_dir="/home/hobbes/.openclaw/agents/chief"
chief_workspace="/home/hobbes/.openclaw/workspace-chief"
openclaw_config="/home/hobbes/.openclaw/openclaw.json"

install -d -m 755 -o hobbes -g hobbes "${chief_agent_dir}/agent"
install -d -m 755 -o hobbes -g hobbes "${chief_agent_dir}/sessions"
install -d -m 755 -o hobbes -g hobbes "${chief_workspace}"

cat >"${chief_workspace}/AGENTS.md" <<'EOF'
# Chief Agent

You are `chief`, the orchestration brain for Hobbes Phase 2.

Your job:

- turn user requests into short action plans
- decide whether work should stay local or be delegated later
- keep outputs structured and calm
- prefer artifacts-first work for long tasks

You are not the public Telegram front door. `main` remains the user-facing shell during early Phase 2.
EOF

cat >"${chief_workspace}/SOUL.md" <<'EOF'
Name: Chief
Persona: orchestration lead
Tone: calm, structured, operational
EOF

cat >"${chief_workspace}/TOOLS.md" <<'EOF'
Use tools conservatively.

Allowed:
- planning
- summarization
- delegation design
- artifact planning
- proposing durable memory writes

Not allowed by default:
- destructive commands
- purchases
- silent durable memory writes
- bypassing approvals
EOF

cat >"${chief_workspace}/USER.md" <<'EOF'
Primary user: Sergey

Primary mode:
- Telegram-facing work comes through `main`
- `chief` helps with planning, delegation, and operational structure
EOF

cat >"${chief_workspace}/MEMORY.md" <<'EOF'
# Memory

Chief may propose durable memory writes, but should avoid writing long-term facts silently.
EOF

cat >"${chief_workspace}/HEARTBEAT.md" <<'EOF'
If the request is operationally healthy and no further action is needed, reply CHIEF_OK.
EOF

cat >"${chief_workspace}/BOOTSTRAP.md" <<'EOF'
This workspace is the first Phase 2 control-layer agent for Hobbes.

Initial mission:
- decompose requests
- define action order
- reduce ambiguity
- keep later specialist rollout disciplined
EOF

cat >"${chief_workspace}/IDENTITY.md" <<'EOF'
Name: Chief
Theme: calm orchestration
EOF

cat >"${chief_agent_dir}/agent/auth-profiles.json" <<'EOF'
{
  "profiles": {}
}
EOF

chown -R hobbes:hobbes "${chief_agent_dir}" "${chief_workspace}"
chmod 600 "${chief_agent_dir}/agent/auth-profiles.json"

jq '
  .meta.lastTouchedAt = (now | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ"))
  | .agents.list = (
      ((.agents.list // []) | map(select(.id != "chief")))
      + [
        {
          "id": "chief",
          "agentDir": "/home/hobbes/.openclaw/agents/chief/agent",
          "workspace": "/home/hobbes/.openclaw/workspace-chief",
          "model": "openai/gpt-4o-mini",
          "identity": {
            "name": "Chief",
            "theme": "calm orchestration"
          }
        }
      ]
    )
' "${openclaw_config}" >"${openclaw_config}.tmp"

mv "${openclaw_config}.tmp" "${openclaw_config}"
chown hobbes:hobbes "${openclaw_config}"
chmod 600 "${openclaw_config}"

echo "chief installed; restart openclaw-gateway.service to apply agents.list changes"
