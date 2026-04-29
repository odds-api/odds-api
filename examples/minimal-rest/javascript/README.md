# Minimal JavaScript REST example

This is the one-file JavaScript example for `odds-api/odds-api`.

It uses plain HTTP and JSON. No SDK, no framework, no MCP. It uses the global `fetch` available in Node.js 20+.

## Environment

```bash
export ODDS_API_KEY="your_api_key"
export ODDS_API_BASE_URL="https://api.odds-api.net/v1"
```

`ODDS_API_BASE_URL` is optional and defaults to `https://api.odds-api.net/v1`.

## Run

```bash
export ODDS_API_KEY=YOUR_API_KEY
node odds.mjs
```

## Expected output

The response is JSON containing the sports available to your API key.

```json
{
  "items": ["rugby-league", "soccer", "basketball"]
}
```

## When to use this

Use this example when you want a one-file JavaScript odds API integration.

For typed TypeScript SDK usage, OpenAPI, mock mode, MCP tools, arbitrage, positive EV, bookmaker comparison, and line movement, use the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).

Start simple, then move to SDKs, MCP, or OpenAPI when needed.
