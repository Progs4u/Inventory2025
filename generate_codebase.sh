#!/bin/bash

# Directory to process
DIRECTORY="/home/appserver/web/projects/inventory"

# Get the current timestamp
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Output file for the protocol with a timestamp
OUTPUT_FILE="generated_codebase_$TIMESTAMP.json"

# Start the JSON array
echo "[" > "$OUTPUT_FILE"

# Counter for adding commas between JSON objects
first=true

# Loop through all files in the directory, excluding specified directories and files
find "$DIRECTORY" \
  -type d \( -name "node_modules" -o -name "uploads" \) -prune -o \
  -type f ! \( \
    -name "$(basename "$OUTPUT_FILE")" -o \
    -path "$DIRECTORY/src/script_addMasterUser.js" -o \
    -path "$DIRECTORY/src/public/output.css" -o \
    -path "$DIRECTORY/package-lock.json" -o \
    -path "$DIRECTORY/.vscode/settings.json" -o \
    -path "$DIRECTORY/screenlog.0" -o \
    -path "$DIRECTORY/ssl/certificate.crt" -o \
    -path "$DIRECTORY/ssl/private.key" -o \
    -path "$DIRECTORY/ssl/ca_bundle.crt" -o \
    -path "$DIRECTORY/.env" \
  \) -print | while read -r file; do
  # Get file details
  filename=$(basename "$file")
  filepath=$(realpath "$file")
  content=$(cat "$file" | jq -R -s '.') # Read file content and escape for JSON
  last_modified=$(date -r "$file" +"%Y-%m-%d %H:%M:%S")

  # Add a comma before every JSON object except the first
  if [ "$first" = false ]; then
    echo "," >> "$OUTPUT_FILE"
  fi
  first=false

  # Write the JSON object to the output file
  echo "  {" >> "$OUTPUT_FILE"
  echo "    \"filename\": \"$filename\"," >> "$OUTPUT_FILE"
  echo "    \"filepath\": \"$filepath\"," >> "$OUTPUT_FILE"
  echo "    \"content\": $content," >> "$OUTPUT_FILE"
  echo "    \"last_modified\": \"$last_modified\"" >> "$OUTPUT_FILE"
  echo "  }" >> "$OUTPUT_FILE"

done

# End the JSON array
echo "]" >> "$OUTPUT_FILE"

# Notify the user
echo "Protocol saved to $OUTPUT_FILE"