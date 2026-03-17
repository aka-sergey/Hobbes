#!/usr/bin/env bash
set -euo pipefail

test -x /usr/local/bin/hobbes-tavily-search
grep -q '^TAVILY_API_KEY=' /home/hobbes/.openclaw/.env

if grep -q '^TAVILY_API_KEY=$' /home/hobbes/.openclaw/.env; then
  echo "TAVILY_INSTALL_OK_KEY_MISSING"
  exit 0
fi

set -a
. /home/hobbes/.openclaw/.env
set +a

/usr/local/bin/hobbes-tavily-search \
  --query "Latest shipping update in the Strait of Hormuz" \
  --topic news \
  --time-range week \
  --max-results 3 >/tmp/hobbes-tavily-check.json

grep -q '"ok": true' /tmp/hobbes-tavily-check.json
echo "TAVILY_OK"
