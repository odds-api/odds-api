# Cursor Rules

- Read `agents/AGENTS.md` before generating betting tools.
- Use `ODDS_API_KEY` and `ODDS_API_BASE_URL`; never hardcode keys.
- Use examples as optional references only; design the user's requested UI or workflow.
- Prefer snapshots for one-off answers; use `odds_api.get_streaming_info` before realtime code.
- Use `odds_api.open_stream`, `odds_api.read_stream`, and `odds_api.close_stream` for persistent MCP-managed stream inspection.
- Handle rate limits, stale odds, empty responses, and suspended markets.
- Do not claim guaranteed profit without execution-risk caveats.
