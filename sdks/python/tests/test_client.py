import unittest

from odds_api import OddsApiClient


class ClientTests(unittest.TestCase):
    def test_search_events_builds_url_and_auth(self):
        seen = {}

        def transport(method, url, headers, body):
            seen.update({"method": method, "url": url, "headers": headers, "body": body})
            return {"items": [], "count": 0}

        client = OddsApiClient(
            api_key="test_key",
            base_url="https://api.odds-api.net/v1",
            transport=transport,
        )
        result = client.search_events(sport="rugby-league", league="NRL")

        self.assertEqual(result["count"], 0)
        self.assertEqual(seen["method"], "GET")
        self.assertIn("/events?", seen["url"])
        self.assertEqual(seen["headers"]["X-API-Key"], "test_key")

    def test_find_best_odds(self):
        def transport(method, url, headers, body):
            return {
                "event_id": "event-1",
                "items": [
                    {"id": "a", "event_id": "event-1", "bookmaker": "book-a", "selection_key": "home", "market_key": "moneyline", "type": "moneyline", "period": 0, "odds": 1.9, "is_available": True},
                    {"id": "b", "event_id": "event-1", "bookmaker": "book-b", "selection_key": "home", "market_key": "moneyline", "type": "moneyline", "period": 0, "odds": 2.1, "is_available": True},
                ],
                "resume": "0-0",
            }

        client = OddsApiClient(base_url="https://api.odds-api.net/v1", transport=transport)
        best = client.find_best_odds("event-1")
        self.assertEqual(best[0]["bookmaker"], "book-b")
        self.assertEqual(best[0]["odds"], 2.1)


if __name__ == "__main__":
    unittest.main()

