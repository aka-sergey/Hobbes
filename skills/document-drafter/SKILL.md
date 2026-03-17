---
name: document-drafter
description: Use when Hobbes needs to draft polished user-facing or business-facing documents such as proposals, summaries, letters, instructions, briefs, and structured memos.
---

# Document Drafter

Use this skill to turn rough intent into a polished document draft.

## What it is for

- proposals
- letters
- internal memos
- checklists
- briefs
- client-facing drafts

## Core workflow

1. Identify the target audience.
2. Pick the right document shape.
3. Draft the structure first.
4. Fill the content with concise, purposeful language.
5. If needed, hand off to `pdf-workbench` for final PDF rendering.

## Output pattern

- `draft`
- `document_type`
- `audience`
- optional `artifact_path`

## Guardrails

- avoid filler and generic corporate phrasing
- separate assumptions from confirmed facts
- keep reusable templates consistent across similar outputs
