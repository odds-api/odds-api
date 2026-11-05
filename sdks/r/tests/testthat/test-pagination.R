test_that("pagination follows empty pages and terminates at zero", {
  cursors <- character()
  n <- 0L
  local_mocked_bindings(odds_perform = function(req) {
    n <<- n + 1L
    cursors <<- c(cursors, req$url)
    switch(n,
           json_response('{"items":[{"event_id":"one"}],"next_cursor":"7"}'),
           json_response('{"items":[],"next_cursor":"8"}'),
           json_response('{"items":[{"event_id":"two"}],"next_cursor":"0"}'))
  })
  result <- odds_collect(odds_client(""), "/events", league = "NBA", max_pages = 3)
  expect_equal(result$count, 2)
  expect_equal(result$pages, 3)
  expect_null(result$next_cursor)
  expect_identical(result$items[[2]]$event_id, "two")
  expect_match(cursors[2], "cursor=7", fixed = TRUE)
  expect_match(cursors[3], "league=NBA", fixed = TRUE)
})

test_that("initial cursors and normal terminal cursors are supported", {
  for (terminal in c('null', '""', '0')) {
    observed <- NULL
    local_mocked_bindings(odds_perform = function(req) {
      observed <<- req$url
      json_response(paste0('{"items":[],"next_cursor":', terminal, '}'))
    })
    result <- odds_collect(odds_client(""), "/events/event-1/odds/snapshot", cursor = "42")
    expect_identical(result$items, list())
    expect_match(observed, "cursor=42", fixed = TRUE)
  }
})

test_that("pagination never silently returns a truncated or malformed result", {
  client <- odds_client("")
  local_mocked_bindings(odds_perform = function(req) {
    json_response('{"items":[],"next_cursor":"7"}')
  })
  expect_error(odds_collect(client, "/events"), "repeated", class = "odds_api_error")
  expect_error(odds_collect(client, "/events", max_pages = 1), "max_pages")
  expect_error(odds_collect(client, "/events", max_pages = 0), "positive integer")
  expect_error(odds_collect(client, "/bets/snapshot"), "cursor-based")
  local_mocked_bindings(odds_perform = function(req) json_response('{"error":"bad"}'))
  expect_error(odds_collect(client, "/events"), "items array")
  local_mocked_bindings(odds_perform = function(req) json_response('{"items":[],"next_cursor":true}'))
  expect_error(odds_collect(client, "/events"), "invalid pagination cursor")
})
