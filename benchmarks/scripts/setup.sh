#!/bin/bash

# Setup script to install dependencies for all benchmark fixtures

set -e

echo "🔧 Setting up benchmark fixtures..."
echo ""

# Function to note fixture setup (no longer needed since workspace handles it)
check_fixture() {
  local fixture_name=$1
  local fixture_path="benchmarks/fixtures/$fixture_name"

  if [ -d "$fixture_path" ]; then
    echo "✅ $fixture_name configured"
  fi
}

# Make sure we're in the project root
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from project root"
  exit 1
fi

# Install all workspace dependencies
echo "Installing workspace dependencies..."
pnpm install
echo ""

# Build the plugins
echo "Building plugins..."
pnpm build
echo ""

# Install dependencies for each fixture
check_fixture "vite-app"
check_fixture "vite-rolldown"
check_fixture "rspack-app"
check_fixture "rspack-incremental"
check_fixture "rspack-parallel"
check_fixture "rspack-buildcache"
check_fixture "rspack-optimized"
check_fixture "rsbuild-app"
check_fixture "rsbuild-optimized"

# Create results directory
mkdir -p benchmarks/results

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Run benchmarks: ./benchmarks/scripts/run-hyperfine.sh"
echo "2. View results: cat benchmarks/results/*.md"
echo ""
