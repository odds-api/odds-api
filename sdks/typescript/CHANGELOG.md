# Changelog: @odds-api/client

## 0.2.0 - Unreleased (release together with the other two packages)

Released at the same version as `@odds-api/mcp` and the Python SDK `odds-api-client`.

### Added

- Status, coverage and catalog: `getApiMetadata()`, `getStatus()`, `getCoverage()`, `listBookmakerCountries()`; `listBookmakers()` now accepts filters such as `country_code`.
- Account: `getMe()`, `getUsage()`, `getLimits()`.
- Live events: `listLiveEvents()` and the shared `EventList` type.
- Exchanges: `getExchangeOrderBook()`, `getExchangeMarkets()`, `getBetfairEventMarkets()` with typed order book and market responses.
- Prediction markets: `getPredictionMarketOrderBook()` with typed responses.
- Widgets: `getOddsTicker()`.
- `getEvent()` and `getRacingEvent()` accept query parameters; `getOddsHistory()` parameters are optional.
- Mock-mode fixtures for every new endpoint.
- Package README (npm previously showed no README) and this changelog.

### Changed

- Mock mode serves only the `pos_ev` and `arbitrage` opportunity strategies, matching the live opportunity feeds.

## 0.1.0 - 2026-05-02

- First npm release: REST client, sports and racing helpers, best-odds and bookmaker comparison helpers, bets snapshot helpers, and mock mode.
