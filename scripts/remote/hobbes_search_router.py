#!/usr/bin/env python3
import argparse
import json
import re
import sys


QUERY_TYPES = {
    "news_current",
    "general_research",
    "quick_fact",
    "official_lookup",
    "document_lookup",
    "local_maps",
    "travel_booking",
    "shopping_product",
    "comparison_alternatives",
    "finance_market",
    "law_policy",
    "technical_docs",
    "troubleshooting",
    "people_company_lookup",
    "community_reviews",
    "media_search",
    "scientific_academic",
    "internal_source_search",
}

FRESHNESS_TERMS = {
    "latest", "recent", "today", "yesterday", "new", "release", "update", "news",
    "сегодня", "вчера", "новости", "последние", "свеж", "новое", "апдейт",
}
GEO_TERMS = {
    "рядом", "near", "nearby", "metro", "метро", "адрес", "address", "hours",
    "часы", "phone", "телефон", "карте", "map", "maps", "station", "станции",
}
TRAVEL_TERMS = {
    "hotel", "hotels", "отель", "отели", "apartment", "apartments", "апартамент",
    "stay", "stays", "trip", "booking", "book", "бронь", "брон", "гостиниц",
    "check-in", "checkin", "check-out", "checkout", "заезд", "выезд", "guests",
    "guest", "гостей", "взросл", "child", "children", "ребен", "budget", "room",
    "rooms", "номер", "ноч", "night", "сутки", "accommodation", "жилье", "домик",
    "коттедж", "cabin",
}
PRODUCT_TERMS = {
    "buy", "купить", "price", "цена", "where to buy", "seller", "stock", "наличие",
    "дешевле", "cheaper", "compare models", "модель", "товар",
}
OFFICIAL_TERMS = {
    "official", "официаль", "site", "сайт", "docs", "documentation", "pricing",
    "login", "github", "policy", "api",
}
TROUBLESHOOTING_TERMS = {
    "error", "issue", "bug", "not working", "failed", "crash", "fix", "workaround",
    "ошибка", "не работает", "падает", "исправить", "problem", "debug", "trace",
    "stack trace", "billing_not_active",
}
LAW_TERMS = {
    "law", "regulation", "policy", "legal", "requirement", "federal law", "gdpr",
    "compliance", "закон", "правило", "регламент", "требован", "норматив",
}
FINANCE_TERMS = {
    "stock", "stocks", "shares", "market cap", "revenue", "ebitda", "btc", "eth",
    "nasdaq", "price now", "акции", "котиров", "капитализац", "выручка", "курс",
    "рынок", "отчетность", "отчётность",
}
REVIEWS_TERMS = {
    "review", "reviews", "reddit", "opinion", "sentiment", "complaints", "отзывы",
    "мнения", "жалобы", "форум", "forum", "community", "сообщество",
}
MEDIA_TERMS = {
    "photo", "photos", "image", "images", "video", "videos", "presentation",
    "slides", "картин", "изображен", "фото", "видео", "презентац", "схем",
}
ACADEMIC_TERMS = {
    "paper", "papers", "doi", "arxiv", "study", "studies", "research", "systematic review",
    "citation", "исследован", "статья", "препринт", "doi", "научн",
}
INTERNAL_TERMS = {
    "my file", "my files", "my repo", "my slides", "google drive", "notion", "slack",
    "readme", "projectpassport", "в репо", "в репозитории", "мой файл", "мой репо",
    ".md", ".pdf", ".docx", "github repo", "repo",
}
PEOPLE_COMPANY_TERMS = {
    "ceo", "founder", "company", "brand", "service", "who is", "кто такой", "кто такая",
    "кто такой", "основал", "компания", "бренд", "сервис",
}
LOCAL_BUSINESS_TERMS = {
    "clinic", "clinics", "dentist", "dental", "стоматолог", "стоматология", "кафе",
    "restaurant", "ресторан", "shop", "service", "сервис", "repair", "аптека",
    "hotel", "отель",
}

LOCAL_DIRECTORY_DOMAINS = [
    "2gis.ru",
    "yandex.ru",
    "yandex.com",
    "google.com",
    "zoon.ru",
    "prodoctorov.ru",
    "napopravku.ru",
]
TRAVEL_DOMAINS = [
    "ostrovok.ru",
    "booking.com",
    "airbnb.com",
    "hotels.com",
    "trip.com",
    "travel.yandex.ru",
]
OFFICIAL_DOCS_DOMAINS = [
    "github.com",
    "docs.",
    "developers.",
]
NEWS_DOMAINS = [
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "nytimes.com",
    "ft.com",
    "wsj.com",
    "aljazeera.com",
]


def detect_language(query: str) -> str:
    has_cyrillic = bool(re.search(r"[А-Яа-яЁё]", query))
    has_latin = bool(re.search(r"[A-Za-z]", query))
    if has_cyrillic and has_latin:
        return "mixed"
    if has_cyrillic:
        return "ru"
    return "en"


def has_any(query_lower: str, terms: set[str]) -> bool:
    return any(term in query_lower for term in terms)


def count_any(query_lower: str, terms: set[str]) -> int:
    return sum(1 for term in terms if term in query_lower)


def has_date_pattern(query_lower: str) -> bool:
    patterns = [
        r"\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b",
        r"\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|январ|феврал|март|апрел|мая|июн|июл|август|сентябр|октябр|ноябр|декабр)",
        r"\bfrom\b.+\bto\b",
        r"\bс\s+\d{1,2}\b.+\bпо\s+\d{1,2}\b",
    ]
    return any(re.search(pattern, query_lower) for pattern in patterns)


def detect_signals(query: str) -> dict:
    q = query.lower()
    location = has_any(q, GEO_TERMS) or bool(re.search(r"\bnear me\b|\bрядом с\b", q))
    travel = has_any(q, TRAVEL_TERMS) or has_date_pattern(q)
    commercial = has_any(q, PRODUCT_TERMS) or travel
    official = has_any(q, OFFICIAL_TERMS)
    error_intent = has_any(q, TROUBLESHOOTING_TERMS)
    finance = has_any(q, FINANCE_TERMS)
    internal = has_any(q, INTERNAL_TERMS) or bool(re.search(r"/[\w.-]+", q))
    freshness = has_any(q, FRESHNESS_TERMS)
    review = has_any(q, REVIEWS_TERMS)
    media = has_any(q, MEDIA_TERMS)
    law = has_any(q, LAW_TERMS)
    academic = has_any(q, ACADEMIC_TERMS)
    local_business = location and has_any(q, LOCAL_BUSINESS_TERMS)
    people_company = has_any(q, PEOPLE_COMPANY_TERMS)
    docs = official and ("docs" in q or "documentation" in q or "api" in q or "github" in q)
    comparison = " vs " in q or "versus" in q or "alternative" in q or "альтернатив" in q or "лучше" in q
    return {
        "freshness": freshness,
        "location": location,
        "travel_filters": travel,
        "commercial_intent": commercial,
        "official_page_intent": official,
        "error_intent": error_intent,
        "finance_intent": finance,
        "internal_source_intent": internal,
        "review_intent": review,
        "media_intent": media,
        "law_intent": law,
        "academic_intent": academic,
        "local_business_intent": local_business,
        "people_company_intent": people_company,
        "technical_docs_intent": docs,
        "comparison_intent": comparison,
    }


def route_query(query: str) -> dict:
    signals = detect_signals(query)
    q = query.lower()
    confidence = 0.6
    detected_type = "general_research"

    if signals["internal_source_intent"]:
        detected_type = "internal_source_search"
        confidence = 0.93
    elif signals["error_intent"]:
        detected_type = "troubleshooting"
        confidence = 0.95
    elif signals["technical_docs_intent"]:
        detected_type = "technical_docs"
        confidence = 0.92
    elif signals["law_intent"]:
        detected_type = "law_policy"
        confidence = 0.9
    elif signals["finance_intent"]:
        detected_type = "finance_market"
        confidence = 0.9
    elif signals["travel_filters"]:
        detected_type = "travel_booking"
        confidence = 0.95
    elif signals["local_business_intent"]:
        detected_type = "local_maps"
        confidence = 0.95
    elif signals["freshness"]:
        detected_type = "news_current"
        confidence = 0.9
    elif signals["official_page_intent"]:
        detected_type = "official_lookup"
        confidence = 0.88
    elif signals["review_intent"]:
        detected_type = "community_reviews"
        confidence = 0.88
    elif signals["media_intent"]:
        detected_type = "media_search"
        confidence = 0.86
    elif signals["academic_intent"]:
        detected_type = "scientific_academic"
        confidence = 0.88
    elif signals["comparison_intent"]:
        detected_type = "comparison_alternatives"
        confidence = 0.84
    elif signals["people_company_intent"]:
        detected_type = "people_company_lookup"
        confidence = 0.82
    elif has_any(q, PRODUCT_TERMS):
        detected_type = "shopping_product"
        confidence = 0.82
    elif re.search(r"\bwhat is\b|\bчто такое\b|\bwhen\b|\bкогда\b|\bcapital of\b|\bmeaning\b", q):
        detected_type = "quick_fact"
        confidence = 0.74

    dispatch = {
        "news_current": {
            "preferred_agent": "research",
            "preferred_backend": "tavily_news",
            "fallback_backend": "trusted_sources_news",
            "recommended_domains": NEWS_DOMAINS,
            "needs_structured_filters": False,
            "tavily_topic": "news",
            "tavily_time_range": "week",
            "routing_note": "Prioritize freshness and multiple recent sources.",
        },
        "general_research": {
            "preferred_agent": "research",
            "preferred_backend": "tavily_general",
            "fallback_backend": "trusted_sources_fetch",
            "recommended_domains": [],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Use source-backed summary with a small number of strong links.",
        },
        "quick_fact": {
            "preferred_agent": "research",
            "preferred_backend": "entity_lookup",
            "fallback_backend": "official_or_reputable_page",
            "recommended_domains": [],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": "year" if signals["freshness"] else None,
            "routing_note": "Prefer concise factual lookup over a broad research write-up.",
        },
        "official_lookup": {
            "preferred_agent": "research",
            "preferred_backend": "official_navigational",
            "fallback_backend": "trusted_search",
            "recommended_domains": OFFICIAL_DOCS_DOMAINS,
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Favor official site, docs, pricing, login, or GitHub page over commentary.",
        },
        "document_lookup": {
            "preferred_agent": "research",
            "preferred_backend": "file_page_targeting",
            "fallback_backend": "docs_github_pdf",
            "recommended_domains": ["github.com"],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Target PDF, README, whitepaper, or specific file page.",
        },
        "local_maps": {
            "preferred_agent": "research",
            "preferred_backend": "directory_maps",
            "fallback_backend": "official_site_confirmation",
            "recommended_domains": LOCAL_DIRECTORY_DOMAINS,
            "needs_structured_filters": True,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Return concrete nearby businesses with names, addresses, phones, hours, and direct links.",
        },
        "travel_booking": {
            "preferred_agent": "bookingprep",
            "preferred_backend": "travel_booking",
            "fallback_backend": "provider_filtered_links",
            "recommended_domains": TRAVEL_DOMAINS,
            "needs_structured_filters": True,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Use dates, guests, children, budget, and area. Return candidate stays or filtered result links, not generic homepages.",
        },
        "shopping_product": {
            "preferred_agent": "research",
            "preferred_backend": "product_merchant",
            "fallback_backend": "comparison_summary",
            "recommended_domains": [],
            "needs_structured_filters": True,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Prefer product listing, specs, price, and seller availability.",
        },
        "comparison_alternatives": {
            "preferred_agent": "research",
            "preferred_backend": "comparison_research",
            "fallback_backend": "docs_plus_reviews",
            "recommended_domains": [],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Compare a few options with criteria instead of returning one link dump.",
        },
        "finance_market": {
            "preferred_agent": "research",
            "preferred_backend": "finance_structured",
            "fallback_backend": "market_pages",
            "recommended_domains": [],
            "needs_structured_filters": False,
            "tavily_topic": "finance",
            "tavily_time_range": "month" if signals["freshness"] else None,
            "routing_note": "Prefer market or official financial data before general web pages.",
        },
        "law_policy": {
            "preferred_agent": "research",
            "preferred_backend": "official_policy",
            "fallback_backend": "reputable_secondary_law",
            "recommended_domains": [],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Prefer official statutes, regulators, and policy pages.",
        },
        "technical_docs": {
            "preferred_agent": "research",
            "preferred_backend": "docs_first",
            "fallback_backend": "github_releases_issues",
            "recommended_domains": ["github.com", "docs.", "developers."],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": "year" if signals["freshness"] else None,
            "routing_note": "Search official docs, changelogs, and GitHub before generic blogs.",
        },
        "troubleshooting": {
            "preferred_agent": "research",
            "preferred_backend": "docs_issues_forum",
            "fallback_backend": "community_workarounds",
            "recommended_domains": ["github.com", "docs.", "developers."],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": "year",
            "routing_note": "Search symptoms, causes, and fixes with docs-first priority.",
        },
        "people_company_lookup": {
            "preferred_agent": "research",
            "preferred_backend": "entity_lookup",
            "fallback_backend": "official_plus_reputable_profile",
            "recommended_domains": [],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": "year" if signals["freshness"] else None,
            "routing_note": "Use official site and reputable profiles first.",
        },
        "community_reviews": {
            "preferred_agent": "research",
            "preferred_backend": "forums_reviews",
            "fallback_backend": "reddit_community",
            "recommended_domains": ["reddit.com"],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": "year",
            "routing_note": "Separate opinions from factual claims.",
        },
        "media_search": {
            "preferred_agent": "research",
            "preferred_backend": "media_search",
            "fallback_backend": "official_media_page",
            "recommended_domains": [],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Prefer image, video, or presentation pages instead of general text articles.",
        },
        "scientific_academic": {
            "preferred_agent": "research",
            "preferred_backend": "papers_first",
            "fallback_backend": "arxiv_scholar_semantic",
            "recommended_domains": ["arxiv.org", "doi.org", "scholar.google.com"],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Prefer papers, preprints, and citation-aware summaries.",
        },
        "internal_source_search": {
            "preferred_agent": "research",
            "preferred_backend": "internal_sources_first",
            "fallback_backend": "public_web_last",
            "recommended_domains": ["github.com"],
            "needs_structured_filters": False,
            "tavily_topic": "general",
            "tavily_time_range": None,
            "routing_note": "Search connected or repo sources before public web.",
        },
    }

    data = dispatch[detected_type]
    result = {
        "ok": True,
        "query": query,
        "language": detect_language(query),
        "detected_type": detected_type,
        "confidence": round(confidence, 2),
        "signals": signals,
        "preferred_agent": data["preferred_agent"],
        "preferred_backend": data["preferred_backend"],
        "fallback_backend": data["fallback_backend"],
        "needs_structured_filters": data["needs_structured_filters"],
        "recommended_domains": data["recommended_domains"],
        "suggested_tavily_topic": data["tavily_topic"],
        "suggested_tavily_time_range": data["tavily_time_range"],
        "routing_note": data["routing_note"],
    }
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Classify search query type for Hobbes.")
    parser.add_argument("--query", required=True, help="Raw user query")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    payload = route_query(args.query.strip())
    if args.pretty:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
