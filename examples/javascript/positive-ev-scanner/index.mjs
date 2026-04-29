// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const snapshot = await client.findPositiveEv({ limit: 10 });

console.log("# Positive EV scanner");
for (const bet of snapshot.items) {
  console.log(`${bet.id}: ${bet.bookmaker_name} odds=${bet.odds} fair=${bet.fair_odds} ev=${bet.ev}%`);
}
console.log(riskNote());
