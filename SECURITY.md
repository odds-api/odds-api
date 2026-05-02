# Security Policy

This repository contains the public odds-api developer package: OpenAPI exports, REST examples, TypeScript SDK, Python SDK, MCP server, agent instructions, and related documentation.

The production API and account security overview is published at <https://odds-api.net/security>.

## Reporting A Vulnerability

Email sensitive reports to security@odds-api.net.

Do not open public GitHub issues, pull requests, discussions, screenshots, or logs for vulnerabilities, exposed credentials, live API keys, account data, or private customer information.

Useful reports include:

- affected package, file, endpoint, or URL
- reproduction steps
- expected and actual behavior
- impact assessment
- package versions, runtime versions, or request IDs where relevant
- screenshots or logs with secrets removed

We aim to acknowledge valid reports on a best-effort basis within 2 business days. Please avoid public disclosure until a remediation path has been agreed or the issue has been resolved.

## Repository Scope

In scope for this public repository:

- OpenAPI schema and generated contract files
- TypeScript SDK
- Python SDK
- MCP server
- example applications and minimal REST examples
- agent instructions and public documentation

Out of scope for this public repository:

- private production infrastructure
- customer account administration
- private operational tooling
- private data collection systems
- source-feed or proprietary scoring internals

For production API security controls, subprocessors, retention notes, and enterprise roadmap items, use the website security page: <https://odds-api.net/security>.

## Handling API Keys

Use `ODDS_API_KEY` for local examples and CI secrets. Do not commit live API keys to this repository, example apps, screenshots, issue reports, or support logs.

If a key is exposed, rotate it from the odds-api account page and remove it from the public location before filing a report.
