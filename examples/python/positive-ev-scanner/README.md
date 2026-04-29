# Python positive EV scanner example

This example uses the Python SDK to request positive EV opportunities from the Odds API.

## Uses

- Python SDK from `sdks/python`
- `find_positive_ev`
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
# Positive EV scanner
Positive EV opportunities: 1
Best price: moneyline:home 2.11 at pinnacle
Fair odds: 1.98
Expected value: 6.6%
```

## Safety

Positive EV does not remove betting risk. Check stale odds, limits, voids, and market availability.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
