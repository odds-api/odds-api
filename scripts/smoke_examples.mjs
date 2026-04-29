import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const jsRoot = join(root, "examples", "javascript");
const pyRoot = join(root, "examples", "python");

const env = {
  ...process.env,
  ODDS_API_MOCK: "1",
  ODDS_API_BASE_URL: process.env.ODDS_API_BASE_URL || "https://api.odds-api.net/v1"
};

function run(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, { cwd, env: { ...env, ...extraEnv }, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runAsync(command, args, cwd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...env, ...extraEnv }, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with ${signal || code}`));
    });
  });
}

async function smokeMinimalRestJavascript() {
  const server = createServer((request, response) => {
    if (request.url === "/v1/sports") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ items: ["rugby-league", "soccer", "basketball"] }));
      return;
    }
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not found" }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await runAsync("node", ["odds.mjs"], join(root, "examples", "minimal-rest", "javascript"), {
      ODDS_API_KEY: "smoke-test",
      ODDS_API_BASE_URL: `http://127.0.0.1:${address.port}/v1`
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

await smokeMinimalRestJavascript();

for (const name of readdirSync(jsRoot)) {
  const dir = join(jsRoot, name);
  if (statSync(dir).isDirectory() && name !== "lib") {
    run("node", ["index.mjs"], dir);
  }
}

for (const name of readdirSync(pyRoot)) {
  const dir = join(pyRoot, name);
  if (statSync(dir).isDirectory()) {
    run("python3", ["main.py"], dir);
  }
}
