# JavaScript positive EV scanner example

This example uses the TypeScript SDK to request positive EV opportunities from the Odds API.

## Uses

- TypeScript SDK through the local example client
- `findPositiveEv`
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
# Positive EV scanner
Positive EV opportunities: 1
Best price: moneyline:home 2.11 at pinnacle
Fair odds: 1.98
Expected value: 6.6%
```

## Safety

Positive EV does not remove betting risk. Check stale odds, market availability, limits, voids, and execution risk before using this in a user-facing product.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
