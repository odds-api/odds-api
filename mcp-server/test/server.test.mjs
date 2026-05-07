import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import { WebSocketServer } from "ws";

import { consumeSseBuffer, createServer, parseSseFrame } from "../dist/index.js";

test("creates MCP server", () => {
  const server = createServer({});
  assert.ok(server);
});

test("registers the expanded Odds API MCP tool set", () => {
  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const toolNames = Object.keys(server._registeredTools).sort();
  assert.deepEqual(toolNames, [
    "odds_api.close_stream",
    "odds_api.compare_odds",
    "odds_api.find_arbitrage",
    "odds_api.find_positive_ev",
    "odds_api.get_account",
    "odds_api.get_api_metadata",
    "odds_api.get_bookmaker_countries",
    "odds_api.get_bookmakers",
    "odds_api.get_event",
    "odds_api.get_event_bookmakers",
    "odds_api.get_leagues",
    "odds_api.get_limits",
    "odds_api.get_line_movement",
    "odds_api.get_market_schema",
    "odds_api.get_odds",
    "odds_api.get_racing_event",
    "odds_api.get_racing_odds",
    "odds_api.get_results",
    "odds_api.get_sports",
    "odds_api.get_stream_connection",
    "odds_api.get_streaming_info",
    "odds_api.get_usage",
    "odds_api.list_streams",
    "odds_api.open_stream",
    "odds_api.read_stream",
    "odds_api.sample_bets_stream",
    "odds_api.sample_event_odds_history_stream",
    "odds_api.sample_odds_stream",
    "odds_api.sample_racing_events_stream",
    "odds_api.sample_racing_odds_stream",
    "odds_api.search_events",
    "odds_api.search_racing_events"
  ]);
});

test("new data tools call the matching client methods", async () => {
  const calls = [];
  const client = {
    baseUrl: "https://api.odds-api.net/v1",
    getApiMetadata: async () => record(calls, "getApiMetadata", null, { openapi: "/v1/openapi.json" }),
    getMe: async () => record(calls, "getMe", null, { account_id: "acct_1" }),
    getUsage: async () => record(calls, "getUsage", null, { api_credits_used: 1 }),
    getLimits: async () => record(calls, "getLimits", null, { responses: {} }),
    getEvent: async (eventId, params) => record(calls, "getEvent", { eventId, params }, { event_id: eventId }),
    getEventBookmakers: async (eventId) => record(calls, "getEventBookmakers", eventId, { event_id: eventId, items: [] }),
    listLeagues: async (params) => record(calls, "listLeagues", params, { items: ["NRL"] }),
    getResults: async (eventId) => record(calls, "getResults", eventId, { event_id: eventId }),
    searchRacingEvents: async (params) => record(calls, "searchRacingEvents", params, { items: [] }),
    getRacingEvent: async (eventId, params) => record(calls, "getRacingEvent", { eventId, params }, { event_id: eventId }),
    getRacingOdds: async (eventId, params) => record(calls, "getRacingOdds", { eventId, params }, { event_id: eventId }),
    listBookmakerCountries: async () => record(calls, "listBookmakerCountries", null, { items: [] }),
    listBookmakers: async () => ({ items: [] }),
    listSports: async () => ({ items: [] }),
    getMarketSchema: () => ({})
  };
  const server = createServer(client);

  assert.deepEqual(await callTool(server, "odds_api.get_api_metadata", {}), { openapi: "/v1/openapi.json" });
  assert.deepEqual(await callTool(server, "odds_api.get_account", {}), { account_id: "acct_1" });
  assert.deepEqual(await callTool(server, "odds_api.get_usage", {}), { api_credits_used: 1 });
  assert.deepEqual(await callTool(server, "odds_api.get_limits", {}), { responses: {} });
  assert.deepEqual(await callTool(server, "odds_api.get_event", { event_id: "event-1", include_links: true }), {
    event_id: "event-1"
  });
  assert.deepEqual(await callTool(server, "odds_api.get_event_bookmakers", { event_id: "event-1" }), {
    event_id: "event-1",
    items: []
  });
  assert.deepEqual(await callTool(server, "odds_api.get_leagues", { sport: "rugby-league" }), { items: ["NRL"] });
  assert.deepEqual(await callTool(server, "odds_api.get_results", { event_id: "event-1" }), { event_id: "event-1" });
  assert.deepEqual(await callTool(server, "odds_api.search_racing_events", { limit: 5 }), { items: [] });
  assert.deepEqual(await callTool(server, "odds_api.get_racing_event", { event_id: "race-1", include_source: true }), {
    event_id: "race-1"
  });
  assert.deepEqual(await callTool(server, "odds_api.get_racing_odds", { event_id: "race-1", bookmakers: "betfair" }), {
    event_id: "race-1"
  });
  assert.deepEqual(await callTool(server, "odds_api.get_bookmaker_countries", {}), { items: [] });

  assert.deepEqual(calls, [
    ["getApiMetadata", null],
    ["getMe", null],
    ["getUsage", null],
    ["getLimits", null],
    ["getEvent", { eventId: "event-1", params: { include_links: true } }],
    ["getEventBookmakers", "event-1"],
    ["listLeagues", { sport: "rugby-league" }],
    ["getResults", "event-1"],
    ["searchRacingEvents", { limit: 5 }],
    ["getRacingEvent", { eventId: "race-1", params: { include_source: true } }],
    ["getRacingOdds", { eventId: "race-1", params: { bookmakers: "betfair" } }],
    ["listBookmakerCountries", null]
  ]);
});

test("streaming info explains direct SSE and WebSocket usage", async () => {
  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const info = await callTool(server, "odds_api.get_streaming_info", {});
  assert.equal(info.base_url, "https://api.odds-api.net/v1");
  assert.ok(info.guidance.mcp_sampling.includes("bounded inspection"));
  assert.ok(info.guidance.mcp_persistent.includes("open_stream"));
  assert.equal(info.stream_families.length, 5);
  assert.ok(info.sse_endpoints.some((endpoint) => endpoint.includes("/bets/stream")));
  assert.ok(info.websocket_paths.some((path) => path.includes("/bets/ws")));
  assert.ok(info.websocket_paths.some((path) => path.includes("/odds/ws")));
  assert.equal(info.websocket_paths.some((path) => path.includes("main-lines")), false);
  assert.equal(info.websocket_paths.some((path) => path.includes("home/sports")), false);
  assert.equal(info.websocket_paths.some((path) => path.includes("home/racing")), false);
});

test("stream connection recipes expose public raw API stream details without secrets", async () => {
  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const connection = await callTool(server, "odds_api.get_stream_connection", {
    endpoint: "event_odds_ws",
    event_id: "event-1",
    bookmakers: "pinnacle",
    since: "10-0",
    catchup: true
  });

  assert.equal(connection.family, "event_odds");
  assert.equal(connection.snapshot.path, "/events/event-1/odds/snapshot");
  assert.equal(new URL(connection.snapshot.url).pathname, "/v1/events/event-1/odds/snapshot");
  assert.equal(new URL(connection.sse.url).pathname, "/v1/events/event-1/odds/stream");
  assert.equal(new URL(connection.websocket.url).protocol, "wss:");
  assert.equal(new URL(connection.websocket.url).pathname, "/v1/events/event-1/odds/ws");
  assert.equal(new URL(connection.websocket.url).searchParams.get("since"), "10-0");
  assert.equal(connection.websocket.headers["X-API-Key"].includes("test_key"), false);
  assert.equal(JSON.stringify(connection).includes("main-lines"), false);
});

test("parses SSE data and heartbeat frames", () => {
  assert.deepEqual(parseSseFrame("event: delta\ndata: {\"ok\":true}\nid: 10-0\n"), {
    event: "delta",
    data: { ok: true },
    id: "10-0"
  });
  assert.deepEqual(parseSseFrame(": keep-alive\n"), { event: "heartbeat", data: {} });
  assert.deepEqual(consumeSseBuffer("event: delta\ndata: 1\n\npartial"), {
    events: [{ event: "delta", data: 1 }],
    remainder: "partial"
  });
});

test("samples odds streams with hard event limits and auth headers", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.ODDS_API_KEY;
  const originalMock = process.env.ODDS_API_MOCK;
  process.env.ODDS_API_KEY = "test_key";
  delete process.env.ODDS_API_MOCK;
  let seenUrl;
  let seenHeaders;
  globalThis.fetch = async (url, init) => {
    seenUrl = String(url);
    seenHeaders = init.headers;
    const body = Array.from({ length: 30 }, (_, i) => `event: delta\ndata: {\"i\":${i}}\n\n`).join("");
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        }
      }),
      { status: 200, headers: { "content-type": "text/event-stream" } }
    );
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.ODDS_API_KEY;
    else process.env.ODDS_API_KEY = originalApiKey;
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const sample = await callTool(server, "odds_api.sample_odds_stream", {
    event_id: "event-1",
    catchup: true,
    heartbeat_sec: 5,
    max_events: 99,
    timeout_sec: 99
  });

  const url = new URL(seenUrl);
  assert.equal(url.pathname, "/v1/events/event-1/odds/stream");
  assert.equal(url.searchParams.get("catchup"), "true");
  assert.equal(url.searchParams.get("heartbeat_sec"), "5");
  assert.equal(seenHeaders["X-API-Key"], "test_key");
  assert.equal(sample.count, 25);
  assert.equal(sample.stopped_reason, "max_events");
  assert.equal(sample.events[24].data.i, 24);
  assert.ok(sample.warning.includes("bounded debugging"));
});

test("samples bets streams with strategy filters", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalMock = process.env.ODDS_API_MOCK;
  delete process.env.ODDS_API_MOCK;
  let seenUrl;
  globalThis.fetch = async (url) => {
    seenUrl = String(url);
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("event: delta\ndata: {\"strategy\":\"pos_ev\"}\n\n"));
          controller.close();
        }
      }),
      { status: 200 }
    );
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const sample = await callTool(server, "odds_api.sample_bets_stream", {
    strategies: "pos_ev",
    max_events: 10
  });

  const url = new URL(seenUrl);
  assert.equal(url.pathname, "/v1/bets/stream");
  assert.equal(url.searchParams.get("strategies"), "pos_ev");
  assert.equal(sample.count, 1);
  assert.equal(sample.events[0].data.strategy, "pos_ev");
});

test("samples mock odds streams with live-shaped delta payloads", async (t) => {
  const originalMock = process.env.ODDS_API_MOCK;
  const originalFetch = globalThis.fetch;
  process.env.ODDS_API_MOCK = "1";
  globalThis.fetch = async () => {
    throw new Error("mock stream sampling should not call fetch");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const sample = await callTool(server, "odds_api.sample_odds_stream", {
    event_id: "event-1001",
    max_events: 2
  });

  assert.equal(sample.count, 2);
  assert.equal(sample.events[0].event, "delta");
  assert.equal(sample.events[0].data.event_id, "event-1001");
  assert.equal(sample.events[0].data.changes[0].op, "upsert");
  assert.equal(sample.events[0].data.changes[0].odd.bet_type, "moneyline");
  assert.equal(sample.events[0].data.changes[0].odd.period_str, "full time");
  assert.equal(sample.events[1].event, "heartbeat");
});

test("samples mock bets streams with JSON resume strings and delete ops", async (t) => {
  const originalMock = process.env.ODDS_API_MOCK;
  const originalFetch = globalThis.fetch;
  process.env.ODDS_API_MOCK = "1";
  globalThis.fetch = async () => {
    throw new Error("mock stream sampling should not call fetch");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const sample = await callTool(server, "odds_api.sample_bets_stream", {
    strategies: "pos_ev",
    max_events: 1
  });

  assert.equal(sample.count, 1);
  assert.deepEqual(JSON.parse(sample.events[0].data.resume), { pos_ev: "1760000000001-0" });
  assert.equal(sample.events[0].data.events[0].doc.odds_history.primary_selection_key, "moneyline:home");
  assert.equal(sample.events[0].data.events[1].op, "delete");
});

test("samples all public SSE stream families in mock mode", async (t) => {
  const originalMock = process.env.ODDS_API_MOCK;
  const originalFetch = globalThis.fetch;
  process.env.ODDS_API_MOCK = "1";
  globalThis.fetch = async () => {
    throw new Error("mock stream sampling should not call fetch");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });

  const history = await callTool(server, "odds_api.sample_event_odds_history_stream", {
    event_id: "event-1001",
    selection_key: "moneyline:home",
    max_events: 1
  });
  assert.equal(history.events[0].data.selection_key, "moneyline:home");

  const racingEvents = await callTool(server, "odds_api.sample_racing_events_stream", { max_events: 1 });
  assert.equal(racingEvents.events[0].data.changes[0].event_id, "race-1001");

  const racingOdds = await callTool(server, "odds_api.sample_racing_odds_stream", {
    event_id: "race-1001",
    max_events: 1
  });
  assert.equal(racingOdds.events[0].data.event_id, "race-1001");
});

test("opens, reads, lists, and closes persistent mock stream sessions", async (t) => {
  const originalMock = process.env.ODDS_API_MOCK;
  process.env.ODDS_API_MOCK = "1";
  t.after(() => {
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const opened = await callTool(server, "odds_api.open_stream", {
    endpoint: "event_odds_ws",
    event_id: "event-1001",
    since: "1760000000000-0",
    buffer_limit: 2
  });
  assert.equal(opened.transport, "websocket");
  assert.ok(opened.url.startsWith("wss://api.odds-api.net/v1/events/event-1001/odds/ws"));
  assert.equal(opened.buffered_events, 2);

  const listed = await callTool(server, "odds_api.list_streams", {});
  assert.equal(listed.count, 1);
  assert.equal(listed.streams[0].stream_id, opened.stream_id);

  const read = await callTool(server, "odds_api.read_stream", {
    stream_id: opened.stream_id,
    max_events: 1,
    timeout_sec: 0
  });
  assert.equal(read.count, 1);
  assert.equal(read.events[0].event, "delta");
  assert.equal(read.events[0].sequence, 1);
  assert.equal(read.buffered_events, 1);

  const cursorOpened = await callTool(server, "odds_api.open_stream", {
    endpoint: "bets_sse",
    strategies: "pos_ev",
    buffer_limit: 5
  });
  const cursorRead = await callTool(server, "odds_api.read_stream", {
    stream_id: cursorOpened.stream_id,
    cursor: 0,
    max_events: 2,
    timeout_sec: 0
  });
  assert.equal(cursorRead.count, 2);
  assert.equal(cursorRead.drain, false);
  assert.equal(cursorRead.next_cursor, 2);
  const afterCursorRead = await callTool(server, "odds_api.list_streams", {});
  assert.equal(afterCursorRead.streams.find((stream) => stream.stream_id === cursorOpened.stream_id).buffered_events, 2);
  await callTool(server, "odds_api.close_stream", { stream_id: cursorOpened.stream_id });

  const closed = await callTool(server, "odds_api.close_stream", { stream_id: opened.stream_id });
  assert.equal(closed.status, "closed");
  const afterClose = await callTool(server, "odds_api.list_streams", {});
  assert.equal(afterClose.count, 0);
});

test("persistent SSE broker reconnects with resume and exposes cursor reads", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.ODDS_API_KEY;
  const originalMock = process.env.ODDS_API_MOCK;
  process.env.ODDS_API_KEY = "test_key";
  delete process.env.ODDS_API_MOCK;
  const seenUrls = [];
  let seenHeaders;
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls += 1;
    seenUrls.push(String(url));
    seenHeaders = init.headers;
    const resume = calls === 1 ? "1-0" : "2-0";
    const body = `event: delta\ndata: {\"resume\":\"${resume}\",\"i\":${calls}}\n\n`;
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        }
      }),
      { status: 200, headers: { "content-type": "text/event-stream" } }
    );
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.ODDS_API_KEY;
    else process.env.ODDS_API_KEY = originalApiKey;
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const opened = await callTool(server, "odds_api.open_stream", {
    endpoint: "bets_sse",
    strategies: "pos_ev"
  });
  const first = await callTool(server, "odds_api.read_stream", {
    stream_id: opened.stream_id,
    cursor: 0,
    max_events: 1,
    timeout_sec: 5
  });
  const second = await callTool(server, "odds_api.read_stream", {
    stream_id: opened.stream_id,
    cursor: first.next_cursor,
    max_events: 1,
    timeout_sec: 5
  });
  await callTool(server, "odds_api.close_stream", { stream_id: opened.stream_id });

  assert.equal(seenHeaders["X-API-Key"], "test_key");
  assert.equal(first.events[0].data.i, 1);
  assert.equal(second.events[0].data.i, 2);
  assert.ok(second.reconnect_count >= 1);
  assert.equal(second.last_resume, "2-0");
  const reconnectUrl = new URL(seenUrls[1]);
  assert.equal(reconnectUrl.searchParams.get("since"), "1-0");
  assert.equal(reconnectUrl.searchParams.get("catchup"), "true");
});

test("persistent WebSocket broker reconnects with resume and auth headers", async (t) => {
  const originalApiKey = process.env.ODDS_API_KEY;
  const originalMock = process.env.ODDS_API_MOCK;
  process.env.ODDS_API_KEY = "ws_key";
  delete process.env.ODDS_API_MOCK;
  const wss = new WebSocketServer({ port: 0 });
  await once(wss, "listening");
  const address = wss.address();
  assert.equal(typeof address, "object");
  const port = address.port;
  const seenUrls = [];
  const seenAuth = [];
  let connections = 0;

  wss.on("connection", (socket, request) => {
    connections += 1;
    seenUrls.push(request.url);
    seenAuth.push(request.headers["x-api-key"]);
    const resume = connections === 1 ? "10-0" : "11-0";
    socket.send(JSON.stringify({ event: "delta", data: { resume, i: connections } }));
    setTimeout(() => socket.close(1000, "test close"), 10);
  });

  t.after(() => {
    wss.close();
    if (originalApiKey === undefined) delete process.env.ODDS_API_KEY;
    else process.env.ODDS_API_KEY = originalApiKey;
    if (originalMock === undefined) delete process.env.ODDS_API_MOCK;
    else process.env.ODDS_API_MOCK = originalMock;
  });

  const server = createServer({ baseUrl: `http://127.0.0.1:${port}/v1` });
  const opened = await callTool(server, "odds_api.open_stream", {
    endpoint: "bets_ws",
    strategies: "arbitrage"
  });
  const first = await callTool(server, "odds_api.read_stream", {
    stream_id: opened.stream_id,
    cursor: 0,
    max_events: 1,
    timeout_sec: 5
  });
  const second = await callTool(server, "odds_api.read_stream", {
    stream_id: opened.stream_id,
    cursor: first.next_cursor,
    max_events: 1,
    timeout_sec: 5
  });
  await callTool(server, "odds_api.close_stream", { stream_id: opened.stream_id });

  assert.equal(first.events[0].data.i, 1);
  assert.equal(second.events[0].data.i, 2);
  assert.deepEqual(seenAuth.slice(0, 2), ["ws_key", "ws_key"]);
  assert.ok(seenUrls[0].includes("/v1/bets/ws"));
  assert.ok(seenUrls[1].includes("since=10-0"));
  assert.ok(seenUrls[1].includes("catchup=true"));
  assert.ok(second.reconnect_count >= 1);
});

async function callTool(server, name, args) {
  const result = await server._registeredTools[name].handler(args);
  return JSON.parse(result.content[0].text);
}

function record(calls, method, args, result) {
  calls.push([method, args]);
  return result;
}
