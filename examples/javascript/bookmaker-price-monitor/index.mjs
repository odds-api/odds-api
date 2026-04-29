// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const snapshot = await client.compareBookmakers("event-1001", ["bet365", "pinnacle", "sportsbet"]);
const bookmakers = new Set(snapshot.items.map((odd) => odd.bookmaker));

console.log("# Bookmaker price monitor");
console.log(`Compared ${bookmakers.size} bookmakers`);
console.log(`Prices returned: ${snapshot.items.length}`);
for (const odd of snapshot.items) {
  console.log(`Best price candidate: ${odd.selection_key} ${odd.odds} at ${odd.bookmaker}`);
}
console.log(riskNote());
