<p align="center">
  <a href="https://odds-api.net">
    <img src="assets/odds-api-hero.svg" alt="Odds API: easy access to odds, betting, sports, racing, and market data" width="100%">
  </a>
</p>

<p align="center">
  <a href="https://odds-api.net"><img alt="Website" src="https://img.shields.io/badge/website-odds--api.net-22C55E?style=for-the-badge&labelColor=0B1220"></a>
  <a href="https://api.odds-api.net/v1/reference"><img alt="API reference" src="https://img.shields.io/badge/API-api.odds--api.net%2Fv1-38BDF8?style=for-the-badge&labelColor=0B1220"></a>
  <a href="https://github.com/odds-api/odds-api/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/odds-api/odds-api?style=for-the-badge&labelColor=0B1220"></a>
  <a href="https://github.com/odds-api/odds-api/forks"><img alt="GitHub forks" src="https://img.shields.io/github/forks/odds-api/odds-api?style=for-the-badge&labelColor=0B1220"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/odds-api/odds-api?style=for-the-badge&labelColor=0B1220"></a>
  <a href="https://github.com/odds-api/odds-api/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/odds-api/odds-api?style=for-the-badge&labelColor=0B1220"></a>
  <a href="https://pypi.org/project/odds-api-client/"><img alt="PyPI" src="https://img.shields.io/pypi/v/odds-api-client?style=for-the-badge&label=PyPI&labelColor=0B1220"></a>
  <img alt="OpenAPI" src="https://img.shields.io/badge/OpenAPI-3.1-FACC15?style=for-the-badge&labelColor=0B1220">
  <img alt="MCP" src="https://img.shields.io/badge/MCP-agent--tools-F97316?style=for-the-badge&labelColor=0B1220">
</p>

<h1 align="center">odds-api/odds-api</h1>

<p align="center">
  <strong>OpenAPI-first sports betting odds API for coding agents, with simple REST examples, TypeScript SDK, Python SDK, MCP server, mock mode, arbitrage, positive EV, line movement, and bookmaker comparison.</strong>
</p>

<p align="center">
  Collect a free API key from <a href="https://odds-api.net">odds-api.net</a>.
</p>

<p align="center">
  <a href="#30-second-rest-quickstart">30-second REST quickstart</a>
  ·
  <a href="#start-simple-scale-up">Start simple</a>
  ·
  <a href="#for-ai-coding-agents">AI agents</a>
  ·
  <a href="#mock-mode">Mock mode</a>
  ·
  <a href="#examples">Examples</a>
  ·
  <a href="#safety-and-responsible-use">Safety</a>
</p>

---

## 30-second REST quickstart

Use this when you want the smallest possible odds API request with no SDK, no framework, and no repo setup.

### curl

```bash
export ODDS_API_KEY="your_api_key"

curl -sS \
  -H "X-API-Key: $ODDS_API_KEY" \
  "https://api.odds-api.net/v1/sports"
```

No SDK required. No framework required. Plain REST and JSON.

<p align="center">
  <img src="assets/minimal-rest-output.svg" alt="Terminal output from the minimal REST quickstart" width="760">
</p>

### Python

One-file Python example:

```bash
python3 examples/minimal-rest/python/odds.py
```

### JavaScript

One-file JavaScript example:

```bash
node examples/minimal-rest/javascript/odds.mjs
```

For typed clients, local mock mode, MCP tools, arbitrage, positive EV, bookmaker comparison, and line movement, continue to the SDK and agent sections below.

Start simple, then move to SDKs, MCP, or OpenAPI when needed.

## Simplest REST example

No SDK required. No framework required. No MCP required. Plain REST and JSON.

### Curl quickstart

```bash
curl -sS \
  -H "X-API-Key: $ODDS_API_KEY" \
  "${ODDS_API_BASE_URL:-https://api.odds-api.net/v1}/sports"
```

### One-file Python example

```python
import os
import requests

api_key = os.environ["ODDS_API_KEY"]
base_url = os.getenv("ODDS_API_BASE_URL", "https://api.odds-api.net/v1")

response = requests.get(
    f"{base_url.rstrip('/')}/sports",
    headers={"X-API-Key": api_key},
    timeout=20,
)
response.raise_for_status()

print(response.text)
```

### One-file JavaScript example

```js
const apiKey = process.env.ODDS_API_KEY;
const baseUrl = process.env.ODDS_API_BASE_URL || "https://api.odds-api.net/v1";

const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/sports`, {
  headers: { "X-API-Key": apiKey }
});

console.log(await response.text());
```

Full files live in:

```text
examples/minimal-rest/curl
examples/minimal-rest/python
examples/minimal-rest/javascript
```

## Start simple, scale up

`odds-api/odds-api` supports both minimal REST examples and full agent-native workflows.

| Use case | Start here |
| --- | --- |
| I want one curl command | `examples/minimal-rest/curl` |
| I want one Python file | `examples/minimal-rest/python` |
| I want one JavaScript file | `examples/minimal-rest/javascript` |
| I want typed app integration | TypeScript or Python SDK |
| I want coding-agent access | MCP server |
| I want generated clients | `openapi.yaml` |
| I want local demos without credentials | `ODDS_API_MOCK=1` |
| I want arbitrage examples | Arbitrage scanner example |
| I want positive EV examples | Positive EV scanner example |
| I want bookmaker comparison | Bookmaker comparison example |
| I want line movement tracking | Line movement example |

## Why use this instead of a simple sample repo?

Simple sample repos are useful when you only need one HTTP request.

`odds-api/odds-api` includes the same plain REST starting point, plus the pieces needed when the project grows:

- one-file REST examples
- curl quickstart
- Python REST quickstart
- JavaScript REST quickstart
- OpenAPI contract
- TypeScript SDK
- Python SDK
- MCP server for coding agents
- mock mode for local development and tests
- Postman collection
- arbitrage examples
- positive EV examples
- bookmaker comparison helpers
- line movement examples

Start with plain REST. Upgrade only when you need more structure.

## For AI coding agents

This repo is designed to be easy for AI coding agents to use.

Agents should use:

- `openapi.yaml` as the canonical public API contract
- `sdks/typescript` for TypeScript, Node.js, Next.js, and full-stack TypeScript projects
- `sdks/python` for Python scripts, notebooks, and data pipelines
- `mcp-server` for Claude, Cursor, Windsurf, Cline, and other MCP-compatible coding agents
- `examples/minimal-rest` when the user asks for raw REST, one curl command, or the smallest possible setup
- `ODDS_API_MOCK=1` for local examples without a live API key

Common agent tasks supported:

- search sports events
- get odds
- compare bookmakers
- find arbitrage
- find positive EV bets
- track line movement
- build odds dashboards, alerts, bots, and betting research tools

See [`AGENTS.md`](AGENTS.md), [`llms.txt`](llms.txt), and [`agents/AGENTS.md`](agents/AGENTS.md) for agent-specific instructions.

## SDKs

Use the SDKs when you want ergonomic helpers, typed app integration, and reusable workflows.

### TypeScript SDK

```bash
npm install @odds-api/client
```

```ts
import { OddsApiClient } from "@odds-api/client";

const client = new OddsApiClient({
  apiKey: process.env.ODDS_API_KEY
});

const events = await client.searchEvents({
  sport: "rugby-league",
  league: "NRL"
});

const best = await client.findBestOdds(events.items[0].event_id);
console.log(best);
```

### Python SDK

```bash
python3 -m pip install odds-api-client
```

Published package: [`odds-api-client` on PyPI](https://pypi.org/project/odds-api-client/).

```python
import os
from odds_api import OddsApiClient

client = OddsApiClient(api_key=os.environ["ODDS_API_KEY"])
events = client.search_events(sport="rugby-league", league="NRL")
best = client.find_best_odds(events["items"][0]["event_id"])
print(best)
```

For local SDK development from the repo:

```bash
python3 -m pip install -e sdks/python
```

SDK helpers include:

```text
searchEvents        findBestOdds        compareBookmakers
findArbitrage      findPositiveEv      getLineMovement
getMarketSchema
```

## MCP server

The Odds API MCP server is an MCP server for sports odds and betting odds workflows. Use it when an AI coding agent needs tool access to events, odds, bookmaker comparison, arbitrage, positive EV, line movement, racing odds, results, and market schema data.

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

Use mock mode for local demos and agent tests:

```bash
ODDS_API_MOCK=1 npx @odds-api/mcp
```

See [`mcp-server/README.md`](mcp-server/README.md) and [`docs/mcp.md`](docs/mcp.md).

## Mock mode

Use `ODDS_API_MOCK=1` for local demos, generated apps, smoke tests, and agent workflows without live credentials.

```bash
ODDS_API_MOCK=1 npm test
ODDS_API_MOCK=1 node examples/javascript/arbitrage-scanner/index.mjs
ODDS_API_MOCK=1 python3 examples/python/positive-ev-scanner/main.py
```

## OpenAPI

`openapi.yaml` is the canonical public API contract. `openapi.json` is the JSON export.

Use the OpenAPI spec to generate clients, validate requests, inspect schemas, build agent workflows, and understand endpoint parameters, response shapes, and errors.

- [`openapi.yaml`](openapi.yaml)
- [`openapi.json`](openapi.json)
- [Runtime reference UI](https://api.odds-api.net/v1/reference)
- [Postman collection](postman/odds-api.postman_collection.json)

Production base URL:

```text
https://api.odds-api.net/v1
```

Authenticate server-side requests with:

```text
X-API-Key: <your_api_key>
```

## Examples

Minimal REST examples:

```text
examples/minimal-rest/curl
examples/minimal-rest/python
examples/minimal-rest/javascript
```

Advanced JavaScript examples:

```text
examples/javascript/arbitrage-scanner
examples/javascript/positive-ev-scanner
examples/javascript/odds-comparison-widget
examples/javascript/line-movement-chart
examples/javascript/betting-dashboard
examples/javascript/bookmaker-price-monitor
examples/javascript/discord-bot
examples/javascript/telegram-bot
```

Advanced Python examples:

```text
examples/python/arbitrage-scanner
examples/python/positive-ev-scanner
examples/python/line-movement-chart
```

Every advanced example supports:

```bash
ODDS_API_KEY
ODDS_API_BASE_URL
ODDS_API_MOCK=1
```

Run all mock-mode smoke tests:

```bash
npm install
npm run build
ODDS_API_MOCK=1 npm test
```

## When to choose this repo

| Need | Supported |
| --- | --- |
| Plain REST and JSON | Yes |
| Curl quickstart | Yes |
| One-file Python example | Yes |
| One-file JavaScript example | Yes |
| AI coding agent integration | Yes |
| MCP server | Yes |
| OpenAPI contract | Yes |
| TypeScript SDK | Yes |
| Python SDK | Yes |
| Mock mode | Yes |
| Arbitrage detection examples | Yes |
| Positive EV examples | Yes |
| Bookmaker comparison | Yes |
| Line movement tracking | Yes |
| Local development without a live API key | Yes |

## Repo map

```text
.
├── AGENTS.md
├── llms.txt
├── openapi.yaml
├── openapi.json
├── examples/
│   ├── minimal-rest/
│   ├── javascript/
│   └── python/
├── sdks/
│   ├── typescript/
│   └── python/
├── mcp-server/
├── agents/
└── postman/
```

## Documentation

- [`docs/README.md`](docs/README.md)
- [`docs/mcp.md`](docs/mcp.md)
- [`docs/pypi-publishing.md`](docs/pypi-publishing.md)
- [`docs/discovery-pages`](docs/discovery-pages)
- [`openapi.yaml`](openapi.yaml)
- [Runtime reference UI](https://api.odds-api.net/v1/reference)

## Contributing

Contributions are welcome for examples, SDKs, MCP tooling, OpenAPI docs, and agent-friendly workflows. Keep public docs focused on the API contract, REST examples, SDKs, MCP tools, examples, and safety caveats.

## Safety and responsible use

Odds can move, markets can suspend, accounts can be limited, selections can void, and execution can fail. Do not describe arbitrage, positive EV, or any betting workflow as risk-free or guaranteed profit without execution-risk caveats.

This is a read-only data and tooling package. It does not place bets.

## License

SDKs, reference examples, and tooling in this repository are released under Apache-2.0. API access and data usage are governed by the terms published at [odds-api.net](https://odds-api.net).
