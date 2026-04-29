import assert from "node:assert/strict";
import test from "node:test";

import { consumeSseBuffer, createServer, parseSseFrame } from "../dist/index.js";

test("creates MCP server", () => {
  const server = createServer({});
  assert.ok(server);
});

test("registers the expanded Odds API MCP tool set", () => {
  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const toolNames = Object.keys(server._registeredTools).sort();
  assert.deepEqual(toolNames, [
    "odds_api.compare_odds",
    "odds_api.find_arbitrage",
    "odds_api.find_positive_ev",
    "odds_api.get_bookmakers",
    "odds_api.get_leagues",
    "odds_api.get_line_movement",
    "odds_api.get_market_schema",
    "odds_api.get_odds",
    "odds_api.get_racing_odds",
    "odds_api.get_results",
    "odds_api.get_sports",
    "odds_api.get_streaming_info",
    "odds_api.sample_bets_stream",
    "odds_api.sample_odds_stream",
    "odds_api.search_events",
    "odds_api.search_racing_events"
  ]);
});

test("new data tools call the matching client methods", async () => {
  const calls = [];
  const client = {
    baseUrl: "https://api.odds-api.net/v1",
    listLeagues: async (params) => record(calls, "listLeagues", params, { items: ["NRL"] }),
    getResults: async (eventId) => record(calls, "getResults", eventId, { event_id: eventId }),
    searchRacingEvents: async (params) => record(calls, "searchRacingEvents", params, { items: [] }),
    getRacingOdds: async (eventId, params) => record(calls, "getRacingOdds", { eventId, params }, { event_id: eventId }),
    listBookmakers: async () => ({ items: [] }),
    listSports: async () => ({ items: [] }),
    getMarketSchema: () => ({})
  };
  const server = createServer(client);

  assert.deepEqual(await callTool(server, "odds_api.get_leagues", { sport: "rugby-league" }), { items: ["NRL"] });
  assert.deepEqual(await callTool(server, "odds_api.get_results", { event_id: "event-1" }), { event_id: "event-1" });
  assert.deepEqual(await callTool(server, "odds_api.search_racing_events", { limit: 5 }), { items: [] });
  assert.deepEqual(await callTool(server, "odds_api.get_racing_odds", { event_id: "race-1", bookmakers: "betfair" }), {
    event_id: "race-1"
  });

  assert.deepEqual(calls, [
    ["listLeagues", { sport: "rugby-league" }],
    ["getResults", "event-1"],
    ["searchRacingEvents", { limit: 5 }],
    ["getRacingOdds", { eventId: "race-1", params: { bookmakers: "betfair" } }]
  ]);
});

test("streaming info explains direct SSE and WebSocket usage", async () => {
  const server = createServer({ baseUrl: "https://api.odds-api.net/v1" });
  const info = await callTool(server, "odds_api.get_streaming_info", {});
  assert.equal(info.base_url, "https://api.odds-api.net/v1");
  assert.ok(info.guidance.mcp_sampling.includes("bounded inspection"));
  assert.ok(info.sse_endpoints.some((endpoint) => endpoint.includes("/bets/stream")));
  assert.ok(info.websocket_paths.some((path) => path.includes("/odds/ws")));
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
  process.env.ODDS_API_KEY = "test_key";
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

async function callTool(server, name, args) {
  const result = await server._registeredTools[name].handler(args);
  return JSON.parse(result.content[0].text);
}

function record(calls, method, args, result) {
  calls.push([method, args]);
  return result;
}
