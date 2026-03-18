# Search Router Taxonomy

This document captures the production-oriented search taxonomy for Hobbes.

## Why it exists

One search backend almost never performs equally well for every class of task.
The problem is usually not a specific search engine, but the fact that products mix:

- news and fresh events
- general research
- official page lookup
- local business near the user
- travel and accommodation
- shopping and availability
- technical docs and troubleshooting
- finance and market data
- reviews and community sentiment

So Hobbes needs a category-aware router:

1. detect the query type
2. choose the right flow
3. only then search

## Minimum production-ready route set

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

## Core mapping

| Query type | Preferred flow |
| --- | --- |
| `news_current` | Tavily news / fresh search |
| `general_research` | Tavily general research |
| `official_lookup` | navigational / official page lookup |
| `local_maps` | directory / maps / catalog flow |
| `travel_booking` | booking-specific flow |
| `shopping_product` | product / merchant flow |
| `finance_market` | finance-specific sources |
| `law_policy` | official sources only |
| `technical_docs` | docs-first flow |
| `troubleshooting` | docs + issues + community fixes |
| `community_reviews` | forum / review / sentiment flow |
| `media_search` | image / video / media flow |
| `people_company_lookup` | entity lookup |
| `internal_source_search` | repo / file / connected source search |

## Routing signals

### Freshness

- `latest`
- `recent`
- `today`
- `yesterday`
- `new`
- `release`
- `update`
- `новости`
- `последние`
- `сегодня`

### Geo

- `рядом`
- `near me`
- `у метро`
- `nearby`
- `address`
- `phone`
- `на карте`

### Travel

- `hotel`
- `apartment`
- `booking`
- `dates`
- `guests`
- `children`
- `room`
- `check-in`
- `check-out`
- `budget`

### Official intent

- `official`
- `официальный`
- `site`
- `docs`
- `documentation`
- `pricing`
- `login`
- `github`

### Troubleshooting

- `error`
- `issue`
- `bug`
- `failed`
- `crash`
- `fix`
- `workaround`
- `ошибка`
- `не работает`

## Operational rules

1. If a query requires freshness, do not send it through a static research flow.
2. If a query contains geography and a physical place, use `local_maps`.
3. If a query includes dates, guests, children, or budget, use `travel_booking`.
4. If a query asks for official docs, pricing, or login, use `official_lookup` or `technical_docs`.
5. If a query contains an error or workaround request, use `troubleshooting`.
6. If a query asks for quotes, capitalization, or market metrics, use `finance_market`.
7. If a query asks for opinions, do not mix it with factual search.
8. If a query asks for a private or repo file, search internal sources first.

## Hobbes-specific conclusion

`Tavily` is a strong base for:

- `news_current`
- `general_research`
- candidate page discovery
- source-backed summaries

But it should not be the only strategy for:

- `local_maps`
- `travel_booking`
- `shopping_product`
- highly structured finance tasks
