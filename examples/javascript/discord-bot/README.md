# JavaScript Discord bot alert example

This example uses the TypeScript SDK to build a Discord-style positive EV alert message. If `DISCORD_WEBHOOK_URL` is set and mock mode is off, it posts to Discord; otherwise it prints the message.

## Uses

- TypeScript SDK through the local example client
- `findPositiveEv`
- optional Discord webhook
- mock odds data when `ODDS_API_MOCK=1`

## Environment

```bash
export ODDS_API_KEY="your_api_key"
export ODDS_API_BASE_URL="https://api.odds-api.net/v1"
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

`ODDS_API_BASE_URL` and `DISCORD_WEBHOOK_URL` are optional. Use `ODDS_API_MOCK=1` for local development without live credentials or webhook delivery.

## Mock run

```bash
ODDS_API_MOCK=1 node index.mjs
```

## Live run

```bash
ODDS_API_KEY="your_api_key" DISCORD_WEBHOOK_URL="your_webhook" node index.mjs
```

## Expected output

```text
Odds API edge alert
Positive EV opportunities: 1
**pinnacle** moneyline:home @ 2.11 (6.6% EV)
```

## Safety

Alerts should include stale-price and execution-risk language. Positive EV does not remove betting risk.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
