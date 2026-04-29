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
                "id": "positive-ev-example",
                "strategy": "pos_ev",
                "bookmaker_name": "pinnacle",
                "odds": 2.11,
                "fair_odds": 1.98,
                "ev": 6.6,
            }
        ],
        "resume": {"pos_ev": "0-0"},
    }


client = OddsApiClient(
    api_key=os.getenv("ODDS_API_KEY"),
    base_url=os.getenv("ODDS_API_BASE_URL", "https://api.odds-api.net/v1"),
    transport=mock_transport if os.getenv("ODDS_API_MOCK") == "1" or not os.getenv("ODDS_API_KEY") else None,
)

snapshot = client.find_positive_ev(limit=10)
print("# Positive EV scanner")
for bet in snapshot["items"]:
    print(f"{bet['id']}: {bet['bookmaker_name']} odds={bet['odds']} fair={bet['fair_odds']} ev={bet['ev']}%")
print("Note: positive EV does not remove betting risk. Check stale odds and market availability.")
