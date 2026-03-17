---
name: voice-notes
description: Use when Hobbes receives or sends voice messages, including transcription, extracting tasks from audio, summarizing spoken content, and preparing concise voice-ready replies.
---

# Voice Notes

Use this skill for spoken audio in Telegram.

## What it is for

- transcribe voice messages
- summarize spoken notes
- extract tasks from audio
- prepare short voice-ready reply drafts

## Core workflow

1. Detect the audio type and language if possible.
2. Transcribe first.
3. Convert the transcript into:
   - clean text
   - key points
   - tasks or reminders if requested
4. If replying by voice, produce a short spoken-style script.

## Output pattern

- `transcript`
- `summary`
- `action_items`
- optional `voice_reply_script`

## Guardrails

- distinguish transcript from interpretation
- if the audio is low quality, say so
- do not silently drop audio failures; surface them as operational issues
