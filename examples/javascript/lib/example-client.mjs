import { OddsApiClient, oddsApiMockFetch } from "../../../sdks/typescript/dist/index.js";

export function createExampleClient() {
  const useMock = process.env.ODDS_API_MOCK === "1" || !process.env.ODDS_API_KEY;
  return new OddsApiClient({
    apiKey: process.env.ODDS_API_KEY,
    baseUrl: process.env.ODDS_API_BASE_URL || "https://api.odds-api.net/v1",
    fetchImpl: useMock ? oddsApiMockFetch : undefined
  });
}

export function riskNote() {
  return "Note: odds move, markets can suspend, selections can void, limits apply, and execution can fail. Do not treat any edge as guaranteed profit.";
}
