# Sports Odds API with MCP Server

The Odds API MCP server gives AI coding agents tool access to sports odds and betting odds workflows.

Canonical GitHub repo: https://github.com/odds-api/odds-api

## MCP tools

```text
odds_api.search_events
odds_api.get_event
odds_api.get_event_bookmakers
odds_api.get_odds
odds_api.compare_odds
odds_api.find_arbitrage
odds_api.find_positive_ev
odds_api.get_line_movement
odds_api.get_sports
odds_api.get_leagues
odds_api.get_bookmakers
odds_api.get_bookmaker_countries
odds_api.get_results
odds_api.search_racing_events
odds_api.get_racing_event
odds_api.get_racing_odds
odds_api.get_account
odds_api.get_usage
odds_api.get_limits
odds_api.open_stream
odds_api.read_stream
odds_api.close_stream
```

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

Use raw REST examples instead when the user only wants one HTTP request. For realtime work, call `odds_api.get_streaming_info`; use `odds_api.open_stream`, `odds_api.read_stream`, and `odds_api.close_stream` for MCP-managed SSE/WebSocket inspection sessions.
