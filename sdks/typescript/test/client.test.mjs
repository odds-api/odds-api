import assert from "node:assert/strict";
import test from "node:test";

import { OddsApiClient } from "../dist/index.js";

test("client sends API key and builds event search URL", async () => {
  const seen = {};
  const client = new OddsApiClient({
    apiKey: "test_key",
    baseUrl: "https://api.odds-api.net/v1",
    fetchImpl: async (url, init) => {
      seen.url = String(url);
      seen.headers = init.headers;
      return new Response(JSON.stringify({ items: [], count: 0 }), { status: 200 });
    }
  });

  const result = await client.searchEvents({ sport: "rugby-league", league: "NRL" });
  assert.equal(result.count, 0);
  assert.equal(seen.url, "https://api.odds-api.net/v1/events?sport=rugby-league&league=NRL");
  assert.equal(seen.headers["X-API-Key"], "test_key");
});

test("findBestOdds returns the best available price per selection", async () => {
  const client = new OddsApiClient({
    baseUrl: "https://api.odds-api.net/v1",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          event_id: "event-1",
          items: [
            { id: "a", event_id: "event-1", bookmaker: "book-a", selection_key: "home", market_key: "moneyline", type: "moneyline", period: 0, odds: 1.9, is_available: true },
            { id: "b", event_id: "event-1", bookmaker: "book-b", selection_key: "home", market_key: "moneyline", type: "moneyline", period: 0, odds: 2.1, is_available: true }
          ],
          resume: "0-0"
        }),
        { status: 200 }
      )
  });

  const best = await client.findBestOdds("event-1");
  assert.equal(best.length, 1);
  assert.equal(best[0].bookmaker, "book-b");
  assert.equal(best[0].odds, 2.1);
});

