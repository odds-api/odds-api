# Sports Odds API with MCP Server

The Odds API MCP server gives AI coding agents tool access to sports odds and betting odds workflows.

Canonical GitHub repo: https://github.com/odds-api/odds-api

## MCP tools

The MCP server registers 41 tools (source: `mcp-server/src/index.ts`).

- `odds_api.get_api_metadata`: Retrieve Odds API root metadata, reference, and OpenAPI links.
- `odds_api.get_status`: Retrieve the public Odds API health summary: component status, rate-limit pressure, and data freshness.
- `odds_api.get_coverage`: Retrieve bookmaker, sport, league, and recently seen market coverage.
- `odds_api.get_account`: Retrieve the authenticated Odds API identity and enabled product capabilities.
- `odds_api.get_usage`: Retrieve quota and API-credit usage counters for the authenticated API key.
- `odds_api.get_limits`: Retrieve response, stream, add-on, and account limits for the authenticated API key.
- `odds_api.search_events`: Retrieve sports event data from Odds API for custom apps and workflows.
- `odds_api.list_live_events`: Retrieve sports events that have started and may still be in play.
- `odds_api.get_event`: Retrieve detail for one canonical sports event.
- `odds_api.get_event_bookmakers`: Retrieve bookmakers currently attached to one sports event.
- `odds_api.get_odds`: Retrieve a normalized odds snapshot for an event.
- `odds_api.compare_odds`: Retrieve bookmaker comparison data for an event.
- `odds_api.find_arbitrage`: Retrieve arbitrage opportunity data from the bets snapshot.
- `odds_api.find_positive_ev`: Retrieve positive EV opportunity data from the bets snapshot.
- `odds_api.get_line_movement`: Retrieve odds history and line-movement data for a selection.
- `odds_api.get_exchange_orderbook`: Retrieve back/lay exchange order books (Betfair, Smarkets, Matchbook) for one sports event.
- `odds_api.get_exchange_markets`: Discover in-play exchange markets for one sports event and the opaque market IDs used by the multiplexed order book WebSocket.
- `odds_api.get_betfair_event_markets`: Discover in-play exchange markets from a native numeric Betfair event ID.
- `odds_api.get_prediction_market_orderbook`: Retrieve Polymarket and Kalshi probability order books linked to one sports event, with gross and fee-adjusted decimal odds.
- `odds_api.get_leagues`: Retrieve available league metadata, optionally filtered by sport.
- `odds_api.get_bookmakers`: Retrieve available bookmaker metadata.
- `odds_api.get_bookmaker_countries`: Retrieve country codes and bookmakers represented in the active bookmaker catalog.
- `odds_api.get_sports`: Retrieve available sports metadata.
- `odds_api.get_results`: Retrieve event result data.
- `odds_api.search_racing_events`: Retrieve racing event data for custom apps and workflows.
- `odds_api.get_racing_event`: Retrieve detail for one canonical racing event.
- `odds_api.get_racing_odds`: Retrieve normalized racing odds for a racing event.
- `odds_api.get_streaming_info`: Explain Odds API SSE and WebSocket streaming options for realtime apps.
- `odds_api.get_stream_connection`: Return production connection details for one public Odds API stream family without exposing API secrets.
- `odds_api.sample_odds_stream`: Collect a bounded SSE sample from an event odds stream for debugging.
- `odds_api.sample_event_odds_history_stream`: Collect a bounded SSE sample from an event odds history stream for debugging.
- `odds_api.sample_exchange_orderbook_stream`: Collect a bounded SSE sample from an event exchange order book stream for debugging.
- `odds_api.sample_prediction_orderbook_stream`: Collect a bounded SSE sample from an event prediction-market order book stream for debugging.
- `odds_api.sample_bets_stream`: Collect a bounded SSE sample from the betting opportunities stream for debugging.
- `odds_api.sample_racing_events_stream`: Collect a bounded SSE sample from the racing events stream for debugging.
- `odds_api.sample_racing_odds_stream`: Collect a bounded SSE sample from a racing event odds stream for debugging.
- `odds_api.open_stream`: Open a persistent MCP-managed SSE or WebSocket stream session.
- `odds_api.read_stream`: Read buffered events from a persistent MCP stream session.
- `odds_api.list_streams`: List persistent MCP stream sessions opened by this server process.
- `odds_api.close_stream`: Close a persistent MCP stream session and release its connection.
- `odds_api.get_market_schema`: Explain normalized market fields used by odds responses.

## Example config

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

Use mock mode for demos and generated apps:

```bash
ODDS_API_MOCK=1 npx @odds-api/mcp
```

Use raw REST examples instead when the user only wants one HTTP request. For realtime work, call `odds_api.get_streaming_info` and `odds_api.get_stream_connection`, then connect production apps directly to the returned raw Odds API SSE/WebSocket URL from a backend service. Use `odds_api.open_stream`, `odds_api.read_stream`, and `odds_api.close_stream` only when MCP should act as an optional server-side broker with reconnects and a bounded in-process buffer.
