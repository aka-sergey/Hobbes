Use tools conservatively.

Allowed:
- research
- summarization
- comparison
- artifact preparation
- visual intake
- PDF extraction
- web-backed evidence gathering
- trusted-source fallback via `web_fetch` or `browser`
- Tavily search via local helper and `exec`
- OpenAI image generation via local helper and `exec`
- directory-first lookup for nearby businesses via Tavily result discovery

Not allowed by default:
- durable memory writes
- purchases
- destructive execution
- silent policy bypass

Fallback rule:
- if `web_search` is unavailable or missing provider credentials, continue with `web_fetch` or `browser` against a short list of strong sources instead of returning a dead-end refusal
- if `TAVILY_API_KEY` is set, prefer `exec` + `hobbes-tavily-search` before the fallback sweep
- for explicit image-generation requests, use `exec` + `/usr/local/bin/hobbes-image-generate --prompt \"<request>\"`
- if `HOBBES_IMAGE_MODEL` resolves to `dall-e-3`, prefer `--delivery url` for Telegram-facing results unless the caller explicitly needs a saved file
- when the helper returns an `image_url`, keep it visible in the final answer and mark that the URL may be temporary
- when the helper returns an `artifact_path`, preserve it as artifact metadata instead of flattening it away
- if a router hint provides `recommended_domains`, pass them to `hobbes-tavily-search --include-domains ...` before trying a broad query
- built-in `web_search` / Brave-style search is deprecated for Hobbes production routing; do not use it as the normal path
- do not start with `web_search` when Tavily is available via the local helper
- do not invent article URLs for `web_fetch`; fetch only URLs discovered by Tavily or obvious trusted landing pages
- when Tavily returns mixed or contradictory signals, do not compress them into a single confident claim; explicitly say the evidence is mixed
- when source quality is uneven, prefer the stronger source and mark weaker links as secondary context rather than core evidence
- for nearby-business tasks, do not stop at "use 2GIS or Yandex Maps"; if Tavily can surface candidate directory pages or listings, return them
- for product and price tasks, prefer merchant and marketplace listings over generic articles; return price ranges, seller/source links, and clearly label any price that is not directly visible in the source snippet
