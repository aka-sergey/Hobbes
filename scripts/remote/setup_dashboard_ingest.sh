#!/usr/bin/env bash
set -euo pipefail

DASHBOARD_URL="${1:-${DASHBOARD_URL:-}}"
INGEST_TOKEN="${2:-${INGEST_TOKEN:-}}"
HOST_LABEL="${3:-${HOST_LABEL:-72.56.112.63}}"

if [[ -z "$DASHBOARD_URL" || -z "$INGEST_TOKEN" ]]; then
  echo "Usage: $0 <dashboard-url> <ingest-token> [host-label]" >&2
  exit 1
fi

install -d -m 0755 /usr/local/bin
install -d -m 0755 /etc/systemd/system

install -m 0755 /tmp/hobbes_dashboard_snapshot.sh /usr/local/bin/hobbes-dashboard-snapshot.sh

cat >/etc/hobbes-dashboard.env <<EOF
DASHBOARD_URL=$DASHBOARD_URL
INGEST_TOKEN=$INGEST_TOKEN
HOST_LABEL=$HOST_LABEL
OPENCLAW_HOME=/home/hobbes/.openclaw
OPENCLAW_USER=hobbes
EOF

cat >/etc/systemd/system/hobbes-dashboard-snapshot.service <<'EOF'
[Unit]
Description=Push Hobbes dashboard snapshot to Railway
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
EnvironmentFile=/etc/hobbes-dashboard.env
ExecStart=/usr/local/bin/hobbes-dashboard-snapshot.sh
EOF

cat >/etc/systemd/system/hobbes-dashboard-snapshot.timer <<'EOF'
[Unit]
Description=Run Hobbes dashboard snapshot every 2 minutes

[Timer]
OnBootSec=45s
OnUnitActiveSec=2min
Unit=hobbes-dashboard-snapshot.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now hobbes-dashboard-snapshot.timer
systemctl start hobbes-dashboard-snapshot.service
systemctl status hobbes-dashboard-snapshot.timer --no-pager
