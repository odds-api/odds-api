# JavaScript betting dashboard example

This example uses the TypeScript SDK to collect the summary data a dashboard might show: events, positive EV opportunities, and arbitrage opportunities.

## Uses

- TypeScript SDK through the local example client
- `searchEvents`
- `findPositiveEv`
- `findArbitrage`
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
# Betting dashboard
Found 1 events
Positive EV opportunities: 1
Arbitrage opportunities: 1
```

## Safety

Dashboards should show timestamps, stale-price handling, market availability, and execution-risk language for betting workflows.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
