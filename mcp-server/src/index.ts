#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { OddsApiClient } from "@odds-api/client";

export function createServer(client = new OddsApiClient()) {
  const server = new McpServer({
    name: "odds-api",
    version: "0.1.0"
  });

  server.tool(
    "odds_api.search_events",
    "Retrieve sports event data from Odds API for custom apps and workflows.",
    {
      sport: z.string().optional(),
      league: z.string().optional(),
      start_from: z.number().optional(),
      start_to: z.number().optional(),
      limit: z.number().optional()
    },
    async (args) => jsonResult(await client.searchEvents(args))
  );

  server.tool(
    "odds_api.get_odds",
    "Retrieve a normalized odds snapshot for an event.",
    {
      event_id: z.string(),
      bookmakers: z.string().optional(),
      market_keys: z.string().optional(),
      types: z.string().optional()
    },
    async ({ event_id, ...params }) => jsonResult(await client.getOddsSnapshot(event_id, params))
  );

  server.tool(
    "odds_api.compare_odds",
    "Retrieve bookmaker comparison data for an event.",
    {
      event_id: z.string(),
      bookmakers: z.array(z.string()).min(1)
    },
    async ({ event_id, bookmakers }) => jsonResult(await client.compareBookmakers(event_id, bookmakers))
  );

  server.tool(
    "odds_api.find_arbitrage",
    "Retrieve arbitrage opportunity data from the bets snapshot.",
    { limit: z.number().optional() },
    async (args) => jsonResult(await client.findArbitrage(args))
  );

  server.tool(
    "odds_api.find_positive_ev",
    "Retrieve positive EV opportunity data from the bets snapshot.",
    { limit: z.number().optional() },
    async (args) => jsonResult(await client.findPositiveEv(args))
  );

  server.tool(
    "odds_api.get_line_movement",
    "Retrieve odds history and line-movement data for a selection.",
    {
      event_id: z.string(),
      selection_key: z.string(),
      price_type: z.string().optional(),
      bookmakers: z.string().optional()
    },
    async ({ event_id, selection_key, ...params }) =>
      jsonResult(await client.getLineMovement(event_id, selection_key, params))
  );

  server.tool(
    "odds_api.get_bookmakers",
    "Retrieve available bookmaker metadata.",
    {},
    async () => jsonResult(await client.listBookmakers())
  );

  server.tool(
    "odds_api.get_sports",
    "Retrieve available sports metadata.",
    {},
    async () => jsonResult(await client.listSports())
  );

  server.tool(
    "odds_api.get_market_schema",
    "Explain normalized market fields used by odds responses.",
    {},
    async () => jsonResult(client.getMarketSchema())
  );

  return server;
}

function jsonResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
