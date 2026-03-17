# Search Router Implementation

This document describes the Hobbes production search router layer.

## Goal

Stop treating every search-like request as the same class of work.

The router now classifies the user request first and only then chooses the right agent and backend strategy.

## Runtime helper

The local helper is:

- `/usr/local/bin/hobbes-search-router`

Source in repo:

- [hobbes_search_router.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_search_router.py)

Example:

```bash
hobbes-search-router --query "Найди стоматологии рядом с метро Водный стадион" --pretty
```

## Current mapping

| detected_type | preferred_agent | preferred_backend |
| --- | --- | --- |
| `news_current` | `research` | `tavily_news` |
| `general_research` | `research` | `tavily_general` |
| `official_lookup` | `research` | `official_navigational` |
| `technical_docs` | `research` | `docs_first` |
| `troubleshooting` | `research` | `docs_issues_forum` |
| `law_policy` | `research` | `official_policy` |
| `finance_market` | `research` | `finance_structured` |
| `local_maps` | `research` | `directory_maps` |
| `travel_booking` | `bookingprep` | `travel_booking` |
| `shopping_product` | `research` | `product_merchant` |
| `community_reviews` | `research` | `forums_reviews` |
| `media_search` | `research` | `media_search` |
| `people_company_lookup` | `research` | `entity_lookup` |
| `internal_source_search` | `research` | `internal_sources_first` |

## Why this matters

Before this layer:

- local business requests were treated like generic web research
- hotel searches were treated like normal web pages and failed on anti-bot pages
- news and mixed-evidence searches could collapse into overly confident summaries

After this layer:

- `chief` should classify the search task first
- `local_maps` should go to `research` with directory-first constraints
- `travel_booking` should go to `bookingprep` with dates, guests, budget, and provider-domain bias
- `news_current` should go to Tavily-backed fresh research

## Dashboard visibility

Search cards now expose router metadata:

- `routeType`
- `preferredBackend`
- `preferredAgent`

This should make it easier to debug whether a bad answer came from:

1. wrong classification
2. right classification but weak backend results
3. right backend but poor synthesis

## Current checkpoint

Detailed checkpoint:

- [Search_Current_State_2026-03-18.md](/Users/sergeysobolev/HobbesCodex/docs/Search_Current_State_2026-03-18.md)

Important current reality:

- the router baseline is implemented and rolled out
- `travel_booking` and `local_maps` are still the weakest verticals
- the next improvement should target backend selection per route, not generic prompt tuning
