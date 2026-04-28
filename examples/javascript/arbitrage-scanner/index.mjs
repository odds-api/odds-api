import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const snapshot = await client.findArbitrage({ limit: 10 });

console.log("# Arbitrage scanner");
for (const bet of snapshot.items) {
  console.log(`${bet.id}: ${bet.bookmaker_name} ${bet.arb_percent ?? "n/a"}%`);
}
console.log(riskNote());

