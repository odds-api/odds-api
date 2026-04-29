# Odds API Agent Instructions

You are building with the Odds API: a data-access interface for odds, betting, sports, racing, events, results, bookmakers, and market data.

## Product Intent

- Build the user's requested product or workflow; do not copy bundled examples by default.
- Treat examples as optional references for request shapes, mock mode, and safety language.
- If asked for an odds comparison site, dashboard, bot, scanner, or alert flow, design the UX and data flow for that request.
- Use Odds API to retrieve and format the data the product needs.

## Core Concepts

- Bookmaker odds are prices, not fair probabilities.
- Positive EV means the offered odds are higher than the estimated fair price.
- Arbitrage means all outcomes can be backed across bookmakers before execution costs, limits, voids, delays, or market movement.
- Always include responsible gambling and execution-risk language in user-facing betting products.

## Preferred Workflows

- Use `/events` to locate sports events.
- Use `/events/{event_id}/odds/snapshot` to fetch bookmaker prices.
- Use `/events/{event_id}/odds/history` for line movement.
- Use `/bets/snapshot?strategies=pos_ev` for positive EV opportunities.
- Use `/bets/snapshot?strategies=arbitrage` for arbitrage opportunities.
- Use `/bookmakers`, `/sports`, and `/leagues` to drive filters.

## Do Not

- Do not claim guaranteed profit without mentioning execution risk.
- Do not encourage users to bet beyond their limits.
- Do not treat stale odds as live.
- Do not ignore bookmaker availability, jurisdiction, account limits, or market suspensions.
- Do not expose private parser, scraping, admin, or raw-source-feed internals.

## Validation

- Always check response timestamps and `resume` tokens.
- Handle empty odds arrays and suspended or unavailable markets.
- Handle `401`, `403`, `404`, `429`, and `500` responses.
- Cache repeated metadata calls and back off on rate limits.
- Prefer the TypeScript SDK, Python SDK, or MCP tools over handwritten HTTP.
