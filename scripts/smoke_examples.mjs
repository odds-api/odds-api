import { spawnSync } from "node:child_process";
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

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

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

