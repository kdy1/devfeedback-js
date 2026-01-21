#!/bin/bash

# Analyze bundle sizes across all configurations

set -e

echo "📦 BUNDLE SIZE ANALYSIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to analyze a build output
analyze_bundle() {
  local name=$1
  local path=$2

  if [ ! -d "$path" ]; then
    echo "⚠️  $name: Directory not found"
    return
  fi

  echo "📊 $name"
  echo "────────────────────────────────────────────────────"

  # Count files
  local file_count=$(find "$path" -type f | wc -l | tr -d ' ')
  echo "Total files: $file_count"

  # Calculate total size
  local total_size=$(find "$path" -type f -exec ls -l {} \; | awk '{sum += $5} END {print sum}')
  local total_kb=$((total_size / 1024))
  echo "Total size: ${total_kb} KB (${total_size} bytes)"

  # List individual files
  echo ""
  echo "Individual files:"
  find "$path" -type f | while read file; do
    local size=$(ls -lh "$file" | awk '{print $5}')
    local rel_path=$(echo "$file" | sed "s|$path/||")
    echo "  - $rel_path: $size"
  done

  # Breakdown by type
  local js_count=$(find "$path" -type f -name "*.js" -o -name "*.mjs" | wc -l | tr -d ' ')
  local css_count=$(find "$path" -type f -name "*.css" | wc -l | tr -d ' ')
  local other_count=$((file_count - js_count - css_count))

  echo ""
  echo "Breakdown:"
  echo "  - JavaScript files: $js_count"
  echo "  - CSS files: $css_count"
  echo "  - Other files (HTML, maps, etc): $other_count"
  echo ""
}

# Make sure we're in the project root
cd "$(dirname "$0")/../.."

# Check if dist directory exists
if [ ! -d "benchmarks/dist" ]; then
  echo "❌ No dist directory found. Run builds first:"
  echo "   pnpm build"
  exit 1
fi

# Analyze each configuration
analyze_bundle "Vite 7 + Rollup" "benchmarks/dist/vite-app"
analyze_bundle "Vite 8 + Rolldown" "benchmarks/dist/vite-rolldown"
analyze_bundle "Rspack Standard" "benchmarks/dist/rspack-app"
analyze_bundle "Rspack + Incremental" "benchmarks/dist/rspack-incremental"
analyze_bundle "Rspack + ParallelLoader" "benchmarks/dist/rspack-parallel"
analyze_bundle "Rspack + Persistent Cache" "benchmarks/dist/rspack-buildcache"
analyze_bundle "Rspack Optimized" "benchmarks/dist/rspack-optimized"
analyze_bundle "Rsbuild Standard" "benchmarks/dist/rsbuild-app"
analyze_bundle "Rsbuild Optimized" "benchmarks/dist/rsbuild-optimized"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Analysis complete!"
echo ""
echo "Note: Bundle sizes include source maps. For production comparison,"
echo "exclude .map files from the analysis."
echo ""
