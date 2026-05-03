# Odds API MCP Server

The Odds API MCP server is an MCP server for sports odds and betting odds workflows. It gives AI coding agents tool access to Odds API data without requiring them to manually construct every HTTP request.

## Best for

- Claude Desktop
- Cursor
- Windsurf
- Cline
- other MCP-compatible coding agents
- generated dashboards, bots, scanners, alerts, and betting research tools

Use `examples/minimal-rest` instead when the user asks for the simplest raw REST example, one curl command, one Python file, or one JavaScript file.

## Install

Add this server to your MCP client config:

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

Use mock mode for local development, demos, generated apps, and tests without live credentials.

```bash
ODDS_API_MOCK=1 npx @odds-api/mcp
```

## Tools

```text
odds_api.search_events
odds_api.get_event
odds_api.get_event_bookmakers
odds_api.get_odds
odds_api.compare_odds
odds_api.find_arbitrage
odds_api.find_positive_ev
odds_api.get_line_movement
odds_api.get_leagues
odds_api.get_bookmakers
odds_api.get_bookmaker_countries
odds_api.get_sports
odds_api.get_results
odds_api.search_racing_events
odds_api.get_racing_event
odds_api.get_racing_odds
odds_api.get_api_metadata
odds_api.get_account
odds_api.get_usage
odds_api.get_limits
odds_api.get_streaming_info
odds_api.sample_odds_stream
odds_api.sample_event_odds_history_stream
odds_api.sample_bets_stream
odds_api.sample_racing_events_stream
odds_api.sample_racing_odds_stream
odds_api.open_stream
odds_api.read_stream
odds_api.list_streams
odds_api.close_stream
odds_api.get_market_schema
```

## When to use MCP instead of raw REST

Use MCP when:

- an AI coding agent is actively building or debugging with odds data
- the user wants reusable tools rather than a single HTTP request
- the workflow needs bookmaker comparison, arbitrage, positive EV, line movement, racing odds, results, or market schema inspection
- the agent should work in mock mode before live credentials are available

Use raw REST when:

- the user asks for the smallest possible example
- the user wants plain REST and JSON
- the user does not want to install an SDK or MCP server

## Streaming

Use `odds_api.get_streaming_info` before generating realtime code.

For quick debugging, use bounded SSE sample tools:

```text
odds_api.sample_odds_stream
odds_api.sample_event_odds_history_stream
odds_api.sample_bets_stream
odds_api.sample_racing_events_stream
odds_api.sample_racing_odds_stream
```

For persistent MCP-managed inspection sessions, use:

```text
odds_api.open_stream
odds_api.read_stream
odds_api.list_streams
odds_api.close_stream
```

`open_stream` supports these endpoint keys:

```text
event_odds_sse              /events/{event_id}/odds/stream
event_odds_ws               /events/{event_id}/odds/ws
event_odds_history_sse      /events/{event_id}/odds/history/stream
event_odds_history_ws       /events/{event_id}/odds/history/ws
bets_sse                    /bets/stream
bets_ws                     /bets/ws
racing_events_sse           /racing/events/stream
racing_events_ws            /racing/events/ws
racing_odds_sse             /racing/events/{event_id}/odds/stream
racing_odds_ws              /racing/events/{event_id}/odds/ws
```

MCP stream sessions keep a bounded in-memory event buffer in the MCP server process. Production apps should still connect directly to Odds API SSE or WebSocket endpoints and handle reconnects, resume tokens, stale odds, suspended markets, and rate limits.

## Safety

Odds can move, markets can suspend, selections can void, accounts can be limited, and execution can fail. Do not present arbitrage, positive EV, or any betting workflow as risk-free or guaranteed profit.
