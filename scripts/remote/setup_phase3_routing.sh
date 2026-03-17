#!/usr/bin/env bash
set -euo pipefail

openclaw_config="/home/hobbes/.openclaw/openclaw.json"

jq '
  .meta.lastTouchedAt = (now | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ"))
  | .agents.defaults.subagents = (
      (.agents.defaults.subagents // {})
      + {
        "maxSpawnDepth": 2,
        "maxChildrenPerAgent": 6,
        "maxConcurrent": 4
      }
    )
  | .agents.list = ((.agents.list // []) | map(
      if .id == "main" then
        . + {
          "subagents": {
            "allowAgents": ["chief", "comms", "guard"]
          }
        }
      elif .id == "chief" then
        . + {
          "subagents": {
            "allowAgents": ["comms", "guard", "research", "memorykeeper", "bookingprep"]
          }
        }
      else
        .
      end
    ))
' "${openclaw_config}" >"${openclaw_config}.tmp"

mv "${openclaw_config}.tmp" "${openclaw_config}"
chown hobbes:hobbes "${openclaw_config}"
chmod 600 "${openclaw_config}"

chown -R hobbes:hobbes \
  /home/hobbes/.openclaw/workspace-main \
  /home/hobbes/.openclaw/workspace-chief

echo "phase 3 routing permissions updated; restart openclaw-gateway.service to apply config changes"
