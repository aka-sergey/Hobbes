# Tavily Integration Plan

## Goal

Add a stable external search backend for Hobbes current-info tasks without depending on Brave Search.

## Why Tavily

- good fit for agentic research
- stable dedicated search layer
- independent from the future LLM move to OpenRouter
- better operational fit than prompt-only browsing fallback

## Installed components

- local helper: `/usr/local/bin/hobbes-tavily-search`
- repo source: [hobbes_tavily_search.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_tavily_search.py)
- installer: [setup_tavily_integration.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/setup_tavily_integration.sh)
- check script: [check_tavily_integration.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_tavily_integration.sh)

## Runtime behavior

1. `main` routes current-info tasks to `chief`
2. `chief` routes them to `research`
3. `research` prefers Tavily through the local helper when `TAVILY_API_KEY` is present
4. if Tavily is not available, `research` falls back to trusted-source browsing

## Production policy

- built-in `web_search` / Brave-style search is deprecated for Hobbes production routing
- `main` must not use direct `web_search` for user-facing current-info tasks
- `chief` must not use direct `web_search` or invent article URLs for `web_fetch`
- `research` is the only current-info workhorse and should start with Tavily
- if internal `chief` / `research` sessions become polluted with old routing behavior, reset those internal sessions after a backup rather than resetting the user's Telegram chat

## Remaining requirement

To complete live Tavily use on the VPS, set:

```bash
TAVILY_API_KEY=tvly-...
```

inside:

```bash
/home/hobbes/.openclaw/.env
```
