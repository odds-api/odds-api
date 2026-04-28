# odds-api-client

Python SDK for the Odds API.

```python
from odds_api import OddsApiClient

client = OddsApiClient(api_key="your_api_key")
events = client.search_events(sport="rugby-league", league="NRL")
```

