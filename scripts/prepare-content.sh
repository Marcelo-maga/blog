#!/usr/bin/env sh
set -eu

CONTENT_ROOT=${1:?usage: prepare-content.sh CONTENT_DIR}
VAULT_ROOT="$CONTENT_ROOT/vault"
MEDIA_ROOT="$VAULT_ROOT/midia"
WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/prepare-content.XXXXXX")
trap 'rm -rf "$WORK_DIR"' EXIT

INDEX="$WORK_DIR/media-index"
find "$MEDIA_ROOT" -type f \( \
  -iname '*.avif' -o -iname '*.gif' -o -iname '*.jpeg' -o -iname '*.jpg' \
  -o -iname '*.png' -o -iname '*.svg' -o -iname '*.webp' \
\) -print | awk -v vault="$VAULT_ROOT/" '
function basename(path, parts, count) {
  count = split(path, parts, "/")
  return parts[count]
}
{
  path = $0
  sub("^" vault, "", path)
  print path "\t" basename(path)
}
' > "$INDEX"

find "$CONTENT_ROOT" -type f -name '*.md' -print | while IFS= read -r note; do
  temporary="$WORK_DIR/note"
  if ! awk -v note="$note" -v vault="$VAULT_ROOT" -v media="midia" -v index_file="$INDEX" '
    function basename(path, parts, count) {
      count = split(path, parts, "/")
      return parts[count]
    }
    function image_extension(path) {
      return path ~ /\.(avif|gif|jpe?g|png|svg|webp)$/i
    }
    function url(path) {
      gsub(/%/, "%25", path)
      gsub(/ /, "%20", path)
      gsub(/#/, "%23", path)
      gsub(/\?/, "%3F", path)
      return path
    }
    function load_index(path, relative, name) {
      while ((getline path < index_file) > 0) {
        split(path, fields, "\t")
        relative = fields[1]
        name = fields[2]
        exact[relative] = relative
        names[name] = names[name] + 1
        if (names[name] == 1) matches[name] = relative
      }
      close(index_file)
    }
    function resolve(target, note_relative, candidate, name) {
      gsub(/\\/, "/", target)
      sub(/^</, "", target)
      sub(/>$/, "", target)
      gsub(/^ +| +$/, "", target)
      name = basename(target)

      candidate = note_relative "/" target
      if (candidate in exact) return exact[candidate]
      candidate = target
      sub(/^\/+/, "", candidate)
      sub(/^vault\//, "", candidate)
      if (candidate in exact) return exact[candidate]
      sub(/^midia\//, "", candidate)
      candidate = "midia/" candidate
      if (candidate in exact) return exact[candidate]
      if (names[name] == 1) return matches[name]
      if (names[name] > 1) {
        print "content preparation failed: imagem ambigua \"" target "\"" > "/dev/stderr"
        exit 1
      }
      return ""
    }
    function reference(relative) {
      sub(/^midia\//, "", relative)
      return url(media "/" relative)
    }
    BEGIN {
      load_index()
      note_relative = note
      sub("^" vault "/", "", note_relative)
      sub("/[^/]+$", "", note_relative)
      fenced = 0
    }
    {
      line = $0
      if (line ~ /^[[:space:]]*(```|~~~)/) {
        fenced = !fenced
        print line
        next
      }
      if (fenced) {
        print line
        next
      }

      while (match(line, /!\[\[[^]]+\]\]/)) {
        original = line
        before = substr(line, 1, RSTART - 1)
        end = RSTART + RLENGTH
        embed = substr(line, RSTART + 3, RLENGTH - 5)
        target = embed
        alias = ""
        if (index(embed, "|")) {
          split(embed, parts, "|")
          target = parts[1]
          alias = parts[2]
        }
        if (!image_extension(target)) {
          replacement = substr(line, RSTART, RLENGTH)
        } else {
          resolved = resolve(target, note_relative)
          if (!resolved) {
            print "content preparation failed: imagem não encontrada \"" target "\"" > "/dev/stderr"
            exit 1
          }
          alt = alias
          if (!alt || alt ~ /^[0-9]+$/) alt = basename(target)
          sub(/\.[^.]+$/, "", alt)
          replacement = "![" alt "](" reference(resolved) ")"
        }
        line = before replacement substr(line, end)
        if (line == original) break
      }

      while (match(line, /!\[[^]]*\]\([^)]*\)/)) {
        original = line
        before = substr(line, 1, RSTART - 1)
        end = RSTART + RLENGTH
        image = substr(line, RSTART, RLENGTH)
        open = index(image, "](")
        alt = substr(image, 1, open - 1)
        target = substr(image, open + 2, length(image) - open - 2)
        if (target ~ /^(<|https?:\/\/|\/|#|data:)/) {
          replacement = image
        } else {
          resolved = resolve(target, note_relative)
          replacement = image
          if (resolved) replacement = alt "](" reference(resolved) ")"
        }
        line = before replacement substr(line, end)
        if (line == original) break
      }
      print line
    }
  ' "$note" > "$temporary"; then
    echo "content preparation failed in $note" >&2
    exit 1
  fi
  mv "$temporary" "$note"
done
