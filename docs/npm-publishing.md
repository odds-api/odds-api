# npm publishing

This repo publishes the TypeScript SDK and MCP server to npm:

- [`@odds-api/client`](https://www.npmjs.com/package/@odds-api/client)
- [`@odds-api/mcp`](https://www.npmjs.com/package/@odds-api/mcp)

## Current status

- npm owner account: `odds-api.net`
- npm scope: `@odds-api`
- Published versions: `@odds-api/client@0.1.0`, `@odds-api/mcp@0.1.0`
- Publish credential: granular npm automation token, issued 2026-05-02, valid for 90 days.
- Rotation due: before 2026-07-31.

Do not commit npm tokens, paste them into docs, or store them in repo files. Use a local temporary npm config, `NPM_TOKEN`, or GitHub Actions secrets/trusted publishing.

## Release flow

1. Update package versions in:

   ```text
   sdks/typescript/package.json
   mcp-server/package.json
   package-lock.json
   ```

2. Keep `@odds-api/mcp` depending on the published client version, not a local `file:` dependency:

   ```json
   "@odds-api/client": "^0.1.0"
   ```

3. Run checks from the repo root:

   ```bash
   npm run build
   npm test
   npm pack --dry-run --workspace @odds-api/client
   npm pack --dry-run --workspace @odds-api/mcp
   ```

4. Publish the client before the MCP server:

   ```bash
   npm publish --access public --workspace @odds-api/client
   npm publish --access public --workspace @odds-api/mcp
   ```

5. Verify:

   ```bash
   npm view @odds-api/client version name dist-tags --json
   npm view @odds-api/mcp version name dist-tags --json
   ```

## Credential upkeep

- The current npm automation token expires 90 days after 2026-05-02. Rotate it before 2026-07-31.
- If publishing from a local terminal with security-key 2FA, npm may require a browser/device approval or OTP.
- Prefer GitHub Actions trusted publishing or a tightly scoped granular npm token for repeatable releases.
- Coordinate npm version bumps with PyPI releases in [`pypi-publishing.md`](pypi-publishing.md) so SDK package versions and docs stay aligned.
