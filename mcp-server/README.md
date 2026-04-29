# Odds API MCP

The MCP server exposes Odds API as a data-access layer for agents. Use it to retrieve and shape sports, racing, odds, bookmaker, market, result, and betting-opportunity data for the user's requested product.

It is not an app-template generator. If a user asks for an odds comparison site, dashboard, bot, scanner, or alert workflow, use these tools to get the right data and design the requested experience. Treat bundled examples as optional references only.

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
