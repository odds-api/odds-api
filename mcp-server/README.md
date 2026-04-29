# Odds API MCP Server

The Odds API MCP server is an MCP server for sports odds and betting odds workflows.

Use it when Claude, Cursor, Windsurf, Cline, or another MCP-compatible coding agent needs structured access to sports odds, racing odds, bookmakers, market schemas, betting opportunities, results, and streaming metadata.

Use raw REST from `examples/minimal-rest` when the user asks for one curl command or the smallest possible setup. Use the MCP server when the user wants agent-native tools or when an agent is building an app, dashboard, bot, scanner, or research workflow.

## Install

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

## Mock mode

Use mock mode for local demos, generated apps, agent testing, and examples without a live API key.

```bash
ODDS_API_MOCK=1 npx @odds-api/mcp
```

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

## Safety

Do not present arbitrage, positive EV, or any betting workflow as guaranteed profit. User-facing products should mention stale prices, execution risk, market suspension, limits, voids, delays, and jurisdictional availability.

See the root [`README.md`](../README.md), [`AGENTS.md`](../AGENTS.md), [`llms.txt`](../llms.txt), and [`docs/mcp.md`](../docs/mcp.md).
