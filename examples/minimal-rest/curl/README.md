# Minimal curl REST example

This is the smallest curl quickstart for `odds-api/odds-api`.

It uses plain HTTP and JSON. No SDK, no framework, no MCP.

## Environment

```bash
export ODDS_API_KEY="your_api_key"
export ODDS_API_BASE_URL="https://api.odds-api.net/v1"
```

`ODDS_API_BASE_URL` is optional. It defaults to `https://api.odds-api.net/v1` in the command below.

## Run

```bash
curl -sS \
  -H "X-API-Key: $ODDS_API_KEY" \
  "${ODDS_API_BASE_URL:-https://api.odds-api.net/v1}/sports"
```

## Expected output

The response is JSON containing the sports available to your API key.

```json
{
  "items": ["rugby-league", "soccer", "basketball"]
}
```

For SDKs, OpenAPI, MCP tools, mock mode, arbitrage, positive EV, line movement, and bookmaker comparison, use the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).

## When to use this

Use this example when you want to verify your API key, inspect raw JSON responses, or build a custom integration without an SDK.

Start simple, then move to SDKs, MCP, or OpenAPI when needed.
