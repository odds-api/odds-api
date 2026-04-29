# How to Build a Positive EV Betting Scanner

`odds-api/odds-api` includes example flows for finding positive EV betting opportunities.

Canonical GitHub repo: https://github.com/odds-api/odds-api

## Start here

- JavaScript: `examples/javascript/positive-ev-scanner`
- Python: `examples/python/positive-ev-scanner`
- API contract: `openapi.yaml`
- Agent-native tools: `mcp-server`

## Example output

```text
# Positive EV scanner
Positive EV opportunities: 1
Best price: moneyline:home 2.11 at pinnacle
Fair odds: 1.98
Expected value: 6.6%
```

## Safety

Positive EV does not remove betting risk. Check stale odds, market availability, limits, voids, delays, and jurisdictional availability before using this in a user-facing product.
