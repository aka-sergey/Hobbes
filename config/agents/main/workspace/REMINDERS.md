# Reminder Intake For `main`

Treat reminder and follow-up requests as structured work, not casual chat.

Capture:

- `reminder_text`
- `due_at`
- `timezone`
- `recurrence`
- `delivery_channel`
- `schedule_status`

Rules:

- if the request is missing a precise time, ask one concise follow-up
- if the user gives a relative time, restate the normalized final date and time in the reply
- route normalized reminder work through `chief`
- do not claim a reminder is durably scheduled unless the scheduler path actually confirms it
- if scheduling is not yet confirmed, say so plainly
