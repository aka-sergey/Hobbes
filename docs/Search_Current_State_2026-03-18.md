# Search Current State

Date:

- `2026-03-18`

Purpose:

- capture the real current state of Hobbes search and routing
- record what is already improved
- record what is still weak
- make the next engineering step obvious

## Executive summary

Search is no longer a single generic web-research path.

Hobbes now has a first production-ready `category-aware search router` layer:

- `news_current`
- `general_research`
- `official_lookup`
- `local_maps`
- `travel_booking`
- `shopping_product`
- `finance_market`
- `law_policy`
- `technical_docs`
- `troubleshooting`
- `community_reviews`
- `media_search`
- `people_company_lookup`
- `internal_source_search`

This is a real architectural improvement over the earlier state where:

- `chief` improvised the search class
- `research` mixed current-info and directory work
- hotel searches were treated like normal web pages
- local business lookup degraded into generic advice

The system is now in a better place structurally, but search quality is still uneven.

Current honest state:

- routing architecture: improved a lot
- search backend baseline: usable
- search answer quality: mixed
- travel and local-business retrieval: still not strong enough

## What changed

### 1. Search router added

New local helper:

- [hobbes_search_router.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_search_router.py)

What it does:

- classifies the user query
- returns:
  - `detected_type`
  - `preferred_agent`
  - `preferred_backend`
  - `fallback_backend`
  - `recommended_domains`
  - `needs_structured_filters`

Confirmed local examples:

- hotel request with dates/budget/child -> `travel_booking`
- clinic near metro -> `local_maps`
- latest tanker news -> `news_current`

Local verification result:

- `SEARCH_ROUTER_OK`

### 2. Agent contracts updated

Updated:

- [AGENTS.md](/Users/sergeysobolev/HobbesCodex/config/agents/main/workspace/AGENTS.md)
- [TOOLS.md](/Users/sergeysobolev/HobbesCodex/config/agents/main/workspace/TOOLS.md)
- [AGENTS.md](/Users/sergeysobolev/HobbesCodex/config/agents/chief/workspace/AGENTS.md)
- [TOOLS.md](/Users/sergeysobolev/HobbesCodex/config/agents/chief/workspace/TOOLS.md)
- [AGENTS.md](/Users/sergeysobolev/HobbesCodex/config/agents/research/workspace/AGENTS.md)
- [TOOLS.md](/Users/sergeysobolev/HobbesCodex/config/agents/research/workspace/TOOLS.md)
- [AGENTS.md](/Users/sergeysobolev/HobbesCodex/config/agents/booking/workspace/AGENTS.md)
- [TOOLS.md](/Users/sergeysobolev/HobbesCodex/config/agents/booking/workspace/TOOLS.md)

Behavioral shift:

- `main` is the Telegram entrypoint only
- `chief` is now the intended search-router entrypoint
- `research` owns `news_current`, `general_research`, `official_lookup`, `technical_docs`, `troubleshooting`, `law_policy`, `finance_market`, `local_maps`
- `bookingprep` owns `travel_booking`

### 3. Dashboard search metadata extended

Updated:

- [page.tsx](/Users/sergeysobolev/HobbesCodex/dashboard-mvp/app/page.tsx)
- [route.ts](/Users/sergeysobolev/HobbesCodex/dashboard-mvp/app/api/ingest/route.ts)
- [types.ts](/Users/sergeysobolev/HobbesCodex/dashboard-mvp/lib/types.ts)
- [hobbes_dashboard_snapshot.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_dashboard_snapshot.sh)

Dashboard search cards can now carry:

- `routeType`
- `preferredBackend`
- `preferredAgent`

Goal:

- make search debugging observable
- stop guessing whether the failure is:
  - wrong route selection
  - weak backend results
  - weak synthesis

## What is working better now

### Current-info/news

Compared to earlier state:

- the system is no longer tied to `Brave`
- `Tavily-first` is established
- obvious provider-dead-end answers improved
- search quality for recent-news style questions is better than before

### Architecture

The biggest improvement is not “search results are perfect”.
It is this:

- the search path is now explicit
- query type is now a first-class concern
- search can now be improved per route instead of blindly tuning one generic flow

This is the main reason the system is in a recoverable state.

## What is still weak

### 1. Travel / hotel search is still only partially good

Real Telegram test showed improvement, but still not enough.

Observed behavior:

- bot returned concrete links instead of pure homepage-only fluff
- but option quality is still unreliable
- some results are weakly grounded
- availability/price/family constraints are not yet consistently verified

Why:

- large booking providers block scraping
- provider listing pages are anti-bot heavy
- we still do not have a dedicated travel API
- “searching hotels” is not the same thing as “summarizing web sources”

Current verdict:

- better than before
- still below production-quality expectation

### 2. Local business search is still mixed

Real Telegram test for dental clinics near `Vodny Stadion` improved in form:

- it now returns concrete candidates instead of pure “go to 2GIS yourself”

But still weak in substance:

- ranking confidence is unclear
- data freshness is unclear
- no strong structured validation layer for address/phone/hours
- this is still not equal to a real maps/directory integration

Current verdict:

- better than before
- not yet trustworthy enough for “serious local search”

### 3. Search quality is still source-shape dependent

Good:

- news
- general research
- official-ish lookup
- known-site lookup

Weak:

- local directories
- hotels / travel
- deeply structured commerce-style retrieval

## Root cause analysis

### What we fixed

We fixed the biggest architecture bug:

- trying to solve all search tasks with one generic research flow

### What remains

The remaining problem is not only prompt quality.
It is retrieval mismatch.

Examples:

- `news_current` wants freshness and strong reporting
- `local_maps` wants directory data and geography
- `travel_booking` wants dates, guests, budget, child policy, price, listing validity

These are different products, not just different prompts.

## Production limitations right now

### 1. `openclaw agent --local --agent chief` is still not a reliable test harness

Observed on VPS:

- `Error: Unknown agent id "chief"`

Meaning:

- bounded synthetic verification through this CLI path is still not reliable for internal agents
- the most honest verification path remains:
  - live Telegram
  - session traces
  - dashboard

This is a known runtime/harness limitation, not a search-router design problem.

### 2. Gateway readiness is slower than ideal after restarts

Observed:

- `openclaw-gateway.service` becomes `active (running)` before `127.0.0.1:18792` is ready

Meaning:

- health checks need a warm-up window
- instant post-restart curl checks may fail even when startup is still progressing normally

### 3. Dashboard search visibility is improved but not complete

Current state:

- Railway dashboard is live
- search card model now supports route metadata
- a fresh snapshot from VPS was accepted

But:

- the dashboard may still show an older overview until the next relevant search sessions are captured
- search visibility is still based on inferred session parsing, not full structured execution logs

## VPS state at this checkpoint

Relevant operational facts:

- `openclaw-gateway.service` restarted successfully after router rollout
- router helper was installed at:
  - `/usr/local/bin/hobbes-search-router`
- router install verification on VPS passed:
  - `SEARCH_ROUTER_OK`
- dashboard snapshot service succeeded after rollout through:
  - `hobbes-dashboard-snapshot.service`

Backup made during this checkpoint:

- `/root/search-router-rollout-20260317-232717`

Earlier related backup:

- `/root/openclaw-routing-fix-20260317-224517`

## Git / repo status at this checkpoint

Committed and pushed:

- commit `3a3e3d8`
- message: `Add category-aware search router`

Core files added:

- [hobbes_search_router.py](/Users/sergeysobolev/HobbesCodex/scripts/remote/hobbes_search_router.py)
- [check_search_router.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/check_search_router.sh)
- [setup_search_router.sh](/Users/sergeysobolev/HobbesCodex/scripts/remote/setup_search_router.sh)
- [Search_Router_Taxonomy.md](/Users/sergeysobolev/HobbesCodex/docs/Search_Router_Taxonomy.md)
- [Search_Router_Implementation.md](/Users/sergeysobolev/HobbesCodex/docs/Search_Router_Implementation.md)

## Where we stopped

We stopped at this exact point:

1. search-router baseline is implemented
2. contracts are updated
3. VPS rollout is applied
4. dashboard redeploy is done
5. early live tests show:
   - architecture improved
   - results better
   - but `travel_booking` and `local_maps` are still not strong enough

So this is not a “done” state.
This is a clean engineering checkpoint.

## Most important open issues

1. `travel_booking` still needs a stronger provider strategy.
Current state is better than before, but still not reliable enough.

2. `local_maps` needs directory-grade data quality, not just search-grade data quality.

3. Search answer synthesis must still get stricter about:
   - confidence
   - structured fields
   - explicit `unverified` marks

4. Dashboard search telemetry should ideally move from inferred parsing to more structured router event emission.

5. We still need to decide whether to add:
   - Yandex.XML for RU navigational/official web lookup
   - Yandex Places / Organization Search for RU local business
   - a dedicated travel/search provider for accommodation

## Recommended next step

Do not try to “tune the whole search system at once”.

The best next step is:

1. define backend selection by route
2. keep `Tavily` for `news_current` and `general_research`
3. decide a real backend for `local_maps`
4. decide a real backend for `travel_booking`

Most likely future shape:

- `news_current` -> Tavily
- `general_research` -> Tavily
- `official_lookup` -> Tavily plus optional RU navigational search
- `local_maps` -> directory/maps backend
- `travel_booking` -> booking/travel-specific backend

## Honest verdict

Search is no longer “blind and crooked in one generic way”.

Now it is:

- architecturally much healthier
- operationally more debuggable
- still incomplete for the two hardest verticals:
  - local business
  - travel/accommodation

That is good progress, but not the finish line.
