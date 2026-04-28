import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const events = await client.searchEvents({ sport: "rugby-league", league: "NRL", limit: 1 });
const event = events.items[0];
const best = await client.findBestOdds(event.event_id);

console.log(`# Odds comparison: ${event.home_team} vs ${event.away_team}`);
for (const row of best) {
  console.log(`${row.selection_key}: ${row.bookmaker} @ ${row.odds}`);
}
console.log(riskNote());

