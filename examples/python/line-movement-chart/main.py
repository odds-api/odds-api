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
                    {"tick_ts": "2026-04-27T00:00:00Z", "odds": 1.95, "is_available": True},
                    {"tick_ts": "2026-04-27T01:00:00Z", "odds": 2.05, "is_available": True},
                ],
            }
        ],
    }


client = OddsApiClient(
    api_key=os.getenv("ODDS_API_KEY"),
    base_url=os.getenv("ODDS_API_BASE_URL", "https://api.odds-api.net/v1"),
    transport=mock_transport if os.getenv("ODDS_API_MOCK") == "1" or not os.getenv("ODDS_API_KEY") else None,
)

history = client.get_line_movement("event-1001", "moneyline:home", price_type="odds")
print("# Line movement")
for series in history["series"]:
    print(series["bookmaker_name"])
    for point in series["points"]:
        print(f"  {point['tick_ts']}: {point['odds']}")
print("Note: line movement charts can lag live markets. Verify before user-facing alerts.")

