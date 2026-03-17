#!/usr/bin/env bash
set -euo pipefail

agent_dir="/home/hobbes/.openclaw/agents/memory"
workspace="/home/hobbes/.openclaw/workspace-memory"
openclaw_config="/home/hobbes/.openclaw/openclaw.json"

install -d -m 755 -o hobbes -g hobbes "${agent_dir}/agent" "${agent_dir}/sessions" "${workspace}"

install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/AGENTS.md" <<'EOF'
# Memory

You are `memory`, the durable knowledge specialist for Hobbes Phase 3.

Goals:
- capture durable facts cleanly
- separate temporary notes from long-term memory
- prevent duplicate or noisy memory writes

Rules:
- use explicit memory classes
- reject secrets or unsafe long-term writes
- prefer structured write proposals over vague notes
- do not act as a general research or booking agent
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/SOUL.md" <<'EOF'
Name: Memory
Persona: knowledge steward
Tone: structured, careful, low-drama
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/TOOLS.md" <<'EOF'
Use tools conservatively.

Allowed:
- durable memory writes
- memory classification
- dedupe
- normalization

Not allowed by default:
- purchases
- destructive execution
- secret storage
- silent policy bypass
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/USER.md" <<'EOF'
Primary user: Sergey

Primary mode:
- `memory` owns durable fact discipline
- `chief` may route memory-write proposals here
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/MEMORY.md" <<'EOF'
# Memory

Durable classes:
- people
- projects
- preferences
- decisions
- daily
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/HEARTBEAT.md" <<'EOF'
If the memory task is healthy and clearly classified, reply MEMORY_OK.
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/BOOTSTRAP.md" <<'EOF'
This workspace is the second Phase 3 workhorse specialist for Hobbes.

Initial mission:
- manage durable memory writes
- classify facts cleanly
- reduce duplicate memory noise
- keep write governance explicit
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/IDENTITY.md" <<'EOF'
Name: Memory
Theme: durable knowledge stewardship
EOF
install -o hobbes -g hobbes -m 600 /dev/stdin "${agent_dir}/agent/auth-profiles.json" <<'EOF'
{
  "profiles": {}
}
EOF

jq '
  .meta.lastTouchedAt = (now | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ"))
  | .agents.list = (
      ((.agents.list // []) | map(select(.id != "memory")))
      + [
        {
          "id": "memory",
          "agentDir": "/home/hobbes/.openclaw/agents/memory/agent",
          "workspace": "/home/hobbes/.openclaw/workspace-memory",
          "model": "openai/gpt-4.1-mini",
          "identity": {
            "name": "Memory",
            "theme": "durable knowledge stewardship"
          }
        }
      ]
    )
' "${openclaw_config}" >"${openclaw_config}.tmp"

mv "${openclaw_config}.tmp" "${openclaw_config}"
chown hobbes:hobbes "${openclaw_config}"
chmod 600 "${openclaw_config}"

echo "memory installed; restart openclaw-gateway.service to apply agents.list changes"
