# Starter issue drafts

Use these after the branch is merged and labels are available in GitHub.

## Add OpenAPI schema examples for common odds workflows

Labels: `good first issue`, `documentation`, `openapi`, `agent-friendly`

Add short examples that show how to use `openapi.yaml` for common workflows:

- search events
- get odds snapshot
- compare bookmakers
- get line movement
- request arbitrage or positive EV snapshots

Acceptance criteria:

- examples link to `openapi.yaml`
- examples use `https://api.odds-api.net/v1`
- no private implementation details are included
- betting workflows include execution-risk language

## Add MCP setup notes for another MCP-compatible client

Labels: `documentation`, `mcp`, `agent-friendly`

Extend `docs/mcp.md` with setup notes for another MCP-compatible client.

Acceptance criteria:

- includes config snippet
- mentions `ODDS_API_KEY`, `ODDS_API_BASE_URL`, and `ODDS_API_MOCK=1`
- explains when to use MCP instead of raw REST
- includes streaming caveats

## Add a bookmaker comparison dashboard walkthrough

Labels: `examples`, `documentation`, `typescript`, `agent-friendly`

Create a walkthrough that starts from `examples/javascript/odds-comparison-widget` and explains how to build a simple bookmaker comparison dashboard.

Acceptance criteria:

- shows expected output
- links to `openapi.yaml`
- handles empty events and empty odds
- mentions stale odds and market suspension

## Add mock responses for line movement examples

Labels: `examples`, `sdk`, `python`, `typescript`

Expand line movement mock responses to cover multiple bookmakers and more than two points.

Acceptance criteria:

- JavaScript and Python examples still pass under `ODDS_API_MOCK=1`
- expected output in example READMEs is updated
- smoke tests pass

## Add a terminal screenshot for the minimal REST quickstart

Labels: `documentation`, `examples`, `good first issue`

Replace or supplement `assets/minimal-rest-output.svg` with a real captured terminal screenshot of the minimal REST quickstart.

Acceptance criteria:

- image is readable at README width
- output matches the minimal REST docs
- no API key or secret appears in the image

## Add TypeScript positive EV scanner walkthrough

Labels: `examples`, `typescript`, `documentation`

Expand `examples/javascript/positive-ev-scanner/README.md` with a step-by-step walkthrough.

Acceptance criteria:

- includes mock and live commands
- explains `findPositiveEv`
- explains stale odds and execution risk
- keeps the quickstart concise
