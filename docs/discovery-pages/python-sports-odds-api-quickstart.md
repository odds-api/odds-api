# Python Sports Odds API Quickstart

This quickstart shows the smallest Python REST request for Odds API.

Canonical GitHub repo: https://github.com/odds-api/odds-api

## One-file Python example

No SDK required. No framework required. Plain REST and JSON.

```python
import json
import os
from urllib.request import Request, urlopen

api_key = os.environ["ODDS_API_KEY"]
base_url = os.getenv("ODDS_API_BASE_URL", "https://api.odds-api.net/v1")

request = Request(
    f"{base_url.rstrip('/')}/sports",
    headers={"X-API-Key": api_key, "Accept": "application/json"},
)

with urlopen(request, timeout=20) as response:
    print(json.dumps(json.loads(response.read()), indent=2))
```

When the project grows, install the Python SDK with `python3 -m pip install odds-api-client` for reusable methods such as `search_events`, `find_best_odds`, `find_arbitrage`, `find_positive_ev`, and `get_line_movement`.
