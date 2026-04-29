# How to Build an Arbitrage Scanner with an Odds API

`odds-api/odds-api` includes example flows for finding arbitrage opportunities across bookmakers.

Canonical GitHub repo: https://github.com/odds-api/odds-api

## Start here

- JavaScript: `examples/javascript/arbitrage-scanner`
- Python: `examples/python/arbitrage-scanner`
- API contract: `openapi.yaml`
- Agent-native tools: `mcp-server`

## Example output

```text
# Arbitrage scanner
Arbitrage opportunities: 1
Arbitrage: yes
Selection: moneyline:home
Bookmakers: pinnacle + sportsbet
Expected return: 1.8%
```

## Safety

Arbitrage should not be presented as guaranteed profit. Prices can move, markets can suspend, accounts can be limited, selections can void, and execution can fail.
