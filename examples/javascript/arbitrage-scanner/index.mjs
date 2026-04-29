// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const snapshot = await client.findArbitrage({ limit: 10 });

console.log("# Arbitrage scanner");
console.log(`Arbitrage opportunities: ${snapshot.items.length}`);
for (const bet of snapshot.items) {
  console.log(`Arbitrage: yes`);
  console.log(`Selection: ${bet.selection_key}`);
  console.log(`Bookmakers: ${bet.bookmaker_name}`);
  console.log(`Expected return: ${bet.arb_percent ?? "n/a"}%`);
}
console.log(riskNote());
