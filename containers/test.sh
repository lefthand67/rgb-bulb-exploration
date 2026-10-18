#!/usr/bin/env bash
set -euo pipefail

cd /work

# Always reinstall: the named node_modules volume must not keep stale deps.
npm ci --no-audit --no-fund

npm test
npm run package
npm run verify:web

python3 tests/e2e/android_webdriver.py \
  --url "file:///work/web/index.html" \
  --artifacts /work/tests/e2e/artifacts

python3 tests/e2e/visual_contracts.py \
  --url "file:///work/web/index.html?e2e=1" \
  --artifacts /work/tests/e2e/artifacts

python3 tests/e2e/centering.py \
  --url "file:///work/web/index.html?e2e=1" \
  --artifacts /work/tests/e2e/artifacts
