#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
CONTENT_ROOT="$ROOT/content/vault"
OUTPUT="$ROOT/static/graph-data.json"
TMP_OUTPUT="${OUTPUT}.$$.tmp"

find "$CONTENT_ROOT/Notes" "$CONTENT_ROOT/Artigos" -type f -name '*.md' 2>/dev/null | sort | awk '
function basename(path, parts, n) {
  n = split(path, parts, "/")
  return parts[n]
}

function clean(value) {
  gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
  if ((substr(value, 1, 1) == "\"" && substr(value, length(value), 1) == "\"") ||
      (substr(value, 1, 1) == "\047" && substr(value, length(value), 1) == "\047")) {
    value = substr(value, 2, length(value) - 2)
  }
  return value
}

function json(value) {
  gsub(/\\/, "\\\\", value)
  gsub(/"/, "\\\"", value)
  gsub(/\t/, "\\t", value)
  gsub(/\r/, "\\r", value)
  gsub(/\n/, "\\n", value)
  return "\"" value "\""
}

function slug_from_file(path, name) {
  name = basename(path)
  sub(/\.md$/, "", name)
  return name
}

function add_tag(value) {
  value = clean(value)
  gsub(/,$/, "", value)
  if (value != "") {
    tags[++tag_count] = value
  }
}

function add_link(value) {
  value = clean(value)
  if (value != "") {
    links[++link_count] = value
  }
}

function save_item() {
  if (current_file == "") return
  if (title == "") title = slug_from_file(current_file)
  if (slug == "") slug = slug_from_file(current_file)
  if (stream == "") stream = (current_file ~ /\/Artigos\//) ? "artigos" : "notas"

  count++
  item_title[count] = title
  item_slug[count] = slug
  item_stream[count] = stream
  item_path[count] = current_file
  title_to_id[title] = "content:" slug

  item_tags[count] = ""
  for (i = 1; i <= tag_count; i++) {
    item_tags[count] = item_tags[count] (i > 1 ? "\034" : "") tags[i]
  }

  item_links[count] = ""
  for (i = 1; i <= link_count; i++) {
    item_links[count] = item_links[count] (i > 1 ? "\034" : "") links[i]
  }
}

function reset_item(path) {
  for (i in tags) delete tags[i]
  for (i in links) delete links[i]
  current_file = path
  title = ""
  slug = ""
  stream = ""
  in_frontmatter = 0
  reading_tags = 0
  tag_count = 0
  link_count = 0
}

function read_file(path, line, tagline, match_text) {
  reset_item(path)
  first_line = 1
  while ((getline line < path) > 0) {
    if (first_line && line == "---") {
      in_frontmatter = 1
      first_line = 0
      continue
    }
    first_line = 0

    if (in_frontmatter) {
      if (line == "---") {
        in_frontmatter = 0
        reading_tags = 0
        continue
      }

      if (reading_tags) {
        if (line ~ /^[[:space:]]*-[[:space:]]*/) {
          tagline = line
          sub(/^[[:space:]]*-[[:space:]]*/, "", tagline)
          add_tag(tagline)
          continue
        }
        if (line ~ /^[^[:space:]][^:]*:/) {
          reading_tags = 0
        }
      }

      if (line ~ /^title:[[:space:]]*/) {
        title = line
        sub(/^title:[[:space:]]*/, "", title)
        title = clean(title)
      } else if (line ~ /^slug:[[:space:]]*/) {
        slug = line
        sub(/^slug:[[:space:]]*/, "", slug)
        slug = clean(slug)
      } else if (line ~ /^stream:[[:space:]]*/) {
        stream = line
        sub(/^stream:[[:space:]]*/, "", stream)
        stream = clean(stream)
      } else if (line ~ /^tags:[[:space:]]*\[/) {
        tagline = line
        sub(/^tags:[[:space:]]*\[/, "", tagline)
        sub(/\][[:space:]]*$/, "", tagline)
        inline_tag_count = split(tagline, inline_tags, ",")
        for (i = 1; i <= inline_tag_count; i++) add_tag(inline_tags[i])
      } else if (line ~ /^tags:[[:space:]]*$/) {
        reading_tags = 1
      }
    }

    while (match(line, /\[\[[^]|#]+/)) {
      match_text = substr(line, RSTART + 2, RLENGTH - 2)
      add_link(match_text)
      line = substr(line, RSTART + RLENGTH)
    }
  }
  close(path)
  save_item()
}

BEGIN {
  current_file = ""
  count = 0
}

{
  read_file($0)
}

END {
  generated_at = strftime("%Y-%m-%dT%H:%M:%S")
  print "{"
  print "  \"generatedAt\": " json(generated_at) ","
  print "  \"nodes\": ["

  first_node = 1
  for (i = 1; i <= count; i++) {
    kind = item_stream[i] == "artigos" ? "article" : "note"
    prefix = item_stream[i] == "artigos" ? "artigos-" : "notas-"
    if (!first_node) print ","
    first_node = 0
    printf "    {\"id\": %s, \"label\": %s, \"kind\": %s, \"url\": %s, \"tags\": [", json("content:" item_slug[i]), json(item_title[i]), json(kind), json(prefix item_slug[i] ".html")
    tag_value_count = split(item_tags[i], tag_values, "\034")
    first_tag = 1
    for (j = 1; j <= tag_value_count; j++) {
      if (tag_values[j] == "") continue
      if (!first_tag) printf ", "
      first_tag = 0
      printf "%s", json(tag_values[j])
      if (!(tag_values[j] in seen_tags)) {
        seen_tags[tag_values[j]] = 1
        tag_order[++tag_total] = tag_values[j]
      }
    }
    printf "]}"
  }

  for (i = 1; i <= tag_total; i++) {
    tag = tag_order[i]
    if (!first_node) print ","
    first_node = 0
    printf "    {\"id\": %s, \"label\": %s, \"kind\": \"tag\", \"url\": %s, \"tags\": []}", json("tag:" tag), json("#" tag), json("tag-" tag ".html")
  }
  print ""
  print "  ],"
  print "  \"edges\": ["

  first_edge = 1
  for (i = 1; i <= count; i++) {
    source = "content:" item_slug[i]
    tag_value_count = split(item_tags[i], tag_values, "\034")
    for (j = 1; j <= tag_value_count; j++) {
      if (tag_values[j] == "") continue
      if (!first_edge) print ","
      first_edge = 0
      printf "    {\"source\": %s, \"target\": %s, \"kind\": \"tag\"}", json(source), json("tag:" tag_values[j])
    }

    link_value_count = split(item_links[i], link_values, "\034")
    for (j = 1; j <= link_value_count; j++) {
      if (link_values[j] == "" || !(link_values[j] in title_to_id)) continue
      if (!first_edge) print ","
      first_edge = 0
      printf "    {\"source\": %s, \"target\": %s, \"kind\": \"link\"}", json(source), json(title_to_id[link_values[j]])
    }
  }
  print ""
  print "  ]"
  print "}"
}
' > "$TMP_OUTPUT"

mv "$TMP_OUTPUT" "$OUTPUT"
printf 'Graph data written to %s\n' "$OUTPUT"
