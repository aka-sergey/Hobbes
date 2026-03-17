#!/usr/bin/env bash
set -euo pipefail

echo "===PID==="
cat /root/openclaw-install.pid 2>/dev/null || true
echo "===EXIT==="
cat /root/openclaw-install.exit 2>/dev/null || true
echo "===TAIL==="
tail -n 80 /root/openclaw-install.log 2>/dev/null || true
echo "===BIN==="
command -v openclaw || true
openclaw --version 2>/dev/null || true
