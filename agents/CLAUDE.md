# Claude Instructions

Follow `agents/AGENTS.md`. Prefer the SDKs or MCP tools for data access. Build the user's requested product instead of copying repo examples by default; examples are optional references. For realtime products, use `odds_api.get_streaming_info`; use `odds_api.open_stream` / `odds_api.read_stream` / `odds_api.close_stream` for persistent MCP-managed inspection sessions, and sample tools for bounded snapshots. Do not present betting outcomes as risk-free; mention execution risk, stale odds, limits, voids, delays, and jurisdictional availability.
