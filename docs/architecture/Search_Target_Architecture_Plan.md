# Search Target Architecture Plan

Date:

- `2026-03-20`

Purpose:

- define the target search architecture for Hobbes based on the current routed baseline
- turn the current search checkpoint into an implementation program
- make the next phases explicit, testable, and incremental

## Executive summary

Hobbes search should not evolve into "one better web search prompt."

It should evolve into a layered system:

1. `main` accepts the request
2. `chief` classifies the request through the search router
3. the correct specialist adapter performs retrieval
4. a normalizer/verifier turns raw results into structured candidate data
5. `comms` or the caller produces a concise human-facing answer

The current architecture already has the most important first step:

- a category-aware router
- explicit route types
- route-aware agent ownership
- a Tavily-first backbone for news and general research

The remaining problem is retrieval mismatch.

The search experience still feels non-human when Hobbes treats:

- hotels like normal web pages
- local business lookup like generic search summaries
- product pricing like general research
- mixed evidence like a single confident answer

So the target architecture is:

- `Tavily` remains the backbone for web research
- `Yandex` is added for Russian web and local business cases
- merchant-first and travel-first adapters become first-class search backends
- search results become structured artifacts, not only prose
- dashboard observability becomes route-aware and backend-aware

## Current baseline

Relevant current state:

- [Search_Current_State_2026-03-18.md](/Users/sergeysobolev/HobbesCodex/docs/current-state/Search_Current_State_2026-03-18.md)
- [Search_Router_Implementation.md](/Users/sergeysobolev/HobbesCodex/docs/architecture/Search_Router_Implementation.md)
- [Search_Router_Taxonomy.md](/Users/sergeysobolev/HobbesCodex/docs/architecture/Search_Router_Taxonomy.md)

What already exists:

- `main -> chief -> research / bookingprep`
- `hobbes-search-router`
- `Tavily-first` baseline for current-info / research tasks
- dashboard route metadata:
  - `routeType`
  - `preferredBackend`
  - `preferredAgent`

What is still weak:

- `local_maps`
- `shopping_product`
- `travel_booking`
- inconsistent structured verification
- missing backend-specific answer shaping

## Target principles

### 1. One route type, one backend strategy

Do not let agents improvise retrieval strategy when the route type is already known.

### 2. Retrieval is not the same as answering

The system should distinguish:

- retrieval
- normalization
- verification
- final delivery

### 3. Source quality beats clever prose

If retrieval is weak, the answer should become narrower and more honest.
The system should not compensate with confident filler.

### 4. Local search, shopping, and travel are vertical products

They should not be treated as "generic web search with a better prompt."

### 5. Search must be observable

For every search-heavy request, the dashboard should make it obvious:

- what route was selected
- which backend was used
- whether fallback was used
- what sources were accepted
- what fields were actually verified

## Target layered architecture

### Layer 1. User intake

Owner:

- `main`

Responsibilities:

- accept the Telegram request
- preserve user wording
- keep context minimal and accurate
- send search-heavy work to `chief`

### Layer 2. Search routing

Owner:

- `chief`

Responsibilities:

- call `hobbes-search-router`
- classify the request
- pass route hints downstream
- choose the correct agent and backend strategy

Required route hints:

- `detected_type`
- `preferred_agent`
- `preferred_backend`
- `fallback_backend`
- `recommended_domains`
- `needs_structured_filters`

### Layer 3. Backend adapters

Owner:

- `research` for general/source-backed lookup
- `bookingprep` for travel/accommodation

The system should expose adapter-specific logic, not one generic search flow.

### Layer 4. Normalizer and verifier

Owners:

- `research`
- `bookingprep`

Responsibilities:

- dedupe
- rank
- convert raw hits into structured candidates
- mark missing or unverified fields
- separate:
  - confirmed
  - mixed
  - missing

### Layer 5. User-facing synthesis

Owners:

- `comms` when Telegram polish is needed
- or `main` when the upstream answer is already user-ready

Responsibilities:

- present a short useful answer
- keep links visible
- never hide uncertainty

## Target backend matrix

| route type | primary backend | secondary backend | notes |
| --- | --- | --- | --- |
| `news_current` | `tavily_news` | `openai_web_search` or trusted-source fetch | freshness-first |
| `general_research` | `tavily_general` | trusted-source fetch | source-backed summaries |
| `official_lookup` | `tavily_general` + domain bias | `yandex_xml` | navigational and official pages |
| `technical_docs` | docs-first | Tavily | docs > blogs |
| `troubleshooting` | docs/issues/forums | Tavily | explicit fix/workaround shape |
| `finance_market` | finance-specific structured sources | Tavily | avoid generic prose-only answers |
| `law_policy` | official sources only | trusted-source fetch | no low-signal summaries |
| `local_maps` | `yandex_local` | Tavily-discovered directory pages | names/addresses/phones/hours |
| `shopping_product` | `merchant_product` | Tavily-discovered merchant pages | price-first, merchant-first |
| `travel_booking` | `travel_booking_adapter` | provider-filtered link fallback | dates/guests/budget/family constraints |
| `community_reviews` | forums/review sources | Tavily | sentiment separated from facts |
| `media_search` | media-specific search flow | Tavily | images/videos/presentations |
| `people_company_lookup` | entity lookup | official sites | company/person basics |
| `internal_source_search` | internal sources | none | repo/files/connectors first |

## Adapter design

### A. `tavily_general` / `tavily_news`

Use for:

- fresh news
- broad research
- official candidate discovery
- source discovery

Responsibilities:

- discover candidate URLs
- rank stronger domains higher
- return a source list, not only the Tavily answer blob
- mark evidence as mixed when sources conflict

### B. `yandex_local`

Use for:

- clinics
- restaurants
- services near metro
- shops with phone/address/hours

Responsibilities:

- geosearch / organization lookup
- proximity-aware results
- return listing-grade fields:
  - `name`
  - `address`
  - `phone`
  - `hours`
  - `map_link`
  - `official_site`
  - `rating`
  - `rating_source`

Important:

- this is not a replacement for Tavily
- this is a route-specific adapter for `local_maps`

### C. `merchant_product`

Use for:

- prices
- parts lists
- electronics
- "сколько стоит"
- "подбери по цене"

Primary domains at baseline:

- `dns-shop.ru`
- `citilink.ru`
- `market.yandex.ru`
- `ozon.ru`
- `onlinetrade.ru`
- `regard.ru`

Responsibilities:

- discover concrete product/listing pages
- extract visible price signals
- keep seller/source links
- dedupe near-identical products
- label stale/unverified pricing

### D. `travel_booking_adapter`

Use for:

- hotels
- apartments
- cabins
- family stays
- filtered accommodation lookup

Structured filters:

- location
- date range
- adults
- children
- child age if known
- nightly budget
- accommodation type
- must-have features

Responsibilities:

- bias toward booking providers
- generate filtered provider links when direct listing extraction is blocked
- return candidate stays when possible
- explicitly mark:
  - `price_unverified`
  - `availability_unverified`
  - `provider_only_link`

## Structured result contracts

### Shared search artifact contract

Every search-heavy route should return an artifact with:

- `artifact_type`
- `artifact_status`
- `artifact_summary`
- `produced_by`
- `route_type`
- `backend_used`
- `fallback_used`
- `sources`
- `candidates`

### Candidate schema for `local_maps`

- `name`
- `address`
- `phone`
- `hours`
- `link`
- `map_link`
- `official_site`
- `rating`
- `rating_source`
- `confidence`
- `verified_fields`

### Candidate schema for `shopping_product`

- `title`
- `merchant`
- `url`
- `price`
- `price_currency`
- `price_verified`
- `availability`
- `availability_verified`
- `model_match_confidence`
- `notes`

### Candidate schema for `travel_booking`

- `property_name`
- `provider`
- `provider_url`
- `location_text`
- `nightly_price`
- `price_currency`
- `price_verified`
- `availability_verified`
- `guest_fit`
- `family_fit_notes`
- `must_have_match`
- `notes`

## Answer shapes

### For local business

Target answer:

- one-line summary
- 3 to 5 concrete options
- each option includes:
  - name
  - address
  - phone if available
  - link

### For product pricing

Target answer:

- one-line budget summary
- per item or per bundle:
  - visible price range
  - merchant links
  - note if exact price was not confirmed

### For travel

Target answer:

- one-line fit summary
- 3 to 5 candidate options or provider-filtered links
- explicit notes about:
  - price not confirmed
  - availability not confirmed
  - child policy not confirmed

### For news/current info

Target answer:

- one short synthesis paragraph
- 2 to 4 strong links
- explicit mention of mixed evidence when relevant

## Observability target

Dashboard should show for each routed search:

- `routeType`
- `backendUsed`
- `fallbackBackend`
- `preferredAgent`
- `latencyMs`
- `sourceCount`
- `candidateCount`
- `verifiedFieldCount`
- `errorClass`
- `finalOutcome`

Recommended final outcomes:

- `success_verified`
- `success_partially_verified`
- `fallback_used`
- `no_candidates`
- `backend_error`
- `policy_blocked`

## Phase S1: Local and Product Search

### Goal

Make `local_maps` and `shopping_product` feel useful and concrete in Telegram.

### Why this comes first

These are currently the most obviously non-human cases in the user experience.

### Deliverables

- `yandex_local` adapter
- `merchant_product` adapter
- route-aware normalization for both classes
- dashboard route/backend/result counters

### Implementable tasks

#### S1.1 Add adapter interface

- create a backend adapter contract under `scripts/remote/` or `config/`
- standardize adapter output:
  - `backend_used`
  - `raw_hits`
  - `normalized_candidates`
  - `verification_notes`

#### S1.2 Add `yandex_local` adapter

- add Yandex local/org search integration
- support:
  - free-text place query
  - optional district/metro bias
  - optional coordinates later
- normalize fields into `local_lookup_table`

#### S1.3 Add `merchant_product` adapter

- implement merchant-domain-first discovery
- accept:
  - single product query
  - bundle / parts-list query
- return price signals and source links per candidate

#### S1.4 Upgrade router hints

- make router explicitly emit:
  - `needs_price_extraction`
  - `needs_listing_fields`
  - `needs_bundle_mode`
  - `needs_location_bias`

#### S1.5 Upgrade `research`

- when route is `local_maps`, use `yandex_local` first
- when route is `shopping_product`, use `merchant_product` first
- only use Tavily as discovery fallback, not the first and only strategy

#### S1.6 Add answer templates

- local business answer template
- product pricing answer template
- require explicit `not confirmed` markers

#### S1.7 Dashboard visibility

- add local/product specific result cards
- show:
  - verified fields
  - extracted price count
  - candidate count
  - fallback use

### Acceptance criteria

- clinic near metro returns 3 to 5 concrete candidates with address/phone/link
- product price query returns merchant links and visible price ranges
- bot no longer answers with "посмотрите сами в DNS/2GIS"
- dashboard shows route and backend used

## Phase S2: Travel Booking Search

### Goal

Turn `travel_booking` into a structured accommodation workflow instead of generic search.

### Deliverables

- travel filter normalizer
- provider-aware adapter
- booking result schema
- clearer uncertainty handling

### Implementable tasks

#### S2.1 Build travel filter parser

- extract:
  - destination
  - dates
  - adults
  - children
  - child age
  - nightly budget
  - accommodation type
  - must-have features

#### S2.2 Add `travel_booking_adapter`

- bias toward provider pages and filtered result links
- support at minimum:
  - Booking-like flows
  - marketplace/family-stay flows
- do not pretend availability is verified if it is not

#### S2.3 Upgrade `bookingprep`

- make `bookingprep` return:
  - candidate options when possible
  - otherwise provider-filtered links
- make it strict about `price_verified` and `availability_verified`

#### S2.4 Add provider notes

- mark anti-bot/provider limitations explicitly
- prefer narrowed useful answers over generic travel advice

#### S2.5 Add travel answer template

- compact summary
- 3 to 5 options or filtered links
- explicit notes for:
  - price not verified
  - family fit not verified
  - availability not verified

#### S2.6 Dashboard travel instrumentation

- route type
- filter set completeness
- provider count
- candidate count
- verification coverage

### Acceptance criteria

- hotel queries with dates/budget/child no longer degrade into homepage-only links
- answers clearly distinguish:
  - actual candidates
  - filtered provider links
  - unverified availability

## Phase S3: Quality, Ranking, and Evidence Discipline

### Goal

Make search answers feel trustworthy, not merely non-empty.

### Deliverables

- ranking layer
- source-quality policy
- contradiction handling
- evidence-first summaries

### Implementable tasks

#### S3.1 Add ranking policy per route

- stronger domains get higher weight
- duplicates and mirrors penalized
- outdated price pages penalized
- generic homepages penalized when candidate pages exist

#### S3.2 Add contradiction policy

- if evidence conflicts, require:
  - `mixed evidence`
  - short contradiction explanation
- do not collapse contradictory sources into one confident statement

#### S3.3 Add freshness policy

- route-aware freshness scoring:
  - stricter for news
  - moderate for prices
  - lower priority for evergreen docs

#### S3.4 Add verification score

- calculate a simple score from:
  - number of verified fields
  - number of primary links
  - recency
  - route-specific field completeness

#### S3.5 Add response templates by route

- `news_current`
- `local_maps`
- `shopping_product`
- `travel_booking`
- `technical_docs`

#### S3.6 Add routed regression pack

- local maps case
- product bundle case
- travel case
- news case with mixed evidence

### Acceptance criteria

- answers become shorter and more evidence-dense
- weak sources stop dominating final responses
- mixed evidence is surfaced honestly
- regression pack catches route/backends/summary regressions

## Phase S4: Observability and Operator Control

### Goal

Make search debuggable and operable from the dashboard.

### Deliverables

- structured search event model
- per-backend stats
- operator controls
- replay/debug support

### Implementable tasks

#### S4.1 Structured search events

- log:
  - route type
  - backend chosen
  - fallback backend
  - candidate count
  - verified fields
  - final outcome

#### S4.2 Dashboard search console

- list recent searches
- filter by route/backend/outcome
- open search detail
- show:
  - query
  - route
  - backend
  - sources
  - normalized candidates
  - verification notes

#### S4.3 Add operator toggles

- enable/disable backends
- set backend priority by route
- emergency fallback mode
- route-specific debug mode

#### S4.4 Add replay/debug workflow

- rerun a past search through:
  - same backend
  - alternate backend
  - debug comparison mode

#### S4.5 Add quality metrics

- success rate by route
- fallback rate by route
- no-candidate rate
- average candidate count
- average verified field count
- latency by route/backend

### Acceptance criteria

- operator can understand why a bad answer happened
- operator can see whether the failure was:
  - routing
  - backend
  - extraction
  - synthesis
- backend strategy can be tuned without SSH guessing

## Suggested implementation order

1. `S1.1` adapter contract
2. `S1.2` Yandex local adapter
3. `S1.3` merchant product adapter
4. `S1.5` route-aware `research` backend selection
5. `S1.6` local/product answer templates
6. `S2.1` travel filter parser
7. `S2.2` travel booking adapter
8. `S2.3` `bookingprep` upgrade
9. `S3.1` ranking policy
10. `S3.2` contradiction handling
11. `S4.1` structured events
12. `S4.2` dashboard search console

## What not to do

- do not replace everything with a single new web-search backend
- do not tune only prompts and call it a search fix
- do not claim product/travel/local search is "done" while answers still rely on generic homepages
- do not hide missing verification behind fluent wording

## Practical next step

The next implementation step should be:

- `Phase S1`

Specifically:

1. add the adapter contract
2. add `yandex_local`
3. add `merchant_product`
4. wire both into `research`
5. expose route/backend/result telemetry on the dashboard

That is the shortest path from the current architecture to a noticeably more human and useful assistant search experience.
