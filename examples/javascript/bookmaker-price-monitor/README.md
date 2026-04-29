# JavaScript bookmaker price monitor example

This example uses the TypeScript SDK to compare selected bookmakers for one event.

## Uses

- TypeScript SDK through the local example client
- `compareBookmakers`
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
# Bookmaker price monitor
Compared 3 bookmakers
Prices returned: 6
Best price candidate: moneyline:home 2.05 at bet365
```

## Safety

Bookmaker availability, limits, suspensions, stale odds, and void rules can change. Handle them before alerting users.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
