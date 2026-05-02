# Reference pattern only: adapt this data-access flow to your own product.
# Do not treat this example as the default UI or workflow.
from pathlib import Path
import os
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "sdks/python/src"))

from odds_api import OddsApiClient  # noqa: E402


def mock_transport(method, url, headers, body):
    return {
        "event_id": "event-1001",
        "selection_key": "moneyline:home",
        "price_type": "odds",
        "series": [
            {
                "bookmaker_name": "bet365",
                "points": [
                    {"tick_ts": "2026-04-27T00:00:00Z", "is_available": True, "value": None, "odds": 1.95, "odds_no_vig": 1.91, "fair_odds": None},
                    {"tick_ts": "2026-04-27T01:00:00Z", "is_available": True, "value": None, "odds": 2.05, "odds_no_vig": 2.01, "fair_odds": None},
                ],
            }
        ],
        "meta": {
            "from_ts": "2026-04-27T00:00:00Z",
            "to_ts": "2026-04-27T01:00:00Z",
            "available_price_types": ["odds", "odds_no_vig", "fair_odds"],
        },
    }


client = OddsApiClient(
    api_key=os.getenv("ODDS_API_KEY"),
    base_url=os.getenv("ODDS_API_BASE_URL", "https://api.odds-api.net/v1"),
    transport=mock_transport if os.getenv("ODDS_API_MOCK") == "1" or not os.getenv("ODDS_API_KEY") else None,
)

history = client.get_line_movement("event-1001", "moneyline:home", price_type="odds")
print("# Line movement")
print(f"Series: {len(history['series'])}")
for series in history["series"]:
    print(f"Bookmaker: {series['bookmaker_name']}")
    print(f"Points: {len(series['points'])}")
    for point in series["points"]:
        print(f"  {point['tick_ts']}: {point['odds']}")
print("Note: line movement charts can lag live markets. Verify stale odds, suspensions, and rate limits before user-facing alerts.")
