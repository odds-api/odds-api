# TypeScript Sports Odds API Quickstart

This quickstart shows the smallest JavaScript REST request and the TypeScript SDK path for Odds API.

Canonical GitHub repo: https://github.com/odds-api/odds-api

## One-file JavaScript REST example

No SDK required. No framework required. Plain REST and JSON.

```js
const apiKey = process.env.ODDS_API_KEY;
const baseUrl = process.env.ODDS_API_BASE_URL || "https://api.odds-api.net/v1";

const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/sports`, {
  headers: { "X-API-Key": apiKey, Accept: "application/json" }
});

console.log(JSON.stringify(await response.json(), null, 2));
```

## TypeScript SDK path

```bash
npm install @odds-api/client
```

```ts
import { OddsApiClient } from "@odds-api/client";

const client = new OddsApiClient({ apiKey: process.env.ODDS_API_KEY });
const events = await client.searchEvents({ sport: "rugby-league", league: "NRL" });
console.log(events);
```

Use the SDK when you want typed app integration, helper methods, and mock-mode examples.
