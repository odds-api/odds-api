import { OddsApiClient } from "../../../sdks/typescript/dist/index.js";

export function createExampleClient() {
  const useMock = process.env.ODDS_API_MOCK === "1" || !process.env.ODDS_API_KEY;
  return new OddsApiClient({
    apiKey: process.env.ODDS_API_KEY,
    baseUrl: process.env.ODDS_API_BASE_URL || "https://api.odds-api.net/v1",
    fetchImpl: useMock ? mockFetch : undefined
  });
}

export function riskNote() {
  return "Note: odds move and markets can suspend. Do not treat any edge as guaranteed profit.";
}

async function mockFetch(input) {
  const url = new URL(String(input));
  const path = url.pathname.replace(/^\/v1/, "");

  if (path === "/events") {
    return json({
      items: [
        {
          event_id: "event-1001",
          sport: "rugby-league",
          league: "NRL",
          start_time: 1760000000,
          home_team: "Brisbane",
          away_team: "Sydney",
          bookmakers: { bet365: "odds-a", pinnacle: "odds-b", sportsbet: "odds-c" }
        }
      ],
      count: 1,
      next_cursor: null
    });
  }

  if (path.endsWith("/odds/snapshot")) {
    return json({
      event_id: "event-1001",
      as_of_ts_ms: Date.now(),
      ttl_seconds: 1800,
      resume: "0-0",
      items: [
        line("bet365", "home", 2.05),
        line("pinnacle", "home", 2.11),
        line("sportsbet", "home", 2.0),
        line("bet365", "away", 1.82),
        line("pinnacle", "away", 1.78),
        line("sportsbet", "away", 1.87)
      ]
    });
  }

  if (path.endsWith("/odds/history")) {
    return json({
      event_id: "event-1001",
      selection_key: url.searchParams.get("selection_key") || "moneyline:home",
      price_type: "odds",
      series: [
        {
          bookmaker_name: "bet365",
          points: [
            { tick_ts: "2026-04-27T00:00:00Z", odds: 1.95, is_available: true },
            { tick_ts: "2026-04-27T01:00:00Z", odds: 2.05, is_available: true }
          ]
        }
      ],
      meta: { available_price_types: ["odds", "odds_no_vig"] }
    });
  }

  if (path === "/bets/snapshot") {
    const strategy = url.searchParams.get("strategies") || "pos_ev";
    return json({
      items: [
        {
          id: `${strategy}-example`,
          strategy,
          event_id: "event-1001",
          selection_key: "moneyline:home",
          bookmaker_name: strategy === "arbitrage" ? "pinnacle + sportsbet" : "pinnacle",
          odds: 2.11,
          fair_odds: 1.98,
          ev: 6.6,
          arb_percent: strategy === "arbitrage" ? 1.8 : undefined
        }
      ],
      resume: { [strategy]: "0-0" }
    });
  }

  if (path === "/bookmakers") {
    return json({ items: ["bet365", "pinnacle", "sportsbet"] });
  }

  if (path === "/sports") {
    return json({ items: ["rugby-league", "soccer", "basketball"] });
  }

  return json({});
}

function line(bookmaker, side, odds) {
  return {
    id: `${bookmaker}:moneyline:${side}`,
    event_id: "event-1001",
    bookmaker,
    selection_key: `moneyline:${side}`,
    market_key: "moneyline",
    type: "moneyline",
    period: 0,
    side,
    selection_name: side === "home" ? "Brisbane" : "Sydney",
    odds,
    odds_no_vig: odds - 0.04,
    is_available: true
  };
}

function json(value) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

