# Benchmark Guide: Vite vs Rspack Performance Testing

## 📖 Overview

This guide explains how to run fair performance benchmarks comparing Vite and Rspack bundlers using hyperfine, with special attention to:
- Cold builds (no cache)
- Warm builds (with cache)
- Rspack `experiments.incremental` feature
- Rspack `module.parser.javascript.parallelLoader` option

## 🎯 Test Configurations

### 1. Vite (Baseline)
Standard Vite configuration with our devfeedback plugin.

**Config Location**: `benchmarks/fixtures/vite-app/vite.config.js`

### 2. Rspack Standard (Baseline)
Standard Rspack configuration without optimizations.

**Config Location**: `benchmarks/fixtures/rspack-app/rspack.config.js`

### 3. Rspack + Incremental
Tests the `experiments.incremental` feature:
```js
experiments: {
  incremental: true
}
```

**What it does**: Enables incremental compilation where only changed modules are recompiled.

**Expected benefit**: Faster warm builds (20-30% improvement expected).

**Config Location**: `benchmarks/fixtures/rspack-incremental/rspack.config.js`

**Documentation**: https://rspack.rs/config/experiments#experimentsincremental

### 4. Rspack + ParallelLoader
Tests the `parallelLoader` feature:
```js
module: {
  parser: {
    javascript: {
      parallelLoader: true
    }
  }
}
```

**What it does**: Processes JavaScript modules in parallel.

**Expected benefit**: Better CPU utilization, faster builds on multi-core systems.

**Config Location**: `benchmarks/fixtures/rspack-parallel/rspack.config.js`

### 5. Rspack Optimized
Combines both optimizations for maximum performance:
```js
experiments: {
  incremental: true
},
module: {
  parser: {
    javascript: {
      parallelLoader: true
    }
  }
}
```

**Config Location**: `benchmarks/fixtures/rspack-optimized/rspack.config.js`

## 🚀 Running Benchmarks

### Step 1: Setup (First Time)

```bash
# From project root
pnpm run benchmark:setup
```

This will:
1. Build all devfeedback plugins
2. Install dependencies for all test fixtures
3. Create results directory

### Step 2: Run Benchmarks

Choose one of these commands:

```bash
# Run all benchmarks (cold + warm)
pnpm run benchmark:run

# Run only cold builds (no cache)
pnpm run benchmark:cold

# Run only warm builds (with cache)
pnpm run benchmark:warm
```

### Step 3: View Results

```bash
# View cold build results
cat benchmarks/results/cold-builds.md

# View warm build results
cat benchmarks/results/warm-builds.md
```

## 📊 Interpreting Results

### Cold Build Example

```
Benchmark 1: Vite (cold)
  Time (mean ± σ):      2.345 s ±  0.123 s

Benchmark 2: Rspack Standard (cold)
  Time (mean ± σ):      1.823 s ±  0.089 s

Benchmark 3: Rspack + Incremental (cold)
  Time (mean ± σ):      1.798 s ±  0.076 s

Benchmark 4: Rspack + ParallelLoader (cold)
  Time (mean ± σ):      1.756 s ±  0.082 s

Benchmark 5: Rspack Optimized (cold)
  Time (mean ± σ):      1.712 s ±  0.071 s

Summary
  'Rspack Optimized (cold)' ran
    1.37 ± 0.09 times faster than 'Vite (cold)'
```

**Analysis**:
- Rspack is ~27% faster than Vite on cold builds
- `incremental` provides minimal benefit on cold builds (expected)
- `parallelLoader` provides ~4% improvement on cold builds
- Combined optimizations provide ~6% improvement on cold builds

### Warm Build Example

**Process:**
1. Pre-build all projects once to populate caches
2. Run 1 warmup iteration per command (cache intact)
3. Run 10 measured iterations per command (cache intact)

```
Benchmark 1: Vite (warm)
  Time (mean ± σ):      1.234 s ±  0.067 s

Benchmark 2: Rspack Standard (warm)
  Time (mean ± σ):      0.945 s ±  0.045 s

Benchmark 3: Rspack + Incremental (warm)
  Time (mean ± σ):      0.678 s ±  0.034 s

Benchmark 4: Rspack + ParallelLoader (warm)
  Time (mean ± σ):      0.723 s ±  0.038 s

Benchmark 5: Rspack Optimized (warm)
  Time (mean ± σ):      0.512 s ±  0.029 s

Summary
  'Rspack Optimized (warm)' ran
    2.41 ± 0.18 times faster than 'Vite (warm)'
```

**Analysis**:
- Rspack with optimizations is ~59% faster than Vite on warm builds
- `incremental` provides ~28% improvement on warm builds (major benefit)
- `parallelLoader` provides ~23% improvement on warm builds
- Combined optimizations provide ~46% improvement on warm builds

## 🔍 Cache Behavior

### Cold Builds (No Cache)

**Before each run**:
- Clears `node_modules/.vite` (Vite)
- Clears `node_modules/.cache` (Rspack)
- Clears all `dist/` directories

**Simulates**:
- CI/CD pipeline builds
- First build after git clone
- Build after major dependency changes

### Warm Builds (With Cache)

**Before benchmark suite**:
- Pre-builds all projects once to populate caches
- Cache remains populated during ALL benchmark runs
- No `--prepare` flag used (caches are NOT cleared between runs)

**During benchmark**:
- 1 warmup run per command (with cache)
- 10 measured runs per command (with cache)
- Cache is preserved across all iterations

**Simulates**:
- Local development rebuilds
- Incremental changes during development
- Typical developer experience with hot caches

## 📈 Expected Performance Characteristics

### Vite
- **Cold builds**: Slower (more module processing)
- **Warm builds**: Fast (HTTP cache + esbuild)
- **Cache model**: HTTP/filesystem cache
- **Strengths**: Great HMR, dev experience

### Rspack Standard
- **Cold builds**: Faster than Vite
- **Warm builds**: Faster than Vite
- **Cache model**: Module-level cache
- **Strengths**: Rust performance, webpack compatible

### Rspack + Incremental
- **Cold builds**: Minimal improvement
- **Warm builds**: Significant improvement (20-30%)
- **How it helps**: Only recompiles changed modules
- **Best for**: Development with frequent changes

### Rspack + ParallelLoader
- **Cold builds**: Moderate improvement (5-10%)
- **Warm builds**: Moderate improvement (10-20%)
- **How it helps**: Parallel module processing
- **Best for**: Multi-core systems, large projects

### Rspack Optimized (Both)
- **Cold builds**: Best Rspack performance
- **Warm builds**: Best overall performance
- **How it helps**: Combines both optimizations
- **Best for**: Production builds + development

## 🧪 Data Collection

Each build collects these metrics via our devfeedback plugins:

```json
{
  "timeTaken": 1712,
  "totalModulesProcessed": 150,
  "totalOutputSizeBytes": 524288,
  "buildMode": "production",
  "bundlerVersions": {
    "rspack": "1.2.3"
  },
  "nbrOfCachedModules": 120,
  "nbrOfRebuiltModules": 30
}
```

This ensures:
- ✅ Fair timing (manual Date.now())
- ✅ Build complexity context
- ✅ Cache effectiveness tracking
- ✅ Version information

## 🔧 Advanced Usage

### Run Custom Benchmarks

```bash
# Run hyperfine manually with custom options
hyperfine \
  --warmup 5 \
  --runs 20 \
  --prepare './benchmarks/scripts/clear-cache.sh' \
  'cd benchmarks/fixtures/vite-app && pnpm build' \
  'cd benchmarks/fixtures/rspack-optimized && pnpm build'
```

### Compare Specific Configurations

```bash
# Just Vite vs Rspack Optimized
hyperfine \
  --warmup 3 \
  --runs 15 \
  'cd benchmarks/fixtures/vite-app && pnpm build' \
  'cd benchmarks/fixtures/rspack-optimized && pnpm build'
```

### Export Different Formats

```bash
# Export to CSV
hyperfine \
  --export-csv results.csv \
  'cd benchmarks/fixtures/vite-app && pnpm build'

# Export to multiple formats
hyperfine \
  --export-json results.json \
  --export-markdown results.md \
  --export-csv results.csv \
  'cd benchmarks/fixtures/vite-app && pnpm build'
```

## 📝 Best Practices

1. **Run multiple times**: Hyperfine runs each benchmark 10 times by default
2. **Stable environment**: Close other applications during benchmarks
3. **Consistent state**: Use the cache clearing scripts for cold builds
4. **Version tracking**: Check `bundlerVersions` in results
5. **Context matters**: Compare builds with similar `totalModulesProcessed`

## 🐛 Troubleshooting

### Issue: "hyperfine: command not found"

**Solution**:
```bash
# macOS
brew install hyperfine

# Linux with cargo
cargo install hyperfine
```

### Issue: Build failures

**Solution**:
```bash
# Rebuild plugins
pnpm build

# Re-run setup
pnpm run benchmark:setup
```

### Issue: Inconsistent results

**Solution**:
```bash
# Clear all caches
pnpm run benchmark:clear

# Re-run benchmarks
pnpm run benchmark:run
```

### Issue: "Cannot find module" errors

**Solution**:
```bash
# Ensure plugins are built
pnpm build

# Reinstall fixture dependencies
cd benchmarks/fixtures/vite-app && pnpm install
cd ../rspack-app && pnpm install
# ... etc
```

## 🔗 Related Resources

- [Benchmark README](./README.md)
- [Comparison Improvements](../COMPARISON_IMPROVEMENTS.md)
- [Rspack Experiments Documentation](https://rspack.rs/config/experiments)
- [Hyperfine Documentation](https://github.com/sharkdp/hyperfine)
