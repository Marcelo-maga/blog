#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
OUT_DIR="${1:-site}"

cd "$ROOT"

sh "$ROOT/scripts/update-graph-data.sh"

if ! command -v marmite >/dev/null 2>&1 && [ -x "$HOME/.local/bin/marmite" ]; then
  PATH="$HOME/.local/bin:$PATH"
fi

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/static"
if [ "${MARMITE_URL:-}" ]; then
  marmite --force --url "$MARMITE_URL" . "$OUT_DIR"
else
  marmite --force . "$OUT_DIR"
fi

echo "Build ready at $ROOT/$OUT_DIR"
