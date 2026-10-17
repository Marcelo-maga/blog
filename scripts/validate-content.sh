#!/usr/bin/env sh
set -eu

CONTENT_ROOT=${1:?usage: validate-content.sh CONTENT_DIR}
VAULT_ROOT="$CONTENT_ROOT/vault"
MEDIA_ROOT="$VAULT_ROOT/midia"
WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/validate-content.XXXXXX")
trap 'rm -rf "$WORK_DIR"' EXIT

NOTES="$WORK_DIR/notes"
MEDIA="$WORK_DIR/media"
ERRORS=0

find "$VAULT_ROOT/content" -type f -name '*.md' -print > "$NOTES"
find "$MEDIA_ROOT" -type f \( \
  -iname '*.avif' -o -iname '*.gif' -o -iname '*.jpeg' -o -iname '*.jpg' \
  -o -iname '*.png' -o -iname '*.svg' -o -iname '*.webp' \
\) -print | awk -v vault="$VAULT_ROOT/" '
function basename(path, parts, count) {
  count = split(path, parts, "/")
  return parts[count]
}
{
  relative = $0
  sub("^" vault, "", relative)
  print relative "\t" basename(relative)
}
' > "$MEDIA"

if ! awk -v notes="$NOTES" -v media="$MEDIA" -v vault="$VAULT_ROOT" '
function trim(value) {
  gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
  if (value ~ /^".*"$/ || value ~ /^\047.*\047$/) value = substr(value, 2, length(value) - 2)
  return value
}
function basename(path, parts, count) {
  count = split(path, parts, "/")
  return parts[count]
}
function image_extension(path) {
  return path ~ /\.(avif|gif|jpe?g|png|svg|webp)$/i
}
function report(path, line, message) {
  printf "%s:%d: %s\n", path, line, message > "/dev/stderr"
  errors++
}
function load_indexes(path, fields, title, slug, file) {
  while ((getline path < notes) > 0) {
    title = ""
    slug = ""
    in_frontmatter = 0
    first_line = 1
    while ((getline line < path) > 0) {
      if (first_line && line == "---") {
        in_frontmatter = 1
        first_line = 0
        continue
      }
      first_line = 0
      if (in_frontmatter && line == "---") break
      if (in_frontmatter && line ~ /^title:[[:space:]]*/) {
        sub(/^title:[[:space:]]*/, "", line)
        title = trim(line)
      }
      if (in_frontmatter && line ~ /^slug:[[:space:]]*/) {
        sub(/^slug:[[:space:]]*/, "", line)
        slug = trim(line)
      }
    }
    close(path)
    file = path
    sub("^" vault "/", "", file)
    if (title == "") report(path, 1, "frontmatter sem title")
    if (slug == "") report(path, 1, "frontmatter sem slug")
    if (title != "") {
      if (title in title_files) report(path, 1, "titulo duplicado: " title)
      title_files[title] = path
    }
    if (slug != "") {
      if (slug in slug_files) report(path, 1, "slug duplicado: " slug)
      slug_files[slug] = path
    }
  }
}
function load_media(path, fields, relative, name) {
  while ((getline path < media) > 0) {
    split(path, fields, "\t")
    relative = fields[1]
    name = fields[2]
    media_exact[relative] = 1
    media_names[name]++
    media_matches[name] = relative
  }
  close(media)
}
function resolve_media(target, note_relative, candidate, name) {
  gsub(/\\/, "/", target)
  gsub(/^ +| +$/, "", target)
  name = basename(target)
  candidate = note_relative "/" target
  if (candidate in media_exact) return candidate
  candidate = target
  sub(/^\/+/, "", candidate)
  sub(/^vault\//, "", candidate)
  if (candidate in media_exact) return candidate
  sub(/^midia\//, "", candidate)
  candidate = "midia/" candidate
  if (candidate in media_exact) return candidate
  if (media_names[name] == 1) return media_matches[name]
  return ""
}
function validate_note(path, line_number, line, match_text, target, inner, note_relative, resolved) {
  note_relative = path
  sub("^" vault "/", "", note_relative)
  sub("/[^/]+$", "", note_relative)
  fenced = 0
  line_number = 0
  while ((getline line < path) > 0) {
    line_number++
    if (line ~ /^[[:space:]]*(```|~~~)/) {
      fenced = !fenced
      continue
    }
    if (fenced) continue

    while (match(line, /\[\[[^]]+\]\]/)) {
      match_text = substr(line, RSTART, RLENGTH)
      if (!(RSTART > 1 && substr(line, RSTART - 1, 1) == "!")) {
        inner = substr(match_text, 3, length(match_text) - 4)
        sub(/\|.*$/, "", inner)
        sub(/#.*$/, "", inner)
        gsub(/^ +| +$/, "", inner)
        if (!(inner in title_files) && !(inner in slug_files))
          report(path, line_number, "wikilink nao encontrado: [[" inner "]]")
      }
      line = substr(line, RSTART + RLENGTH)
    }

    while (match(line, /!\[[^]]*\]\([^)]*\)/)) {
      match_text = substr(line, RSTART, RLENGTH)
      target = match_text
      sub(/^.*\]\(/, "", target)
      sub(/\)$/, "", target)
      gsub(/^<|>$/, "", target)
      if (target ~ /^\/midia\//)
        report(path, line_number, "caminho de imagem comecando por /midia/ quebra no GitHub Pages: " target)
      else if (target !~ /^(https?:\/\/|data:|#|\/)/) {
        resolved = resolve_media(target, note_relative)
        if (!resolved) report(path, line_number, "imagem nao encontrada: " target)
      }
      line = substr(line, RSTART + RLENGTH)
    }

    while (match(line, /!\[\[[^]]+\]\]/)) {
      match_text = substr(line, RSTART, RLENGTH)
      inner = substr(match_text, 4, length(match_text) - 5)
      target = inner
      sub(/\|.*$/, "", target)
      gsub(/^ +| +$/, "", target)
      if (image_extension(target)) {
        resolved = resolve_media(target, note_relative)
        if (!resolved) report(path, line_number, "imagem do Obsidian nao encontrada: " target)
      }
      line = substr(line, RSTART + RLENGTH)
    }
  }
  close(path)
}
BEGIN {
  errors = 0
  load_indexes()
  load_media()
}
{
  validate_note($0)
}
END {
  if (errors > 0) {
    printf "content validation failed: %d erro(s)\n", errors > "/dev/stderr"
    exit 1
  }
}
' "$NOTES"; then
  ERRORS=1
fi

if [ "$ERRORS" -ne 0 ]; then
  exit 1
fi

printf 'Content validation passed.\n'
