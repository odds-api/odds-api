#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { OddsApiClient, oddsApiMockSseMessages, type QueryParams } from "@odds-api/client";

const DEFAULT_STREAM_MAX_EVENTS = 10;
const DEFAULT_STREAM_TIMEOUT_SEC = 15;
const HARD_STREAM_MAX_EVENTS = 25;
const HARD_STREAM_TIMEOUT_SEC = 30;
const STREAM_SAMPLE_WARNING =
  "MCP stream samples are bounded debugging snapshots. Production apps should consume SSE or WebSocket streams directly.";

const sampleControlsSchema = {
  since: z.string().optional(),
  catchup: z.boolean().optional(),
  heartbeat_sec: z.number().int().min(5).max(120).optional(),
  max_events: z.number().int().min(1).max(HARD_STREAM_MAX_EVENTS).optional(),
  timeout_sec: z.number().int().min(1).max(HARD_STREAM_TIMEOUT_SEC).optional()
};

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
    {
      start_from: z.number().optional(),
      start_to: z.number().optional(),
      country: z.string().optional(),
      track: z.string().optional(),
      limit: z.number().optional()
    },
    async (args) => jsonResult(await client.searchRacingEvents(args))
  );

  server.tool(
    "odds_api.get_racing_odds",
    "Retrieve normalized racing odds for a racing event.",
    {
      event_id: z.string(),
      bookmakers: z.string().optional(),
      market_keys: z.string().optional()
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
      bookmakers: z.string().optional(),
      market_keys: z.string().optional(),
      types: z.string().optional(),
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
    "odds_api.sample_bets_stream",
    "Collect a bounded SSE sample from the betting opportunities stream for debugging.",
    {
      strategies: z.string().optional(),
      ...sampleControlsSchema
    },
    async ({ max_events, timeout_sec, ...params }) =>
      jsonResult(await sampleSseStream(client, "/bets/stream", params, { max_events, timeout_sec }))
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
        "Use odds_api.sample_odds_stream and odds_api.sample_bets_stream for bounded inspection only. Production apps should connect directly to SSE or WebSocket endpoints."
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

function buildStreamUrl(baseUrl: string, path: string, params: QueryParams = {}): string {
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
  return url.toString();
}

function streamHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "text/event-stream" };
  const apiKey = process.env.ODDS_API_KEY?.trim();
  if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}

function boundedInteger(value: number | undefined, fallback: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(max, Math.trunc(Number(value))));
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
