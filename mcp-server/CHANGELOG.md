# Changelog: @odds-api/mcp

## 0.2.0 - Unreleased (release together with the other two packages)

Released at the same version as `@odds-api/client` and the Python SDK `odds-api-client`. Depends on `@odds-api/client` `^0.2.0`.

### Added

- 25 new tools (41 in total, up from 16): `get_api_metadata`, `get_status`, `get_coverage`, `get_account`, `get_usage`, `get_limits`, `list_live_events`, `get_event`, `get_event_bookmakers`, `get_bookmaker_countries`, `get_racing_event`, `get_exchange_orderbook`, `get_exchange_markets`, `get_betfair_event_markets`, `get_prediction_market_orderbook`, `get_stream_connection`, the bounded stream samplers `sample_event_odds_history_stream`, `sample_exchange_orderbook_stream`, `sample_prediction_orderbook_stream`, `sample_racing_events_stream` and `sample_racing_odds_stream`, and the persistent stream broker tools `open_stream`, `read_stream`, `list_streams` and `close_stream`.
- Stream families for odds, odds history, exchange order books, prediction-market order books, bets, racing events and racing odds over SSE and WebSocket.
- `ws` runtime dependency for WebSocket stream sessions.
- This changelog; README links now point to absolute GitHub URLs so they work on npmjs.com.

## 0.1.0 - 2026-05-02

- First npm release with 16 tools for events, odds, bookmaker comparison, arbitrage, positive EV, line movement, catalog metadata, results, racing, streaming info, bounded odds and bets stream samples, and the market schema; mock mode.
