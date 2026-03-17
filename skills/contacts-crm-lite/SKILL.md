---
name: contacts-crm-lite
description: Use when Hobbes needs lightweight contact management, relationship notes, lead status tracking, follow-up suggestions, or simple CRM-like summaries for people and conversations.
---

# Contacts CRM Lite

Use this skill for lightweight people and lead tracking.

## What it is for

- contact cards
- lead stage tracking
- conversation status
- last contact date
- follow-up recommendations

## Core workflow

1. Normalize the person or company record.
2. Track only the minimum useful fields:
   - name
   - role
   - contact channel
   - relationship context
   - last interaction
   - next step
3. Keep notes short and factual.
4. Suggest a follow-up when useful.

## Output pattern

- `contact_summary`
- `current_status`
- `next_action`
- `follow_up_date` when applicable

## Guardrails

- do not turn soft guesses into durable facts
- avoid storing unnecessary sensitive information
- keep CRM notes separate from general memory
