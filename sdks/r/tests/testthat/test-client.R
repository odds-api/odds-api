test_that("environment configuration and printing protect the API key", {
  old <- Sys.getenv(c("ODDS_API_KEY", "ODDS_API_BASE_URL"), unset = NA)
  on.exit({
    for (key in names(old)) {
      if (is.na(old[[key]])) Sys.unsetenv(key) else do.call(Sys.setenv, setNames(list(old[[key]]), key))
    }
  })
  Sys.setenv(ODDS_API_KEY = "synthetic-secret", ODDS_API_BASE_URL = "https://example.test/v1/")
  client <- odds_client()
  expect_equal(client$base_url, "https://example.test/v1")
  expect_equal(client$api_key, "synthetic-secret")
  output <- paste(capture.output(print(client)), collapse = "\n")
  expect_match(output, "<redacted>", fixed = TRUE)
  expect_false(grepl("synthetic-secret", output, fixed = TRUE))
})

test_that("client rejects unsafe URLs and invalid configuration", {
  for (url in c("http://example.com/v1", "https://key@example.com/v1",
                "https://example.com/v1?api_key=secret", "https://example.com/#part")) {
    expect_error(odds_client(base_url = url), "base_url")
  }
  expect_s3_class(odds_client(base_url = "http://127.0.0.1:8000/v1"), "odds_api_client")
  for (value in list(0, -1, NA_real_, Inf, "30", c(1, 2))) {
    expect_error(odds_client(timeout = value), "timeout")
  }
  for (value in list(0, 11, 1.5, NA_real_, Inf, "3")) {
    expect_error(odds_client(max_tries = value), "max_tries")
  }
})

test_that("requests use header auth and serialize API filters", {
  observed <- NULL
  local_mocked_bindings(odds_perform = function(req) {
    observed <<- req
    json_response('{"items":[],"next_cursor":"123"}')
  })
  response <- odds_snapshot(odds_client("synthetic-secret", max_tries = 1),
                            "event-1", bookmakers = c("a", "b"),
                            periods = c(0, 1), include_unavailable = FALSE,
                            market_keys = "player points", unused = NULL)
  expect_identical(response$next_cursor, "123")
  expect_match(observed$url, "/v1/events/event-1/odds/snapshot", fixed = TRUE)
  expect_match(observed$url, "bookmakers=a%2Cb", fixed = TRUE)
  expect_match(observed$url, "periods=0%2C1", fixed = TRUE)
  expect_match(observed$url, "include_unavailable=false", fixed = TRUE)
  expect_match(observed$url, "market_keys=player%20points", fixed = TRUE)
  expect_false(grepl("unused|synthetic-secret", observed$url))
  # httr2 may store redacted headers as weak references rather than plain text.
  expect_true("X-API-Key" %in% names(observed$headers))
  expect_false(observed$options$followlocation)
  expect_false(grepl("synthetic-secret", paste(capture.output(print(observed)), collapse = "")))
})

test_that("paths, event identifiers and malformed queries cannot redirect credentials", {
  client <- odds_client("synthetic-secret")
  for (path in c("https://other.test", "//other.test", "/../status", "/%2e%2e/status",
                 "/events?api_key=bad", "/events#bad")) {
    expect_error(odds_get(client, path), "path")
  }
  expect_error(odds_event(client, "../status"), "event_id")
  expect_error(odds_history(client, "event-1", ""), "selection_key")
  expect_error(odds_events(client, 10), "Query parameters")
  expect_error(odds_events(client, limit = 1, limit = 2), "unique")
  expect_error(odds_events(client, .req = "bad"), "leading dot")
  expect_error(odds_events(client, limit = NA), "NA")
  expect_error(odds_events(client, limit = Inf), "finite")
  expect_error(odds_events(client, nested = list(x = 1)), "Query values")
  expect_error(odds_events(NULL), "odds_client")
})

test_that("HTTP failures expose status and retry hints without echoing bodies", {
  client <- odds_client("synthetic-secret", max_tries = 1)
  for (code in c(301L, 401L, 403L, 404L, 429L, 500L)) {
    local_mocked_bindings(odds_perform = function(req) {
      json_response('{"detail":"synthetic-secret"}', code, list(`retry-after` = "5"))
    })
    err <- tryCatch(odds_sports(client), odds_api_error = identity)
    expect_s3_class(err, "odds_api_error")
    expect_equal(err$status, code)
    expect_identical(err$retry_after, "5")
    expect_false(grepl("synthetic-secret", conditionMessage(err), fixed = TRUE))
  }
})

test_that("malformed JSON, empty success and transport errors are handled", {
  client <- odds_client("", max_tries = 1)
  local_mocked_bindings(odds_perform = function(req) json_response("not json"))
  expect_error(odds_sports(client), "invalid JSON", class = "odds_api_error")
  local_mocked_bindings(odds_perform = function(req) httr2::response(status_code = 204L))
  expect_null(odds_sports(client))
  local_mocked_bindings(odds_perform = function(req) stop("transport secret"))
  expect_error(odds_sports(client), "connection failed", class = "odds_api_error")
})

test_that("endpoint wrappers map to the public contract", {
  observed <- NULL
  local_mocked_bindings(odds_perform = function(req) {
    observed <<- req$url
    json_response()
  })
  client <- odds_client("", max_tries = 1)
  calls <- list(
    sports = function() odds_sports(client),
    leagues = function() odds_leagues(client),
    bookmakers = function() odds_bookmakers(client),
    events = function() odds_events(client),
    `events/event-1` = function() odds_event(client, "event-1"),
    `events/event-1/bookmakers` = function() odds_event_bookmakers(client, "event-1"),
    `events/event-1/odds/snapshot` = function() odds_snapshot(client, "event-1"),
    `events/event-1/results` = function() odds_results(client, "event-1"),
    `bets/snapshot` = function() odds_bets(client, strategies = "arbitrage"),
    `racing/events` = function() odds_racing_events(client),
    `racing/events/race-1` = function() odds_racing_event(client, "race-1"),
    `racing/events/race-1/odds` = function() odds_racing_snapshot(client, "race-1"),
    me = function() odds_me(client), usage = function() odds_usage(client),
    limits = function() odds_limits(client), status = function() odds_status(client)
  )
  for (path in names(calls)) {
    calls[[path]]()
    expect_equal(strsplit(observed, "?", fixed = TRUE)[[1]][1],
                 paste0("https://api.odds-api.net/v1/", path))
  }
  odds_history(client, "event-1", "player:a/b +3.5", bookmakers = c("a", "b"))
  expect_match(observed, "/events/event-1/odds/history?", fixed = TRUE)
  expect_match(observed, "selection_key=player%3Aa%2Fb%20%2B3.5", fixed = TRUE)
})
