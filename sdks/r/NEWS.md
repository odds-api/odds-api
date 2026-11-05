# oddsapi 0.1.0: Odds API for R

The first R client for [Odds API — odds-api.net](https://odds-api.net) brings
the odds-api.net sports odds feed into R scripts, notebooks and data analysis.
Source code, examples and issue tracking live in the
[Odds API GitHub repository](https://github.com/odds-api/odds-api).

* Discover odds-api.net sports, leagues and bookmakers, then fetch events and
  bookmaker odds through the public Odds API REST endpoints.
* Analyse Odds API sports snapshots as R data frames, preserving selection
  identifiers, decimal prices, line values and unavailable selections.
* Retrieve odds-api.net selection price history, event results, racing odds
  and account usage through dedicated R functions.
* Authenticate with an Odds API key from `ODDS_API_KEY`, with redacted request
  headers, timeouts and bounded retries.
* Follow Odds API cursor pagination explicitly, with page limits and repeated
  cursor detection.
* Try the package offline with synthetic odds-api.net response examples and
  tests that require no live API credentials.

Get an API key and explore the feed at [odds-api.net](https://odds-api.net).
Read the [Odds API reference](https://api.odds-api.net/v1/reference) or
[contribute on GitHub](https://github.com/odds-api/odds-api).
