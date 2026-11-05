# oddsapi: the odds-api.net R client

Fetch sports betting odds from [odds-api.net](https://odds-api.net) in R.
Discover sports, leagues and bookmakers, retrieve events and odds, and turn
sports odds snapshots into data frames for analysis.

**Data provider:** [Odds API](https://odds-api.net) ·
**GitHub:** [odds-api/odds-api](https://github.com/odds-api/odds-api) ·
**API reference:** [Public REST API](https://api.odds-api.net/v1/reference) ·
**Support:** [support@odds-api.net](mailto:support@odds-api.net)

## Install

Requires R 4.1 or later. Install from the
[Odds API R-Universe repository](https://odds-api.r-universe.dev/oddsapi):

```r
install.packages("oddsapi", repos = c(
  "https://odds-api.r-universe.dev",
  "https://cloud.r-project.org"
))
```

The package is also available directly from the
[Odds API GitHub repository](https://github.com/odds-api/odds-api):

```r
install.packages("remotes")
remotes::install_github("odds-api/odds-api", subdir = "sdks/r",
                        dependencies = NA, upgrade = "never")
```

The package has not been submitted to CRAN. For local development from a
checkout containing this package, run in the repository root:

```r
install.packages("remotes")
remotes::install_local("sdks/r", dependencies = NA, upgrade = "never")
```

For a downloaded `oddsapi_0.1.0.tar.gz` source archive:

```r
install.packages("httr2")
install.packages("oddsapi_0.1.0.tar.gz", repos = NULL, type = "source")
```

## Fetch odds

[Create an odds-api.net account](https://odds-api.net) and obtain an API key.
Put `ODDS_API_KEY=your_key` in your user `.Renviron`, then restart R.
Keep that file out of version control.

```r
library(oddsapi)

client <- odds_client()  # reads ODDS_API_KEY
odds_sports(client)
odds_leagues(client, sport = "basketball")
odds_bookmakers(client, country_code = c("US", "AU"))

events <- odds_events(client, sport = "basketball", league = "NBA", limit = 10)
if (length(events$items)) {
  event_id <- events$items[[1]]$event_id
  snapshot <- odds_snapshot(client, event_id, types = "moneyline")
  prices <- odds_table(snapshot)
  print(prices[, c("bookmaker", "selection_name", "odds", "is_available")])
}
```

Responses remain nested lists with the API's original metadata and cursors.
`odds_table()` converts a sports odds response into a base R data frame and
preserves missing prices as `NA`. Line values remain text, so `+3.5` is kept
exactly. Unavailable records remain visible. Snapshot `as_of_ts_ms` and
`ttl_seconds` are retained as data-frame attributes.

## Try it without a key

The package includes synthetic example odds. This example runs entirely offline:

```r
library(oddsapi)

fixture <- system.file("extdata", "odds-snapshot.json", package = "oddsapi")
response <- httr2::response(
  status_code = 200,
  headers = list(`content-type` = "application/json"),
  body = readBin(fixture, "raw", n = file.info(fixture)$size)
)
prices <- odds_table(httr2::resp_body_json(response, simplifyVector = FALSE))
prices[, c("bookmaker", "selection_name", "line", "odds", "is_available")]
```

The fixture uses invented events and bookmakers. It is not a live price feed.
For a public network check without credentials, use:

```r
odds_status(odds_client(api_key = ""))
```

## Collect pages

Ordinary endpoint calls fetch one page. To collect events or sports odds across
pages, use `odds_collect()`:

```r
events <- odds_collect(client, "/events", league = "NBA", limit = 100,
                       max_pages = 10)

if (length(events$items)) {
  event_id <- events$items[[1]]$event_id
  all_odds <- odds_collect(
    client, paste0("/events/", event_id, "/odds/snapshot"),
    bookmakers = c("pinnacle", "betfair"), max_pages = 20
  )
  prices <- odds_table(all_odds)
}
```

Each page makes a separate API request and may consume credits. A repeated
cursor or exhausted `max_pages` raises an error so incomplete results are not
mistaken for a full response. Empty pages with a continuation cursor are followed.
Collecting changing odds over multiple requests does not produce an atomic
snapshot; retain the single-page response for its freshness and stream metadata.

## History and results

Use the exact `selection_key` from an odds snapshot to request line movement:

```r
if (length(events$items)) {
  event_id <- events$items[[1]]$event_id
  snapshot <- odds_snapshot(client, event_id, limit = 10)
  if (length(snapshot$items) && !is.null(snapshot$items[[1]]$selection_key)) {
    history <- odds_history(client, event_id,
                             selection_key = snapshot$items[[1]]$selection_key,
                             price_type = "odds")
  }
  results <- odds_results(client, event_id)
}
```

## Functions

| Function | Data |
| --- | --- |
| `odds_sports()`, `odds_leagues()` | Sports and league catalogs |
| `odds_bookmakers()`, `odds_event_bookmakers()` | Bookmaker catalogs |
| `odds_events()`, `odds_event()` | Sports events |
| `odds_snapshot()` | Sports odds and snapshot metadata |
| `odds_history()` | Selection price history and line movement |
| `odds_results()` | Event results |
| `odds_bets()` | API bet opportunities; filter with `strategies` |
| `odds_racing_events()`, `odds_racing_event()` | Racing events |
| `odds_racing_snapshot()` | Racing odds as nested bookmaker/runner lists |
| `odds_me()`, `odds_usage()`, `odds_limits()` | Account identity and usage |
| `odds_status()` | Public service status |
| `odds_get()` | GET any public JSON endpoint |
| `odds_collect()` | Bounded cursor pagination |
| `odds_table()` | Sports odds as a data frame |

Pass named filters through `...`; vectors become comma-separated API filters,
logical values become lowercase `true`/`false`, and `NULL` values are omitted.
See `?odds_endpoints` or the [API reference](https://api.odds-api.net/v1/reference)
for details. This release uses REST; SSE and WebSocket subscriptions are not
implemented.

## Errors and retries

```r
tryCatch(
  odds_events(client, league = "NBA"),
  odds_api_error = function(e) {
    message(conditionMessage(e))
    if (identical(e$status, 429L)) {
      message("Rate limited; Retry-After: ", e$retry_after)
    }
  }
)
```

The default timeout is 30 seconds with at most three attempts. HTTP 429, 502,
503, 504 and connection failures are retried with bounded backoff; `Retry-After`
is respected. Use `odds_client(max_tries = 1)` to disable retries.
API keys are redacted in printed requests. Redirects are rejected rather than
forwarding credentials. HTTPS is required except for local loopback tests.

## Develop

From `sdks/r` with R and the development dependencies installed:

```sh
Rscript -e 'install.packages(c("httr2", "testthat", "roxygen2"))'
Rscript -e 'roxygen2::roxygenise(); testthat::test_local()'
R CMD build .
R CMD check --no-manual oddsapi_0.1.0.tar.gz
```

Tests use synthetic responses and require no API key. GitHub Actions checks the
R package on Linux, Windows and macOS. The package contains only R code, so it
does not need compilation tools for installation.

## License and data source

The client and synthetic fixtures are licensed under Apache-2.0. API access and
data usage follow the terms at [odds-api.net](https://odds-api.net).
When sharing research using the feed, cite the data provider with a link:
**[Odds API — odds-api.net](https://odds-api.net)**.

For betting research, account for stale prices, suspensions, voids, limits,
delays, jurisdictional availability and execution risk. No opportunity guarantees
a profit.
