---
name: vision-intake
description: Use when Hobbes needs to inspect photos, screenshots, scans, receipts, IDs, or image-heavy documents; extract text and entities, describe what is visible, and turn visual input into structured notes or follow-up tasks.
---

# Vision Intake

Use this skill for image-first intake.

## What it is for

- photos from Telegram
- screenshots
- receipts and invoices
- business cards
- scans of forms or IDs
- mixed image + text documents

## Core workflow

1. Identify the image type.
2. Extract visible text with OCR if the image contains text.
3. Pull out structured facts:
   - names
   - dates
   - phone numbers
   - addresses
   - amounts
   - document numbers
4. State confidence and ambiguities.
5. Return both:
   - a short human summary
   - a structured fact block

## Output pattern

- `summary`: what is on the image
- `facts`: extracted fields
- `follow_up`: what should be checked manually

## Guardrails

- do not claim exact text when the image is blurry
- flag low-confidence OCR explicitly
- do not store sensitive personal data into durable memory without approval
