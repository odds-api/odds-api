from __future__ import annotations

import json
import os
from typing import Any, Callable
from urllib.parse import urlencode
from urllib.request import Request, urlopen


Transport = Callable[[str, str, dict[str, str], Any | None], Any]


class OddsApiError(RuntimeError):
    def __init__(self, status: int, body: Any):
        super().__init__(f"Odds API request failed with status {status}")
        self.status = status
        self.body = body


class OddsApiClient:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        bearer_token: str | None = None,
        transport: Transport | None = None,
    ) -> None:
        self.api_key = api_key or os.getenv("ODDS_API_KEY")
        self.base_url = (base_url or os.getenv("ODDS_API_BASE_URL") or "https://api.odds-api.net/v1").rstrip("/")
        self.bearer_token = bearer_token
        self.transport = transport

    def request(self, method: str, path: str, params: dict[str, Any] | None = None, body: Any | None = None) -> Any:
        url = self._url(path, params)
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        if self.bearer_token:
            headers["Authorization"] = f"Bearer {self.bearer_token}"
        if body is not None:
            headers["Content-Type"] = "application/json"

        if self.transport:
            return self.transport(method, url, headers, body)

        payload = None if body is None else json.dumps(body).encode("utf-8")
        req = Request(url, data=payload, headers=headers, method=method)
        try:
            with urlopen(req, timeout=30) as response:
                text = response.read().decode("utf-8")
                return json.loads(text) if text else None
        except Exception as exc:  # urllib exposes several concrete error types.
            status = getattr(exc, "code", 0)
            raw = getattr(exc, "read", lambda: b"")()
            try:
                parsed = json.loads(raw.decode("utf-8")) if raw else None
            except Exception:
                parsed = raw.decode("utf-8", errors="replace") if raw else None
            raise OddsApiError(status, parsed) from exc

    def get(self, path: str, **params: Any) -> Any:
        return self.request("GET", path, params=params)

    def post(self, path: str, body: Any | None = None, **params: Any) -> Any:
        return self.request("POST", path, params=params, body=body)

    def list_sports(self) -> Any:
        return self.get("/sports")

    def list_bookmakers(self) -> Any:
        return self.get("/bookmakers")

    def list_leagues(self, **params: Any) -> Any:
        return self.get("/leagues", **params)

    def search_events(self, **params: Any) -> Any:
        return self.get("/events", **params)

    def get_event(self, event_id: str) -> Any:
        return self.get(f"/events/{event_id}")

    def get_event_bookmakers(self, event_id: str) -> Any:
        return self.get(f"/events/{event_id}/bookmakers")

    def get_odds_snapshot(self, event_id: str, **params: Any) -> Any:
        return self.get(f"/events/{event_id}/odds/snapshot", **params)

    def get_odds_history(self, event_id: str, **params: Any) -> Any:
        return self.get(f"/events/{event_id}/odds/history", **params)

    def get_line_movement(self, event_id: str, selection_key: str, **params: Any) -> Any:
        return self.get_odds_history(event_id, selection_key=selection_key, **params)

    def get_bets_snapshot(self, **params: Any) -> Any:
        return self.get("/bets/snapshot", **params)

    def find_positive_ev(self, **params: Any) -> Any:
        return self.get_bets_snapshot(strategies="pos_ev", **params)

    def find_arbitrage(self, **params: Any) -> Any:
        return self.get_bets_snapshot(strategies="arbitrage", **params)

    def get_results(self, event_id: str) -> Any:
        return self.get(f"/events/{event_id}/results")

    def search_racing_events(self, **params: Any) -> Any:
        return self.get("/racing/events", **params)

    def get_racing_event(self, event_id: str) -> Any:
        return self.get(f"/racing/events/{event_id}")

    def get_racing_odds(self, event_id: str, **params: Any) -> Any:
        return self.get(f"/racing/events/{event_id}/odds", **params)

    def find_best_odds(self, event_id: str, **params: Any) -> list[dict[str, Any]]:
        snapshot = self.get_odds_snapshot(event_id, **params)
        best: dict[str, dict[str, Any]] = {}
        for odd in snapshot.get("items", []):
            if not odd.get("is_available", True) or not isinstance(odd.get("odds"), (int, float)):
                continue
            key = odd.get("selection_key") or f"{odd.get('market_key')}:{odd.get('side')}:{odd.get('line')}"
            current = best.get(key)
            if current is None or odd["odds"] > current["odds"]:
                best[key] = {
                    "selection_key": key,
                    "bookmaker": odd.get("bookmaker"),
                    "odds": odd["odds"],
                    "market_key": odd.get("market_key"),
                    "odd": odd,
                }
        return list(best.values())

    def compare_bookmakers(self, event_id: str, bookmakers: list[str], **params: Any) -> Any:
        return self.get_odds_snapshot(event_id, bookmakers=",".join(bookmakers), **params)

    def get_market_schema(self) -> dict[str, str]:
        return {
            "event_id": "Canonical sports event identifier.",
            "selection_key": "Stable selection identifier used for odds history.",
            "market_key": "Normalized market key.",
            "type": "Normalized market type.",
            "period": "Normalized period integer.",
            "odds": "Bookmaker decimal odds.",
            "odds_no_vig": "No-vig reference price when available.",
            "is_available": "False when a line is unavailable or suspended.",
        }

    def _url(self, path: str, params: dict[str, Any] | None = None) -> str:
        clean_path = path if path.startswith("/") else f"/{path}"
        query: dict[str, str] = {}
        for key, value in (params or {}).items():
            if value is None:
                continue
            if isinstance(value, (list, tuple)):
                query[key] = ",".join(str(item) for item in value)
            else:
                query[key] = str(value)
        suffix = f"?{urlencode(query)}" if query else ""
        return f"{self.base_url}{clean_path}{suffix}"

