#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f /home/hobbes/.openclaw/.env ]]; then
  echo ".env not found at /home/hobbes/.openclaw/.env" >&2
  exit 1
fi

set -a
. /home/hobbes/.openclaw/.env
set +a

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
  --agent booking \
  --session-id booking-wave3-smoke \
  --json \
  --message "Reply with exactly BOOKING_OK"
