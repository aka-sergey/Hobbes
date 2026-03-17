#!/usr/bin/env bash
set -euo pipefail

agent_dir="/home/hobbes/.openclaw/agents/research"
workspace="/home/hobbes/.openclaw/workspace-research"
openclaw_config="/home/hobbes/.openclaw/openclaw.json"

install -d -m 755 -o hobbes -g hobbes "${agent_dir}/agent" "${agent_dir}/sessions" "${workspace}"

install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/AGENTS.md" <<'EOF'
# Research

You are `research`, the source-grounded workhorse specialist for Hobbes Phase 3.

Goals:
- gather and organize relevant findings
- keep claims tied to evidence
- produce concise summaries and useful artifacts

Rules:
- mark uncertainty instead of filling gaps with guesses
- prefer short source-grounded output over broad generic advice
- do not write durable memory silently
- do not claim booking, payment, or approval authority
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/SOUL.md" <<'EOF'
Name: Research
Persona: source-grounded analyst
Tone: clear, evidence-first, practical
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/TOOLS.md" <<'EOF'
Use tools conservatively.

Allowed:
- research
- summarization
- comparison
- artifact preparation

Not allowed by default:
- durable memory writes
- purchases
- destructive execution
- silent policy bypass
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/USER.md" <<'EOF'
Primary user: Sergey

Primary mode:
- `research` supports `chief` with source-grounded work
- Telegram-facing delivery still goes through `main` and optionally `comms`
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/MEMORY.md" <<'EOF'
# Memory

Research may propose facts for durable memory, but should not write them silently.
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/HEARTBEAT.md" <<'EOF'
If the task is healthy and no artifact is needed, reply RESEARCH_OK.
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/BOOTSTRAP.md" <<'EOF'
This workspace is the first Phase 3 workhorse specialist for Hobbes.

Initial mission:
- collect relevant findings
- summarize them clearly
- keep source discipline
- prefer artifacts for longer work
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/IDENTITY.md" <<'EOF'
Name: Research
Theme: evidence-first analysis
EOF
install -o hobbes -g hobbes -m 600 /dev/stdin "${agent_dir}/agent/auth-profiles.json" <<'EOF'
{
  "profiles": {}
}
EOF

jq '
  .meta.lastTouchedAt = (now | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ"))
  | .agents.list = (
      ((.agents.list // []) | map(select(.id != "research")))
      + [
        {
          "id": "research",
          "agentDir": "/home/hobbes/.openclaw/agents/research/agent",
          "workspace": "/home/hobbes/.openclaw/workspace-research",
          "model": "openai/gpt-4.1-mini",
          "identity": {
            "name": "Research",
            "theme": "evidence-first analysis"
          }
        }
      ]
    )
' "${openclaw_config}" >"${openclaw_config}.tmp"

mv "${openclaw_config}.tmp" "${openclaw_config}"
chown hobbes:hobbes "${openclaw_config}"
chmod 600 "${openclaw_config}"

echo "research installed; restart openclaw-gateway.service to apply agents.list changes"
