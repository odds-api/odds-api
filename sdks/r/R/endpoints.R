#' Read sports, odds, results and account data
#'
#' Thin wrappers around the public [odds-api.net](https://odds-api.net) API.
#' Responses remain nested lists; use [odds_table()] for a sports odds data frame.
#' Each call requests one page. Use [odds_collect()] when the endpoint supports
#' `next_cursor`. Consult <https://api.odds-api.net/v1/reference> for filters.
#' @param client A client created by [odds_client()].
#' @param event_id Canonical event identifier, as returned by `odds_events()`
#'   or `odds_racing_events()`.
#' @param selection_key Stable selection identifier returned by an odds snapshot.
#' @param ... Named API query filters, forwarded to [odds_get()].
#' @return Parsed JSON as nested R lists, including any pagination metadata.
#' @examples
#' \dontrun{
#' client <- odds_client()
#' odds_sports(client)
#' odds_bookmakers(client, country_code = c("US", "AU"))
#' events <- odds_events(client, sport = "basketball", league = "NBA", limit = 10)
#' if (length(events$items)) {
#'   id <- events$items[[1]]$event_id
#'   snapshot <- odds_snapshot(client, id, types = "moneyline")
#'   odds_table(snapshot)
#' }
#' }
#' @name odds_endpoints
NULL

event_path <- function(prefix, event_id, suffix = "") {
  scalar_string(event_id, "event_id")
  # Public event identifiers are opaque; reject path/query delimiters.
  if (!grepl("^[A-Za-z0-9_.-]+$", event_id) || event_id %in% c(".", "..")) {
    stop("event_id must be an event identifier, without path or query delimiters.", call. = FALSE)
  }
  paste0(prefix, "/", event_id, suffix)
}

#' @rdname odds_endpoints
#' @export
odds_sports <- function(client) odds_get(client, "/sports")

#' @rdname odds_endpoints
#' @export
odds_leagues <- function(client, ...) odds_get(client, "/leagues", ...)

#' @rdname odds_endpoints
#' @export
odds_bookmakers <- function(client, ...) odds_get(client, "/bookmakers", ...)

#' @rdname odds_endpoints
#' @export
odds_events <- function(client, ...) odds_get(client, "/events", ...)

#' @rdname odds_endpoints
#' @export
odds_event <- function(client, event_id, ...) {
  odds_get(client, event_path("/events", event_id), ...)
}

#' @rdname odds_endpoints
#' @export
odds_event_bookmakers <- function(client, event_id) {
  odds_get(client, event_path("/events", event_id, "/bookmakers"))
}

#' @rdname odds_endpoints
#' @export
odds_snapshot <- function(client, event_id, ...) {
  odds_get(client, event_path("/events", event_id, "/odds/snapshot"), ...)
}

#' @rdname odds_endpoints
#' @export
odds_history <- function(client, event_id, selection_key, ...) {
  scalar_string(selection_key, "selection_key")
  odds_get(client, event_path("/events", event_id, "/odds/history"),
           selection_key = selection_key, ...)
}

#' @rdname odds_endpoints
#' @export
odds_results <- function(client, event_id) {
  odds_get(client, event_path("/events", event_id, "/results"))
}

#' @rdname odds_endpoints
#' @export
odds_bets <- function(client, ...) odds_get(client, "/bets/snapshot", ...)

#' @rdname odds_endpoints
#' @export
odds_racing_events <- function(client, ...) odds_get(client, "/racing/events", ...)

#' @rdname odds_endpoints
#' @export
odds_racing_event <- function(client, event_id, ...) {
  odds_get(client, event_path("/racing/events", event_id), ...)
}

#' @rdname odds_endpoints
#' @export
odds_racing_snapshot <- function(client, event_id, ...) {
  odds_get(client, event_path("/racing/events", event_id, "/odds"), ...)
}

#' @rdname odds_endpoints
#' @export
odds_me <- function(client) odds_get(client, "/me")

#' @rdname odds_endpoints
#' @export
odds_usage <- function(client) odds_get(client, "/usage")

#' @rdname odds_endpoints
#' @export
odds_limits <- function(client) odds_get(client, "/limits")

#' @rdname odds_endpoints
#' @export
odds_status <- function(client) odds_get(client, "/status")
