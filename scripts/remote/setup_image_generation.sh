#!/usr/bin/env bash
set -euo pipefail

install -d -m 755 /home/hobbes/.openclaw/artifacts/generated-images
install -m 755 scripts/remote/hobbes_image_generate.py /usr/local/bin/hobbes-image-generate
chown -R hobbes:hobbes /home/hobbes/.openclaw/artifacts/generated-images

if [[ -f /home/hobbes/.openclaw/.env ]]; then
  if ! grep -q '^HOBBES_IMAGE_MODEL=' /home/hobbes/.openclaw/.env; then
    cat >>/home/hobbes/.openclaw/.env <<'EOF'
HOBBES_IMAGE_MODEL=dall-e-3
HOBBES_IMAGE_SIZE=1024x1024
HOBBES_IMAGE_QUALITY=standard
HOBBES_IMAGE_STYLE=vivid
HOBBES_IMAGE_DELIVERY=url
HOBBES_IMAGE_OUT_DIR=/home/hobbes/.openclaw/artifacts/generated-images
EOF
  fi
else
  cat >/home/hobbes/.openclaw/.env <<'EOF'
HOBBES_IMAGE_MODEL=dall-e-3
HOBBES_IMAGE_SIZE=1024x1024
HOBBES_IMAGE_QUALITY=standard
HOBBES_IMAGE_STYLE=vivid
HOBBES_IMAGE_DELIVERY=url
HOBBES_IMAGE_OUT_DIR=/home/hobbes/.openclaw/artifacts/generated-images
EOF
fi

chown hobbes:hobbes /home/hobbes/.openclaw/.env
chmod 600 /home/hobbes/.openclaw/.env

echo "IMAGE_GENERATION_SETUP_OK"
