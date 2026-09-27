import type { FetchLike, QueryParams } from "./index.js";

export const MOCK_EVENT_ID = "event-1001";
export const MOCK_RACING_EVENT_ID = "race-1001";
export const MOCK_RESUME = "1760000000000-0";
export const MOCK_NEXT_RESUME = "1760000000001-0";

const MOCK_NOW_MS = 1760000000000;
const MOCK_NOW_SEC = 1760000000;
const MOCK_EVENT = {
  event_id: MOCK_EVENT_ID,
  sport: "rugby-league",
  league: "NRL",
  start_time: MOCK_NOW_SEC + 7200,
  home_team: "Brisbane Broncos",
  away_team: "Sydney Roosters",
  last_capture: MOCK_NOW_SEC,
  bookmakers: {
    bet365: "odds-bet365-event-1001",
    pinnacle: "odds-pinnacle-event-1001",
    sportsbet: "odds-sportsbet-event-1001"
  }
};

const MOCK_BOOKMAKERS = [
  { bookmaker: "bet365", country_codes: ["AU", "UK"] },
  { bookmaker: "pinnacle", country_codes: ["AU", "US"] },
  { bookmaker: "sportsbet", country_codes: ["AU"] }
];

const MOCK_ODD_LINES = [
  oddLine({
    id: "bet365::moneyline::moneyline::0::::home::",
    bookmaker: "bet365",
    selection_key: "moneyline:home",
    market_group_id: "moneyline::0",
    market_key: "moneyline",
    type: "moneyline",
    bet_type: "moneyline",
    period: 0,
    period_str: "full time",
    side: "home",
    selection_name: "Brisbane Broncos",
    odds: 2.05,
    odds_no_vig: 2.01,
    fair_odds: 2.04
  }),
  oddLine({
    id: "pinnacle::moneyline::moneyline::0::::home::",
    bookmaker: "pinnacle",
    selection_key: "moneyline:home",
    market_group_id: "moneyline::0",
    market_key: "moneyline",
    type: "moneyline",
    bet_type: "moneyline",
    period: 0,
    period_str: "full time",
    side: "home",
    selection_name: "Brisbane Broncos",
    odds: 2.11,
    odds_no_vig: 2.07,
    fair_odds: 2.04
  }),
  oddLine({
    id: "sportsbet::moneyline::moneyline::0::::away::",
    bookmaker: "sportsbet",
    selection_key: "moneyline:away",
    market_group_id: "moneyline::0",
    market_key: "moneyline",
    type: "moneyline",
    bet_type: "moneyline",
    period: 0,
    period_str: "full time",
    side: "away",
    selection_name: "Sydney Roosters",
    odds: 1.87,
    odds_no_vig: 1.83
  }),
  oddLine({
    id: "bet365::total::total::0::44.5::over::",
    bookmaker: "bet365",
    selection_key: "total:over:44.5",
    market_group_id: "total::0::44.5",
    market_key: "total",
    type: "total",
    bet_type: "total",
    period: 0,
    period_str: "full time",
    metric: "points",
    line: "44.5",
    side: "over",
    selection_name: "Over 44.5",
    odds: 1.91,
    odds_no_vig: 1.88
  }),
  oddLine({
    id: "pinnacle::handicap::handicap::0::-4.5::home::",
    bookmaker: "pinnacle",
    selection_key: "handicap:home:-4.5",
    market_group_id: "handicap::0::-4.5",
    market_key: "handicap",
    type: "handicap",
    bet_type: "handicap",
    period: 0,
    period_str: "full time",
    metric: "points",
    line: "-4.5",
    side: "home",
    selection_name: "Brisbane Broncos -4.5",
    odds: 1.96,
    odds_no_vig: 1.92
  })
];

const MOCK_RACING_EVENT = {
  event_id: MOCK_RACING_EVENT_ID,
  race_start_time: MOCK_NOW_SEC + 1800,
  race_type: "thoroughbred",
  race_venue: "Eagle Farm",
  race_number: "R3",
  race_state: "QLD",
  race_country: "AU",
  race_distance: "1200m",
  active_runners: 8,
  status: "open",
  bookmaker_links: {
    bet365: "https://example.invalid/racing/bet365/race-1001",
    sportsbet: "https://example.invalid/racing/sportsbet/race-1001"
  },
  scrapping_links: {},
  last_capture: MOCK_NOW_SEC
};

const MOCK_RACING_ODDS = [
  {
    bookmaker_name: "bet365",
    race_id: MOCK_RACING_EVENT_ID,
    status: "open",
    updated_at_ts: MOCK_NOW_SEC,
    payload: {
      race_id: MOCK_RACING_EVENT_ID,
      bookmaker_name: "bet365",
      markets: [
        {
          market_key: "win",
          selections: [
            { selection_number: "1", selection_name: "Example Runner", odds: 3.4, is_available: true },
            { selection_number: "2", selection_name: "Sample Speed", odds: 4.2, is_available: true }
          ]
        }
      ]
    }
  }
];

export interface OddsApiMockSseMessage {
  event: "delta" | "heartbeat" | "resync";
  data: unknown;
  id?: string;
}

const MOCK_EXCHANGE_ORDER_BOOK = {
  id: "betfair::moneyline::0",
  market_id: "mkt_mock_match_odds",
  event_id: MOCK_EVENT_ID,
  exchange: "betfair",
  exchange_market_id: "1.234567890",
  sport: "rugby-league",
  market_key: "moneyline",
  market_name: "Match Odds",
  type: "moneyline",
  bet_type: "moneyline",
  period: 0,
  period_str: "full time",
  home_team: "Brisbane Broncos",
  away_team: "Sydney Roosters",
  status: "OPEN",
  in_play: false,
  total_matched: 125430.5,
  currency: "AUD",
  freshness: "fresh",
  actively_collected: true,
  observed_at: "2026-04-27T01:00:00Z",
  selections: [
    {
      selection_key: "moneyline:home",
      selection_name: "Brisbane Broncos",
      side: "home",
      status: "ACTIVE",
      last_traded_price: 2.1,
      available_to_back: [
        { price: 2.1, size: 850 },
        { price: 2.08, size: 1200 }
      ],
      available_to_lay: [
        { price: 2.12, size: 640 },
        { price: 2.14, size: 900 }
      ],
      best_back_price: 2.1,
      best_back_size: 850,
      best_lay_price: 2.12,
      best_lay_size: 640
    }
  ]
};

const MOCK_EXCHANGE_MARKETS = {
  event_id: MOCK_EVENT_ID,
  exchange: "betfair",
  count: 1,
  available_market_types: ["MATCH_ODDS"],
  markets: [
    {
      market_id: "mkt_mock_match_odds",
      event_id: MOCK_EVENT_ID,
      betfair_event_id: "30000001",
      exchange: "betfair",
      sport: "rugby-league",
      market_key: "moneyline",
      bet_type: "moneyline",
      metric: "points",
      period: "full time",
      source_market_type: "MATCH_ODDS",
      market_name: "Match Odds",
      event_name: "Brisbane Broncos v Sydney Roosters",
      competition_name: "NRL",
      start_time: "2026-10-09T09:00:00Z",
      in_play_supported: true,
      ladder_depth_max: 10,
      runners: [
        { selection_id: 1001, name: "Brisbane Broncos", handicap: 0, sort_priority: 1 },
        { selection_id: 1002, name: "Sydney Roosters", handicap: 0, sort_priority: 2 }
      ]
    }
  ],
  subscription: {
    websocket_url: "wss://api.odds-api.net/v1/exchange/orderbooks/ws",
    command: { op: "subscribe", market_ids: ["mkt_mock_match_odds"], depth: 3 },
    max_markets_per_connection: 5
  },
  score_subscription: null
};

const MOCK_PREDICTION_ORDER_BOOK = {
  id: "polymarket::moneyline::0",
  event_id: MOCK_EVENT_ID,
  provider: "polymarket",
  provider_market_id: "pm_mock_market",
  market_key: "moneyline",
  market_name: "Brisbane Broncos to win",
  type: "moneyline",
  bet_type: "moneyline",
  period: 0,
  period_str: "full time",
  home_team: "Brisbane Broncos",
  away_team: "Sydney Roosters",
  status: "open",
  in_play: false,
  currency: "USD",
  size_unit: "contracts",
  fee_estimated: true,
  observed_at: "2026-04-27T01:00:00Z",
  contracts: [
    {
      contract_id: "pm_mock_market:yes",
      contract_name: "Yes",
      outcome: "yes",
      side: "home",
      status: "open",
      probability_bids: [{ price: 0.47, size: 1500 }],
      probability_asks: [{ price: 0.49, size: 1200 }],
      best_bid_probability: 0.47,
      best_bid_size: 1500,
      best_ask_probability: 0.49,
      best_ask_size: 1200,
      last_trade_probability: 0.48,
      gross_decimal_odds: 2.04,
      fee_adjusted_decimal_odds: 2.01
    }
  ]
};

export const oddsApiMockFetch: FetchLike = async (input) => {
  const url = toUrl(input);
  const path = publicPath(url);

  if (path === "/") {
    return json({
      name: "Odds API",
      version: "1.0.0",
      openapi: "/v1/openapi.json",
      reference: "/v1/reference"
    });
  }

  if (path === "/me") {
    return json({
      account_id: "acct_mock",
      plan: "mock",
      products: ["sports_odds", "racing_odds", "bets"],
      capabilities: ["snapshots", "sse", "websocket"]
    });
  }

  if (path === "/usage") {
    return json({
      period_start_utc: "2026-05-01T00:00:00Z",
      period_end_utc: "2026-06-01T00:00:00Z",
      plan: "mock",
      pricing_model: "odds_api_net_v2",
      api_credits_used: 42,
      api_credits_limit: 100000,
      exceeded: false
    });
  }

  if (path === "/limits") {
    return json({
      responses: {
        events_limit_max: 1000,
        odds_snapshot_limit_max: 10000,
        bets_snapshot_limit_max: 20000
      },
      sse: {
        heartbeat_sec_min: 5,
        heartbeat_sec_max: 120,
        max_batch_default: 500
      }
    });
  }

  if (path === "/events") {
    return json({ items: [clone(MOCK_EVENT)], next_cursor: null, count: 1 });
  }

  if (path === "/status") {
    return json({
      status: "operational",
      as_of: "2026-04-27T01:00:00Z",
      window_seconds: 300,
      components: [{ id: "sports_odds", name: "Sports odds", status: "operational" }],
      rate_limits: { status: "normal", throttled_pct: 0 },
      source: { fresh: true, age_seconds: 4 }
    });
  }

  if (path === "/coverage") {
    return json({
      as_of: "2026-04-27T01:00:00Z",
      bookmakers: clone(MOCK_BOOKMAKERS),
      sports: ["rugby-league"],
      leagues: [{ sport: "rugby-league", league: "NRL" }],
      markets: [
        {
          bookmaker: "bet365",
          sport: "rugby-league",
          league: "NRL",
          bet_type: "moneyline",
          metric: null,
          period: "full time",
          last_seen_at: "2026-04-27T01:00:00Z",
          sample_event_id: MOCK_EVENT_ID
        }
      ],
      source: { markets_are_approximate: true, lookback_days: 7 }
    });
  }

  if (path === "/widgets/odds-ticker") {
    return json({
      league: url.searchParams.get("league") || "NRL",
      widget_id: url.searchParams.get("widget_id") || "mock-widget",
      last_updated: "2026-04-27T01:00:00Z",
      events: [
        {
          league: "NRL",
          event_name: "Brisbane Broncos v Sydney Roosters",
          start_time: MOCK_NOW_SEC + 7200,
          last_updated: "2026-04-27T01:00:00Z",
          markets: [
            {
              market: "moneyline",
              bookmakers: [{ label: "bet365", selections: [{ selection: "Brisbane Broncos", price: 2.05 }] }]
            }
          ]
        }
      ]
    });
  }

  if (path === "/events/live") {
    return json({
      items: [{ ...clone(MOCK_EVENT), event_state: "in_play", live_candidate: true, has_available_bets: true }],
      next_cursor: null,
      count: 1
    });
  }

  if (path.match(/^\/events\/[^/]+\/exchange\/orderbook\/snapshot$/)) {
    const event_id = eventIdFromPath(path);
    return json({
      event_id,
      as_of_ts_ms: MOCK_NOW_MS,
      ttl_seconds: 30,
      items: [{ ...clone(MOCK_EXCHANGE_ORDER_BOOK), event_id }],
      next_cursor: null,
      resume: MOCK_RESUME,
      refresh_state: "fresh",
      fresh_count: 1,
      stale_count: 0,
      warming_count: 0
    });
  }

  if (path.match(/^\/events\/[^/]+\/exchange\/markets$/)) {
    return json({ ...clone(MOCK_EXCHANGE_MARKETS), event_id: eventIdFromPath(path) });
  }

  if (path.match(/^\/exchange\/betfair\/events\/[^/]+\/markets$/)) {
    return json(clone(MOCK_EXCHANGE_MARKETS));
  }

  if (path.match(/^\/events\/[^/]+\/prediction-markets\/orderbook\/snapshot$/)) {
    const event_id = eventIdFromPath(path);
    return json({
      event_id,
      as_of_ts_ms: MOCK_NOW_MS,
      ttl_seconds: 30,
      items: [{ ...clone(MOCK_PREDICTION_ORDER_BOOK), event_id }],
      next_cursor: null,
      resume: MOCK_RESUME
    });
  }

  if (path === `/events/${MOCK_EVENT_ID}` || path.match(/^\/events\/[^/]+$/)) {
    return json({ event_id: eventIdFromPath(path), data: clone(MOCK_EVENT) });
  }

  if (path.match(/^\/events\/[^/]+\/bookmakers$/)) {
    return json({ event_id: eventIdFromPath(path), items: ["bet365", "pinnacle", "sportsbet"] });
  }

  if (path.match(/^\/events\/[^/]+\/odds\/snapshot$/)) {
    return json(oddsSnapshot(eventIdFromPath(path), url.searchParams));
  }

  if (path.match(/^\/events\/[^/]+\/odds\/history$/)) {
    return json(oddsHistory(eventIdFromPath(path), url.searchParams));
  }

  if (path === "/bets/snapshot") {
    return json(betsSnapshot(url.searchParams));
  }

  if (path.match(/^\/events\/[^/]+\/results$/)) {
    return json({
      event_id: eventIdFromPath(path),
      status: "available",
      result: {
        home_score: 24,
        away_score: 18,
        winner: "home",
        settled_at: "2026-04-27T10:30:00Z"
      }
    });
  }

  if (path === "/bookmakers") {
    const countryCodes = csvSet(url.searchParams.get("country_code"), true);
    const items = clone(MOCK_BOOKMAKERS).filter((item) => {
      if (!countryCodes) return true;
      return item.country_codes.some((countryCode) => countryCodes.has(countryCode.toLowerCase()));
    });
    return json({ items });
  }

  if (path === "/bookmakers/countries") {
    return json({
      items: [
        { country_code: "AU", country: "Australia", bookmakers: ["bet365", "pinnacle", "sportsbet"] },
        { country_code: "UK", country: "United Kingdom", bookmakers: ["bet365"] },
        { country_code: "US", country: "United States", bookmakers: ["pinnacle"] }
      ]
    });
  }

  if (path === "/sports") {
    return json({ items: ["rugby-league", "soccer", "basketball"] });
  }

  if (path === "/leagues") {
    return json({ items: ["NRL", "NBA", "English Premier League"] });
  }

  if (path === "/racing/events") {
    return json({ items: [clone(MOCK_RACING_EVENT)], next_cursor: null, count: 1 });
  }

  if (path === `/racing/events/${MOCK_RACING_EVENT_ID}` || path.match(/^\/racing\/events\/[^/]+$/)) {
    return json({ event_id: racingEventIdFromPath(path), data: clone(MOCK_RACING_EVENT) });
  }

  if (path.match(/^\/racing\/events\/[^/]+\/odds$/)) {
    return json({
      event_id: racingEventIdFromPath(path),
      as_of_ts_ms: MOCK_NOW_MS,
      ttl_seconds: 1800,
      items: clone(MOCK_RACING_ODDS),
      resume: MOCK_RESUME
    });
  }

  return json({});
};

export function oddsApiMockSseMessages(input: string | URL, params: QueryParams = {}): OddsApiMockSseMessage[] {
  const url = toUrl(input);
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const path = publicPath(url);

  if (path.match(/^\/events\/[^/]+\/odds\/stream$/)) {
    const event_id = eventIdFromPath(path);
    const [firstLine] = filteredOddLines(url.searchParams);
    if (!firstLine) return [{ event: "heartbeat", data: {} }];
    return [
      {
        event: "delta",
        id: MOCK_NEXT_RESUME,
        data: {
          event_id,
          resume: MOCK_NEXT_RESUME,
          changes: [
            {
              op: "upsert",
              odd: { ...firstLine, odds: 2.12, odds_no_vig: 2.08 }
            }
          ]
        }
      },
      { event: "heartbeat", data: {} }
    ];
  }

  if (path.match(/^\/events\/[^/]+\/exchange\/orderbook\/stream$/)) {
    const event_id = eventIdFromPath(path);
    const [selection] = MOCK_EXCHANGE_ORDER_BOOK.selections;
    return [
      {
        event: "delta",
        id: MOCK_NEXT_RESUME,
        data: {
          event_id,
          resume: MOCK_NEXT_RESUME,
          changes: [
            {
              op: "upsert",
              orderbook: {
                ...clone(MOCK_EXCHANGE_ORDER_BOOK),
                event_id,
                selections: [{ ...clone(selection), best_back_price: 2.12, best_lay_price: 2.14 }]
              }
            }
          ]
        }
      },
      { event: "heartbeat", data: {} }
    ];
  }

  if (path.match(/^\/events\/[^/]+\/prediction-markets\/orderbook\/stream$/)) {
    const event_id = eventIdFromPath(path);
    return [
      {
        event: "delta",
        id: MOCK_NEXT_RESUME,
        data: {
          event_id,
          resume: MOCK_NEXT_RESUME,
          changes: [{ op: "upsert", orderbook: { ...clone(MOCK_PREDICTION_ORDER_BOOK), event_id } }]
        }
      },
      { event: "heartbeat", data: {} }
    ];
  }

  if (path.match(/^\/events\/[^/]+\/odds\/history\/stream$/)) {
    const event_id = eventIdFromPath(path);
    const selection_key = url.searchParams.get("selection_key") || "moneyline:home";
    return [
      {
        event: "delta",
        id: MOCK_NEXT_RESUME,
        data: {
          event_id,
          selection_key,
          resume: MOCK_NEXT_RESUME,
          points: [
            {
              tick_ts: "2026-04-27T01:05:00Z",
              is_available: true,
              value: null,
              odds: 2.12,
              odds_no_vig: 2.08,
              fair_odds: null
            }
          ]
        }
      },
      { event: "heartbeat", data: {} }
    ];
  }

  if (path === "/bets/stream") {
    const strategies = selectedStrategies(url.searchParams);
    const strategy = strategies[0] || "pos_ev";
    return [
      {
        event: "delta",
        id: MOCK_NEXT_RESUME,
        data: {
          resume: JSON.stringify(Object.fromEntries(strategies.map((item) => [item, MOCK_NEXT_RESUME]))),
          events: [
            { strategy, op: "upsert", id: `${strategy}-example`, doc: betForStrategy(strategy) },
            { strategy, op: "delete", id: `${strategy}-stale-example` }
          ]
        }
      },
      { event: "heartbeat", data: {} }
    ];
  }

  if (path === "/racing/events/stream") {
    return [
      {
        event: "delta",
        id: MOCK_NEXT_RESUME,
        data: {
          resume: MOCK_NEXT_RESUME,
          changes: [{ op: "upsert", event_id: MOCK_RACING_EVENT_ID, event: clone(MOCK_RACING_EVENT) }]
        }
      },
      { event: "heartbeat", data: {} }
    ];
  }

  if (path.match(/^\/racing\/events\/[^/]+\/odds\/stream$/)) {
    return [
      {
        event: "delta",
        id: MOCK_NEXT_RESUME,
        data: {
          event_id: racingEventIdFromPath(path),
          resume: MOCK_NEXT_RESUME,
          changes: [
            {
              op: "upsert",
              bookmaker_name: "bet365",
              snapshot: clone(MOCK_RACING_ODDS[0])
            }
          ]
        }
      },
      { event: "heartbeat", data: {} }
    ];
  }

  return [{ event: "heartbeat", data: {} }];
}

function oddsSnapshot(event_id: string, searchParams: URLSearchParams) {
  return {
    event_id,
    as_of_ts_ms: MOCK_NOW_MS,
    ttl_seconds: 1800,
    items: filteredOddLines(searchParams).map((line) => ({ ...line, event_id })),
    next_cursor: null,
    resume: MOCK_RESUME
  };
}

function oddsHistory(event_id: string, searchParams: URLSearchParams) {
  const selection_key = searchParams.get("selection_key") || "moneyline:home";
  const price_type = searchParams.get("price_type") || "odds_no_vig";
  return {
    event_id,
    selection_key,
    price_type,
    series: [
      {
        bookmaker_name: "bet365",
        points: [
          {
            tick_ts: "2026-04-27T00:00:00Z",
            is_available: true,
            value: null,
            odds: 1.95,
            odds_no_vig: 1.91,
            fair_odds: null
          },
          {
            tick_ts: "2026-04-27T01:00:00Z",
            is_available: true,
            value: null,
            odds: 2.05,
            odds_no_vig: 2.01,
            fair_odds: null
          }
        ]
      }
    ],
    meta: {
      from_ts: "2026-04-27T00:00:00Z",
      to_ts: "2026-04-27T01:00:00Z",
      available_price_types: ["odds", "odds_no_vig", "fair_odds"]
    }
  };
}

function betsSnapshot(searchParams: URLSearchParams) {
  const strategies = selectedStrategies(searchParams);
  const limit = Number.parseInt(searchParams.get("limit") || "", 10);
  const items = strategies.map(betForStrategy).slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined);
  return {
    resume: JSON.stringify(Object.fromEntries(strategies.map((strategy) => [strategy, MOCK_RESUME]))),
    items
  };
}

function selectedStrategies(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get("strategies") || "pos_ev";
  if (raw === "all") return ["pos_ev", "arbitrage", "middles", "freebets"];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function betForStrategy(strategy: string) {
  const base = {
    id: `${strategy}-example`,
    betID: `${strategy}-example`,
    strategy,
    event_id: MOCK_EVENT_ID,
    gameID: MOCK_EVENT_ID,
    sport: MOCK_EVENT.sport,
    league: MOCK_EVENT.league,
    home_team: MOCK_EVENT.home_team,
    away_team: MOCK_EVENT.away_team,
    start_time: MOCK_EVENT.start_time,
    latest_timestamp: MOCK_NOW_SEC,
    expiry_timestamp: MOCK_NOW_SEC + 900,
    history_ready: true,
    selection_key: "moneyline:home",
    selection_keys: ["moneyline:home"],
    selection_key_by_leg: {
      selection_1: "moneyline:home",
      selection_2: null,
      selection_3: null,
      bonus: null
    },
    odds_history: {
      event_id: MOCK_EVENT_ID,
      market_group_id: "moneyline::0",
      primary_selection_key: "moneyline:home",
      selection_keys: ["moneyline:home"],
      bookmakers: ["pinnacle"],
      default_price_type: "odds_no_vig",
      supports_history: true,
      missing_fields: []
    }
  };

  if (strategy === "arbitrage") {
    return {
      ...base,
      bookmaker_name: "pinnacle + sportsbet",
      market_type: "moneyline",
      period: "full time",
      selection_type: "moneyline",
      selection_1_bookmaker_name: "pinnacle",
      selection_1_odds: 2.11,
      selection_1_line: "home",
      selection_1_line_repr: "Brisbane Broncos",
      selection_1_push_line: false,
      selection_1_match_link: null,
      selection_2_bookmaker_name: "sportsbet",
      selection_2_odds: 1.95,
      selection_2_line: "away",
      selection_2_line_repr: "Sydney Roosters",
      selection_2_push_line: false,
      selection_2_match_link: null,
      selection_3_bookmaker_name: null,
      selection_3_odds: null,
      selection_3_line: null,
      selection_3_line_repr: null,
      selection_3_push_line: null,
      selection_3_match_link: null,
      arbitrage_percentage: 1.8,
      arb_percent: 1.8
    };
  }

  if (strategy === "middles") {
    return {
      ...base,
      bookmaker_name: "bet365 + pinnacle",
      market_type: "handicap",
      period: "full time",
      selection_type: "handicap",
      selection_1_bookmaker_name: "bet365",
      selection_1_odds: 1.91,
      selection_1_line: "home -4.5",
      selection_1_line_repr: "Brisbane Broncos -4.5",
      selection_1_push_line: false,
      selection_1_match_link: null,
      selection_2_bookmaker_name: "pinnacle",
      selection_2_odds: 1.96,
      selection_2_line: "away +6.5",
      selection_2_line_repr: "Sydney Roosters +6.5",
      selection_2_push_line: false,
      selection_2_match_link: null,
      ql_percent: 3.2
    };
  }

  if (strategy === "freebets") {
    return {
      ...base,
      bookmaker_name: "sportsbet",
      bonus_bookmaker_name: "sportsbet",
      bonus_odds: 2.4,
      bonus_line: "home",
      bonus_line_repr: "Brisbane Broncos",
      bonus_match_link: null,
      conversion_percent: 72.4,
      market_type: "moneyline",
      period: "full time"
    };
  }

  return {
    ...base,
    bookmaker_name: "pinnacle",
    odds: 2.11,
    fair_odds: 1.98,
    ev: 6.6,
    market_type: "moneyline",
    bet_type: "moneyline",
    period: "full time",
    line: "home",
    line_repr: "Brisbane Broncos",
    push_line: false,
    confidence: 8,
    match_link: null,
    fair_price_dict: {
      bet365: { odds: 2.05, odds_no_vig: 2.01 },
      pinnacle: { odds: 2.11, odds_no_vig: 2.07 },
      sportsbet: { odds: 2.0, odds_no_vig: 1.96 }
    }
  };
}

function filteredOddLines(searchParams: URLSearchParams) {
  const bookmakers = csvSet(searchParams.get("bookmakers"), true);
  const marketKeys = csvSet(searchParams.get("market_keys"), true);
  const types = csvSet(searchParams.get("types"), true);
  const lines = clone(MOCK_ODD_LINES);
  return lines.filter((line) => {
    if (bookmakers && !bookmakers.has(String(line.bookmaker).toLowerCase())) return false;
    if (marketKeys && !marketKeys.has(String(line.market_key).toLowerCase())) return false;
    if (types && !types.has(String(line.type).toLowerCase())) return false;
    return true;
  }).map((line) => applyPriceFields(line, searchParams));
}

function applyPriceFields(line: Record<string, unknown>, searchParams: URLSearchParams) {
  const requested = parsePriceFields(searchParams.get("price_fields"));
  if (!requested) return line;

  const out = { ...line };
  if (!requested.has("odds")) delete out.odds;
  if (!requested.has("odds_no_vig")) delete out.odds_no_vig;
  if (!requested.has("fair_odds")) delete out.fair_odds;
  return out;
}

function parsePriceFields(raw: string | null): Set<string> | null {
  if (!raw || !raw.trim()) return null;
  const value = raw.trim().toLowerCase();
  if (value === "all") return new Set(["odds", "odds_no_vig", "fair_odds"]);

  const out = new Set<string>();
  for (const part of value.split(",")) {
    const token = part.trim().toLowerCase().replace(/-/g, "_");
    if (token === "odds" || token === "price") out.add("odds");
    else if (token === "novig" || token === "no_vig" || token === "odds_no_vig") out.add("odds_no_vig");
    else if (token === "fair" || token === "fair_odds") out.add("fair_odds");
  }
  return out.size ? out : null;
}

function csvSet(raw: string | null, lower = false): Set<string> | null {
  if (!raw) return null;
  const values = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (lower ? item.toLowerCase() : item));
  return values.length ? new Set(values) : null;
}

function oddLine(input: Record<string, unknown>) {
  return {
    id: "",
    event_id: MOCK_EVENT_ID,
    bookmaker: "",
    selection_key: null,
    market_group_id: null,
    market_key: "",
    type: "",
    bet_type: null,
    period: 0,
    period_str: null,
    metric: null,
    line: null,
    side: null,
    player_name: null,
    selection_name: null,
    odds: null,
    odds_no_vig: null,
    fair_odds: null,
    is_available: true,
    ...input
  };
}

function toUrl(input: string | URL): URL {
  const raw = String(input);
  if (/^https?:\/\//i.test(raw)) return new URL(raw);
  return new URL(raw.startsWith("/") ? `https://api.odds-api.net${raw}` : `https://api.odds-api.net/${raw}`);
}

function publicPath(url: URL): string {
  return url.pathname.replace(/^\/v1(?=\/|$)/, "") || "/";
}

function eventIdFromPath(path: string): string {
  const match = path.match(/^\/events\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : MOCK_EVENT_ID;
}

function racingEventIdFromPath(path: string): string {
  const match = path.match(/^\/racing\/events\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : MOCK_RACING_EVENT_ID;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function json(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
