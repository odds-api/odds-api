json_response <- function(text = '{"items":[]}', status = 200L, headers = list()) {
  httr2::response(status_code = status,
                   headers = c(list(`content-type` = "application/json"), headers),
                   body = charToRaw(text))
}

synthetic_snapshot <- function() {
  path <- system.file("extdata", "odds-snapshot.json", package = "oddsapi")
  httr2::resp_body_json(httr2::response(
    status_code = 200L, headers = list(`content-type` = "application/json"),
    body = readBin(path, "raw", n = file.info(path)$size)), simplifyVector = FALSE)
}
