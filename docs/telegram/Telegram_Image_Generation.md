# Telegram Image Generation

## Purpose

Add image generation to Hobbes through the existing Telegram routing stack without pretending that every transport detail is already solved.

The intended path is:

1. `main`
2. `chief`
3. `research`
4. local helper `hobbes-image-generate`
5. final Telegram-facing answer with the generated image URL or saved artifact path

## Current design

Hobbes now treats explicit generation requests such as:

- `сгенерируй картинку`
- `нарисуй`
- `сделай постер`
- `сделай баннер`
- `generate an image`

as a separate capability from:

- screenshot intake
- receipt OCR
- PDF extraction
- current-info research

This avoids the old failure mode where every image-related request was interpreted only as visual inspection.

It should also treat the immediate follow-up turn as part of the same image-generation request when the bot has just asked for clarification. For example:

1. user: `сделай картинку с грецким орехом`
2. bot: asks whether a photo / illustration / close-up is wanted
3. user: `грецкий орех разломанный пополам, крупный кадр, сочные краски`

In that third step, the short visual fragment must still route to image generation instead of falling back to ordinary chat.

## Runtime helper

The generation helper is:

- [`hobbes_image_generate.py`](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_image_generate.py)

Installation script:

- [`setup_image_generation.sh`](/Users/sergeysobolev/HobbesCodex/scripts/remote/setup_image_generation.sh)

Dry-run check:

- [`check_image_generation.sh`](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_image_generation.sh)

Installed VPS path:

- `/usr/local/bin/hobbes-image-generate`

## Model choice

Current default:

- `dall-e-3`

Reason:

- Sergey explicitly requested a DALL·E-based path for Telegram image generation.

Important reality:

- according to the official OpenAI deprecations page, `dall-e-3` is deprecated and scheduled for removal on `2026-05-12`
- the recommended replacement is `gpt-image-1` or `gpt-image-1-mini`

So the safe posture is:

- use `dall-e-3` now because it was explicitly requested
- keep the model configurable through `HOBBES_IMAGE_MODEL`
- plan a switch later instead of hard-coding DALL·E permanently

## Environment variables

Suggested runtime variables:

- `OPENAI_API_KEY`
- `HOBBES_IMAGE_MODEL=dall-e-3`
- `HOBBES_IMAGE_SIZE=1024x1024`
- `HOBBES_IMAGE_QUALITY=standard`
- `HOBBES_IMAGE_STYLE=vivid`
- `HOBBES_IMAGE_DELIVERY=url`
- `HOBBES_IMAGE_OUT_DIR=/home/hobbes/.openclaw/artifacts/generated-images`

## Delivery behavior

Current baseline:

- if delivery mode is `url`, Hobbes can return a generated image URL in Telegram
- if delivery mode is `file`, Hobbes can save a PNG artifact on the VPS

Important limitation:

- the current baseline does **not** claim that Hobbes will always attach the binary image directly into the Telegram chat
- the transport path for direct attachment should be treated as a separate improvement unless live validation proves it

## Expected artifact shape

Recommended artifact type:

- `generated_image_bundle`

Suggested fields:

- `artifact_type`
- `artifact_title`
- `artifact_status`
- `artifact_summary`
- `artifact_path`
- `linked_run_id`
- `produced_by`
- `handoff_target`

Optional payload fields:

- `image_url`
- `model`
- `prompt`
- `revised_prompt`

## Minimal operator test

1. Ask Hobbes in Telegram:
   - `Сгенерируй картинку: синий лис читает документацию за столом, уютный стиль`
2. Confirm the reply does not say search is unavailable.
3. Confirm the reply contains either:
   - a valid image URL
   - or a real artifact path
4. If the URL path works but direct attachment is still missing, treat the helper as working and the transport as the remaining gap.
