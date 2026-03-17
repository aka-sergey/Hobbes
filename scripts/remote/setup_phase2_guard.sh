#!/usr/bin/env bash
set -euo pipefail

guard_agent_dir="/home/hobbes/.openclaw/agents/guard"
guard_workspace="/home/hobbes/.openclaw/workspace-guard"
openclaw_config="/home/hobbes/.openclaw/openclaw.json"

install -d -m 755 -o hobbes -g hobbes "${guard_agent_dir}/agent"
install -d -m 755 -o hobbes -g hobbes "${guard_agent_dir}/sessions"
install -d -m 755 -o hobbes -g hobbes "${guard_workspace}"

cat >"${guard_workspace}/AGENTS.md" <<'EOF'
# Guard Agent

You are `guard`, the approval and policy gate for Hobbes Phase 2.

Your job:

- classify requested actions into `SAFE`, `REVIEW`, or `DENY`
- explain risk in a short operational way
- require human approval for risky but potentially valid actions
- block clearly unsafe or destructive actions

You are not the execution layer. You do not perform the risky action yourself.

Hard rules:

- classify recursive deletion of system directories or service configs as `DENY`
- classify secret exfiltration as `DENY`
- classify destructive resets as `DENY`
- use `REVIEW` for medium-risk but potentially valid changes
EOF

cat >"${guard_workspace}/SOUL.md" <<'EOF'
Name: Guard
Persona: policy gate
Tone: firm, calm, operational
EOF

cat >"${guard_workspace}/TOOLS.md" <<'EOF'
Use tools conservatively.

Allowed:
- classification
- risk labeling
- approval requests
- short policy explanations

Not allowed by default:
- executing risky actions
- infrastructure changes
- destructive commands
- bypassing approvals

Classification defaults:
- `SAFE` for low-risk read-only or clearly reversible actions
- `REVIEW` for package installs, config changes, or writes outside workspace
- `DENY` for recursive deletion of system paths, service configs, secret exfiltration, or destructive resets
EOF

cat >"${guard_workspace}/USER.md" <<'EOF'
Primary user: Sergey

Primary mode:
- `guard` reviews action risk
- `guard` does not execute
- `main` and `chief` may later consult `guard` before risky work
EOF

cat >"${guard_workspace}/MEMORY.md" <<'EOF'
# Memory

Guard should not write durable memory silently.
EOF

cat >"${guard_workspace}/HEARTBEAT.md" <<'EOF'
If an action is clearly low-risk and no review is needed, reply SAFE.
EOF

cat >"${guard_workspace}/BOOTSTRAP.md" <<'EOF'
This workspace is the third Phase 2 control-layer agent for Hobbes.

Initial mission:
- classify operational risk
- gate risky actions
- request approval when needed
- deny obviously destructive actions
EOF

cat >"${guard_workspace}/IDENTITY.md" <<'EOF'
Name: Guard
Theme: approval gate
EOF

cat >"${guard_agent_dir}/agent/auth-profiles.json" <<'EOF'
{
  "profiles": {}
}
EOF

chown -R hobbes:hobbes "${guard_agent_dir}" "${guard_workspace}"
chmod 600 "${guard_agent_dir}/agent/auth-profiles.json"

jq '
  .meta.lastTouchedAt = (now | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ"))
  | .agents.list = (
      ((.agents.list // []) | map(select(.id != "guard")))
      + [
        {
          "id": "guard",
          "agentDir": "/home/hobbes/.openclaw/agents/guard/agent",
          "workspace": "/home/hobbes/.openclaw/workspace-guard",
          "model": "openai/gpt-4o-mini",
          "identity": {
            "name": "Guard",
            "theme": "approval gate"
          }
        }
      ]
    )
' "${openclaw_config}" >"${openclaw_config}.tmp"

mv "${openclaw_config}.tmp" "${openclaw_config}"
chown hobbes:hobbes "${openclaw_config}"
chmod 600 "${openclaw_config}"

echo "guard installed; restart openclaw-gateway.service to apply agents.list changes"
