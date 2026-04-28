export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface OddsApiClientOptions {
  apiKey?: string;
  baseUrl?: string;
  bearerToken?: string;
  fetchImpl?: FetchLike;
}

export interface EventSummary {
  event_id: string;
  sport?: string | null;
  league?: string | null;
  start_time?: number | null;
  home_team?: string | null;
  away_team?: string | null;
  bookmakers?: Record<string, string | null>;
}

export interface OddLine {
  id: string;
  event_id: string;
  bookmaker: string;
  selection_key?: string | null;
  market_group_id?: string | null;
  market_key: string;
  type: string;
  period: number;
  line?: string | null;
  side?: string | null;
  player_name?: string | null;
  selection_name?: string | null;
  odds?: number | null;
  odds_no_vig?: number | null;
  is_available: boolean;
}

export interface OddsSnapshot {
  event_id: string;
  as_of_ts_ms?: number | null;
  ttl_seconds?: number | null;
  items: OddLine[];
  next_cursor?: string | null;
  resume: string;
}

export interface BetOpportunity {
  id?: string;
  strategy?: string;
  event_id?: string;
  selection_key?: string;
  bookmaker_name?: string;
  odds?: number;
  fair_odds?: number;
  ev?: number;
  [key: string]: unknown;
}

export interface BetsSnapshot {
  items: BetOpportunity[];
  resume?: string | Record<string, string>;
  [key: string]: unknown;
}

export interface QueryParams {
  [key: string]: string | number | boolean | null | undefined | Array<string | number | boolean>;
}

export interface BestOdds {
  selection_key: string;
  bookmaker: string;
  odds: number;
  line?: string | null;
  side?: string | null;
  market_key: string;
  odd: OddLine;
}

export class OddsApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Odds API request failed with status ${status}`);
    this.name = "OddsApiError";
    this.status = status;
    this.body = body;
  }
}

export class OddsApiClient {
  readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly bearerToken?: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: OddsApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl || process.env.ODDS_API_BASE_URL || "https://api.odds-api.net/v1").replace(/\/+$/, "");
    this.apiKey = options.apiKey || process.env.ODDS_API_KEY;
    this.bearerToken = options.bearerToken;
    this.fetchImpl = options.fetchImpl || fetch;
  }

  async get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async post<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    return this.request<T>("POST", path, { body, params });
  }

  async request<T>(method: string, path: string, options: { body?: unknown; params?: QueryParams } = {}): Promise<T> {
    const url = this.url(path, options.params);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.apiKey) headers["X-API-Key"] = this.apiKey;
    if (this.bearerToken) headers.Authorization = `Bearer ${this.bearerToken}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    const response = await this.fetchImpl(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    const text = await response.text();
    const data = text ? safeJson(text) : undefined;
    if (!response.ok) {
      throw new OddsApiError(response.status, data);
    }
    return data as T;
  }

  listSports(): Promise<unknown> {
    return this.get("/sports");
  }

  listBookmakers(): Promise<unknown> {
    return this.get("/bookmakers");
  }

  listLeagues(params: QueryParams = {}): Promise<unknown> {
    return this.get("/leagues", params);
  }

  searchEvents(params: QueryParams = {}): Promise<{ items: EventSummary[]; next_cursor?: string | null; count: number }> {
    return this.get("/events", params);
  }

  getEvent(eventId: string): Promise<unknown> {
    return this.get(`/events/${encodeURIComponent(eventId)}`);
  }

  getEventBookmakers(eventId: string): Promise<{ event_id: string; items: string[] }> {
    return this.get(`/events/${encodeURIComponent(eventId)}/bookmakers`);
  }

  getOddsSnapshot(eventId: string, params: QueryParams = {}): Promise<OddsSnapshot> {
    return this.get(`/events/${encodeURIComponent(eventId)}/odds/snapshot`, params);
  }

  getOddsHistory(eventId: string, params: QueryParams): Promise<unknown> {
    return this.get(`/events/${encodeURIComponent(eventId)}/odds/history`, params);
  }

  getLineMovement(eventId: string, selectionKey: string, params: QueryParams = {}): Promise<unknown> {
    return this.getOddsHistory(eventId, { ...params, selection_key: selectionKey });
  }

  getBetsSnapshot(params: QueryParams = {}): Promise<BetsSnapshot> {
    return this.get("/bets/snapshot", params);
  }

  findPositiveEv(params: QueryParams = {}): Promise<BetsSnapshot> {
    return this.getBetsSnapshot({ ...params, strategies: "pos_ev" });
  }

  findArbitrage(params: QueryParams = {}): Promise<BetsSnapshot> {
    return this.getBetsSnapshot({ ...params, strategies: "arbitrage" });
  }

  getResults(eventId: string): Promise<unknown> {
    return this.get(`/events/${encodeURIComponent(eventId)}/results`);
  }

  searchRacingEvents(params: QueryParams = {}): Promise<unknown> {
    return this.get("/racing/events", params);
  }

  getRacingEvent(eventId: string): Promise<unknown> {
    return this.get(`/racing/events/${encodeURIComponent(eventId)}`);
  }

  getRacingOdds(eventId: string, params: QueryParams = {}): Promise<unknown> {
    return this.get(`/racing/events/${encodeURIComponent(eventId)}/odds`, params);
  }

  async findBestOdds(eventId: string, params: QueryParams = {}): Promise<BestOdds[]> {
    const snapshot = await this.getOddsSnapshot(eventId, params);
    const best = new Map<string, BestOdds>();
    for (const odd of snapshot.items || []) {
      if (!odd.is_available || typeof odd.odds !== "number") continue;
      const key = odd.selection_key || `${odd.market_key}:${odd.side || ""}:${odd.line || ""}:${odd.player_name || ""}`;
      const current = best.get(key);
      if (!current || odd.odds > current.odds) {
        best.set(key, {
          selection_key: key,
          bookmaker: odd.bookmaker,
          odds: odd.odds,
          line: odd.line,
          side: odd.side,
          market_key: odd.market_key,
          odd
        });
      }
    }
    return [...best.values()];
  }

  async compareBookmakers(eventId: string, bookmakers: string[], params: QueryParams = {}): Promise<OddsSnapshot> {
    return this.getOddsSnapshot(eventId, { ...params, bookmakers: bookmakers.join(",") });
  }

  getMarketSchema(): Record<string, unknown> {
    return {
      event_id: "Canonical sports event identifier.",
      selection_key: "Stable selection identifier used for odds history.",
      market_key: "Normalized market key.",
      type: "Normalized market type.",
      period: "Normalized period integer.",
      odds: "Bookmaker decimal odds.",
      odds_no_vig: "No-vig reference price when available.",
      is_available: "False when a line is unavailable or suspended."
    };
  }

  private url(path: string, params?: QueryParams): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);
    for (const [key, raw] of Object.entries(params || {})) {
      if (raw === null || raw === undefined) continue;
      if (Array.isArray(raw)) {
        url.searchParams.set(key, raw.join(","));
      } else {
        url.searchParams.set(key, String(raw));
      }
    }
    return url.toString();
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default OddsApiClient;

