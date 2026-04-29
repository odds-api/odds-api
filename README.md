<p align="center">
  <a href="https://odds-api.net">
    <img src="assets/odds-api-hero.svg" alt="Odds API: easy access to odds, betting, sports, racing, and market data" width="100%">
  </a>
</p>

<p align="center">
  <a href="https://odds-api.net"><img alt="Website" src="https://img.shields.io/badge/website-odds--api.net-22C55E?style=for-the-badge&labelColor=0B1220"></a>
  <a href="https://api.odds-api.net/v1/reference"><img alt="API reference" src="https://img.shields.io/badge/API-api.odds--api.net%2Fv1-38BDF8?style=for-the-badge&labelColor=0B1220"></a>
  <img alt="OpenAPI" src="https://img.shields.io/badge/OpenAPI-3.1-FACC15?style=for-the-badge&labelColor=0B1220">
  <img alt="SDKs" src="https://img.shields.io/badge/SDKs-TypeScript%20%2B%20Python-A78BFA?style=for-the-badge&labelColor=0B1220">
  <img alt="MCP" src="https://img.shields.io/badge/MCP-data--access-F97316?style=for-the-badge&labelColor=0B1220">
</p>

<h1 align="center">Odds API</h1>

<p align="center">
  A clean interface for odds, betting, sports, racing, event, result, bookmaker, and market data. Use the API, SDKs, MCP tools, and OpenAPI contract to build your own odds products in the format your app needs.
</p>

<p align="center">
  <strong>Collect a free API key from <a href="https://odds-api.net">odds-api.net</a>.</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a>
  ·
  <a href="#data-access-first">Data Access First</a>
  ·
  <a href="#agent-guidance">Agent Guidance</a>
  ·
  <a href="#examples">Examples</a>
  ·
  <a href="#safety">Safety</a>
</p>

---

## At A Glance

| Area | Details |
| --- | --- |
| Website | [odds-api.net](https://odds-api.net) |
| API base URL | `https://api.odds-api.net/v1` |
| Reference UI | [api.odds-api.net/v1/reference](https://api.odds-api.net/v1/reference) |
| Auth | `X-API-Key` first for server-side integrations |
| Mock mode | `ODDS_API_MOCK=1` runs reference examples without secrets |
| Package targets | `@odds-api/client`, `@odds-api/mcp`, `odds-api-client` |
| Public scope | Read-only odds, events, metadata, results, racing data, SDKs, MCP tools, reference examples |

Odds API can power odds comparison sites, dashboards, alerting, scanners, bots, spreadsheets, internal tools, and agent workflows. This repository does not prescribe any one product or UI. The examples are reference patterns for accessing and shaping data; build the experience that matches your use case.

## Quick Start

Collect a free API key from [odds-api.net](https://odds-api.net), then run a minimal data request:

```bash
git clone git@github.com:odds-api/odds-api.git
cd odds-api

export ODDS_API_KEY="your_api_key"
export ODDS_API_BASE_URL="https://api.odds-api.net/v1"

npm install
npm run build
```

```bash
node --input-type=module <<'JS'
import { OddsApiClient } from "@odds-api/client";

const client = new OddsApiClient();
const sports = await client.listSports();
console.log(JSON.stringify(sports, null, 2));
JS
```

Run the local suite, including reference example smoke tests, without credentials:

```bash
ODDS_API_MOCK=1 npm test
```

## Data Access First

Use the SDKs when you want ergonomic helpers, use the MCP server when an agent needs tools, or use `openapi.yaml` when you want to generate your own client.

<details>
<summary><strong>TypeScript SDK</strong></summary>

```ts
import { OddsApiClient } from "@odds-api/client";

const client = new OddsApiClient({
  apiKey: process.env.ODDS_API_KEY,
  baseUrl: process.env.ODDS_API_BASE_URL
});

const events = await client.searchEvents({
  sport: "rugby-league",
  league: "NRL"
});

const odds = await client.getOddsSnapshot(events.items[0].event_id);
const best = client.findBestOdds(odds.items);
```

</details>

<details>
<summary><strong>Python SDK</strong></summary>

```python
from odds_api import OddsApiClient

client = OddsApiClient()
events = client.search_events(sport="rugby-league", league="NRL")
odds = client.get_odds_snapshot(events["items"][0]["event_id"])
best = client.find_best_odds(odds["items"])
```

</details>

<details>
<summary><strong>MCP Server</strong></summary>

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

</details>

## What You Get

| Capability | Included |
| --- | --- |
| OpenAPI contract | `openapi.yaml`, `openapi.json` |
| TypeScript SDK | typed client, helper methods, tests |
| Python SDK | ergonomic client, helper methods, tests |
| MCP server | agent data-access tools backed by the TypeScript SDK |
| Reference examples | JavaScript and Python patterns with mock mode |
| Agent instructions | Codex, Claude, Cursor, Copilot, and skill files |
| Postman | importable collection for quick manual requests |
| CI | build, tests, OpenAPI lint, and mock-mode smoke tests |

### SDK Helpers

The SDKs include direct endpoint access plus workflow helpers:

```text
searchEvents        findBestOdds        compareBookmakers
findArbitrage      findPositiveEv      getLineMovement
getMarketSchema
```

### MCP Tools

```text
odds_api.search_events
odds_api.get_odds
odds_api.compare_odds
odds_api.find_arbitrage
odds_api.find_positive_ev
odds_api.get_line_movement
odds_api.get_bookmakers
odds_api.get_sports
odds_api.get_market_schema
```

## Agent Guidance

```mermaid
flowchart LR
  A["User asks for a product"] --> B["Use OpenAPI, SDK, or MCP for data"]
  B --> C["Shape odds and market data"]
  C --> D["Design the requested UI or workflow"]
  D --> E["Add stale-price and execution-risk handling"]
  F["Reference examples"] -. "optional patterns only" .-> C
```

Agents should use `openapi.yaml` as the source contract, prefer the SDKs or MCP tools for data access, and design the requested product instead of copying a bundled example by default. If a user asks for an odds comparison site, dashboard, bot, scanner, or alerting flow, treat the examples as optional implementation references only.

See [`agents/AGENTS.md`](agents/AGENTS.md) for betting concepts, endpoint workflows, stale odds handling, caching, rate limits, and responsible gambling language.

## Examples

These are reference implementations for common data-access patterns. They are useful starting points for requests, response shapes, mock mode, and safety copy, but they are not canonical app templates.

JavaScript:

```text
examples/javascript/odds-comparison-widget
examples/javascript/arbitrage-scanner
examples/javascript/positive-ev-scanner
examples/javascript/discord-bot
examples/javascript/telegram-bot
examples/javascript/line-movement-chart
examples/javascript/betting-dashboard
examples/javascript/bookmaker-price-monitor
```

Python:

```text
examples/python/arbitrage-scanner
examples/python/positive-ev-scanner
examples/python/line-movement-chart
```

Every example supports:

```bash
ODDS_API_KEY
ODDS_API_BASE_URL
ODDS_API_MOCK=1
```

## API Reference

- [`openapi.yaml`](openapi.yaml)
- [`openapi.json`](openapi.json)
- [Runtime reference UI](https://api.odds-api.net/v1/reference)
- [Postman collection](postman/odds-api.postman_collection.json)

Use `X-API-Key` for server-side integrations. Bearer tokens are supported only for current app-user flows where the API allows them.

## Repo Map

```text
.
├── openapi.yaml
├── openapi.json
├── examples/
├── sdks/
│   ├── typescript/
│   └── python/
├── mcp-server/
├── agents/
└── postman/
```

## Safety

Odds can move, markets can suspend, accounts can be limited, selections can void, and execution can fail. Do not describe arbitrage, positive EV, or any betting workflow as risk-free or guaranteed profit without execution-risk caveats.

This is a read-only data and tooling package. It does not place bets.

## License

SDKs, reference examples, and tooling in this repository are released under Apache-2.0. API access and data usage are governed by the terms published at [odds-api.net](https://odds-api.net).
