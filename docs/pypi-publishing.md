# PyPI publishing

This repo publishes the Python SDK as `odds-api-client`.

Use Trusted Publishing from GitHub Actions. Do not store a long-lived PyPI token in GitHub secrets unless Trusted Publishing is unavailable.

## One-time PyPI setup

Create or use the PyPI owner account or organization that should own `odds-api-client`.

Add a pending trusted publisher on PyPI with these exact fields:

| Field | Value |
|---|---|
| PyPI project name | `odds-api-client` |
| Owner | `odds-api` |
| Repository name | `odds-api` |
| Workflow filename | `python-publish.yml` |
| Environment name | `pypi` |

The pending publisher does not reserve the name. Publish the first release soon after adding it.

## First publish

After the pending trusted publisher exists, dispatch the workflow from the public repo:

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

- Publish only from `/Users/rorincampbell/Desktop/odds-api-public`.
- Publish only to the `odds-api-client` PyPI project.
- Never publish from the private WagerWise repo.
- Never include WagerWise/private implementation details, secrets, parser internals, raw datasets, admin endpoints, or proprietary scoring internals.
- PyPI versions are immutable. If a version has been uploaded, bump to a new version.
