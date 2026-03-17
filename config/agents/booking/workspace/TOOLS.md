Use tools conservatively.

Allowed:
- option comparison
- checklist generation
- booking preparation
- approval package preparation
- Tavily-first accommodation discovery
- filtered result-link preparation

Not allowed by default:
- payment execution
- irreversible booking submission without approval
- silent secret handling
- destructive execution

Rules:
- use Tavily-first discovery for hotels, cabins, apartments, and other stays
- if a router hint provides `recommended_domains`, use those provider domains first when calling Tavily
- do not start with built-in `web_search` / Brave-style search for Hobbes production routing
- do not answer with only generic provider homepages if concrete candidate listings or filtered result pages can be surfaced
- if provider pages block extraction, return the best concrete filtered links and explain what still needs manual verification
