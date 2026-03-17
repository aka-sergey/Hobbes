---
name: web-research
description: Use when Hobbes needs to search the internet, compare sources, verify recent information, and produce a concise source-grounded digest with links and caveats.
---

# Web Research

Use this skill for current external information.

## What it is for

- quick market scans
- recent news or updates
- tool comparisons
- source-grounded summaries
- link-backed fact checks

## Core workflow

1. Define the question in one sentence.
2. Prefer primary or official sources first.
3. Collect a small number of strong sources, not a noisy list.
4. Separate:
   - confirmed facts
   - interpretations
   - open questions
5. Return a short digest with links.

## Output pattern

- `answer`
- `sources`
- `confidence`
- `open_questions`

## Guardrails

- do not present stale facts as current
- avoid source laundering; say when a claim comes from secondary reporting
- prefer fewer reliable links over many weak ones
