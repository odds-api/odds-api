const apiKey = process.env.ODDS_API_KEY;
const baseUrl = process.env.ODDS_API_BASE_URL || "https://api.odds-api.net/v1";

if (!apiKey) {
  console.error("Missing API key. Set ODDS_API_KEY.");
  process.exit(1);
}

const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/sports`, {
  headers: {
    "X-API-Key": apiKey
  }
});

const text = await response.text();

if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${text}`);
}

console.log(text);
