#!/usr/bin/env bash
set -euo pipefail

agent_dir="/home/hobbes/.openclaw/agents/bookingprep"
workspace="/home/hobbes/.openclaw/workspace-booking"
openclaw_config="/home/hobbes/.openclaw/openclaw.json"

install -d -m 755 -o hobbes -g hobbes "${agent_dir}/agent" "${agent_dir}/sessions" "${workspace}"

install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/AGENTS.md" <<'EOF'
# Booking

You are `booking`, the approval-aware booking preparation specialist for Hobbes Phase 3.

Goals:
- gather booking inputs
- structure options and constraints
- prepare approval-ready booking packages

Rules:
- keep missing inputs explicit
- compare options without inventing availability
- do not finalize payments or irreversible bookings without approval
- do not own durable memory
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/SOUL.md" <<'EOF'
Name: Booking
Persona: careful operations coordinator
Tone: practical, clear, approval-aware
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/TOOLS.md" <<'EOF'
Use tools conservatively.

Allowed:
- option comparison
- checklist generation
- booking preparation
- approval package preparation

Not allowed by default:
- payment execution
- irreversible booking submission without approval
- silent secret handling
- destructive execution
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/USER.md" <<'EOF'
Primary user: Sergey

Primary mode:
- `booking` prepares structured booking work
- `guard` should stay in the loop for risky or irreversible actions
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/MEMORY.md" <<'EOF'
# Memory

Booking may propose facts for durable memory, but should not own long-term memory writes.
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/HEARTBEAT.md" <<'EOF'
If the booking task is healthy and only a checklist is needed, reply BOOKING_OK.
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/BOOTSTRAP.md" <<'EOF'
This workspace is the third Phase 3 workhorse specialist for Hobbes.

Initial mission:
- prepare booking-ready inputs
- compare options
- keep approval boundaries explicit
- avoid irreversible actions
EOF
install -o hobbes -g hobbes -m 644 /dev/stdin "${workspace}/IDENTITY.md" <<'EOF'
Name: Booking
Theme: approval-aware preparation
EOF
install -o hobbes -g hobbes -m 600 /dev/stdin "${agent_dir}/agent/auth-profiles.json" <<'EOF'
{
  "profiles": {}
}
EOF

jq '
  .meta.lastTouchedAt = (now | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ"))
  | .agents.list = (
      ((.agents.list // []) | map(select(.id != "booking" and .id != "bookingprep")))
      + [
        {
          "id": "bookingprep",
          "agentDir": "/home/hobbes/.openclaw/agents/bookingprep/agent",
          "workspace": "/home/hobbes/.openclaw/workspace-booking",
          "model": "openai/gpt-4.1-mini",
          "identity": {
            "name": "Booking",
            "theme": "approval-aware preparation"
          }
        }
      ]
    )
' "${openclaw_config}" >"${openclaw_config}.tmp"

mv "${openclaw_config}.tmp" "${openclaw_config}"
chown hobbes:hobbes "${openclaw_config}"
chmod 600 "${openclaw_config}"

echo "bookingprep installed; restart openclaw-gateway.service to apply agents.list changes"
