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
const HARD_STREAM_READ_TIMEOUT_SEC = 10;
const STREAM_SAMPLE_WARNING =
  "MCP stream samples are bounded debugging snapshots. Production apps should consume SSE or WebSocket streams directly.";
const PERSISTENT_STREAM_WARNING =
  "Persistent MCP stream sessions are for agent inspection and supervised workflows. Production apps should connect directly to SSE or WebSocket endpoints.";

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
    "odds_api.sample_odds_stream",
    "Collect a bounded SSE sample from an event odds stream for debugging.",
    {
      event_id: z.string(),
      ...oddsFilterSchema,
      ...sampleControlsSchema
    },
    async ({ event_id, max_events, timeout_sec, ...params }) =>
      jsonResult(
        await sampleSseStream(client, `/events/${encodeURIComponent(event_id)}/odds/stream`, params, {
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
        await sampleSseStream(client, `/events/${encodeURIComponent(event_id)}/odds/history/stream`, params, {
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
      jsonResult(await sampleSseStream(client, "/bets/stream", params, { max_events, timeout_sec }))
  );

  server.tool(
    "odds_api.sample_racing_events_stream",
    "Collect a bounded SSE sample from the racing events stream for debugging.",
    {
      ...racingStreamFieldSchema,
      ...sampleControlsSchema
    },
    async ({ max_events, timeout_sec, ...params }) =>
      jsonResult(await sampleSseStream(client, "/racing/events/stream", params, { max_events, timeout_sec }))
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
        await sampleSseStream(client, `/racing/events/${encodeURIComponent(event_id)}/odds/stream`, params, {
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
    "Read and drain buffered events from a persistent MCP stream session.",
    {
      stream_id: z.string(),
      max_events: z.number().int().min(1).max(HARD_STREAM_READ_MAX_EVENTS).optional(),
      timeout_sec: z.number().int().min(0).max(HARD_STREAM_READ_TIMEOUT_SEC).optional()
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

type PersistentStreamEndpoint = z.infer<typeof persistentStreamEndpointSchema>;
type PersistentStreamTransport = "sse" | "websocket";
type PersistentStreamStatus = "connecting" | "open" | "closed" | "error";

interface OpenStreamArgs extends QueryParams {
  endpoint: PersistentStreamEndpoint;
  event_id?: string;
  selection_key?: string;
  buffer_limit?: number;
}

interface PersistentStreamSpec {
  endpoint: PersistentStreamEndpoint;
  transport: PersistentStreamTransport;
  path: string;
  mockPath: string;
  url: string;
  mockUrl: string;
  params: QueryParams;
  bufferLimit: number;
}

interface PersistentStreamState {
  id: string;
  endpoint: PersistentStreamEndpoint;
  transport: PersistentStreamTransport;
  path: string;
  url: string;
  status: PersistentStreamStatus;
  created_at: string;
  updated_at: string;
  events: SseMessage[];
  dropped_events: number;
  buffer_limit: number;
  error?: string;
  controller?: AbortController;
  socket?: WebSocket;
}

interface StreamReadOptions {
  max_events?: number;
  timeout_sec?: number;
}

class PersistentStreamManager {
  private readonly streams = new Map<string, PersistentStreamState>();

  constructor(private readonly client: Pick<OddsApiClient, "baseUrl">) {}

  async open(args: OpenStreamArgs) {
    const spec = buildPersistentStreamSpec(this.client.baseUrl, args);
    const stream: PersistentStreamState = {
      id: createStreamId(),
      endpoint: spec.endpoint,
      transport: spec.transport,
      path: spec.path,
      url: spec.url,
      status: "connecting",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [],
      dropped_events: 0,
      buffer_limit: spec.bufferLimit
    };
    this.streams.set(stream.id, stream);

    if (process.env.ODDS_API_MOCK === "1") {
      stream.status = "open";
      this.pushMany(stream, oddsApiMockSseMessages(spec.mockUrl));
      return this.summary(stream, { warning: PERSISTENT_STREAM_WARNING });
    }

    if (spec.transport === "sse") {
      this.startSse(stream);
    } else {
      this.startWebSocket(stream);
    }

    return this.summary(stream, { warning: PERSISTENT_STREAM_WARNING });
  }

  async read(streamId: string, options: StreamReadOptions = {}) {
    const stream = this.requireStream(streamId);
    const maxEvents = boundedInteger(options.max_events, DEFAULT_STREAM_READ_MAX_EVENTS, HARD_STREAM_READ_MAX_EVENTS);
    const timeoutSec = boundedInteger(options.timeout_sec, 0, HARD_STREAM_READ_TIMEOUT_SEC, 0);
    const deadline = Date.now() + timeoutSec * 1000;

    while (!stream.events.length && stream.status !== "closed" && stream.status !== "error" && Date.now() < deadline) {
      await delay(100);
    }

    const events = stream.events.splice(0, maxEvents);
    stream.updated_at = new Date().toISOString();
    return {
      ...this.summary(stream),
      count: events.length,
      events
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
    stream.status = "closed";
    stream.updated_at = new Date().toISOString();
    stream.controller?.abort();
    stream.socket?.close();
    this.streams.delete(streamId);
    return this.summary(stream);
  }

  private startSse(stream: PersistentStreamState): void {
    const controller = new AbortController();
    stream.controller = controller;
    void (async () => {
      try {
        const response = await fetch(stream.url, {
          headers: streamHeaders(),
          signal: controller.signal
        });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`SSE stream failed with status ${response.status}: ${body}`);
        }
        if (!response.body) {
          throw new Error("SSE stream response did not include a readable body");
        }
        stream.status = "open";
        stream.updated_at = new Date().toISOString();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while ((stream.status as PersistentStreamStatus) !== "closed") {
          const readResult = await reader.read();
          if (readResult.done) break;
          buffer += decoder.decode(readResult.value, { stream: true });
          const parsed = consumeSseBuffer(buffer);
          buffer = parsed.remainder;
          this.pushMany(stream, parsed.events);
        }
        if ((stream.status as PersistentStreamStatus) !== "closed") stream.status = "closed";
      } catch (error) {
        if (controller.signal.aborted || stream.status === "closed") {
          stream.status = "closed";
        } else {
          stream.status = "error";
          stream.error = errorMessage(error);
        }
      } finally {
        stream.updated_at = new Date().toISOString();
      }
    })();
  }

  private startWebSocket(stream: PersistentStreamState): void {
    const socket = new WebSocket(stream.url, {
      headers: authHeaders()
    });
    stream.socket = socket;
    socket.on("open", () => {
      stream.status = "open";
      stream.updated_at = new Date().toISOString();
    });
    socket.on("message", (data) => {
      const event = parseWebSocketMessage(data);
      if (event) this.pushMany(stream, [event]);
    });
    socket.on("error", (error) => {
      stream.status = "error";
      stream.error = errorMessage(error);
      stream.updated_at = new Date().toISOString();
    });
    socket.on("close", () => {
      if (stream.status !== "error") stream.status = "closed";
      stream.updated_at = new Date().toISOString();
    });
  }

  private pushMany(stream: PersistentStreamState, events: SseMessage[]): void {
    for (const event of events) {
      stream.events.push(event);
      if (stream.events.length > stream.buffer_limit) {
        stream.events.shift();
        stream.dropped_events += 1;
      }
    }
    if (events.length) stream.updated_at = new Date().toISOString();
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
      buffered_events: stream.events.length,
      dropped_events: stream.dropped_events,
      buffer_limit: stream.buffer_limit,
      created_at: stream.created_at,
      updated_at: stream.updated_at,
      ...(stream.error ? { error: stream.error } : {}),
      ...extra
    };
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
      streams: "Use SSE or WebSocket streams for realtime products that need incremental updates.",
      mcp_sampling:
        "Use odds_api.sample_*_stream tools for bounded inspection only.",
      mcp_persistent:
        "Use odds_api.open_stream, odds_api.read_stream, odds_api.list_streams, and odds_api.close_stream for persistent MCP-managed SSE or WebSocket inspection sessions. Production apps should connect directly to SSE or WebSocket endpoints."
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
    sse_endpoints: [
      `${normalizedBaseUrl}/events/{event_id}/odds/stream`,
      `${normalizedBaseUrl}/events/{event_id}/odds/history/stream`,
      `${normalizedBaseUrl}/bets/stream`,
      `${normalizedBaseUrl}/racing/events/stream`,
      `${normalizedBaseUrl}/racing/events/{event_id}/odds/stream`
    ],
    websocket_paths: [
      "/events/{event_id}/odds/ws",
      "/events/{event_id}/odds/history/ws",
      "/bets/ws",
      "/racing/events/ws",
      "/racing/events/{event_id}/odds/ws",
      "/odds/main-lines/ws",
      "/odds/home/sports/ws",
      "/odds/home/racing/ws"
    ],
    safety:
      "Treat streamed prices as time-sensitive. Handle disconnects, stale odds, suspended markets, limits, voids, and execution risk."
  };
}

function buildPersistentStreamSpec(baseUrl: string, args: OpenStreamArgs): PersistentStreamSpec {
  const endpoint = args.endpoint;
  const eventId = args.event_id;
  const transport = endpoint.endsWith("_ws") ? "websocket" : "sse";
  const path = streamPath(endpoint, eventId);
  const mockPath = streamPath(equivalentSseEndpoint(endpoint), eventId);
  const params = streamQueryParams(args);

  if (isHistoryEndpoint(endpoint) && !args.selection_key) {
    throw new Error("selection_key is required for event odds history streams");
  }

  return {
    endpoint,
    transport,
    path,
    mockPath,
    url: buildStreamUrl(baseUrl, path, params, transport),
    mockUrl: buildStreamUrl(baseUrl, mockPath, params, "sse"),
    params,
    bufferLimit: boundedInteger(args.buffer_limit, DEFAULT_PERSISTENT_BUFFER_LIMIT, HARD_PERSISTENT_BUFFER_LIMIT)
  };
}

function streamPath(endpoint: PersistentStreamEndpoint, eventId?: string): string {
  switch (endpoint) {
    case "event_odds_sse":
      return `/events/${encodeRequiredEventId(eventId, endpoint)}/odds/stream`;
    case "event_odds_ws":
      return `/events/${encodeRequiredEventId(eventId, endpoint)}/odds/ws`;
    case "event_odds_history_sse":
      return `/events/${encodeRequiredEventId(eventId, endpoint)}/odds/history/stream`;
    case "event_odds_history_ws":
      return `/events/${encodeRequiredEventId(eventId, endpoint)}/odds/history/ws`;
    case "bets_sse":
      return "/bets/stream";
    case "bets_ws":
      return "/bets/ws";
    case "racing_events_sse":
      return "/racing/events/stream";
    case "racing_events_ws":
      return "/racing/events/ws";
    case "racing_odds_sse":
      return `/racing/events/${encodeRequiredEventId(eventId, endpoint)}/odds/stream`;
    case "racing_odds_ws":
      return `/racing/events/${encodeRequiredEventId(eventId, endpoint)}/odds/ws`;
  }
}

function equivalentSseEndpoint(endpoint: PersistentStreamEndpoint): PersistentStreamEndpoint {
  switch (endpoint) {
    case "event_odds_ws":
      return "event_odds_sse";
    case "event_odds_history_ws":
      return "event_odds_history_sse";
    case "bets_ws":
      return "bets_sse";
    case "racing_events_ws":
      return "racing_events_sse";
    case "racing_odds_ws":
      return "racing_odds_sse";
    default:
      return endpoint;
  }
}

function isHistoryEndpoint(endpoint: PersistentStreamEndpoint): boolean {
  return endpoint === "event_odds_history_sse" || endpoint === "event_odds_history_ws";
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

function cleanQueryParams(params: QueryParams): QueryParams {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
