#!/bin/bash

# Run hyperfine benchmarks comparing Vite and Rspack with different configurations
# Usage: ./run-hyperfine.sh [--with-cache|--without-cache|--both]

set -e

MODE="${1:---both}"

# Check if hyperfine is installed
if ! command -v hyperfine &> /dev/null; then
  echo "❌ hyperfine is not installed!"
  echo "Install it with: brew install hyperfine (macOS) or cargo install hyperfine"
  exit 1
fi

echo "🚀 Running benchmarks with hyperfine..."
echo "Mode: $MODE"
echo ""

# Function to run cold build benchmarks (no cache)
run_cold_benchmarks() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🥶 COLD BUILD BENCHMARKS (No Cache)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  hyperfine \
    --warmup 1 \
    --runs 10 \
    --prepare './benchmarks/scripts/clear-cache.sh' \
    --export-markdown benchmarks/results/cold-builds.md \
    --export-json benchmarks/results/cold-builds.json \
    --command-name "Vite 7 + Rollup (cold)" \
      'cd benchmarks/fixtures/vite-app && pnpm build' \
    --command-name "Vite 8 + Rolldown (cold)" \
      'cd benchmarks/fixtures/vite-rolldown && pnpm build' \
    --command-name "Rspack Standard (cold)" \
      'cd benchmarks/fixtures/rspack-app && pnpm build' \
    --command-name "Rspack + Incremental (cold)" \
      'cd benchmarks/fixtures/rspack-incremental && pnpm build' \
    --command-name "Rspack + ParallelLoader (cold)" \
      'cd benchmarks/fixtures/rspack-parallel && pnpm build' \
    --command-name "Rspack + Persistent Cache (cold)" \
      'cd benchmarks/fixtures/rspack-buildcache && pnpm build' \
    --command-name "Rspack Optimized (cold)" \
      'cd benchmarks/fixtures/rspack-optimized && pnpm build' \
    --command-name "Rsbuild Standard (cold)" \
      'cd benchmarks/fixtures/rsbuild-app && pnpm build' \
    --command-name "Rsbuild Optimized (cold)" \
      'cd benchmarks/fixtures/rsbuild-optimized && pnpm build'

  echo ""
  echo "✅ Cold build benchmarks complete!"
  echo "Results saved to: benchmarks/results/cold-builds.{md,json}"
  echo ""
}

# Function to run warm build benchmarks (with cache)
run_warm_benchmarks() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔥 WARM BUILD BENCHMARKS (With Cache)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Pre-build all projects ONCE to populate caches before the benchmark suite
  echo "Pre-building all projects once to populate caches..."
  cd benchmarks/fixtures/vite-app && pnpm build > /dev/null 2>&1
  cd ../vite-rolldown && pnpm build > /dev/null 2>&1
  cd ../rspack-app && pnpm build > /dev/null 2>&1
  cd ../rspack-incremental && pnpm build > /dev/null 2>&1
  cd ../rspack-parallel && pnpm build > /dev/null 2>&1
  cd ../rspack-buildcache && pnpm build > /dev/null 2>&1
  cd ../rspack-optimized && pnpm build > /dev/null 2>&1
  cd ../rsbuild-app && pnpm build > /dev/null 2>&1
  cd ../rsbuild-optimized && pnpm build > /dev/null 2>&1
  cd ../../..
  echo "✓ Caches populated for all projects!"
  echo ""

  # IMPORTANT: No --prepare flag here! We want to preserve caches between runs.
  # Each command gets 1 warmup run, then 10 measured runs with cache intact.
  hyperfine \
    --warmup 1 \
    --runs 10 \
    --export-markdown benchmarks/results/warm-builds.md \
    --export-json benchmarks/results/warm-builds.json \
    --command-name "Vite 7 + Rollup (warm)" \
      'cd benchmarks/fixtures/vite-app && pnpm build' \
    --command-name "Vite 8 + Rolldown (warm)" \
      'cd benchmarks/fixtures/vite-rolldown && pnpm build' \
    --command-name "Rspack Standard (warm)" \
      'cd benchmarks/fixtures/rspack-app && pnpm build' \
    --command-name "Rspack + Incremental (warm)" \
      'cd benchmarks/fixtures/rspack-incremental && pnpm build' \
    --command-name "Rspack + ParallelLoader (warm)" \
      'cd benchmarks/fixtures/rspack-parallel && pnpm build' \
    --command-name "Rspack + Persistent Cache (warm)" \
      'cd benchmarks/fixtures/rspack-buildcache && pnpm build' \
    --command-name "Rspack Optimized (warm)" \
      'cd benchmarks/fixtures/rspack-optimized && pnpm build' \
    --command-name "Rsbuild Standard (warm)" \
      'cd benchmarks/fixtures/rsbuild-app && pnpm build' \
    --command-name "Rsbuild Optimized (warm)" \
      'cd benchmarks/fixtures/rsbuild-optimized && pnpm build'

  echo ""
  echo "✅ Warm build benchmarks complete!"
  echo "Results saved to: benchmarks/results/warm-builds.{md,json}"
  echo ""
}

# Create results directory if it doesn't exist
mkdir -p benchmarks/results

# Run benchmarks based on mode
case "$MODE" in
  --without-cache)
    run_cold_benchmarks
    ;;
  --with-cache)
    run_warm_benchmarks
    ;;
  --both)
    run_cold_benchmarks
    run_warm_benchmarks
    ;;
  *)
    echo "❌ Invalid mode: $MODE"
    echo "Usage: $0 [--with-cache|--without-cache|--both]"
    exit 1
    ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Analyzing bundle sizes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./benchmarks/scripts/analyze-bundle-sizes.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All benchmarks complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
