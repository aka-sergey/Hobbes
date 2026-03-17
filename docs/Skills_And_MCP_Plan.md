# Skills And MCP Plan

## Recommended Hobbes Skills

### `openclaw-ops`

Use for:

- health checks
- restarts
- journal inspection
- backups
- safe production troubleshooting

### `routing-regression`

Use for:

- bounded route checks
- session counter validation
- separating timeout-only failures from integrity failures

### `agent-contract-linter`

Use for:

- runtime id consistency
- workspace contract validation
- routing allowlist validation
- install and smoke-script drift detection

### `dashboard-product`

Use for:

- event schema
- screen planning
- queue and approval UX
- token and cost visibility

## MCP Recommendation

Current recommendation:

- do **not** add many MCP servers yet
- start with the smallest useful set

### Add first

- Postgres-facing MCP or equivalent data access layer for dashboard querying

### Add later

- GitHub MCP for repo and issue workflows
- Calendar or mail MCP only when `booking` or `inbox` needs real external actions

### Avoid for now

- generic shell or browser MCP duplication
- broad ungoverned MCP fleets that increase risk without clear product value

## Principle

For Hobbes today:

- skills should provide the reusable workflow layer
- MCP should be added only where structured external data or action is genuinely needed
