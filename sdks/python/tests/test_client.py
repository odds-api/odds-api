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


    def test_order_book_exchange_and_live_methods_build_public_urls(self):
        urls = []

        def transport(method, url, headers, body):
            urls.append(url)
            return {"items": []}

        client = OddsApiClient(base_url="https://api.odds-api.net/v1", transport=transport)
        client.get_status()
        client.get_coverage(bookmaker="bet365", lookback_days=7)
        client.list_live_events(sport="soccer", include_opportunity_counts=True)
        client.get_exchange_orderbook("event 1", exchanges=["betfair", "smarkets"], depth=5)
        client.get_exchange_markets("30000001", id_type="betfair")
        client.get_betfair_event_markets("30000001", market_types="MATCH_ODDS")
        client.get_prediction_market_orderbook("event-1", providers="kalshi")
        client.get_odds_ticker("NRL", "bet365", "home-ticker")
        client.list_bookmakers(country_code="AU")

        self.assertEqual(
            urls,
            [
                "https://api.odds-api.net/v1/status",
                "https://api.odds-api.net/v1/coverage?bookmaker=bet365&lookback_days=7",
                "https://api.odds-api.net/v1/events/live?sport=soccer&include_opportunity_counts=true",
                "https://api.odds-api.net/v1/events/event%201/exchange/orderbook/snapshot?exchanges=betfair%2Csmarkets&depth=5",
                "https://api.odds-api.net/v1/events/30000001/exchange/markets?id_type=betfair",
                "https://api.odds-api.net/v1/exchange/betfair/events/30000001/markets?market_types=MATCH_ODDS",
                "https://api.odds-api.net/v1/events/event-1/prediction-markets/orderbook/snapshot?providers=kalshi",
                "https://api.odds-api.net/v1/widgets/odds-ticker?league=NRL&bookmakers=bet365&widget_id=home-ticker",
                "https://api.odds-api.net/v1/bookmakers?country_code=AU",
            ],
        )

if __name__ == "__main__":
    unittest.main()

