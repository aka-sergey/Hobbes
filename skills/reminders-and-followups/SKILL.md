---
name: reminders-and-followups
description: Use when Hobbes needs to turn user requests into reminders, scheduled follow-ups, recurring nudges, or deadline check-ins delivered back through Telegram or the dashboard.
---

# Reminders And Follow-ups

Use this skill when the user wants to remember something later.

## What it is for

- one-time reminders
- recurring reminders
- follow-up nudges
- deadline check-ins

## Core workflow

1. Normalize the request into:
   - what to remind
   - when
   - where to deliver
2. Confirm timezone and timing if ambiguous.
3. Store the reminder in a durable task table or automation layer.
4. Return a short confirmation with exact date/time.

## Output pattern

- `reminder_text`
- `scheduled_for`
- `delivery_channel`
- `status`

## Guardrails

- never keep vague times like "later" without clarification or an explicit assumption
- always echo the final normalized time back to the user
- reminders should survive gateway restarts and not live only in chat history
