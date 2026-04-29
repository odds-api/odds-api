# JavaScript Telegram bot alert example

This example uses the TypeScript SDK to build a Telegram-style arbitrage alert message. If Telegram credentials are set and mock mode is off, it posts to Telegram; otherwise it prints the message.

## Uses

- TypeScript SDK through the local example client
- `findArbitrage`
- optional Telegram bot delivery
- mock odds data when `ODDS_API_MOCK=1`

## Environment

```bash
export ODDS_API_KEY="your_api_key"
export ODDS_API_BASE_URL="https://api.odds-api.net/v1"
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
```

`ODDS_API_BASE_URL`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` are optional for mock-mode local runs.

## Mock run

```bash
ODDS_API_MOCK=1 node index.mjs
```

## Live run

```bash
ODDS_API_KEY="your_api_key" TELEGRAM_BOT_TOKEN="your_bot_token" TELEGRAM_CHAT_ID="your_chat_id" node index.mjs
```

## Expected output

```text
Odds API arbitrage alert
Arbitrage opportunities: 1
arbitrage-example: pinnacle + sportsbet expected return 1.8%
```

## Safety

Arbitrage alerts must mention execution risk, stale odds, limits, voids, delays, and market suspension.

See the [main README](../../../README.md) and [`openapi.yaml`](../../../openapi.yaml).
