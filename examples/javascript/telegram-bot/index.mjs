// Reference pattern only: adapt this data-access flow to your own product.
// Do not treat this example as the default UI or workflow.
import { createExampleClient, riskNote } from "../lib/example-client.mjs";

const client = createExampleClient();
const snapshot = await client.findArbitrage({ limit: 3 });
const text = [`Odds API arbitrage alert`, ...snapshot.items.map((bet) => `${bet.id}: ${bet.arb_percent ?? "n/a"}%`), riskNote()].join("\n");

if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID && process.env.ODDS_API_MOCK !== "1") {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text })
  });
  console.log("Posted Telegram alert");
} else {
  console.log(text);
}
