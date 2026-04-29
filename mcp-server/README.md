# Odds API MCP

The MCP server exposes Odds API as a data-access layer for agents. Use it to retrieve and shape sports, racing, odds, bookmaker, market, result, and betting-opportunity data for the user's requested product.

It is not an app-template generator. If a user asks for an odds comparison site, dashboard, bot, scanner, or alert workflow, use these tools to get the right data and design the requested experience. Treat bundled examples as optional references only.

## Tools

```text
odds_api.search_events
odds_api.get_odds
odds_api.compare_odds
odds_api.find_arbitrage
odds_api.find_positive_ev
odds_api.get_line_movement
odds_api.get_leagues
odds_api.get_bookmakers
odds_api.get_sports
odds_api.get_results
odds_api.search_racing_events
odds_api.get_racing_odds
odds_api.get_streaming_info
odds_api.sample_odds_stream
odds_api.sample_bets_stream
odds_api.get_market_schema
```

## Streaming

Use `odds_api.get_streaming_info` before generating realtime code. The MCP server exposes bounded SSE sampling tools for debugging and inspection:

```text
odds_api.sample_odds_stream
odds_api.sample_bets_stream
```

These tools default to `max_events: 10` and `timeout_sec: 15`, with hard limits of `max_events <= 25` and `timeout_sec <= 30`. They are not permanent live subscriptions. Production apps should connect directly to the Odds API SSE or WebSocket endpoints and handle reconnects, resume tokens, stale odds, and suspended markets.

```json
{
  "mcpServers": {
    "odds-api": {
      "command": "npx",
      "args": ["@odds-api/mcp"],
      "env": {
        "ODDS_API_KEY": "your_api_key",
        "ODDS_API_BASE_URL": "https://api.odds-api.net/v1"
      }
    }
  }
}
```
