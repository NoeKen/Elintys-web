#!/usr/bin/env bash
set -euo pipefail

visual_root="${TMPDIR:-/tmp}"
visual_root="${visual_root%/}/elintys-visual-web"
case "$visual_root" in
  /tmp/elintys-visual-web|/var/folders/*/elintys-visual-web) ;;
  *) echo "Répertoire QA temporaire non sûr: $visual_root" >&2; exit 1 ;;
esac

mkdir -p "$visual_root"
rsync -a --delete \
  --exclude '.git/' \
  --exclude '.next/' \
  --exclude 'node_modules/' \
  --exclude 'playwright-report/' \
  --exclude 'test-results/' \
  --exclude '.visual-qa/' \
  --exclude 'docs/design-qa/event-experience/implementations/' \
  --exclude 'docs/design-qa/event-experience/mobile/' \
  --exclude 'docs/design-qa/event-experience/comparisons/' \
  ./ "$visual_root/"
ln -sfn "$PWD/node_modules" "$visual_root/node_modules"

cd "$visual_root"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.dev.elintys.com/api/v1}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3100}"
build_key="${NEXT_PUBLIC_API_URL}|${NEXT_PUBLIC_APP_URL}"
needs_build=0
if [ ! -f .next/BUILD_ID ]; then
  needs_build=1
elif [ ! -f .next/.elintys-visual-build-key ] || [ "$(cat .next/.elintys-visual-build-key)" != "$build_key" ]; then
  needs_build=1
elif find src next.config.ts package.json -type f -newer .next/BUILD_ID -print -quit | grep -q .; then
  needs_build=1
fi
if [ "$needs_build" -eq 1 ]; then
  node "$PWD/node_modules/next/dist/bin/next" build --webpack
  printf '%s' "$build_key" > .next/.elintys-visual-build-key
fi
node "$PWD/node_modules/next/dist/bin/next" start -p 3100
