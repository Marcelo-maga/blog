#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
OUT_DIR="${1:-site}"

cd "$ROOT"

sh "$ROOT/scripts/update-graph-data.sh"

if ! command -v marmite >/dev/null 2>&1 && [ -x "$HOME/.local/bin/marmite" ]; then
  PATH="$HOME/.local/bin:$PATH"
fi

case "$OUT_DIR" in
  /*) OUTPUT_DIR="$OUT_DIR" ;;
  *) OUTPUT_DIR="$ROOT/$OUT_DIR" ;;
esac

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/static"

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/blog-build.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT
cp -a "$ROOT/." "$WORK_DIR/"
rm -rf "$WORK_DIR/.git" "$WORK_DIR/site"
sh "$ROOT/scripts/validate-content.sh" "$WORK_DIR/content"
rm -rf "$WORK_DIR/content/vault/template"
sh "$ROOT/scripts/prepare-content.sh" "$WORK_DIR/content"

if [ "${MARMITE_URL:-}" ]; then
  marmite --force --url "$MARMITE_URL" "$WORK_DIR" "$OUTPUT_DIR"
else
  marmite --force "$WORK_DIR" "$OUTPUT_DIR"
fi

echo "Build ready at $OUTPUT_DIR"
