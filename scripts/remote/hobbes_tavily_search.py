#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse


PREFERRED_DOMAIN_WEIGHTS = {
    "reuters.com": 120,
    "apnews.com": 115,
    "bloomberg.com": 110,
    "ft.com": 108,
    "wsj.com": 108,
    "nytimes.com": 106,
    "bbc.com": 104,
    "bbc.co.uk": 104,
    "aljazeera.com": 103,
    "cnbc.com": 100,
    "npr.org": 99,
    "gcaptain.com": 96,
}

LOW_SIGNAL_DOMAIN_PENALTIES = {
    "unn.ua": -25,
}


def normalize_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().replace("www.", "")
    except Exception:
        return ""


def normalize_url(url: str) -> str:
    cleaned = (url or "").strip().lower()
    cleaned = cleaned.replace("https://", "").replace("http://", "")
    cleaned = cleaned.rstrip("/")
    if cleaned.startswith("www."):
        cleaned = cleaned[4:]
    cleaned = cleaned.replace("/amp", "")
    return cleaned


def normalize_title(title: str) -> str:
    return " ".join((title or "").lower().split())


def domain_weight(domain: str) -> int:
    if domain in PREFERRED_DOMAIN_WEIGHTS:
        return PREFERRED_DOMAIN_WEIGHTS[domain]
    for candidate, weight in PREFERRED_DOMAIN_WEIGHTS.items():
        if domain.endswith(f".{candidate}"):
            return weight
    if domain in LOW_SIGNAL_DOMAIN_PENALTIES:
        return LOW_SIGNAL_DOMAIN_PENALTIES[domain]
    for candidate, penalty in LOW_SIGNAL_DOMAIN_PENALTIES.items():
        if domain.endswith(f".{candidate}"):
            return penalty
    return 0


def score_result(item: dict) -> float:
    domain = normalize_domain(item.get("url") or "")
    base = float(item.get("score") or 0.0)
    weight = domain_weight(domain) / 1000.0
    title = normalize_title(item.get("title") or "")
    content = (item.get("content") or "").lower()
    if "explainer" in title or "why " in title:
        weight -= 0.08
    if "2023/" in (item.get("url") or ""):
        weight -= 0.12
    if "2024/" in (item.get("url") or ""):
        weight -= 0.06
    if "attack" in content or "attacked" in content or "seizing" in content:
        weight += 0.02
    return base + weight


def filter_and_rank_results(items: list[dict], max_results: int) -> list[dict]:
    ranked = sorted(items, key=score_result, reverse=True)
    filtered = []
    seen_urls = set()
    seen_title_domain = set()

    for item in ranked:
        url = item.get("url") or ""
        title = item.get("title") or ""
        if not url or not title:
            continue

        url_key = normalize_url(url)
        domain = normalize_domain(url)
        title_domain_key = (normalize_title(title), domain)

        if url_key in seen_urls or title_domain_key in seen_title_domain:
            continue

        seen_urls.add(url_key)
        seen_title_domain.add(title_domain_key)
        filtered.append(item)

        if len(filtered) >= max_results:
            break

    return filtered


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run Tavily search for Hobbes and print compact JSON."
    )
    parser.add_argument("--query", required=True, help="Search query")
    parser.add_argument(
        "--topic",
        default="general",
        choices=["general", "news", "finance"],
        help="Tavily topic",
    )
    parser.add_argument(
        "--time-range",
        default=None,
        choices=["day", "week", "month", "year", "d", "w", "m", "y"],
        help="Optional recency filter",
    )
    parser.add_argument(
        "--search-depth",
        default="basic",
        choices=["basic", "advanced", "fast", "ultra-fast"],
        help="Latency vs relevance tradeoff",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=5,
        help="Maximum results to request",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=None,
        help="Alias for --max-results for compatibility with older prompts",
    )
    parser.add_argument(
        "--include-answer",
        default="basic",
        choices=["false", "true", "basic", "advanced"],
        help="Include Tavily answer block",
    )
    parser.add_argument(
        "--include-domains",
        nargs="*",
        default=None,
        help="Optional domain allowlist",
    )
    parser.add_argument(
        "--exclude-domains",
        nargs="*",
        default=None,
        help="Optional domain denylist",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON",
    )
    return parser


def compact_result(item: dict) -> dict:
    domain = normalize_domain(item.get("url") or "")
    return {
        "title": item.get("title"),
        "url": item.get("url"),
        "domain": domain,
        "content": item.get("content"),
        "score": item.get("score"),
        "published_date": item.get("published_date"),
    }


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    api_key = os.environ.get("TAVILY_API_KEY", "").strip()
    if not api_key:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "missing_tavily_api_key",
                    "message": "Set TAVILY_API_KEY in the environment.",
                }
            )
        )
        return 2

    max_results = args.count if args.count is not None else args.max_results

    payload = {
        "query": args.query,
        "topic": args.topic,
        "search_depth": args.search_depth,
        "max_results": max_results,
        "include_answer": False
        if args.include_answer == "false"
        else args.include_answer,
        "include_raw_content": False,
        "include_images": False,
        "include_favicon": False,
    }

    if args.time_range:
        payload["time_range"] = args.time_range
    if args.include_domains:
        payload["include_domains"] = args.include_domains
    if args.exclude_domains:
        payload["exclude_domains"] = args.exclude_domains

    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        "https://api.tavily.com/search",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "http_error",
                    "status": exc.code,
                    "detail": detail,
                }
            )
        )
        return 1
    except Exception as exc:  # noqa: BLE001
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "request_failed",
                    "detail": str(exc),
                }
            )
        )
        return 1

    ranked_results = filter_and_rank_results(data.get("results", []), max_results)

    result = {
        "ok": True,
        "query": data.get("query", args.query),
        "answer": data.get("answer"),
        "response_time": data.get("response_time"),
        "request_id": data.get("request_id"),
        "results": [compact_result(item) for item in ranked_results],
    }

    if args.pretty:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
