#!/usr/bin/env bash
set -euo pipefail

rm -rf /tmp/hobbes-wave4a-chief-research
mkdir -p /tmp/hobbes-wave4a-chief-research
cd /tmp/hobbes-wave4a-chief-research
tar -xzf /tmp/hobbes-wave4a-chief-research.tar.gz
install -m 755 scripts/remote/check_phase4a_chief_research.sh /root/check_phase4a_chief_research.sh

sudo -u hobbes \
  XDG_RUNTIME_DIR="/run/user/$(id -u hobbes)" \
  DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u hobbes)/bus" \
  systemctl --user is-active openclaw-gateway.service

curl -fsS http://127.0.0.1:18792/
/root/check_phase4a_chief_research.sh
