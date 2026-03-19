#!/usr/bin/env bash
set -euo pipefail

python3 scripts/remote/hobbes_image_generate.py \
  --prompt "Illustration of a calm blue fox reading documentation at a desk" \
  --model dall-e-3 \
  --size 1024x1024 \
  --delivery url \
  --dry-run \
  --pretty >/tmp/hobbes-image-generate-check.json

grep -q '"mode": "dry_run"' /tmp/hobbes-image-generate-check.json
grep -q '"model": "dall-e-3"' /tmp/hobbes-image-generate-check.json
grep -q '"response_format": "url"' /tmp/hobbes-image-generate-check.json

echo "IMAGE_GENERATION_CHECK_OK"
