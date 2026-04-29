// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const [events, positiveEv, arbitrage] = await Promise.all([
  client.searchEvents({ limit: 5 }),
  client.findPositiveEv({ limit: 5 }),
  client.findArbitrage({ limit: 5 })
]);

console.log("# Betting dashboard");
console.log(`Found ${events.count} events`);
console.log(`Positive EV opportunities: ${positiveEv.items.length}`);
console.log(`Arbitrage opportunities: ${arbitrage.items.length}`);
console.log(riskNote());
