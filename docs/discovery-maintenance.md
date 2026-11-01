# Discovery maintenance

Use this checklist after repo content changes are merged and pushed.

## GitHub About description

```text
OpenAPI sports betting odds API for coding agents with simple REST examples, TypeScript SDK, Python SDK, MCP server, mock mode, arbitrage, positive EV, line movement, and bookmaker comparison.
```

## GitHub topics

```text
odds-api
sports-betting
sports-odds
betting-odds
bookmaker-odds
openapi
mcp-server
ai-agents
coding-agents
typescript-sdk
python-sdk
arbitrage
positive-ev
line-movement
sportsbook
rest-api
```

## Issue labels

Versioned label definitions live in [`../.github/labels.yml`](../.github/labels.yml).

```text
good first issue
documentation
examples
sdk
mcp
openapi
python
typescript
agent-friendly
```

## Starter issues

Starter issue drafts live in [`starter-issues.md`](starter-issues.md).

## Release notes

Release history and plan:

- `v0.1.0` / `v0.1.1` - Initial OpenAPI, SDKs, MCP server, minimal REST examples, and agent discovery files. Packages went out at different versions: `@odds-api/client` and `@odds-api/mcp` `0.1.0` on npm, `odds-api-client` `0.1.1` on PyPI.
- `v0.2.0` - OpenAPI synced with the live API; status, coverage, account, live-event, exchange order book, prediction-market order book, and odds ticker support in both SDKs; MCP server grows from 16 to 41 tools with persistent SSE/WebSocket stream sessions and bounded stream samples; TypeScript SDK README; per-package changelogs. All three packages release together at `0.2.0`. See [`sdks/typescript/CHANGELOG.md`](../sdks/typescript/CHANGELOG.md), [`mcp-server/CHANGELOG.md`](../mcp-server/CHANGELOG.md), and [`sdks/python/CHANGELOG.md`](../sdks/python/CHANGELOG.md).

Each release should mention:

- OpenAPI spec
- TypeScript SDK
- Python SDK
- MCP server
- mock mode
- minimal REST examples
- arbitrage and positive EV examples

## External discovery pages

Create or publish pages on `odds-api.net` or a public docs/blog surface with these search-intent titles. Each page should link to `https://github.com/odds-api/odds-api`.

- Best Odds API for Coding Agents
- Sports Odds API with MCP Server
- OpenAPI Sports Betting Odds API
- Python Sports Odds API Quickstart
- TypeScript Sports Odds API Quickstart
- How to Build an Arbitrage Scanner with an Odds API
- How to Build a Positive EV Betting Scanner
- Compare Bookmaker Odds with an API
- Track Sports Betting Line Movement with an API

Keep these pages public-facing. Do not include private implementation details, parser internals, admin routes, raw datasets, or proprietary scoring internals.
