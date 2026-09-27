# npm publishing

This repo publishes the TypeScript SDK and MCP server to npm:

- [`@odds-api/client`](https://www.npmjs.com/package/@odds-api/client)
- [`@odds-api/mcp`](https://www.npmjs.com/package/@odds-api/mcp)

Publish through npm Trusted Publishing from GitHub Actions, the same model the Python SDK uses on PyPI. Do not create long-lived npm tokens, commit them, or store them in GitHub secrets unless Trusted Publishing is unavailable.

## Current status

- npm owner account: `odds-api.net`
- npm scope: `@odds-api`
- GitHub environment: `npm`
- Publish workflow: `.github/workflows/npm-publish.yml`
- Versions are released in lockstep with the Python SDK: one GitHub release `vX.Y.Z` publishes `@odds-api/client`, `@odds-api/mcp`, and `odds-api-client` at `X.Y.Z`.

## One-time npm setup

For each of `@odds-api/client` and `@odds-api/mcp`, open the package on npmjs.com as the owner account, go to **Settings → Trusted Publisher → GitHub Actions**, and enter exactly:

| Field | Value |
|---|---|
| Organization or user | `odds-api` |
| Repository | `odds-api` |
| Workflow filename | `npm-publish.yml` |
| Environment name | `npm` |

After the first successful Actions publish, set each package's publishing access to require two-factor authentication and disallow tokens, then revoke any remaining automation tokens.

## Release flow

1. Update the same version in:

   ```text
   sdks/typescript/package.json
   mcp-server/package.json
   sdks/python/pyproject.toml
   sdks/python/src/odds_api/__init__.py
   ```

2. Keep `@odds-api/mcp` depending on the matching published client version, not a local `file:` dependency. The workflow fails if they differ:

   ```json
   "@odds-api/client": "^X.Y.Z"
   ```

3. Refresh the lockfile and run checks from the repo root:

   ```bash
   npm install
   npm run build
   npm test
   npm run lint:openapi
   npm pack --dry-run --workspace @odds-api/client
   npm pack --dry-run --workspace @odds-api/mcp
   ```

4. Publish a GitHub release tagged `vX.Y.Z` from `main`. The `publish-npm` workflow builds, tests, and publishes the client before the MCP server; `publish-python` publishes the Python SDK from the same release. A version that is already on npm is skipped, so a failed run can be re-run safely.

   To publish npm without a new release:

   ```bash
   gh workflow run npm-publish.yml \
     --repo odds-api/odds-api \
     -f version=X.Y.Z \
     -f publish=publish
   ```

5. Verify:

   ```bash
   npm view @odds-api/client version name dist-tags --json
   npm view @odds-api/mcp version name dist-tags --json
   ```

Coordinate with [`pypi-publishing.md`](pypi-publishing.md) so SDK package versions and docs stay aligned.
