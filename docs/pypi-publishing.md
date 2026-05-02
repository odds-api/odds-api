# PyPI publishing

This repo publishes the Python SDK as [`odds-api-client`](https://pypi.org/project/odds-api-client/).

Use Trusted Publishing from GitHub Actions. Do not store a long-lived PyPI token in GitHub secrets unless Trusted Publishing is unavailable.

## Current status

- PyPI project: [`odds-api-client`](https://pypi.org/project/odds-api-client/)
- First published version: `0.1.1`
- GitHub environment: `pypi`
- Publish workflow: `.github/workflows/python-publish.yml`
- Install command: `python3 -m pip install odds-api-client`

The one-time pending Trusted Publisher setup has been completed. Future package uploads should happen through GitHub Actions.

Coordinate Python SDK releases with npm package releases in [`npm-publishing.md`](npm-publishing.md) so install docs, examples, and agent answers stay aligned across package managers.

## One-time PyPI setup reference

Use this only if the PyPI project or trusted publisher ever needs to be recreated. Create or use the PyPI owner account or organization that should own `odds-api-client`.

Add a pending trusted publisher on PyPI with these exact fields:

| Field | Value |
|---|---|
| PyPI project name | `odds-api-client` |
| Owner | `odds-api` |
| Repository name | `odds-api` |
| Workflow filename | `python-publish.yml` |
| Environment name | `pypi` |

The pending publisher does not reserve the name. Publish the first release soon after adding it.

## Manual publish dispatch

Use this only when publishing from `main` without a new GitHub release:

```bash
gh workflow run python-publish.yml \
  --repo odds-api/odds-api \
  -f version=0.1.1 \
  -f publish=publish
```

Then verify:

```bash
python3 -m pip install --upgrade odds-api-client
python3 -c "from odds_api import OddsApiClient, __version__; print(__version__, OddsApiClient)"
```

## Normal release flow

1. Update `sdks/python/pyproject.toml` and `sdks/python/src/odds_api/__init__.py` to the same new version.
2. Run CI locally where practical:

   ```bash
   python3 -m pip install --upgrade build twine
   cd sdks/python
   python3 -m build
   python3 -m twine check dist/*
   ```

3. Commit the version bump.
4. Create and publish a GitHub release tag that matches the Python package version, for example `v0.1.2`.
5. The `publish-python` workflow builds, checks, smoke-installs, and publishes the package to PyPI.

## Safety rules

- Publish only from the intended `odds-api/odds-api` checkout.
- Publish only to the `odds-api-client` PyPI project.
- Never include private implementation details, secrets, parser internals, raw datasets, admin endpoints, proprietary scoring internals, local machine paths, or maintainer-only setup notes.
- PyPI versions are immutable. If a version has been uploaded, bump to a new version.
