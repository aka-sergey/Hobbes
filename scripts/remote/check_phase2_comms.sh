#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f /home/hobbes/.openclaw/.env ]]; then
  echo ".env not found at /home/hobbes/.openclaw/.env" >&2
  exit 1
fi

set -a
. /home/hobbes/.openclaw/.env
set +a

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required in /home/hobbes/.openclaw/.env" >&2
  exit 1
fi

hobbes_uid="$(id -u hobbes)"
hobbes_runtime_dir="/run/user/${hobbes_uid}"
hobbes_bus="unix:path=${hobbes_runtime_dir}/bus"

cd /home/hobbes

sudo -u hobbes env \
  HOME=/home/hobbes \
  OPENAI_API_KEY="${OPENAI_API_KEY}" \
  XDG_RUNTIME_DIR="${hobbes_runtime_dir}" \
  DBUS_SESSION_BUS_ADDRESS="${hobbes_bus}" \
  openclaw agent \
  --local \
  --agent comms \
  --session-id comms-wave2b-smoke \
  --json \
  --message "Rewrite this for Telegram in one short sentence and keep the risk explicit: The service recovered after restart, but the voice pipeline still needs separate follow-up."
