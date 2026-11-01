# @odds-api/client

TypeScript SDK for [odds-api.net](https://odds-api.net), an OpenAPI-first sports betting odds API for coding agents and developers.

Use it for typed access to sports events, odds snapshots, bookmaker comparison, arbitrage and positive EV opportunities, line movement, exchange and prediction-market order books, racing odds, and results. It has no runtime dependencies and works in Node.js 20+.

Get an API key at [odds-api.net](https://odds-api.net). Want to trial it first? Email support@odds-api.net. Plans: https://odds-api.net/pricing

## Install

```bash
npm install @odds-api/client
```

## Configure

The client reads these environment variables when the matching option is not passed:

| Variable | Purpose |
|---|---|
| `ODDS_API_KEY` | API key, sent as the `X-API-Key` header |
| `ODDS_API_BASE_URL` | Base URL, default `https://api.odds-api.net/v1` |
| `ODDS_API_MOCK` | Set to `1` to serve built-in mock responses instead of calling the API |

Keep `ODDS_API_KEY` on the server. Do not ship it to browser code.

## Quickstart

```ts
import { OddsApiClient, OddsApiError } from "@odds-api/client";

const client = new OddsApiClient({
  apiKey: process.env.ODDS_API_KEY
  // baseUrl: process.env.ODDS_API_BASE_URL
});

try {
  const events = await client.searchEvents({ sport: "rugby-league", league: "NRL" });
  const eventId = events.items[0]?.event_id;
  if (eventId) {
    const best = await client.findBestOdds(eventId);
    console.log(best.slice(0, 5));
  }
} catch (error) {
  if (error instanceof OddsApiError) console.error(error.status, error.body);
  else throw error;
}
```

## Mock mode

Mock mode returns deterministic fixtures for local development, demos, generated apps, and tests without a live API key.

```bash
ODDS_API_MOCK=1 node app.mjs
```

Or pass the mock fetch explicitly:

```ts
import { MOCK_EVENT_ID, OddsApiClient, oddsApiMockFetch } from "@odds-api/client";

const client = new OddsApiClient({ fetchImpl: oddsApiMockFetch });
const snapshot = await client.getOddsSnapshot(MOCK_EVENT_ID);
```

## Methods

- Catalog and account: `listSports()`, `listLeagues()`, `listBookmakers()`, `listBookmakerCountries()`, `getCoverage()`, `getStatus()`, `getApiMetadata()`, `getMe()`, `getUsage()`, `getLimits()`
- Events: `searchEvents()`, `listLiveEvents()`, `getEvent()`, `getEventBookmakers()`, `getResults()`
- Odds: `getOddsSnapshot()`, `getOddsHistory()`, `getLineMovement()`, `findBestOdds()`, `compareBookmakers()`, `getOddsTicker()`
- Opportunities: `getBetsSnapshot()`, `findPositiveEv()`, `findArbitrage()`
- Exchanges and prediction markets: `getExchangeOrderBook()`, `getExchangeMarkets()`, `getBetfairEventMarkets()`, `getPredictionMarketOrderBook()`
- Racing: `searchRacingEvents()`, `getRacingEvent()`, `getRacingOdds()`
- Helpers: `getMarketSchema()`, plus low-level `get()`, `post()` and `request()` for any other public endpoint

Each API request uses 1 API credit. Check your counters with `getUsage()`.

## Safety

Arbitrage and positive EV results are betting research, not guaranteed profit. Account for stale odds, limits, delays, suspensions, voids, jurisdiction, and execution risk.

## Links

- Docs and API reference: https://api.odds-api.net/v1/reference
- OpenAPI: https://github.com/odds-api/odds-api/blob/main/openapi.yaml
- GitHub: https://github.com/odds-api/odds-api
- Source: https://github.com/odds-api/odds-api/tree/main/sdks/typescript
- MCP server: [`@odds-api/mcp`](https://www.npmjs.com/package/@odds-api/mcp)
- Python SDK: [`odds-api-client`](https://pypi.org/project/odds-api-client/) on PyPI
- Changelog: https://github.com/odds-api/odds-api/blob/main/sdks/typescript/CHANGELOG.md
