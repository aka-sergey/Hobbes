# Reminder Normalization For `chief`

Use this file when the task is:

- a reminder
- a recurring nudge
- a follow-up check-in
- a deadline ping

Normalize into:

- `reminder_text`
- `due_at`
- `timezone`
- `recurrence`
- `delivery_channel`
- `schedule_status`

Rules:

- never leave the final time as "later" or another vague phrase
- if needed, ask one short follow-up for the missing time signal
- echo the final normalized date and time clearly
- if no verified scheduler has stored the reminder yet, mark it as not fully scheduled
