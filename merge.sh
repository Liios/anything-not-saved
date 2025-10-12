#!/usr/bin/env bash

# merge.sh — Merge parts into anything-not-saved.user.js and update anything-not-saved.meta.js

set -euo pipefail

buildPath="anything-not-saved.user.js"
metaPath="anything-not-saved.meta.js"
partsDir="./parts"
lost=""

# Load base file
buildContent=$(<"$buildPath")

# Loop through all parts
for part in "$partsDir"/*.js; do
  [ -f "$part" ] || continue
  base="$(basename "$part" .js)"
  partContent=$(<"$part")

  # Multiline regex pattern for async/normal functions
  pattern="(async )?function $base\(.*?\) {[\s\S]+?^}\n\n?"

  if ! perl -0777 -ne "exit 0 if /$pattern/m; exit 1" <<< "$buildContent"; then
    lost+="$base not found"$'\n'
  else
    # Replace the function definition with a marker
    buildContent="$(echo "$buildContent" | perl -0777 -pe "s/$pattern/###$base\n\n/m")"
    # Replace marker line with file content using awk
    buildContent="$(awk -v marker="###$base" -v part="$part" '
      $0 == marker { system("cat \"" part "\""); next }
      { print }
    ' <<< "$buildContent")"
  fi
done

# Write updated files
printf "%s" "$buildContent" > "$buildPath"
# Read first 4 lines and append closing tag to the meta file
{ head -n 4 "$buildPath"; echo "// ==/UserScript=="; } > "$metaPath"

if [[ -n "$lost" ]]; then
  echo "Missing functions:"
  echo "$lost"
else
  echo "Done"
fi
