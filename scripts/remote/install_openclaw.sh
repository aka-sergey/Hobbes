#!/usr/bin/env bash
set -euo pipefail

rm -rf /usr/lib/node_modules/openclaw /usr/local/lib/node_modules/openclaw /usr/bin/openclaw /usr/local/bin/openclaw
rm -f /root/openclaw-install.log /root/openclaw-install.exit

nohup bash -lc 'npm install -g openclaw@latest > /root/openclaw-install.log 2>&1; echo $? > /root/openclaw-install.exit' >/dev/null 2>&1 &
echo "$!" > /root/openclaw-install.pid
echo "STARTED:$(cat /root/openclaw-install.pid)"
