# JavaScript odds comparison widget example

This example uses the TypeScript SDK to find an event and compare the best available bookmaker prices.

## Uses

- TypeScript SDK through the local example client
- `searchEvents`
- `findBestOdds`
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
# Odds comparison: Brisbane vs Sydney
Found 1 events
Compared 2 bookmakers
Best price: moneyline:home 2.11 at pinnacle
Best price: moneyline:away 1.87 at sportsbet
```

## Safety

Odds can move or suspend. Display timestamps and stale-price handling in production products.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
