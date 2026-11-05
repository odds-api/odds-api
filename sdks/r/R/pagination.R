#' Collect every page from a cursor endpoint
#'
#' Pagination is explicit because each page is a separate API request and may
#' consume credits. A repeated cursor or exhausted page budget raises an error
#' instead of silently returning incomplete results. An empty page with a
#' nonterminal cursor is followed, as required for odds snapshot scans.
#' @param client A client created by [odds_client()].
#' @param path Cursor endpoint: `/events`, `/racing/events`, or a sports event's
#'   `/events/{event_id}/odds/snapshot` path.
#' @param ... Named query filters, optionally including a starting `cursor`.
#' @param max_pages Positive integer limit on requests (default 100).
#' @return A list containing `items`, `count`, `pages` and `next_cursor = NULL`.
#'   Use [odds_snapshot()] for the original snapshot freshness/resume metadata;
#'   collected pages do not represent an atomic snapshot.
#' @examples
#' \dontrun{
#' events <- odds_collect(odds_client(), "/events", league = "NBA", max_pages = 5)
#' }
#' @export
odds_collect <- function(client, path, ..., max_pages = 100L) {
  check_client(client)
  check_path(path)
  if (!path %in% c("/events", "/racing/events") &&
      !grepl("^/events/[A-Za-z0-9_.-]+/odds/snapshot$", path)) {
    stop("odds_collect() only supports cursor-based event and sports odds endpoints.", call. = FALSE)
  }
  if (!is.numeric(max_pages) || length(max_pages) != 1L ||
      is.na(max_pages) || !is.finite(max_pages) ||
      max_pages < 1 || max_pages != floor(max_pages)) {
    stop("max_pages must be a positive integer.", call. = FALSE)
  }
  params <- query_values(list(...))
  cursor <- params$cursor
  params$cursor <- NULL
  seen <- character()
  items <- list()
  for (page_number in seq_len(max_pages)) {
    if (!is.null(cursor)) seen <- c(seen, cursor)
    page <- do.call(odds_get, c(list(client = client, path = path), params,
                               list(cursor = cursor)))
    if (!is.list(page) || !is.list(page$items)) {
      api_error("Expected a paginated response with an items array.")
    }
    items <- c(items, page$items)
    next_cursor <- page$next_cursor
    if (is.null(next_cursor) || identical(next_cursor, "") ||
        identical(next_cursor, "0") || identical(next_cursor, 0L) ||
        identical(next_cursor, 0)) {
      return(list(items = items, count = length(items), pages = page_number,
                   next_cursor = NULL))
    }
    if (length(next_cursor) != 1L || !is.character(next_cursor) || is.na(next_cursor)) {
      api_error("The API returned an invalid pagination cursor.")
    }
    if (next_cursor %in% seen) api_error("The API repeated a pagination cursor.")
    cursor <- next_cursor
  }
  api_error("Pagination reached max_pages; narrow the filters or increase max_pages.")
}
