import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const snapshot = await client.compareBookmakers("event-1001", ["bet365", "pinnacle", "sportsbet"]);

console.log("# Bookmaker price monitor");
for (const odd of snapshot.items) {
  console.log(`${odd.bookmaker} ${odd.selection_key}: ${odd.odds}`);
}
console.log(riskNote());

