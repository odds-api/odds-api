# Python arbitrage scanner example

This example uses the Python SDK to request arbitrage opportunities from the Odds API.

## Uses

- Python SDK from `sdks/python`
- `find_arbitrage`
- mock odds data when `ODDS_API_MOCK=1`

## Environment

```bash
export ODDS_API_KEY="your_api_key"
export ODDS_API_BASE_URL="https://api.odds-api.net/v1"
```

`ODDS_API_BASE_URL` is optional. Use `ODDS_API_MOCK=1` for local development without live credentials.

## Mock run

```bash
ODDS_API_MOCK=1 python3 main.py
```

## Live run

```bash
ODDS_API_KEY="your_api_key" python3 main.py
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

Arbitrage is subject to execution risk, stale odds, limits, voids, delays, and suspensions.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
