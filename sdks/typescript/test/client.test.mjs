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

test("order book, exchange discovery, live event, and widget methods build public URLs", async () => {
  const urls = [];
  const client = new OddsApiClient({
    apiKey: "test_key",
    baseUrl: "https://api.odds-api.net/v1",
    fetchImpl: async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }
  });

  await client.getStatus();
  await client.getCoverage({ bookmaker: "bet365", lookback_days: 7 });
  await client.listLiveEvents({ sport: "soccer" });
  await client.getExchangeOrderBook("event 1", { exchanges: ["betfair", "smarkets"], depth: 5 });
  await client.getExchangeMarkets("30000001", { id_type: "betfair" });
  await client.getBetfairEventMarkets("30000001", { market_types: "MATCH_ODDS" });
  await client.getPredictionMarketOrderBook("event-1", { providers: "kalshi" });
  await client.getOddsTicker({ league: "NRL", bookmakers: "bet365", widget_id: "home-ticker" });

  assert.deepEqual(urls, [
    "https://api.odds-api.net/v1/status",
    "https://api.odds-api.net/v1/coverage?bookmaker=bet365&lookback_days=7",
    "https://api.odds-api.net/v1/events/live?sport=soccer",
    "https://api.odds-api.net/v1/events/event%201/exchange/orderbook/snapshot?exchanges=betfair%2Csmarkets&depth=5",
    "https://api.odds-api.net/v1/events/30000001/exchange/markets?id_type=betfair",
    "https://api.odds-api.net/v1/exchange/betfair/events/30000001/markets?market_types=MATCH_ODDS",
    "https://api.odds-api.net/v1/events/event-1/prediction-markets/orderbook/snapshot?providers=kalshi",
    "https://api.odds-api.net/v1/widgets/odds-ticker?league=NRL&bookmakers=bet365&widget_id=home-ticker"
  ]);
});

test("mock mode covers order books, exchange discovery, live events, status, and coverage", async () => {
  const client = new OddsApiClient({ baseUrl: "https://api.odds-api.net/v1", fetchImpl: oddsApiMockFetch });

  const exchange = await client.getExchangeOrderBook("event-1001", { depth: 2 });
  assert.equal(exchange.resume, "1760000000000-0");
  assert.equal(exchange.items[0].exchange, "betfair");
  assert.equal(exchange.items[0].selections[0].best_back_price, 2.1);
  assert.deepEqual(exchange.items[0].selections[0].available_to_lay[0], { price: 2.12, size: 640 });

  const markets = await client.getExchangeMarkets("event-1001");
  assert.equal(markets.markets[0].market_id, "mkt_mock_match_odds");
  assert.deepEqual(markets.subscription.command.market_ids, ["mkt_mock_match_odds"]);

  const prediction = await client.getPredictionMarketOrderBook("event-1001");
  assert.equal(prediction.items[0].provider, "polymarket");
  assert.equal(prediction.items[0].contracts[0].best_ask_probability, 0.49);

  const live = await client.listLiveEvents();
  assert.equal(live.items[0].live_candidate, true);

  const status = await client.getStatus();
  assert.equal(status.source.fresh, true);

  const coverage = await client.getCoverage();
  assert.equal(coverage.markets[0].sample_event_id, "event-1001");

  const ticker = await client.getOddsTicker({ league: "NRL", bookmakers: "bet365", widget_id: "w1" });
  assert.equal(ticker.widget_id, "w1");
  assert.equal(ticker.events[0].markets[0].bookmakers[0].selections[0].price, 2.05);
});
