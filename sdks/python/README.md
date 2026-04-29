# odds-api-client

Python SDK for `odds-api/odds-api`, an OpenAPI-first sports betting odds API for coding agents and developers.

Use this package when you want typed Python access to sports odds, betting odds, bookmaker comparison, arbitrage examples, positive EV examples, line movement, racing odds, and local mock-friendly tests.

## Install

After the first PyPI release is published:

```bash
python3 -m pip install odds-api-client
```

For local development from the GitHub repo:

```bash
git clone https://github.com/odds-api/odds-api.git
cd odds-api
python3 -m pip install -e sdks/python
```

## Quickstart

```python
from odds_api import OddsApiClient

client = OddsApiClient(api_key="your_api_key")
events = client.search_events(sport="rugby-league", league="NRL")
print(events)
```

The SDK also reads `ODDS_API_KEY` and `ODDS_API_BASE_URL` from the environment:

```python
from odds_api import OddsApiClient

client = OddsApiClient()
sports = client.list_sports()
```

## Common methods

- `list_sports()`
- `list_bookmakers()`
- `list_leagues()`
- `search_events()`
- `get_odds_snapshot()`
- `get_odds_history()`
- `find_best_odds()`
- `compare_bookmakers()`
- `find_arbitrage()`
- `find_positive_ev()`
- `get_line_movement()`
- `search_racing_events()`
- `get_racing_odds()`

## Safety

Arbitrage and positive EV examples are betting research workflows, not guaranteed-profit systems. Always account for stale odds, limits, delays, suspensions, voids, jurisdiction, and execution risk.

## Links

- GitHub: https://github.com/odds-api/odds-api
- API: https://api.odds-api.net/v1
- OpenAPI: https://github.com/odds-api/odds-api/blob/main/openapi.yaml
