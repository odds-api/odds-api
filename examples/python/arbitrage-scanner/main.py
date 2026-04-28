from pathlib import Path
import os
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "sdks/python/src"))

from odds_api import OddsApiClient  # noqa: E402


def mock_transport(method, url, headers, body):
    return {"items": [{"id": "arb-example", "strategy": "arbitrage", "arb_percent": 1.8}], "resume": {"arbitrage": "0-0"}}


client = OddsApiClient(
    api_key=os.getenv("ODDS_API_KEY"),
    base_url=os.getenv("ODDS_API_BASE_URL", "https://api.odds-api.net/v1"),
    transport=mock_transport if os.getenv("ODDS_API_MOCK") == "1" or not os.getenv("ODDS_API_KEY") else None,
)

snapshot = client.find_arbitrage(limit=10)
print("# Arbitrage scanner")
for bet in snapshot["items"]:
    print(f"{bet['id']}: {bet.get('arb_percent', 'n/a')}%")
print("Note: arbitrage is subject to execution risk, stale odds, limits, voids, and delays.")

