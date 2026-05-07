#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import WebSocket, { type RawData } from "ws";
import { z } from "zod";

import { OddsApiClient, oddsApiMockSseMessages, type QueryParams } from "@odds-api/client";

const DEFAULT_STREAM_MAX_EVENTS = 10;
const DEFAULT_STREAM_TIMEOUT_SEC = 15;
const HARD_STREAM_MAX_EVENTS = 25;
const HARD_STREAM_TIMEOUT_SEC = 30;
const DEFAULT_PERSISTENT_BUFFER_LIMIT = 200;
const HARD_PERSISTENT_BUFFER_LIMIT = 5000;
const DEFAULT_STREAM_READ_MAX_EVENTS = 50;
const HARD_STREAM_READ_MAX_EVENTS = 500;
const HARD_STREAM_READ_TIMEOUT_SEC = 60;
const MAX_RECONNECT_DELAY_MS = 30_000;
const STREAM_SAMPLE_WARNING =
  "MCP stream samples are bounded debugging snapshots. Production apps should consume SSE or WebSocket streams directly.";
const PERSISTENT_STREAM_WARNING =
  "Persistent MCP stream sessions maintain direct upstream SSE or WebSocket connections with reconnects and a bounded in-memory buffer. Production browser apps should still use their own backend relay or connect to Odds API with a safe server-side auth flow.";

const sampleControlsSchema = {
  since: z.string().optional(),
  catchup: z.boolean().optional(),
  heartbeat_sec: z.number().int().min(5).max(120).optional(),
  max_batch: z.number().int().min(1).max(2000).optional(),
  max_events: z.number().int().min(1).max(HARD_STREAM_MAX_EVENTS).optional(),
  timeout_sec: z.number().int().min(1).max(HARD_STREAM_TIMEOUT_SEC).optional()
};

const compactFieldSchema = {
  price_fields: z.string().optional(),
  include_links: z.boolean().optional(),
  include_raw_payload: z.boolean().optional(),
  include_source: z.boolean().optional(),
  include_bookmaker_ids: z.boolean().optional(),
  include_debug_ids: z.boolean().optional(),
  include_unavailable: z.boolean().optional()
};

const oddsFilterSchema = {
  bookmakers: z.string().optional(),
  market_keys: z.string().optional(),
  types: z.string().optional(),
  periods: z.string().optional(),
  ...compactFieldSchema
};

const historyFilterSchema = {
  selection_key: z.string(),
  market_group_id: z.string().optional(),
  bookmakers: z.string().optional(),
  price_type: z.string().optional(),
  ...compactFieldSchema
};

const racingEventFilterSchema = {
  race_type: z.string().optional(),
  race_state: z.string().optional(),
  race_country: z.string().optional(),
  status: z.string().optional(),
  start_from: z.number().optional(),
  start_to: z.number().optional(),
  cursor: z.string().optional(),
  limit: z.number().optional(),
  country: z.string().optional(),
  track: z.string().optional(),
  include_links: z.boolean().optional(),
  include_source: z.boolean().optional()
};

const racingStreamFieldSchema = {
  include_links: z.boolean().optional(),
  include_raw_payload: z.boolean().optional(),
  include_source: z.boolean().optional(),
  include_unavailable: z.boolean().optional()
};

const betsStreamFieldSchema = {
  strategies: z.string().optional(),
  price_fields: z.string().optional(),
  include_links: z.boolean().optional(),
  include_raw_payload: z.boolean().optional(),
  include_source: z.boolean().optional(),
  include_debug_ids: z.boolean().optional()
};

const persistentStreamEndpointSchema = z.enum([
  "event_odds_sse",
  "event_odds_ws",
  "event_odds_history_sse",
  "event_odds_history_ws",
  "bets_sse",
  "bets_ws",
  "racing_events_sse",
  "racing_events_ws",
  "racing_odds_sse",
  "racing_odds_ws"
]);

type PersistentStreamEndpoint = z.infer<typeof persistentStreamEndpointSchema>;
type PersistentStreamTransport = "sse" | "websocket";

interface PublicStreamFamily {
  id: string;
  label: string;
  sseEndpoint: PersistentStreamEndpoint;
  wsEndpoint: PersistentStreamEndpoint;
  snapshotPath: string;
  ssePath: string;
  wsPath: string;
  requiresEventId: boolean;
  requiresSelectionKey: boolean;
  snapshotDescription: string;
}

const PUBLIC_STREAM_FAMILIES: PublicStreamFamily[] = [
  {
    id: "event_odds",
    label: "Event odds",
    sseEndpoint: "event_odds_sse",
    wsEndpoint: "event_odds_ws",
    snapshotPath: "/events/{event_id}/odds/snapshot",
    ssePath: "/events/{event_id}/odds/stream",
    wsPath: "/events/{event_id}/odds/ws",
    requiresEventId: true,
    requiresSelectionKey: false,
    snapshotDescription: "Fetch the event odds snapshot first, then apply stream deltas."
  },
  {
    id: "event_odds_history",
    label: "Event odds history",
    sseEndpoint: "event_odds_history_sse",
    wsEndpoint: "event_odds_history_ws",
    snapshotPath: "/events/{event_id}/odds/history",
    ssePath: "/events/{event_id}/odds/history/stream",
    wsPath: "/events/{event_id}/odds/history/ws",
    requiresEventId: true,
    requiresSelectionKey: true,
    snapshotDescription: "Fetch bounded selection history first, then apply line-movement updates."
  },
  {
    id: "bets",
    label: "Betting opportunities",
    sseEndpoint: "bets_sse",
    wsEndpoint: "bets_ws",
    snapshotPath: "/bets/snapshot",
    ssePath: "/bets/stream",
    wsPath: "/bets/ws",
    requiresEventId: false,
    requiresSelectionKey: false,
    snapshotDescription: "Fetch the scoped betting opportunity snapshot first, then apply insert/update/remove deltas."
  },
  {
    id: "racing_events",
    label: "Racing events",
    sseEndpoint: "racing_events_sse",
    wsEndpoint: "racing_events_ws",
    snapshotPath: "/racing/events",
    ssePath: "/racing/events/stream",
    wsPath: "/racing/events/ws",
    requiresEventId: false,
    requiresSelectionKey: false,
    snapshotDescription: "Fetch the racing event list first, then apply event insert/update/remove deltas."
  },
  {
    id: "racing_odds",
    label: "Racing odds",
    sseEndpoint: "racing_odds_sse",
    wsEndpoint: "racing_odds_ws",
    snapshotPath: "/racing/events/{event_id}/odds",
    ssePath: "/racing/events/{event_id}/odds/stream",
    wsPath: "/racing/events/{event_id}/odds/ws",
    requiresEventId: true,
    requiresSelectionKey: false,
    snapshotDescription: "Fetch the racing odds snapshot first, then apply odds changes."
  }
];

const PUBLIC_STREAM_FAMILIES_BY_ENDPOINT = new Map<PersistentStreamEndpoint, PublicStreamFamily>(
  PUBLIC_STREAM_FAMILIES.flatMap((family) => [
    [family.sseEndpoint, family],
    [family.wsEndpoint, family]
  ])
);

export function createServer(client = new OddsApiClient()) {
  const server = new McpServer({
    name: "odds-api",
    version: "0.1.0"
  });
  const streamManager = new PersistentStreamManager(client);

  server.tool(
    "odds_api.get_api_metadata",
    "Retrieve Odds API root metadata, reference, and OpenAPI links.",
    {},
    async () => jsonResult(await client.getApiMetadata())
  );

  server.tool(
    "odds_api.get_account",
    "Retrieve the authenticated Odds API identity and enabled product capabilities.",
    {},
    async () => jsonResult(await client.getMe())
  );

  server.tool(
    "odds_api.get_usage",
    "Retrieve quota and API-credit usage counters for the authenticated API key.",
    {},
    async () => jsonResult(await client.getUsage())
  );

  server.tool(
    "odds_api.get_limits",
    "Retrieve response, stream, add-on, and account limits for the authenticated API key.",
    {},
    async () => jsonResult(await client.getLimits())
  );

  server.tool(
    "odds_api.search_events",
    "Retrieve sports event data from Odds API for custom apps and workflows.",
    {
      sport: z.string().optional(),
      league: z.string().optional(),
      start_from: z.number().optional(),
      start_to: z.number().optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
      include_bookmaker_ids: z.boolean().optional(),
      include_source: z.boolean().optional()
    },
    async (args) => jsonResult(await client.searchEvents(args))
  );

  server.tool(
    "odds_api.get_event",
    "Retrieve detail for one canonical sports event.",
    {
      event_id: z.string(),
      include_links: z.boolean().optional(),
      include_raw_payload: z.boolean().optional(),
      include_source: z.boolean().optional(),
      include_bookmaker_ids: z.boolean().optional(),
      include_debug_ids: z.boolean().optional()
    },
    async ({ event_id, ...params }) => jsonResult(await client.getEvent(event_id, params))
  );

  server.tool(
    "odds_api.get_event_bookmakers",
    "Retrieve bookmakers currently attached to one sports event.",
    {
      event_id: z.string()
    },
    async ({ event_id }) => jsonResult(await client.getEventBookmakers(event_id))
  );

  server.tool(
    "odds_api.get_odds",
    "Retrieve a normalized odds snapshot for an event.",
    {
      event_id: z.string(),
      limit: z.number().optional(),
      cursor: z.string().optional(),
      ...oddsFilterSchema
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
      market_group_id: z.string().optional(),
      price_type: z.string().optional(),
      from_ts: z.string().optional(),
      to_ts: z.string().optional(),
      limit_points_per_bookmaker: z.number().optional(),
      ...compactFieldSchema,
      bookmakers: z.string().optional()
    },
    async ({ event_id, selection_key, ...params }) =>
      jsonResult(await client.getLineMovement(event_id, selection_key, params))
  );

  server.tool(
    "odds_api.get_leagues",
    "Retrieve available league metadata, optionally filtered by sport.",
    {
      sport: z.string().optional()
    },
    async (args) => jsonResult(await client.listLeagues(args))
  );

  server.tool(
    "odds_api.get_bookmakers",
    "Retrieve available bookmaker metadata.",
    {
      country_code: z.string().optional()
    },
    async (args) => jsonResult(await client.listBookmakers(args))
  );

  server.tool(
    "odds_api.get_bookmaker_countries",
    "Retrieve country codes and bookmakers represented in the active bookmaker catalog.",
    {},
    async () => jsonResult(await client.listBookmakerCountries())
  );

  server.tool(
    "odds_api.get_sports",
    "Retrieve available sports metadata.",
    {},
    async () => jsonResult(await client.listSports())
  );

  server.tool(
    "odds_api.get_results",
    "Retrieve event result data.",
    {
      event_id: z.string()
    },
    async ({ event_id }) => jsonResult(await client.getResults(event_id))
  );

  server.tool(
    "odds_api.search_racing_events",
    "Retrieve racing event data for custom apps and workflows.",
    racingEventFilterSchema,
    async (args) => jsonResult(await client.searchRacingEvents(args))
  );

  server.tool(
    "odds_api.get_racing_event",
    "Retrieve detail for one canonical racing event.",
    {
      event_id: z.string(),
      include_links: z.boolean().optional(),
      include_raw_payload: z.boolean().optional(),
      include_source: z.boolean().optional()
    },
    async ({ event_id, ...params }) => jsonResult(await client.getRacingEvent(event_id, params))
  );

  server.tool(
    "odds_api.get_racing_odds",
    "Retrieve normalized racing odds for a racing event.",
    {
      event_id: z.string(),
      bookmakers: z.string().optional(),
      market_keys: z.string().optional(),
      ...racingStreamFieldSchema
    },
    async ({ event_id, ...params }) => jsonResult(await client.getRacingOdds(event_id, params))
  );

  server.tool(
    "odds_api.get_streaming_info",
    "Explain Odds API SSE and WebSocket streaming options for realtime apps.",
    {},
    async () => jsonResult(getStreamingInfo(client.baseUrl))
  );

  server.tool(
    "odds_api.get_stream_connection",
    "Return production connection details for one public Odds API stream family without exposing API secrets.",
    {
      endpoint: persistentStreamEndpointSchema,
      event_id: z.string().optional(),
      selection_key: z.string().optional(),
      market_group_id: z.string().optional(),
      bookmakers: z.string().optional(),
      market_keys: z.string().optional(),
      types: z.string().optional(),
      periods: z.string().optional(),
      price_type: z.string().optional(),
      strategies: z.string().optional(),
      price_fields: z.string().optional(),
      include_links: z.boolean().optional(),
      include_raw_payload: z.boolean().optional(),
      include_source: z.boolean().optional(),
      include_debug_ids: z.boolean().optional(),
      include_unavailable: z.boolean().optional(),
      since: z.string().optional(),
      catchup: z.boolean().optional(),
      heartbeat_sec: z.number().int().min(5).max(120).optional(),
      max_batch: z.number().int().min(1).max(2000).optional()
    },
    async (args) => jsonResult(getStreamConnection(client.baseUrl, args as OpenStreamArgs))
  );

  server.tool(
    "odds_api.sample_odds_stream",
    "Collect a bounded SSE sample from an event odds stream for debugging.",
    {
      event_id: z.string(),
      ...oddsFilterSchema,
      ...sampleControlsSchema
    },
    async ({ event_id, max_events, timeout_sec, ...params }) =>
      jsonResult(
        await sampleSseStream(client, streamPath("event_odds_sse", event_id), params, {
          max_events,
          timeout_sec
        })
      )
  );

  server.tool(
    "odds_api.sample_event_odds_history_stream",
    "Collect a bounded SSE sample from an event odds history stream for debugging.",
    {
      event_id: z.string(),
      ...historyFilterSchema,
      ...sampleControlsSchema
    },
    async ({ event_id, max_events, timeout_sec, ...params }) =>
      jsonResult(
        await sampleSseStream(client, streamPath("event_odds_history_sse", event_id), params, {
          max_events,
          timeout_sec
        })
      )
  );

  server.tool(
    "odds_api.sample_bets_stream",
    "Collect a bounded SSE sample from the betting opportunities stream for debugging.",
    {
      ...betsStreamFieldSchema,
      ...sampleControlsSchema
    },
    async ({ max_events, timeout_sec, ...params }) =>
      jsonResult(await sampleSseStream(client, streamPath("bets_sse"), params, { max_events, timeout_sec }))
  );

  server.tool(
    "odds_api.sample_racing_events_stream",
    "Collect a bounded SSE sample from the racing events stream for debugging.",
    {
      ...racingStreamFieldSchema,
      ...sampleControlsSchema
    },
    async ({ max_events, timeout_sec, ...params }) =>
      jsonResult(await sampleSseStream(client, streamPath("racing_events_sse"), params, { max_events, timeout_sec }))
  );

  server.tool(
    "odds_api.sample_racing_odds_stream",
    "Collect a bounded SSE sample from a racing event odds stream for debugging.",
    {
      event_id: z.string(),
      ...racingStreamFieldSchema,
      ...sampleControlsSchema
    },
    async ({ event_id, max_events, timeout_sec, ...params }) =>
      jsonResult(
        await sampleSseStream(client, streamPath("racing_odds_sse", event_id), params, {
          max_events,
          timeout_sec
        })
      )
  );

  server.tool(
    "odds_api.open_stream",
    "Open a persistent MCP-managed SSE or WebSocket stream session.",
    {
      endpoint: persistentStreamEndpointSchema,
      event_id: z.string().optional(),
      selection_key: z.string().optional(),
      market_group_id: z.string().optional(),
      bookmakers: z.string().optional(),
      market_keys: z.string().optional(),
      types: z.string().optional(),
      periods: z.string().optional(),
      price_type: z.string().optional(),
      strategies: z.string().optional(),
      price_fields: z.string().optional(),
      include_links: z.boolean().optional(),
      include_raw_payload: z.boolean().optional(),
      include_source: z.boolean().optional(),
      include_debug_ids: z.boolean().optional(),
      include_unavailable: z.boolean().optional(),
      since: z.string().optional(),
      catchup: z.boolean().optional(),
      heartbeat_sec: z.number().int().min(5).max(120).optional(),
      max_batch: z.number().int().min(1).max(2000).optional(),
      buffer_limit: z.number().int().min(1).max(HARD_PERSISTENT_BUFFER_LIMIT).optional()
    },
    async (args) => jsonResult(await streamManager.open(args as OpenStreamArgs))
  );

  server.tool(
    "odds_api.read_stream",
    "Read buffered events from a persistent MCP stream session. Default behavior drains for compatibility; pass cursor for non-destructive reads.",
    {
      stream_id: z.string(),
      max_events: z.number().int().min(1).max(HARD_STREAM_READ_MAX_EVENTS).optional(),
      timeout_sec: z.number().int().min(0).max(HARD_STREAM_READ_TIMEOUT_SEC).optional(),
      cursor: z.number().int().min(0).optional(),
      drain: z.boolean().optional()
    },
    async (args) => jsonResult(await streamManager.read(args.stream_id, args))
  );

  server.tool(
    "odds_api.list_streams",
    "List persistent MCP stream sessions opened by this server process.",
    {},
    async () => jsonResult(streamManager.list())
  );

  server.tool(
    "odds_api.close_stream",
    "Close a persistent MCP stream session and release its connection.",
    {
      stream_id: z.string()
    },
    async ({ stream_id }) => jsonResult(await streamManager.close(stream_id))
  );

  server.tool(
    "odds_api.get_market_schema",
    "Explain normalized market fields used by odds responses.",
    {},
    async () => jsonResult(client.getMarketSchema())
  );

  return server;
}

export interface SseMessage {
  event: string;
  data: unknown;
  id?: string;
  retry?: number;
}

interface StreamSampleOptions {
  max_events?: number;
  timeout_sec?: number;
}

interface StreamSampleResult {
  endpoint: string;
  elapsed_ms: number;
  stopped_reason: "max_events" | "timeout" | "stream_closed";
  count: number;
  events: SseMessage[];
  warning: string;
}

type PersistentStreamStatus = "connecting" | "open" | "reconnecting" | "closed" | "error";

interface OpenStreamArgs extends QueryParams {
  endpoint: PersistentStreamEndpoint;
  event_id?: string;
  selection_key?: string;
  buffer_limit?: number;
}

interface PersistentStreamSpec {
  endpoint: PersistentStreamEndpoint;
  transport: PersistentStreamTransport;
  family: PublicStreamFamily;
  baseUrl: string;
  path: string;
  mockPath: string;
  url: string;
  mockUrl: string;
  params: QueryParams;
  bufferLimit: number;
  initialResume?: string;
}

interface BufferedStreamMessage extends SseMessage {
  sequence: number;
}

interface PersistentStreamState {
  id: string;
  spec: PersistentStreamSpec;
  endpoint: PersistentStreamEndpoint;
  transport: PersistentStreamTransport;
  path: string;
  url: string;
  status: PersistentStreamStatus;
  created_at: string;
  updated_at: string;
  events: BufferedStreamMessage[];
  next_sequence: number;
  last_resume?: string;
  reconnect_count: number;
  resync_required: boolean;
  dropped_events: number;
  buffer_limit: number;
  closed_by_client: boolean;
  error?: string;
  controller?: AbortController;
  socket?: WebSocket;
}

interface StreamReadOptions {
  max_events?: number;
  timeout_sec?: number;
  cursor?: number;
  drain?: boolean;
}

class PersistentStreamManager {
  private readonly streams = new Map<string, PersistentStreamState>();

  constructor(private readonly client: Pick<OddsApiClient, "baseUrl">) {}

  async open(args: OpenStreamArgs) {
    const spec = buildPersistentStreamSpec(this.client.baseUrl, args);
    const stream: PersistentStreamState = {
      id: createStreamId(),
      spec,
      endpoint: spec.endpoint,
      transport: spec.transport,
      path: spec.path,
      url: spec.url,
      status: "connecting",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [],
      next_sequence: 1,
      last_resume: spec.initialResume,
      reconnect_count: 0,
      resync_required: false,
      dropped_events: 0,
      buffer_limit: spec.bufferLimit,
      closed_by_client: false
    };
    this.streams.set(stream.id, stream);

    if (process.env.ODDS_API_MOCK === "1") {
      stream.status = "open";
      this.pushMany(stream, oddsApiMockSseMessages(spec.mockUrl));
      return this.summary(stream, { warning: PERSISTENT_STREAM_WARNING });
    }

    this.startBroker(stream);
    return this.summary(stream, { warning: PERSISTENT_STREAM_WARNING });
  }

  async read(streamId: string, options: StreamReadOptions = {}) {
    const stream = this.requireStream(streamId);
    const maxEvents = boundedInteger(options.max_events, DEFAULT_STREAM_READ_MAX_EVENTS, HARD_STREAM_READ_MAX_EVENTS);
    const timeoutSec = boundedInteger(options.timeout_sec, 0, HARD_STREAM_READ_TIMEOUT_SEC, 0);
    const cursor = normalizeCursor(options.cursor);
    const drain = cursor === undefined ? options.drain !== false : false;
    const deadline = Date.now() + timeoutSec * 1000;

    while (!this.hasReadableEvents(stream, cursor) && stream.status !== "closed" && stream.status !== "error" && Date.now() < deadline) {
      await delay(100);
    }

    const oldestBeforeRead = this.oldestSequence(stream);
    const missedEvents = cursor !== undefined && oldestBeforeRead !== null && cursor < oldestBeforeRead - 1;
    const events =
      cursor === undefined
        ? stream.events.slice(0, maxEvents)
        : stream.events.filter((event) => event.sequence > cursor).slice(0, maxEvents);
    if (drain && cursor === undefined) {
      stream.events.splice(0, events.length);
    }
    if (missedEvents) {
      stream.resync_required = true;
    }
    stream.updated_at = new Date().toISOString();
    const latestSequence = this.latestSequence(stream);
    return {
      ...this.summary(stream),
      count: events.length,
      events,
      cursor: cursor ?? null,
      next_cursor: events.length ? events[events.length - 1].sequence : cursor ?? latestSequence,
      drain,
      missed_events: missedEvents
    };
  }

  list() {
    return {
      count: this.streams.size,
      streams: [...this.streams.values()].map((stream) => this.summary(stream))
    };
  }

  async close(streamId: string) {
    const stream = this.requireStream(streamId);
    stream.closed_by_client = true;
    stream.status = "closed";
    stream.updated_at = new Date().toISOString();
    stream.controller?.abort();
    stream.socket?.close();
    this.streams.delete(streamId);
    return this.summary(stream);
  }

  private startBroker(stream: PersistentStreamState): void {
    void this.runBroker(stream);
  }

  private async runBroker(stream: PersistentStreamState): Promise<void> {
    let attempt = 0;
    while (!stream.closed_by_client) {
      stream.url = this.connectionUrl(stream);
      stream.status = attempt === 0 && stream.next_sequence === 1 ? "connecting" : "reconnecting";
      stream.updated_at = new Date().toISOString();

      try {
        if (stream.transport === "sse") {
          await this.connectSse(stream);
        } else {
          await this.connectWebSocket(stream);
        }
        if (stream.closed_by_client) break;
        if ((stream.status as PersistentStreamStatus) === "open") attempt = 0;
        stream.error = "Upstream stream closed";
      } catch (error) {
        if (stream.closed_by_client) break;
        stream.error = errorMessage(error);
        if (isTerminalStreamError(error)) {
          stream.status = "error";
          stream.updated_at = new Date().toISOString();
          return;
        }
      }

      if (stream.closed_by_client) break;
      stream.reconnect_count += 1;
      attempt += 1;
      stream.status = "reconnecting";
      stream.updated_at = new Date().toISOString();
      await delay(reconnectDelayMs(attempt));
    }

    stream.status = "closed";
    stream.updated_at = new Date().toISOString();
  }

  private async connectSse(stream: PersistentStreamState): Promise<void> {
    const controller = new AbortController();
    stream.controller = controller;
    try {
      const response = await fetch(stream.url, {
        headers: streamHeaders(),
        signal: controller.signal
      });
      if (!response.ok) {
        const body = await response.text();
        throw new StreamHttpError(response.status, `SSE stream failed with status ${response.status}: ${body}`);
      }
      if (!response.body) {
        throw new Error("SSE stream response did not include a readable body");
      }
      stream.status = "open";
      delete stream.error;
      stream.updated_at = new Date().toISOString();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!stream.closed_by_client) {
        const readResult = await reader.read();
        if (readResult.done) break;
        buffer += decoder.decode(readResult.value, { stream: true });
        const parsed = consumeSseBuffer(buffer);
        buffer = parsed.remainder;
        this.pushMany(stream, parsed.events);
      }
    } finally {
      if (stream.controller === controller) {
        stream.controller = undefined;
      }
      stream.updated_at = new Date().toISOString();
    }
  }

  private connectWebSocket(stream: PersistentStreamState): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(stream.url, {
        headers: authHeaders()
      });
      stream.socket = socket;
      let settled = false;
      let socketError: Error | undefined;

      const settle = (callback: () => void) => {
        if (settled) return;
        settled = true;
        if (stream.socket === socket) {
          stream.socket = undefined;
        }
        stream.updated_at = new Date().toISOString();
        callback();
      };

      socket.on("open", () => {
        stream.status = "open";
        delete stream.error;
        stream.updated_at = new Date().toISOString();
      });
      socket.on("message", (data) => {
        const event = parseWebSocketMessage(data);
        if (event) this.pushMany(stream, [event]);
      });
      socket.on("error", (error) => {
        socketError = error instanceof Error ? error : new Error(String(error));
      });
      socket.on("close", (code, reason) => {
        settle(() => {
          if (stream.closed_by_client) {
            resolve();
            return;
          }
          if (socketError) {
            reject(socketError);
            return;
          }
          if (isTerminalWebSocketClose(code)) {
            reject(new Error(`WebSocket closed with code ${code}: ${rawDataToString(reason)}`));
            return;
          }
          resolve();
        });
      });
    });
  }

  private pushMany(stream: PersistentStreamState, events: SseMessage[]): void {
    for (const event of events) {
      const buffered = { ...event, sequence: stream.next_sequence++ };
      stream.events.push(buffered);
      const resume = extractResume(event);
      if (resume) stream.last_resume = resume;
      if (event.event === "resync") stream.resync_required = true;
      if (stream.events.length > stream.buffer_limit) {
        stream.events.shift();
        stream.dropped_events += 1;
        stream.resync_required = true;
      }
    }
    if (events.length) stream.updated_at = new Date().toISOString();
  }

  private connectionUrl(stream: PersistentStreamState): string {
    if (stream.next_sequence === 1 && stream.reconnect_count === 0) {
      return stream.spec.url;
    }
    const params = { ...stream.spec.params };
    if (stream.last_resume) {
      params.since = stream.last_resume;
      params.catchup = true;
    }
    return buildStreamUrl(stream.spec.baseUrl, stream.spec.path, params, stream.spec.transport);
  }

  private hasReadableEvents(stream: PersistentStreamState, cursor: number | undefined): boolean {
    if (cursor === undefined) return stream.events.length > 0;
    return stream.events.some((event) => event.sequence > cursor);
  }

  private oldestSequence(stream: PersistentStreamState): number | null {
    return stream.events.length ? stream.events[0].sequence : null;
  }

  private latestSequence(stream: PersistentStreamState): number {
    return stream.next_sequence - 1;
  }

  private requireStream(streamId: string): PersistentStreamState {
    const stream = this.streams.get(streamId);
    if (!stream) throw new Error(`Unknown stream_id: ${streamId}`);
    return stream;
  }

  private summary(stream: PersistentStreamState, extra: Record<string, unknown> = {}) {
    return {
      stream_id: stream.id,
      endpoint: stream.endpoint,
      transport: stream.transport,
      path: stream.path,
      url: stream.url,
      status: stream.status,
      sequence: this.latestSequence(stream),
      latest_sequence: this.latestSequence(stream),
      oldest_sequence: this.oldestSequence(stream),
      last_resume: stream.last_resume ?? null,
      reconnect_count: stream.reconnect_count,
      buffered_events: stream.events.length,
      dropped_events: stream.dropped_events,
      resync_required: stream.resync_required,
      buffer_limit: stream.buffer_limit,
      created_at: stream.created_at,
      updated_at: stream.updated_at,
      ...(stream.error ? { error: stream.error } : {}),
      ...extra
    };
  }
}

class StreamHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "StreamHttpError";
  }
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

function getStreamingInfo(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return {
    base_url: normalizedBaseUrl,
    guidance: {
      snapshots: "Use snapshots for one-off answers, page loads, server rendering, and low-frequency refreshes.",
      streams:
        "For production realtime apps, connect directly to the public Odds API SSE or WebSocket URLs returned by odds_api.get_stream_connection.",
      mcp_sampling: "Use odds_api.sample_*_stream tools for bounded inspection only.",
      mcp_persistent:
        "Use odds_api.open_stream, odds_api.read_stream, odds_api.list_streams, and odds_api.close_stream when you want the MCP process to act as an optional server-side stream broker with reconnects and a bounded in-memory buffer."
    },
    auth: {
      server_side: "Send X-API-Key with ODDS_API_KEY.",
      browser_or_app: "Use the auth mode allowed for the endpoint and keep secrets out of client-side code."
    },
    common_params: {
      since: "Resume token or Redis stream ID from a previous response.",
      catchup: "When supported, include recent changes before live updates.",
      heartbeat_sec: "Heartbeat interval. Typical range is 5-120 seconds."
    },
    stream_families: PUBLIC_STREAM_FAMILIES.map((family) => ({
      id: family.id,
      label: family.label,
      snapshot_path: family.snapshotPath,
      sse_endpoint: family.sseEndpoint,
      sse_url: `${normalizedBaseUrl}${family.ssePath}`,
      websocket_endpoint: family.wsEndpoint,
      websocket_path: family.wsPath,
      requires_event_id: family.requiresEventId,
      requires_selection_key: family.requiresSelectionKey
    })),
    sse_endpoints: PUBLIC_STREAM_FAMILIES.map((family) => `${normalizedBaseUrl}${family.ssePath}`),
    websocket_paths: PUBLIC_STREAM_FAMILIES.map((family) => family.wsPath),
    safety:
      "Treat streamed prices as time-sensitive. Handle disconnects, stale odds, suspended markets, limits, voids, and execution risk."
  };
}

function getStreamConnection(baseUrl: string, args: OpenStreamArgs) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const family = streamFamilyForEndpoint(args.endpoint);
  validateStreamArgs(family, args);
  const snapshotPath = renderPublicStreamPath(family.snapshotPath, args.event_id, args.endpoint);
  const ssePath = renderPublicStreamPath(family.ssePath, args.event_id, family.sseEndpoint);
  const wsPath = renderPublicStreamPath(family.wsPath, args.event_id, family.wsEndpoint);
  const streamParams = streamQueryParams(args);
  const snapshotParams = snapshotQueryParams(args);

  return {
    base_url: normalizedBaseUrl,
    family: family.id,
    label: family.label,
    requested_endpoint: args.endpoint,
    recommended_transport: streamTransport(args.endpoint),
    snapshot: {
      path: snapshotPath,
      url: buildStreamUrl(normalizedBaseUrl, snapshotPath, snapshotParams),
      description: family.snapshotDescription
    },
    sse: {
      endpoint: family.sseEndpoint,
      path: ssePath,
      url: buildStreamUrl(normalizedBaseUrl, ssePath, streamParams, "sse"),
      headers: {
        Accept: "text/event-stream",
        "X-API-Key": "Set from ODDS_API_KEY on your server; the MCP tool intentionally does not return secrets."
      }
    },
    websocket: {
      endpoint: family.wsEndpoint,
      path: wsPath,
      url: buildStreamUrl(normalizedBaseUrl, wsPath, streamParams, "websocket"),
      headers: {
        "X-API-Key": "Set from ODDS_API_KEY on your server; the MCP tool intentionally does not return secrets."
      }
    },
    resume: {
      snapshot_first: "Read the snapshot first and store its resume token when present.",
      reconnect: "On disconnect, reconnect with since=<last_resume> and catchup=true.",
      resync: "If a stream emits event=resync or the MCP broker reports resync_required=true, reload the snapshot before applying more deltas."
    },
    production_guidance: {
      primary_path:
        "Production apps should connect directly to the raw Odds API SSE or WebSocket URL from a backend service.",
      browser_safety:
        "Never expose ODDS_API_KEY in browser code. Use your own backend relay or a safe auth mode approved for the endpoint.",
      mcp_broker:
        "MCP open_stream/read_stream can be used as an optional server-side broker. It keeps an in-process bounded buffer, so restart or dropped-buffer recovery requires resnapshot."
    },
    safety:
      "Display timestamps, handle stale odds and suspended markets, back off on 429, and never present betting outcomes as guaranteed."
  };
}

function buildPersistentStreamSpec(baseUrl: string, args: OpenStreamArgs): PersistentStreamSpec {
  const endpoint = args.endpoint;
  const family = streamFamilyForEndpoint(endpoint);
  validateStreamArgs(family, args);
  const transport = streamTransport(endpoint);
  const path = streamPath(endpoint, args.event_id);
  const mockPath = streamPath(family.sseEndpoint, args.event_id);
  const params = streamQueryParams(args);

  return {
    endpoint,
    transport,
    family,
    baseUrl,
    path,
    mockPath,
    url: buildStreamUrl(baseUrl, path, params, transport),
    mockUrl: buildStreamUrl(baseUrl, mockPath, params, "sse"),
    params,
    bufferLimit: boundedInteger(args.buffer_limit, DEFAULT_PERSISTENT_BUFFER_LIMIT, HARD_PERSISTENT_BUFFER_LIMIT),
    initialResume: typeof args.since === "string" && args.since.trim() ? args.since.trim() : undefined
  };
}

function streamPath(endpoint: PersistentStreamEndpoint, eventId?: string): string {
  const family = streamFamilyForEndpoint(endpoint);
  const template = streamTransport(endpoint) === "websocket" ? family.wsPath : family.ssePath;
  return renderPublicStreamPath(template, eventId, endpoint);
}

function streamFamilyForEndpoint(endpoint: PersistentStreamEndpoint): PublicStreamFamily {
  const family = PUBLIC_STREAM_FAMILIES_BY_ENDPOINT.get(endpoint);
  if (!family) throw new Error(`Unsupported public stream endpoint: ${endpoint}`);
  return family;
}

function streamTransport(endpoint: PersistentStreamEndpoint): PersistentStreamTransport {
  return endpoint.endsWith("_ws") ? "websocket" : "sse";
}

function validateStreamArgs(family: PublicStreamFamily, args: OpenStreamArgs): void {
  if (family.requiresEventId && !args.event_id) {
    throw new Error(`event_id is required for ${args.endpoint}`);
  }
  if (family.requiresSelectionKey && !args.selection_key) {
    throw new Error("selection_key is required for event odds history streams");
  }
}

function renderPublicStreamPath(template: string, eventId: string | undefined, endpoint: PersistentStreamEndpoint): string {
  if (!template.includes("{event_id}")) return template;
  return template.replace("{event_id}", encodeRequiredEventId(eventId, endpoint));
}

function encodeRequiredEventId(eventId: string | undefined, endpoint: PersistentStreamEndpoint): string {
  if (!eventId) throw new Error(`event_id is required for ${endpoint}`);
  return encodeURIComponent(eventId);
}

function streamQueryParams(args: OpenStreamArgs): QueryParams {
  const {
    endpoint: _endpoint,
    event_id: _eventId,
    buffer_limit: _bufferLimit,
    ...params
  } = args;
  return cleanQueryParams(params);
}

function snapshotQueryParams(args: OpenStreamArgs): QueryParams {
  const {
    endpoint: _endpoint,
    event_id: _eventId,
    buffer_limit: _bufferLimit,
    since: _since,
    catchup: _catchup,
    heartbeat_sec: _heartbeatSec,
    max_batch: _maxBatch,
    ...params
  } = args;
  return cleanQueryParams(params);
}

async function sampleSseStream(
  client: OddsApiClient,
  path: string,
  params: QueryParams,
  options: StreamSampleOptions = {}
): Promise<StreamSampleResult> {
  const maxEvents = boundedInteger(options.max_events, DEFAULT_STREAM_MAX_EVENTS, HARD_STREAM_MAX_EVENTS);
  const timeoutSec = boundedInteger(options.timeout_sec, DEFAULT_STREAM_TIMEOUT_SEC, HARD_STREAM_TIMEOUT_SEC);
  const endpoint = buildStreamUrl(client.baseUrl, path, params);
  const startedAt = Date.now();

  if (process.env.ODDS_API_MOCK === "1") {
    const events = oddsApiMockSseMessages(endpoint).slice(0, maxEvents);
    return {
      endpoint,
      elapsed_ms: Date.now() - startedAt,
      stopped_reason: events.length >= maxEvents ? "max_events" : "stream_closed",
      count: events.length,
      events,
      warning: STREAM_SAMPLE_WARNING
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutSec * 1000);
  const events: SseMessage[] = [];
  let stoppedReason: StreamSampleResult["stopped_reason"] = "stream_closed";

  try {
    const response = await fetch(endpoint, {
      headers: streamHeaders(),
      signal: controller.signal
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SSE sample request failed with status ${response.status}: ${body}`);
    }
    if (!response.body) {
      throw new Error("SSE sample response did not include a readable body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (events.length < maxEvents) {
      let readResult: ReadableStreamReadResult<Uint8Array>;
      try {
        readResult = await reader.read();
      } catch (error) {
        if (controller.signal.aborted) {
          stoppedReason = "timeout";
          break;
        }
        throw error;
      }

      if (readResult.done) {
        stoppedReason = "stream_closed";
        break;
      }

      buffer += decoder.decode(readResult.value, { stream: true });
      const parsed = consumeSseBuffer(buffer);
      buffer = parsed.remainder;
      for (const event of parsed.events) {
        events.push(event);
        if (events.length >= maxEvents) {
          stoppedReason = "max_events";
          break;
        }
      }
    }

    if (events.length >= maxEvents) {
      stoppedReason = "max_events";
      await reader.cancel().catch(() => undefined);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      stoppedReason = "timeout";
    } else {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }

  return {
    endpoint,
    elapsed_ms: Date.now() - startedAt,
    stopped_reason: stoppedReason,
    count: events.length,
    events,
    warning: STREAM_SAMPLE_WARNING
  };
}

function buildStreamUrl(
  baseUrl: string,
  path: string,
  params: QueryParams = {},
  transport: PersistentStreamTransport = "sse"
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}${normalizedPath}`);
  for (const [key, raw] of Object.entries(params)) {
    if (raw === null || raw === undefined) continue;
    if (Array.isArray(raw)) {
      url.searchParams.set(key, raw.join(","));
    } else {
      url.searchParams.set(key, String(raw));
    }
  }
  if (transport === "websocket") {
    if (url.protocol === "https:") url.protocol = "wss:";
    else if (url.protocol === "http:") url.protocol = "ws:";
  }
  return url.toString();
}

function streamHeaders(): Record<string, string> {
  return { Accept: "text/event-stream", ...authHeaders() };
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const apiKey = process.env.ODDS_API_KEY?.trim();
  if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}

function boundedInteger(value: number | undefined, fallback: number, max: number, min = 1): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(Number(value))));
}

function normalizeCursor(value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return Math.max(0, Math.trunc(Number(value)));
}

function cleanQueryParams(params: QueryParams): QueryParams {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reconnectDelayMs(attempt: number): number {
  const capped = Math.min(MAX_RECONNECT_DELAY_MS, 500 * 2 ** Math.max(0, attempt - 1));
  return Math.trunc(capped * (0.75 + Math.random() * 0.5));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isTerminalStreamError(error: unknown): boolean {
  if (error instanceof StreamHttpError) {
    return error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 409 && error.status !== 429;
  }
  return false;
}

function isTerminalWebSocketClose(code: number): boolean {
  return code === 1008;
}

function extractResume(event: SseMessage): string | undefined {
  const data = event.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const resume = (data as Record<string, unknown>).resume;
    if (typeof resume === "string" && resume.trim()) return resume.trim();
  }
  if (typeof event.id === "string" && event.id.trim()) return event.id.trim();
  return undefined;
}

function createStreamId(): string {
  return `stream_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function consumeSseBuffer(buffer: string): { events: SseMessage[]; remainder: string } {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const chunks = normalized.split("\n\n");
  const remainder = chunks.pop() ?? "";
  return {
    events: chunks.map(parseSseFrame).filter((event): event is SseMessage => event !== null),
    remainder
  };
}

export function parseSseFrame(frame: string): SseMessage | null {
  const lines = frame.split("\n");
  const dataLines: string[] = [];
  let event = "message";
  let id: string | undefined;
  let retry: number | undefined;
  let sawComment = false;

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith(":")) {
      sawComment = true;
      continue;
    }
    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    const rawValue = separator === -1 ? "" : line.slice(separator + 1);
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;
    if (field === "event") event = value || "message";
    if (field === "data") dataLines.push(value);
    if (field === "id") id = value;
    if (field === "retry") {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed)) retry = parsed;
    }
  }

  if (!dataLines.length) {
    return sawComment ? { event: "heartbeat", data: {} } : null;
  }

  const dataText = dataLines.join("\n");
  return {
    event,
    data: safeJson(dataText),
    ...(id ? { id } : {}),
    ...(retry !== undefined ? { retry } : {})
  };
}

function parseWebSocketMessage(data: RawData): SseMessage | null {
  const text = rawDataToString(data);
  if (!text) return null;
  const parsed = safeJson(text);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const record = parsed as Record<string, unknown>;
    if ("event" in record && "data" in record) {
      return {
        event: String(record.event || "message"),
        data: record.data,
        ...(typeof record.id === "string" ? { id: record.id } : {}),
        ...(typeof record.retry === "number" ? { retry: record.retry } : {})
      };
    }
    return { event: "message", data: record };
  }
  return { event: "message", data: parsed };
}

function rawDataToString(data: RawData): string {
  if (typeof data === "string") return data;
  if (Buffer.isBuffer(data)) return data.toString("utf8");
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
  return String(data);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
