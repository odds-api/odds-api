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
odds_api.sample_exchange_orderbook_stream
odds_api.sample_prediction_orderbook_stream
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
exchange_orderbook_sse      /events/{event_id}/exchange/orderbook/stream
exchange_orderbook_ws       /events/{event_id}/exchange/orderbook/ws
prediction_orderbook_sse    /events/{event_id}/prediction-markets/orderbook/stream
prediction_orderbook_ws     /events/{event_id}/prediction-markets/orderbook/ws
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

See the repository [`README.md`](https://github.com/odds-api/odds-api/blob/main/README.md), [`AGENTS.md`](https://github.com/odds-api/odds-api/blob/main/AGENTS.md), [`llms.txt`](https://github.com/odds-api/odds-api/blob/main/llms.txt), and [`docs/mcp.md`](https://github.com/odds-api/odds-api/blob/main/docs/mcp.md). Source: https://github.com/odds-api/odds-api/tree/main/mcp-server
