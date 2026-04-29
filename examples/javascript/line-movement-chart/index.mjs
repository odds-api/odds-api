// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const history = await client.getLineMovement("event-1001", "moneyline:home", { price_type: "odds" });

console.log("# Line movement");
console.log(`Series: ${(history.series || []).length}`);
for (const series of history.series || []) {
  console.log(`Bookmaker: ${series.bookmaker_name}`);
  console.log(`Points: ${series.points.length}`);
  for (const point of series.points) {
    console.log(`  ${point.tick_ts}: ${point.odds}`);
  }
}
console.log(riskNote());
