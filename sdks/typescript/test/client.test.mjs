import assert from "node:assert/strict";
import test from "node:test";

import { OddsApiClient, oddsApiMockFetch } from "../dist/index.js";

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

test("mock transport mirrors public response shapes", async (t) => {
  const originalMock = process.env.ODDS_API_MOCK;
  process.env.ODDS_API_MOCK = "1";
  t.after(() => {
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const client = new OddsApiClient({ baseUrl: "https://api.odds-api.net/v1" });
  const metadata = await client.getApiMetadata();
  assert.equal(metadata.openapi, "/v1/openapi.json");

  const account = await client.getMe();
  assert.equal(account.account_id, "acct_mock");

  const usage = await client.getUsage();
  assert.equal(usage.exceeded, false);

  const limits = await client.getLimits();
  assert.equal(limits.sse.heartbeat_sec_min, 5);

  const snapshot = await client.getOddsSnapshot("event-1001");
  assert.equal(snapshot.resume, "1760000000000-0");
  assert.equal(snapshot.next_cursor, null);
  assert.equal(snapshot.items[0].bet_type, "moneyline");
  assert.equal(snapshot.items[0].period_str, "full time");
  assert.equal(Object.hasOwn(snapshot.items[0], "metric"), true);
  assert.equal(snapshot.items[0].fair_odds, 2.04);

  const fairSnapshot = await client.getOddsSnapshot("event-1001", { price_fields: "odds,fair" });
  assert.equal(fairSnapshot.items[0].fair_odds, 2.04);
  assert.equal(Object.hasOwn(fairSnapshot.items[0], "odds_no_vig"), false);

  const bets = await client.findPositiveEv({ limit: 1 });
  assert.equal(typeof bets.resume, "string");
  assert.deepEqual(JSON.parse(bets.resume), { pos_ev: "1760000000000-0" });
  assert.equal(bets.items[0].history_ready, true);
  assert.equal(bets.items[0].odds_history.primary_selection_key, "moneyline:home");

  const history = await client.getLineMovement("event-1001", "moneyline:home");
  assert.equal(history.meta.from_ts, "2026-04-27T00:00:00Z");
  assert.equal(history.meta.to_ts, "2026-04-27T01:00:00Z");

  const bookmakers = await client.listBookmakers();
  assert.equal(bookmakers.items[0].bookmaker, "bet365");
  assert.deepEqual(bookmakers.items[0].country_codes, ["AU", "UK"]);

  const bookmakerCountries = await client.listBookmakerCountries();
  assert.equal(bookmakerCountries.items[0].country_code, "AU");
});

test("mock fetch can be injected directly", async () => {
  const client = new OddsApiClient({
    baseUrl: "https://api.odds-api.net/v1",
    fetchImpl: oddsApiMockFetch
  });
  const racingOdds = await client.getRacingOdds("race-1001");
  assert.equal(racingOdds.resume, "1760000000000-0");
  assert.equal(racingOdds.items[0].bookmaker_name, "bet365");
  assert.equal(racingOdds.items[0].payload.markets[0].market_key, "win");
});
