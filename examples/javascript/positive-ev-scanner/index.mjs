// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const snapshot = await client.findPositiveEv({ limit: 10 });

console.log("# Positive EV scanner");
console.log(`Positive EV opportunities: ${snapshot.items.length}`);
for (const bet of snapshot.items) {
  console.log(`Best price: ${bet.selection_key} ${bet.odds} at ${bet.bookmaker_name}`);
  console.log(`Fair odds: ${bet.fair_odds}`);
  console.log(`Expected value: ${bet.ev}%`);
}
console.log(riskNote());
