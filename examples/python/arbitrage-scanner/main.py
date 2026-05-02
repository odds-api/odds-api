# Reference pattern only: adapt this data-access flow to your own product.
# Do not treat this example as the default UI or workflow.
from pathlib import Path
import os
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "sdks/python/src"))

from odds_api import OddsApiClient  # noqa: E402


def mock_transport(method, url, headers, body):
    return {
        "resume": '{"arbitrage":"1760000000000-0"}',
        "items": [
            {
                "id": "arbitrage-example",
                "betID": "arbitrage-example",
                "strategy": "arbitrage",
                "event_id": "event-1001",
                "gameID": "event-1001",
                "sport": "rugby-league",
                "league": "NRL",
                "home_team": "Brisbane Broncos",
                "away_team": "Sydney Roosters",
                "start_time": 1760007200,
                "latest_timestamp": 1760000000,
                "expiry_timestamp": 1760000900,
                "selection_key": "moneyline:home",
                "selection_keys": ["moneyline:home"],
                "selection_key_by_leg": {"selection_1": "moneyline:home", "selection_2": "moneyline:away", "selection_3": None, "bonus": None},
                "bookmaker_name": "pinnacle + sportsbet",
                "market_type": "moneyline",
                "selection_type": "moneyline",
                "period": "full time",
                "selection_1_bookmaker_name": "pinnacle",
                "selection_1_odds": 2.11,
                "selection_1_line": "home",
                "selection_1_line_repr": "Brisbane Broncos",
                "selection_1_push_line": False,
                "selection_1_match_link": None,
                "selection_2_bookmaker_name": "sportsbet",
                "selection_2_odds": 1.95,
                "selection_2_line": "away",
                "selection_2_line_repr": "Sydney Roosters",
                "selection_2_push_line": False,
                "selection_2_match_link": None,
                "selection_3_bookmaker_name": None,
                "selection_3_odds": None,
                "selection_3_line": None,
                "selection_3_line_repr": None,
                "selection_3_match_link": None,
                "arbitrage_percentage": 1.8,
                "arb_percent": 1.8,
                "history_ready": True,
                "odds_history": {
                    "event_id": "event-1001",
                    "market_group_id": "moneyline::0",
                    "primary_selection_key": "moneyline:home",
                    "selection_keys": ["moneyline:home", "moneyline:away"],
                    "bookmakers": ["pinnacle", "sportsbet"],
                    "default_price_type": "odds_no_vig",
                    "supports_history": True,
                    "missing_fields": [],
                },
            }
        ],
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
