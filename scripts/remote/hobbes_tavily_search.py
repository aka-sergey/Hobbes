#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.request


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
    return {
        "title": item.get("title"),
        "url": item.get("url"),
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

    payload = {
        "query": args.query,
        "topic": args.topic,
        "search_depth": args.search_depth,
        "max_results": args.max_results,
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

    result = {
        "ok": True,
        "query": data.get("query", args.query),
        "answer": data.get("answer"),
        "response_time": data.get("response_time"),
        "request_id": data.get("request_id"),
        "results": [compact_result(item) for item in data.get("results", [])],
    }

    if args.pretty:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
