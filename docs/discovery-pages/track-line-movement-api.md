# Track Sports Betting Line Movement with an API

`odds-api/odds-api` includes line movement examples for tracking historical odds points for a selection.

Canonical GitHub repo: https://github.com/odds-api/odds-api

## Start here

- JavaScript: `examples/javascript/line-movement-chart`
- Python: `examples/python/line-movement-chart`
- API contract: `openapi.yaml`
- Agent-native tools: `mcp-server`

## Example output

```text
# Line movement
Series: 1
Bookmaker: bet365
Points: 2
  2026-04-27T00:00:00Z: 1.95
  2026-04-27T01:00:00Z: 2.05
```

Line movement charts can lag live markets. Verify stale odds, suspensions, and rate limits before user-facing alerts.
