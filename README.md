# Odds API

AI-ready odds data infrastructure for building odds comparison widgets, arbitrage scanners, positive EV dashboards, alerts bots, line-movement tools, and bookmaker monitors.

This public repo is designed for humans and coding agents. The live Odds API service remains the source of truth; `openapi.yaml` and `openapi.json` are exported from the production `/v1` API schema.

- Website: [odds-api.net](https://odds-api.net)
- API base URL: `https://api.odds-api.net/v1`
- Runtime reference UI: [api.odds-api.net/v1/reference](https://api.odds-api.net/v1/reference)

## Quick Start

```bash
export ODDS_API_KEY="your_api_key"
export ODDS_API_BASE_URL="https://api.odds-api.net/v1"

npm install
npm run build
node examples/javascript/positive-ev-scanner/index.mjs
```

Run examples without credentials:

```bash
ODDS_API_MOCK=1 npm test
```

## Packages

- TypeScript SDK: `@odds-api/client`
- Python SDK: `odds-api-client`
- MCP server: `@odds-api/mcp`

## API Reference

- OpenAPI YAML: `openapi.yaml`
- OpenAPI JSON: `openapi.json`
- Runtime reference UI: `https://api.odds-api.net/v1/reference`

Use `X-API-Key` for server-side integrations. Bearer tokens are supported only for current app-user flows where the API allows them.

## Safety

Odds can move, markets can suspend, accounts can be limited, and selections can void. Do not describe arbitrage, positive EV, or any betting workflow as risk-free or guaranteed profit without execution-risk caveats.

## License

SDKs, examples, and tooling in this repository are released under Apache-2.0. API access and data usage are governed by the terms published at [odds-api.net](https://odds-api.net).
