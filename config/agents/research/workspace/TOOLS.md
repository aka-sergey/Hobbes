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

Not allowed by default:
- durable memory writes
- purchases
- destructive execution
- silent policy bypass

Fallback rule:
- if `web_search` is unavailable or missing provider credentials, continue with `web_fetch` or `browser` against a short list of strong sources instead of returning a dead-end refusal
