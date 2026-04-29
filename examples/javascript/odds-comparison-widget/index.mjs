// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const events = await client.searchEvents({ sport: "rugby-league", league: "NRL", limit: 1 });
const event = events.items[0];
const best = await client.findBestOdds(event.event_id);
const bookmakers = new Set(best.map((row) => row.bookmaker));

console.log(`# Odds comparison: ${event.home_team} vs ${event.away_team}`);
console.log(`Found ${events.count} events`);
console.log(`Compared ${bookmakers.size} bookmakers`);
for (const row of best) {
  console.log(`Best price: ${row.selection_key} ${row.odds} at ${row.bookmaker}`);
}
console.log(riskNote());
