#!/usr/bin/env bash
set -euo pipefail

router="${1:-/usr/local/bin/hobbes-search-router}"

test -x "$router"

hotel_json="$("$router" --query "найди отель до 12000 рублей в сутки в подмосковье на двух человек и ребенка до 3-х лет на период с 10 по 17 апреля")"
clinic_json="$("$router" --query "Найди в интернете стоматологию рядом с метро водный стадион")"
news_json="$("$router" --query "Найди последние новости по танкерам в Ормузском проливе")"

python3 - <<'PY' "$hotel_json" "$clinic_json" "$news_json"
import json
import sys

hotel = json.loads(sys.argv[1])
clinic = json.loads(sys.argv[2])
news = json.loads(sys.argv[3])

assert hotel["detected_type"] == "travel_booking", hotel
assert hotel["preferred_agent"] == "bookingprep", hotel
assert clinic["detected_type"] == "local_maps", clinic
assert clinic["preferred_agent"] == "research", clinic
assert news["detected_type"] == "news_current", news
assert news["preferred_backend"] == "tavily_news", news

print("SEARCH_ROUTER_OK")
PY
