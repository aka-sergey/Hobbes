#!/usr/bin/env bash
set -euo pipefail

router="${1:-/usr/local/bin/hobbes-search-router}"
test -f "$router"

hotel_json="$(python3 "$router" --query "найди отель до 12000 рублей в сутки в подмосковье на двух человек и ребенка до 3-х лет на период с 10 по 17 апреля")"
clinic_json="$(python3 "$router" --query "Найди в интернете стоматологию рядом с метро водный стадион")"
news_json="$(python3 "$router" --query "Найди последние новости по танкерам в Ормузском проливе")"
pc_json="$(python3 "$router" --query "сколько рублей будет стоить такая конфигурация ПК: Материнская плата ASRock X870 LiveMixer WiFi Процессор AMD Ryzen 7 7800X3D Видеокарта NVIDIA GeForce RTX 4080 Super Оперативная память 64 ГБ DDR5-6000 NVMe SSD 1 ТБ Samsung 990 Pro Блок питания Corsair HX1500i 1500W")"

python3 - <<'PY' "$hotel_json" "$clinic_json" "$news_json" "$pc_json"
import json
import sys

hotel = json.loads(sys.argv[1])
clinic = json.loads(sys.argv[2])
news = json.loads(sys.argv[3])
pc = json.loads(sys.argv[4])

assert hotel["detected_type"] == "travel_booking", hotel
assert hotel["preferred_agent"] == "bookingprep", hotel
assert clinic["detected_type"] == "local_maps", clinic
assert clinic["preferred_agent"] == "research", clinic
assert news["detected_type"] == "news_current", news
assert news["preferred_backend"] == "tavily_news", news
assert pc["detected_type"] == "shopping_product", pc
assert pc["preferred_agent"] == "research", pc
assert pc["preferred_backend"] == "product_merchant", pc

print("SEARCH_ROUTER_OK")
PY
