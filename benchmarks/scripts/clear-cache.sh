#!/bin/bash

# Clear all build caches for benchmarking
# This ensures cold builds when testing with --prepare in hyperfine

set -e

echo "🧹 Clearing all build caches..."

# Clear Vite cache
if [ -d "benchmarks/fixtures/vite-app/node_modules/.vite" ]; then
  echo "  - Clearing Vite cache..."
  rm -rf benchmarks/fixtures/vite-app/node_modules/.vite
fi

# Clear Vite Rolldown cache
if [ -d "benchmarks/fixtures/vite-rolldown/node_modules/.vite" ]; then
  echo "  - Clearing Vite Rolldown cache..."
  rm -rf benchmarks/fixtures/vite-rolldown/node_modules/.vite
fi

# Clear Rspack standard cache
if [ -d "benchmarks/fixtures/rspack-app/node_modules/.cache" ]; then
  echo "  - Clearing Rspack standard cache..."
  rm -rf benchmarks/fixtures/rspack-app/node_modules/.cache
fi

# Clear Rspack incremental cache
if [ -d "benchmarks/fixtures/rspack-incremental/node_modules/.cache" ]; then
  echo "  - Clearing Rspack incremental cache..."
  rm -rf benchmarks/fixtures/rspack-incremental/node_modules/.cache
fi

# Clear Rspack parallel cache
if [ -d "benchmarks/fixtures/rspack-parallel/node_modules/.cache" ]; then
  echo "  - Clearing Rspack parallel cache..."
  rm -rf benchmarks/fixtures/rspack-parallel/node_modules/.cache
fi

# Clear Rspack buildCache cache
if [ -d "benchmarks/fixtures/rspack-buildcache/node_modules/.cache" ]; then
  echo "  - Clearing Rspack buildCache cache..."
  rm -rf benchmarks/fixtures/rspack-buildcache/node_modules/.cache
fi

# Clear Rspack optimized cache
if [ -d "benchmarks/fixtures/rspack-optimized/node_modules/.cache" ]; then
  echo "  - Clearing Rspack optimized cache..."
  rm -rf benchmarks/fixtures/rspack-optimized/node_modules/.cache
fi

# Clear Rsbuild standard cache
if [ -d "benchmarks/fixtures/rsbuild-app/node_modules/.cache" ]; then
  echo "  - Clearing Rsbuild standard cache..."
  rm -rf benchmarks/fixtures/rsbuild-app/node_modules/.cache
fi

# Clear Rsbuild optimized cache
if [ -d "benchmarks/fixtures/rsbuild-optimized/node_modules/.cache" ]; then
  echo "  - Clearing Rsbuild optimized cache..."
  rm -rf benchmarks/fixtures/rsbuild-optimized/node_modules/.cache
fi

# Clear all dist directories
echo "  - Clearing dist directories..."
rm -rf benchmarks/dist/*

echo "✅ All caches cleared!"
