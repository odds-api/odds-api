# Compare Bookmaker Odds with an API

`odds-api/odds-api` supports bookmaker comparison through plain REST, SDK helpers, MCP tools, and OpenAPI.

Canonical GitHub repo: https://github.com/odds-api/odds-api

## Start here

- Minimal REST: `examples/minimal-rest`
- JavaScript example: `examples/javascript/odds-comparison-widget`
- TypeScript SDK: `sdks/typescript`
- Python SDK: `sdks/python`
- API contract: `openapi.yaml`

## Example output

```text
# Odds comparison: Brisbane vs Sydney
Found 1 events
Compared 2 bookmakers
Best price: moneyline:home 2.11 at pinnacle
Best price: moneyline:away 1.87 at sportsbet
```

Production comparison tools should show timestamps, market availability, stale-price handling, and execution-risk language.
