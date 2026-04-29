# JavaScript line movement chart example

This example uses the TypeScript SDK to fetch odds history for a selection and print the points needed for a line movement chart.

## Uses

- TypeScript SDK through the local example client
- `getLineMovement`
- mock odds data when `ODDS_API_MOCK=1`

## Environment

```bash
export ODDS_API_KEY="your_api_key"
export ODDS_API_BASE_URL="https://api.odds-api.net/v1"
```

`ODDS_API_BASE_URL` is optional. Use `ODDS_API_MOCK=1` for local development without live credentials.

## Mock run

```bash
ODDS_API_MOCK=1 node index.mjs
```

## Live run

```bash
ODDS_API_KEY="your_api_key" node index.mjs
```

## Expected output

```text
# Line movement
Series: 1
Bookmaker: bet365
Points: 2
  2026-04-27T00:00:00Z: 1.95
  2026-04-27T01:00:00Z: 2.05
```

## Safety

Line movement charts can lag live markets. Verify stale odds, suspensions, and rate limits before user-facing alerts.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
