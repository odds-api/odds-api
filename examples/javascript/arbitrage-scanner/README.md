# JavaScript arbitrage scanner example

This example uses the TypeScript SDK to request arbitrage opportunities from the Odds API.

## Uses

- TypeScript SDK through the local example client
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
# Arbitrage scanner
Arbitrage opportunities: 1
Arbitrage: yes
Selection: moneyline:home
Bookmakers: pinnacle + sportsbet
Expected return: 1.8%
```

## Safety

Arbitrage is not guaranteed profit. Prices can move, markets can suspend, selections can void, accounts can be limited, and execution can fail.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
