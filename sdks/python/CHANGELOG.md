# Changelog: odds-api-client

## 0.2.0 - Unreleased (release together with the other two packages)

Released at the same version as the npm packages `@odds-api/client` and `@odds-api/mcp`.

### Added

- Status, coverage and catalog: `get_api_metadata()`, `get_status()`, `get_coverage()`, `list_bookmaker_countries()`; `list_bookmakers()` now accepts filters such as `country_code`.
- Account: `get_me()`, `get_usage()`, `get_limits()`.
- Live events: `list_live_events()`.
- Exchanges: `get_exchange_orderbook()`, `get_exchange_markets()`, `get_betfair_event_markets()`.
- Prediction markets: `get_prediction_market_orderbook()`.
- Widgets: `get_odds_ticker()`.
- `get_event()` and `get_racing_event()` accept query parameters.
- `py.typed` marker, PyPI classifiers and a `dev` extra (`build`, `twine`).

### Fixed

- Path segments such as event IDs are URL-encoded.
- Boolean query parameters are sent as `true` / `false`.

## 0.1.1 - 2026-04-29

- First PyPI release: REST client, sports and racing helpers, best-odds and bookmaker comparison helpers, and bets snapshot helpers.
