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
2. If `TAVILY_API_KEY` is available, prefer Tavily first via `exec` and `hobbes-tavily-search`.
3. Prefer primary or official sources first.
4. Collect a small number of strong sources, not a noisy list.
5. Separate:
   - confirmed facts
   - interpretations
   - conflicting signals
   - open questions
6. Return a short digest with links.
7. If direct search is unavailable, fall back to a small trusted-source sweep with `web_fetch` or `browser` instead of stopping immediately.

## Tavily path

When available, use:

```bash
hobbes-tavily-search --query "<query>" --topic news --time-range week --max-results 5 --pretty
```

Use `topic news` for recent events and `topic general` for broader lookups.

## Fallback sources

When direct search is unavailable, prefer a short sweep of high-signal sources such as:

- Reuters
- AP News
- BBC
- official company or government notices
- regulator or port authority updates when relevant

## Output pattern

- `answer`
- `sources`
- `confidence`
- `open_questions`

## Guardrails

- do not present stale facts as current
- avoid source laundering; say when a claim comes from secondary reporting
- prefer fewer reliable links over many weak ones
- if sources conflict, say so explicitly instead of flattening them into one confident claim
- if sources mention attacks, seizure, shelling, or warnings, do not describe the situation as fully safe or incident-free
