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
odds_api.get_stream_connection
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

## Streaming

Use `odds_api.get_streaming_info` before generating realtime code, then use `odds_api.get_stream_connection` for the specific stream family. Production apps should connect directly to the returned raw Odds API SSE or WebSocket URL from a backend service.

`get_stream_connection` returns:

- snapshot URL to load initial state
- SSE URL
- WebSocket URL
- required headers without exposing secret values
- resume, catchup, resync, and browser/backend safety guidance

For quick debugging, the MCP server exposes bounded SSE sample tools:

```text
odds_api.sample_odds_stream
odds_api.sample_event_odds_history_stream
odds_api.sample_bets_stream
odds_api.sample_racing_events_stream
odds_api.sample_racing_odds_stream
```

These tools default to `max_events: 10` and `timeout_sec: 15`, with hard limits of `max_events <= 25` and `timeout_sec <= 30`.

For optional MCP-managed broker sessions, use:

```text
odds_api.open_stream
odds_api.read_stream
odds_api.list_streams
odds_api.close_stream
```

`open_stream` supports these public OpenAPI stream families over both SSE and WebSocket endpoint keys:

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

Broker mode keeps a direct upstream SSE/WebSocket connection, reconnects with the latest resume token, and stores events in a bounded in-process buffer. `read_stream` supports the legacy drain mode and non-destructive cursor reads. If the process restarts, the buffer drops events, or `resync_required` is true, reload the snapshot before applying more deltas.

Do not expose `ODDS_API_KEY` to browser code. Browser apps should use their own backend relay or a safe endpoint-specific auth flow.

## Safety

Do not present arbitrage, positive EV, or any betting workflow as guaranteed profit. User-facing products should mention stale prices, execution risk, market suspension, limits, voids, delays, and jurisdictional availability.

See the root [`README.md`](../README.md), [`AGENTS.md`](../AGENTS.md), [`llms.txt`](../llms.txt), and [`docs/mcp.md`](../docs/mcp.md).
