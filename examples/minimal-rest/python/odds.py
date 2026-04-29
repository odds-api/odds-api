import argparse
import os

import requests


def main():
    parser = argparse.ArgumentParser(description="Minimal Odds API REST example")
    parser.add_argument("--api-key", default=os.getenv("ODDS_API_KEY"))
    parser.add_argument("--base-url", default=os.getenv("ODDS_API_BASE_URL", "https://api.odds-api.net/v1"))
    args = parser.parse_args()

    if not args.api_key:
        raise SystemExit("Missing API key. Pass --api-key or set ODDS_API_KEY.")

    response = requests.get(
        f"{args.base_url.rstrip('/')}/sports",
        headers={"X-API-Key": args.api_key},
        timeout=20,
    )
    response.raise_for_status()

    print(response.text)


if __name__ == "__main__":
    main()
