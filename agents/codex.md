# Codex Instructions

Follow `agents/AGENTS.md`. Use `openapi.yaml` as the schema contract and prefer `@odds-api/client` for TypeScript data access. Do not copy repo examples by default; use them only as optional references for API shape, mock mode, and safety handling. Use `odds_api.get_streaming_info` and `odds_api.get_stream_connection` before writing realtime code; generate production code that connects to raw Odds API SSE/WebSocket endpoints from a backend service. Use `open_stream` / `read_stream` / `close_stream` only for optional MCP broker workflows.
