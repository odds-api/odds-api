test_that("sports odds keep numeric prices, identifiers, unavailable rows and metadata", {
  snapshot <- synthetic_snapshot()
  result <- odds_table(snapshot)
  expect_s3_class(result, "data.frame")
  expect_equal(nrow(result), 3)
  expect_type(result$odds, "double")
  expect_type(result$period, "character")
  expect_type(result$is_available, "logical")
  expect_identical(result$line[3], "+3.5")
  expect_equal(result$odds[1:2], c(1.95, 2.05))
  expect_true(is.na(result$odds[3]))
  expect_false(result$is_available[3])
  expect_true(all(is.na(result$fair_odds)))
  expect_equal(attr(result, "as_of_ts_ms"), snapshot$as_of_ts_ms)
  expect_equal(attr(result, "ttl_seconds"), 60)
})

test_that("empty snapshots have the same column types and names", {
  empty <- odds_table(list(items = list()))
  filled <- odds_table(synthetic_snapshot())
  expect_equal(nrow(empty), 0)
  expect_identical(names(empty), names(filled))
  expect_identical(vapply(empty, typeof, ""), vapply(filled, typeof, ""))
})

test_that("nested racing data and malformed fields are rejected", {
  expect_error(odds_table(list()), "items list")
  expect_error(odds_table(list(items = list(list(bookmaker = "a", runners = list())))),
               "sports odds record")
  snapshot <- synthetic_snapshot()
  snapshot$items[[1]]$odds <- "not a price"
  expect_error(odds_table(snapshot), "numeric price")
})
