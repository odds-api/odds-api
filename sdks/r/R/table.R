#' Convert a sports odds snapshot to a data frame
#'
#' Preserves selection identifiers, decimal odds, missing values and line text.
#' No prices are inferred and unavailable selections remain visible. This helper
#' accepts sports odds, not the nested racing bookmaker/runner format.
#' @param snapshot A response from [odds_snapshot()] or [odds_collect()] for a
#'   sports odds endpoint, containing an `items` list.
#' @return A data frame with one row per odds record, stable column types and
#'   `NA` for absent values. `as_of_ts_ms` and `ttl_seconds` are attributes copied
#'   from a single-page snapshot, when present. Empty responses retain columns.
#' @examples
#' fixture <- system.file("extdata", "odds-snapshot.json", package = "oddsapi")
#' # The bundled fixture is synthetic and needs no API key.
#' snapshot <- httr2::resp_body_json(httr2::response(
#'   status_code = 200, headers = list(`content-type` = "application/json"),
#'   body = readBin(fixture, "raw", n = file.info(fixture)$size)))
#' odds_table(snapshot)
#' @export
odds_table <- function(snapshot) {
  if (!is.list(snapshot) || !is.list(snapshot$items)) {
    stop("snapshot must contain an items list from a sports odds response.", call. = FALSE)
  }
  chars <- c("id", "event_id", "bookmaker", "selection_key", "market_group_id",
             "market_key", "type", "bet_type", "period", "period_str", "metric",
             "line", "side", "player_name", "selection_name")
  numbers <- c("odds", "odds_no_vig", "fair_odds")
  extract <- function(name, type) {
    vapply(snapshot$items, function(item) {
      if (!is.list(item) || is.null(item$id) || is.null(item$bookmaker) ||
          is.null(item$market_key)) {
        stop("Each item must be a sports odds record with id, bookmaker and market_key.", call. = FALSE)
      }
      value <- item[[name]]
      missing <- switch(type, character = NA_character_, numeric = NA_real_,
                        logical = NA)
      if (is.null(value)) return(missing)
      if (length(value) != 1L || !is.atomic(value)) {
        stop(paste0("Expected scalar sports odds field: ", name), call. = FALSE)
      }
      switch(type,
             character = as.character(value),
             numeric = {
               if (!is.numeric(value) || !is.finite(value)) {
                 stop(paste0("Expected a finite numeric price: ", name), call. = FALSE)
               }
               as.double(value)
             },
             logical = {
               if (!is.logical(value) || is.na(value)) {
                 stop("is_available must be true, false or null.", call. = FALSE)
               }
               value
             })
    }, switch(type, character = character(1), numeric = numeric(1), logical = logical(1)))
  }
  columns <- c(lapply(chars, extract, type = "character"),
               lapply(numbers, extract, type = "numeric"),
               list(extract("is_available", "logical")))
  names(columns) <- c(chars, numbers, "is_available")
  result <- as.data.frame(columns, stringsAsFactors = FALSE, optional = TRUE)
  attr(result, "as_of_ts_ms") <- snapshot$as_of_ts_ms
  attr(result, "ttl_seconds") <- snapshot$ttl_seconds
  result
}
