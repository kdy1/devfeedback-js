#!/usr/bin/env bash

# Analyze bundle sizes for all benchmark fixtures
# Usage: ./analyze-bundle-sizes.sh

set -e

echo "📊 Analyzing bundle sizes..."
echo ""

# Create results directory if it doesn't exist
mkdir -p benchmarks/results

# Function to get size in bytes
get_size() {
  local path=$1
  if [ -d "$path" ]; then
    # Get total size in bytes - compatible with both GNU and BSD stat
    if stat -f%z "$path" &>/dev/null 2>&1; then
      # BSD stat (macOS)
      find "$path" -type f \( -name "*.js" -o -name "*.mjs" -o -name "*.css" \) -exec stat -f%z {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}'
    else
      # GNU stat (Linux)
      find "$path" -type f \( -name "*.js" -o -name "*.mjs" -o -name "*.css" \) -exec stat -c%s {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}'
    fi
  else
    echo "0"
  fi
}

# Function to format bytes to human readable
format_bytes() {
  local bytes=$1
  if [ "$bytes" -lt 1024 ]; then
    echo "${bytes}B"
  elif [ "$bytes" -lt 1048576 ]; then
    awk "BEGIN {printf \"%.2fKB\", $bytes/1024}"
  else
    awk "BEGIN {printf \"%.2fMB\", $bytes/1048576}"
  fi
}

# Function to get JS size
get_js_size() {
  local path=$1
  if [ -d "$path" ]; then
    if stat -f%z "$path" &>/dev/null 2>&1; then
      find "$path" -type f \( -name "*.js" -o -name "*.mjs" \) -exec stat -f%z {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}'
    else
      find "$path" -type f \( -name "*.js" -o -name "*.mjs" \) -exec stat -c%s {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}'
    fi
  else
    echo "0"
  fi
}

# Function to get CSS size
get_css_size() {
  local path=$1
  if [ -d "$path" ]; then
    if stat -f%z "$path" &>/dev/null 2>&1; then
      find "$path" -type f -name "*.css" -exec stat -f%z {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}'
    else
      find "$path" -type f -name "*.css" -exec stat -c%s {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}'
    fi
  else
    echo "0"
  fi
}

# Temporary files for storing data
temp_data=$(mktemp)
trap 'rm -f "$temp_data"' EXIT

# Define fixtures and collect data
fixtures=(
  "vite-app|Vite 7 + Rollup"
  "vite-rolldown|Vite 8 + Rolldown"
  "rspack-app|Rspack Standard"
  "rspack-incremental|Rspack + Incremental"
  "rspack-parallel|Rspack + ParallelLoader"
  "rspack-buildcache|Rspack + Persistent Cache"
  "rspack-optimized|Rspack Optimized"
  "rsbuild-app|Rsbuild Standard"
  "rsbuild-optimized|Rsbuild Optimized"
)

# First pass: collect all data
min_size=999999999
for fixture in "${fixtures[@]}"; do
  IFS='|' read -r dir name <<< "$fixture"
  dist_path="benchmarks/dist/$dir"
  
  if [ -d "$dist_path" ]; then
    total=$(get_size "$dist_path")
    js=$(get_js_size "$dist_path")
    css=$(get_css_size "$dist_path")
    
    echo "$name|$total|$js|$css" >> "$temp_data"
    
    if [ "$total" -lt "$min_size" ] && [ "$total" -gt 0 ]; then
      min_size=$total
    fi
  fi
done

# Initialize JSON output
json_output='{"results":['

# Start markdown table
md_output="# Bundle Size Comparison\n\n"
md_output+="| Bundler | Total Size | JS Size | CSS Size | Relative |\n"
md_output+="|:---|---:|---:|---:|---:|\n"

# Second pass: generate output
first=true
while IFS='|' read -r name total_bytes js_bytes css_bytes; do
  if [ "$total_bytes" -gt 0 ]; then
    total_human=$(format_bytes $total_bytes)
    js_human=$(format_bytes $js_bytes)
    css_human=$(format_bytes $css_bytes)
    
    # Calculate relative size
    relative=$(awk "BEGIN {printf \"%.2f\", $total_bytes/$min_size}")
    
    # Add to JSON
    if [ "$first" = false ]; then
      json_output+=","
    fi
    first=false
    
    json_output+="{\"name\":\"$name\",\"total_bytes\":$total_bytes,\"total_human\":\"$total_human\",\"js_bytes\":$js_bytes,\"js_human\":\"$js_human\",\"css_bytes\":$css_bytes,\"css_human\":\"$css_human\",\"relative\":$relative}"
    
    # Add to markdown
    md_output+="| \`$name\` | $total_human | $js_human | $css_human | ${relative}x |\n"
    
    # Print to console
    echo "✓ $name: $total_human (JS: $js_human, CSS: $css_human) [${relative}x]"
  fi
done < "$temp_data"

# Close JSON
json_output+=']}'

# Write JSON output
echo "$json_output" | python3 -m json.tool > benchmarks/results/bundle-sizes.json 2>/dev/null || echo "$json_output" > benchmarks/results/bundle-sizes.json

# Write markdown output
printf "%b" "$md_output" > benchmarks/results/bundle-sizes.md

echo ""
echo "✅ Bundle size analysis complete!"
echo "Results saved to:"
echo "  - benchmarks/results/bundle-sizes.json"
echo "  - benchmarks/results/bundle-sizes.md"
echo ""
