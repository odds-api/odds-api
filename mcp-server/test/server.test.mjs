import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "../dist/index.js";

test("creates MCP server", () => {
  const server = createServer({});
  assert.ok(server);
});

