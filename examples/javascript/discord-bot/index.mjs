// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const snapshot = await client.findPositiveEv({ limit: 3 });
const lines = snapshot.items.map((bet) => `**${bet.bookmaker_name}** ${bet.selection_key} @ ${bet.odds} (${bet.ev}% EV)`);
const message = [`Odds API edge alert`, `Positive EV opportunities: ${snapshot.items.length}`, ...lines, riskNote()].join("\n");

if (process.env.DISCORD_WEBHOOK_URL && process.env.ODDS_API_MOCK !== "1") {
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: message })
  });
  console.log("Posted Discord alert");
} else {
  console.log(message);
}
