#' Create an odds-api.net client
#'
#' Connect to the sports odds API at <https://odds-api.net>. Credentials are
#' sent in a redacted `X-API-Key` header, never in the query string.
#' @param api_key API key. Defaults to `ODDS_API_KEY`. An empty string allows
#'   access to public endpoints such as `/status`.
#' @param base_url API base URL. Defaults to `ODDS_API_BASE_URL`, or
#'   `https://api.odds-api.net/v1`. HTTPS is required except on loopback hosts.
#' @param timeout Request timeout in seconds; a positive finite number.
#' @param max_tries Maximum total attempts per request, from 1 to 10.
#'   Retries apply to HTTP 429, 502, 503 and 504, and connection failures.
#' @return An `odds_api_client` object. Printing it hides the API key.
#' @examples
#' client <- odds_client(api_key = "")
#' client
#' @export
odds_client <- function(api_key = Sys.getenv("ODDS_API_KEY"),
                        base_url = Sys.getenv("ODDS_API_BASE_URL",
                                              "https://api.odds-api.net/v1"),
                        timeout = 30, max_tries = 3L) {
  scalar_string(api_key, "api_key", empty = TRUE)
  scalar_string(base_url, "base_url")
  url <- tryCatch(httr2::url_parse(base_url), error = function(e) NULL)
  if (is.null(url) || is.null(url$hostname) || !nzchar(url$hostname) ||
      !is.null(url$username) || !is.null(url$password) ||
      !is.null(url$query) || !is.null(url$fragment) ||
      !(identical(url$scheme, "https") ||
        (identical(url$scheme, "http") &&
         url$hostname %in% c("localhost", "127.0.0.1", "::1", "[::1]")))) {
    stop("base_url must be HTTPS (HTTP is allowed only for loopback tests), without credentials, query or fragment.", call. = FALSE)
  }
  if (!is.numeric(timeout) || length(timeout) != 1L ||
      is.na(timeout) || !is.finite(timeout) || timeout <= 0) {
    stop("timeout must be a positive finite number.", call. = FALSE)
  }
  if (!is.numeric(max_tries) || length(max_tries) != 1L ||
      is.na(max_tries) || !is.finite(max_tries) ||
      max_tries != floor(max_tries) || max_tries < 1 || max_tries > 10) {
    stop("max_tries must be an integer from 1 to 10.", call. = FALSE)
  }
  structure(list(api_key = api_key, base_url = sub("/+$", "", base_url),
                 timeout = timeout, max_tries = as.integer(max_tries)),
            class = "odds_api_client")
}

#' @export
print.odds_api_client <- function(x, ...) {
  cat("<odds_api_client>\n", "  API: ", x$base_url,
      "\n  API key: ", if (nzchar(x$api_key)) "<redacted>" else "<not set>",
      "\n", sep = "")
  invisible(x)
}

scalar_string <- function(x, name, empty = FALSE) {
  if (!is.character(x) || length(x) != 1L || is.na(x) ||
      (!empty && !nzchar(trimws(x)))) {
    stop(paste0(name, " must be a single ", if (!empty) "non-empty ",
                "string."), call. = FALSE)
  }
  invisible(x)
}

check_client <- function(client) {
  if (!inherits(client, "odds_api_client")) {
    stop("client must be created with odds_client().", call. = FALSE)
  }
}

check_path <- function(path) {
  scalar_string(path, "path")
  if (!grepl("^/[A-Za-z0-9_/%.-]*$", path) || startsWith(path, "//") ||
      grepl("(^|/)\\.\\.?(/|$)|%", path)) {
    stop("path must be an API-relative path such as /events, without a query or traversal.", call. = FALSE)
  }
}

query_values <- function(params) {
  if (length(params) == 0L) return(list())
  keys <- names(params)
  if (is.null(keys) || anyNA(keys) || any(!nzchar(keys)) ||
      anyDuplicated(keys) || any(startsWith(keys, "."))) {
    stop("Query parameters must have unique, non-empty names without a leading dot.", call. = FALSE)
  }
  lapply(params, function(x) {
    if (is.null(x) || length(x) == 0L) return(NULL)
    if (!is.atomic(x) || anyNA(x) ||
        !(is.character(x) || is.numeric(x) || is.logical(x)) ||
        (is.numeric(x) && any(!is.finite(x)))) {
      stop("Query values must be strings, finite numbers, booleans or NULL; NA is not allowed.", call. = FALSE)
    }
    if (is.logical(x)) x <- tolower(as.character(x))
    paste(x, collapse = ",")
  })
}

build_request <- function(client, path, params) {
  check_client(client)
  check_path(path)
  req <- httr2::request(paste0(client$base_url, path))
  req <- httr2::req_headers(req, Accept = "application/json")
  if (nzchar(client$api_key)) {
    req <- httr2::req_headers(req, `X-API-Key` = client$api_key,
                              .redact = "X-API-Key")
  }
  params <- query_values(params)
  # Avoid dynamic-dots injection: query names beginning with a dot are rejected.
  req <- do.call(httr2::req_url_query, c(list(.req = req), params))
  req <- httr2::req_user_agent(req, "oddsapi/0.1.0 (https://odds-api.net)")
  req <- httr2::req_timeout(req, client$timeout)
  # Do not forward an API key to a redirect target.
  req <- httr2::req_options(req, followlocation = FALSE)
  req <- httr2::req_error(req, is_error = function(resp) FALSE)
  if (client$max_tries > 1L) {
    req <- httr2::req_retry(req, max_tries = client$max_tries,
                          max_seconds = client$timeout * client$max_tries,
                          retry_on_failure = TRUE,
                          is_transient = function(resp) {
                            httr2::resp_status(resp) %in% c(429L, 502L, 503L, 504L)
                          })
  }
  req
}

api_error <- function(message, status = NA_integer_, retry_after = NULL) {
  stop(structure(list(message = message, call = NULL, status = status,
                      retry_after = retry_after),
                 class = c("odds_api_error", "error", "condition")))
}

# Internal seam for offline HTTP tests.
odds_perform <- function(req) httr2::req_perform(req)

#' Request a public API endpoint
#'
#' Returns JSON as nested R lists, preserving pagination and snapshot metadata.
#' Only GET requests are made. See the public API contract at
#' <https://api.odds-api.net/v1/reference> for filters and response fields.
#' @param client A client created by [odds_client()].
#' @param path API-relative path, for example `/events`.
#' @param ... Named query parameters. Vectors become comma-separated filters,
#'   logical values become `true`/`false`, and `NULL` values are omitted.
#' @return Parsed JSON, usually a list. HTTP 204 returns `NULL`. Failures raise
#'   `odds_api_error` with `status` (or `NA` for transport failures) and
#'   `retry_after` fields. Error messages do not echo credentials or server bodies.
#' @examples
#' \dontrun{
#' client <- odds_client()
#' odds_get(client, "/events", sport = "basketball", league = "NBA", limit = 10)
#' }
#' @export
odds_get <- function(client, path, ...) {
  req <- build_request(client, path, list(...))
  resp <- tryCatch(odds_perform(req), error = function(e) {
    api_error("Odds API connection failed; check your network and base URL.")
  })
  status <- httr2::resp_status(resp)
  if (status < 200L || status >= 300L) {
    api_error(paste0("Odds API request failed (HTTP ", status, ")."), status,
              httr2::resp_header(resp, "retry-after"))
  }
  if (status == 204L) return(NULL)
  tryCatch(httr2::resp_body_json(resp, simplifyVector = FALSE),
           error = function(e) api_error("Odds API returned invalid JSON.", status))
}
