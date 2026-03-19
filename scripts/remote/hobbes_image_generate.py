#!/usr/bin/env python3
import argparse
import base64
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_MODEL = os.environ.get("HOBBES_IMAGE_MODEL", "dall-e-3").strip() or "dall-e-3"
DEFAULT_SIZE = os.environ.get("HOBBES_IMAGE_SIZE", "1024x1024").strip() or "1024x1024"
DEFAULT_QUALITY = os.environ.get("HOBBES_IMAGE_QUALITY", "standard").strip() or "standard"
DEFAULT_STYLE = os.environ.get("HOBBES_IMAGE_STYLE", "vivid").strip() or "vivid"
DEFAULT_DELIVERY = os.environ.get("HOBBES_IMAGE_DELIVERY", "url").strip() or "url"
DEFAULT_OUT_DIR = os.environ.get(
    "HOBBES_IMAGE_OUT_DIR",
    "/home/hobbes/.openclaw/artifacts/generated-images",
).strip() or "/home/hobbes/.openclaw/artifacts/generated-images"

DALL_E_3_SIZES = {"1024x1024", "1792x1024", "1024x1792"}


def slugify(value: str) -> str:
    lowered = value.strip().lower()
    lowered = re.sub(r"[^a-z0-9а-яё]+", "-", lowered, flags=re.IGNORECASE)
    lowered = lowered.strip("-")
    return lowered[:80] or "image"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate images for Hobbes via OpenAI Images API.")
    parser.add_argument("--prompt", required=True, help="Image generation prompt")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Image model, defaulting to HOBBES_IMAGE_MODEL or dall-e-3")
    parser.add_argument("--size", default=DEFAULT_SIZE, help="Requested image size")
    parser.add_argument("--quality", default=DEFAULT_QUALITY, help="Image quality")
    parser.add_argument("--style", default=DEFAULT_STYLE, help="Image style")
    parser.add_argument(
        "--delivery",
        default=DEFAULT_DELIVERY,
        choices=["url", "file"],
        help="Return a temporary URL or download a file locally",
    )
    parser.add_argument("--out-dir", default=DEFAULT_OUT_DIR, help="Output directory for downloaded images")
    parser.add_argument("--filename-prefix", default="", help="Optional filename prefix when delivery=file")
    parser.add_argument("--dry-run", action="store_true", help="Print the planned request without calling the API")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")
    return parser.parse_args()


def validate_args(args: argparse.Namespace) -> None:
    if args.model == "dall-e-3" and args.size not in DALL_E_3_SIZES:
        raise ValueError(
            f"dall-e-3 only supports sizes {sorted(DALL_E_3_SIZES)}; got {args.size}"
        )


def build_payload(args: argparse.Namespace) -> dict:
    payload = {
        "model": args.model,
        "prompt": args.prompt,
        "n": 1,
        "size": args.size,
        "quality": args.quality,
    }
    if args.model == "dall-e-3":
        payload["style"] = args.style
    payload["response_format"] = "url" if args.delivery == "url" else "b64_json"
    return payload


def emit(payload: dict, pretty: bool) -> int:
    if pretty:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(payload, ensure_ascii=False))
    return 0


def write_png_from_b64(out_dir: str, filename_prefix: str, prompt: str, b64_value: str) -> str:
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    prefix = filename_prefix.strip() or slugify(prompt)
    timestamp = int(time.time())
    file_path = Path(out_dir) / f"{prefix}-{timestamp}.png"
    file_path.write_bytes(base64.b64decode(b64_value))
    return str(file_path)


def main() -> int:
    args = parse_args()
    try:
        validate_args(args)
    except ValueError as exc:
        return emit({"ok": False, "error": "invalid_arguments", "detail": str(exc)}, args.pretty)

    payload = build_payload(args)
    if args.dry_run:
        return emit(
            {
                "ok": True,
                "mode": "dry_run",
                "model": args.model,
                "delivery": args.delivery,
                "payload": payload,
            },
            args.pretty,
        )

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return emit(
            {
                "ok": False,
                "error": "missing_openai_api_key",
                "detail": "Set OPENAI_API_KEY in the environment before using Hobbes image generation.",
            },
            args.pretty,
        )

    request = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        return emit(
            {
                "ok": False,
                "error": "http_error",
                "status": exc.code,
                "detail": detail,
            },
            args.pretty,
        )
    except Exception as exc:  # noqa: BLE001
        return emit(
            {
                "ok": False,
                "error": "request_failed",
                "detail": str(exc),
            },
            args.pretty,
        )

    item = (data.get("data") or [{}])[0]
    result = {
        "ok": True,
        "model": args.model,
        "delivery": args.delivery,
        "prompt": args.prompt,
        "revised_prompt": item.get("revised_prompt"),
        "image_url": item.get("url"),
        "artifact_path": None,
        "created": data.get("created"),
    }

    if args.delivery == "file":
        b64_value = item.get("b64_json")
        if not isinstance(b64_value, str) or not b64_value:
            return emit(
                {
                    "ok": False,
                    "error": "missing_image_bytes",
                    "detail": "The API response did not include b64_json for file delivery.",
                },
                args.pretty,
            )
        result["artifact_path"] = write_png_from_b64(args.out_dir, args.filename_prefix, args.prompt, b64_value)

    return emit(result, args.pretty)


if __name__ == "__main__":
    sys.exit(main())
