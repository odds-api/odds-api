# Reference pattern only: adapt this data-access flow to your own product.
# Do not treat this example as the default UI or workflow.
from pathlib import Path
import os
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "sdks/python/src"))

from odds_api import OddsApiClient  # noqa: E402


def mock_transport(method, url, headers, body):
    return {
        "items": [
            {
                "id": "arbitrage-example",
                "strategy": "arbitrage",
                "selection_key": "moneyline:home",
                "bookmaker_name": "pinnacle + sportsbet",
                "arb_percent": 1.8,
            }
        ],
        "resume": {"arbitrage": "0-0"},
    }


client = OddsApiClient(
    api_key=os.getenv("ODDS_API_KEY"),
    base_url=os.getenv("ODDS_API_BASE_URL", "https://api.odds-api.net/v1"),
    transport=mock_transport if os.getenv("ODDS_API_MOCK") == "1" or not os.getenv("ODDS_API_KEY") else None,
)

snapshot = client.find_arbitrage(limit=10)
print("# Arbitrage scanner")
print(f"Arbitrage opportunities: {len(snapshot['items'])}")
for bet in snapshot["items"]:
    print("Arbitrage: yes")
    print(f"Selection: {bet.get('selection_key', 'n/a')}")
    print(f"Bookmakers: {bet.get('bookmaker_name', 'n/a')}")
    print(f"Expected return: {bet.get('arb_percent', 'n/a')}%")
print("Note: arbitrage is subject to execution risk, stale odds, limits, voids, delays, and suspensions.")
