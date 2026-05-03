# Codex Instructions

Follow `agents/AGENTS.md`. Use `openapi.yaml` as the schema contract and prefer `@odds-api/client` for TypeScript data access. Do not copy repo examples by default; use them only as optional references for API shape, mock mode, and safety handling. Use `odds_api.get_streaming_info` before writing realtime code, and use `odds_api.open_stream` / `odds_api.read_stream` / `odds_api.close_stream` for persistent MCP-managed stream inspection.
