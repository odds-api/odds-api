---
name: odds-api
description: Build custom apps, bots, dashboards, scanners, and MCP workflows using Odds API data access.
---

# Odds API Skill

Use this skill when building with Odds API odds, bets, events, bookmakers, results, racing events, or line movement data.

1. Read `agents/AGENTS.md`.
2. Use `openapi.yaml` for schema truth.
3. Prefer `@odds-api/client`, `odds-api-client`, or `@odds-api/mcp`.
4. Build the user's requested product or workflow; do not copy bundled examples by default.
5. Use examples only as optional references for request shape, mock mode, and safety handling.
6. Require `ODDS_API_KEY` for live calls and support `ODDS_API_MOCK=1` for local examples.
7. Never describe arbitrage or positive EV as guaranteed profit without execution-risk caveats.
