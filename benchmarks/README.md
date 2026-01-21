# Benchmark Suite for Vite vs Rspack

This benchmark suite provides fair apples-to-apples comparisons between Vite and Rspack bundlers using `hyperfine`.

## 🎯 What This Measures

- **Cold builds**: Fresh builds with no cache (simulates CI/CD pipelines)
- **Warm builds**: Builds with populated caches (simulates local development)
- **Configuration variants**:
  - Vite (standard)
  - Rspack (standard)
  - Rspack + `experiments.incremental`
  - Rspack + `module.parser.javascript.parallelLoader`
  - Rspack + both optimizations

## 📋 Prerequisites

1. **Install hyperfine**:
   ```bash
   # macOS
   brew install hyperfine

   # Linux
   cargo install hyperfine

   # Or download from: https://github.com/sharkdp/hyperfine
   ```

2. **Build the plugins**:
   ```bash
   pnpm build
   ```

## 🚀 Quick Start

### 1. Setup (First Time Only)

```bash
./benchmarks/scripts/setup.sh
```

This will:
- Build all devfeedback plugins
- Install dependencies for all test fixtures
- Create results directory

### 2. Run Benchmarks

Run all benchmarks (cold + warm):
```bash
./benchmarks/scripts/run-hyperfine.sh
```

Run only cold builds (no cache):
```bash
./benchmarks/scripts/run-hyperfine.sh --without-cache
```

Run only warm builds (with cache):
```bash
./benchmarks/scripts/run-hyperfine.sh --with-cache
```

### 3. View Results

Results are saved in `benchmarks/results/`:

```bash
# View cold build results
cat benchmarks/results/cold-builds.md

# View warm build results
cat benchmarks/results/warm-builds.md
```

## 📊 Understanding the Results

### Cold Build Results

Cold builds clear all caches **before EACH run**:
- **Pre-run**: `--prepare` flag clears all caches before every iteration
- **Vite**: Clears `node_modules/.vite`
- **Rspack**: Clears `node_modules/.cache`
- Every run starts with empty caches

This simulates:
- CI/CD pipeline builds
- First build after cloning a repository
- Build after major dependency changes

### Warm Build Results

Warm builds run with populated caches:
- **Pre-build**: All projects built once to populate caches
- **Warmup**: 1 warmup run per command (cache intact)
- **Measured runs**: 10 runs per command (cache intact)
- **Vite**: Uses HTTP/filesystem cache
- **Rspack**: Uses module-level cache

This simulates:
- Local development rebuilds
- Incremental builds during development
- Typical developer workflow with hot caches

### Configuration Variants

#### Rspack Standard
```js
{
  mode: 'production'
}
```
Baseline Rspack configuration for comparison.

#### Rspack + Incremental
```js
{
  experiments: {
    incremental: true
  }
}
```
Enables incremental compilation. See: https://rspack.rs/config/experiments#experimentsincremental

**Expected impact**: Faster warm builds by only recompiling changed modules.

#### Rspack + ParallelLoader
```js
{
  module: {
    parser: {
      javascript: {
        parallelLoader: true
      }
    }
  }
}
```
Enables parallel loader processing for JavaScript modules.

**Expected impact**: Faster builds by processing modules in parallel.

#### Rspack Optimized
Combines both `incremental` and `parallelLoader` for maximum performance.

## 📁 Directory Structure

```
benchmarks/
├── fixtures/
│   ├── test-app/                # Shared source code
│   │   └── src/
│   │       ├── components/      # 5 component files
│   │       ├── utils/           # Helper utilities
│   │       ├── index.js         # Entry point
│   │       └── index.html       # HTML template
│   ├── vite-app/                # Vite configuration
│   ├── rspack-app/              # Rspack standard
│   ├── rspack-incremental/      # Rspack + incremental
│   ├── rspack-parallel/         # Rspack + parallelLoader
│   └── rspack-optimized/        # Rspack + both
├── scripts/
│   ├── setup.sh                 # Install dependencies
│   ├── run-hyperfine.sh         # Run benchmarks
│   └── clear-cache.sh           # Clear all caches
├── results/                     # Benchmark results
│   ├── cold-builds.md
│   ├── cold-builds.json
│   ├── warm-builds.md
│   └── warm-builds.json
└── README.md                    # This file
```

## 🔍 What Gets Measured

Each build collects the following metrics via our devfeedback plugins:

```json
{
  "timeTaken": 1850,                    // Manual Date.now() timing
  "totalModulesProcessed": 150,         // Total modules (cached + rebuilt)
  "totalOutputSizeBytes": 524288,       // Total bundle size
  "buildMode": "production",            // development vs production
  "bundlerVersions": {                  // Tool versions
    "rspack": "1.2.3"
  },
  "nbrOfCachedModules": 120,           // Modules loaded from cache
  "nbrOfRebuiltModules": 30            // Modules rebuilt from source
}
```

This ensures:
- ✅ Same timing methodology across bundlers
- ✅ Context about build complexity
- ✅ Cache effectiveness tracking
- ✅ Version information for troubleshooting

## 🧪 Example Output

```
Benchmark 1: Vite (cold)
  Time (mean ± σ):      2.345 s ±  0.123 s    [User: 3.456 s, System: 0.789 s]
  Range (min … max):    2.201 s …  2.567 s    10 runs

Benchmark 2: Rspack Standard (cold)
  Time (mean ± σ):      1.823 s ±  0.089 s    [User: 2.567 s, System: 0.456 s]
  Range (min … max):    1.734 s …  1.956 s    10 runs

Benchmark 3: Rspack + Incremental (cold)
  Time (mean ± σ):      1.798 s ±  0.076 s    [User: 2.489 s, System: 0.434 s]
  Range (min … max):    1.712 s …  1.901 s    10 runs

Benchmark 4: Rspack + ParallelLoader (cold)
  Time (mean ± σ):      1.756 s ±  0.082 s    [User: 3.201 s, System: 0.512 s]
  Range (min … max):    1.654 s …  1.876 s    10 runs

Benchmark 5: Rspack Optimized (cold)
  Time (mean ± σ):      1.712 s ±  0.071 s    [User: 3.123 s, System: 0.498 s]
  Range (min … max):    1.623 s …  1.823 s    10 runs

Summary
  'Rspack Optimized (cold)' ran
    1.03 ± 0.06 times faster than 'Rspack + ParallelLoader (cold)'
    1.05 ± 0.06 times faster than 'Rspack + Incremental (cold)'
    1.06 ± 0.06 times faster than 'Rspack Standard (cold)'
    1.37 ± 0.09 times faster than 'Vite (cold)'
```

## 🐛 Troubleshooting

### hyperfine not found
```bash
# Install hyperfine first
brew install hyperfine  # macOS
cargo install hyperfine # Linux
```

### Build failures
```bash
# Rebuild plugins
cd ../..
pnpm build

# Re-run setup
./benchmarks/scripts/setup.sh
```

### Cache not clearing
```bash
# Manually clear caches
./benchmarks/scripts/clear-cache.sh

# Then re-run benchmarks
./benchmarks/scripts/run-hyperfine.sh --without-cache
```

## 📝 Notes

- **Warmup runs**: Hyperfine performs warmup runs to stabilize results
- **Run count**: Each benchmark runs 10 times by default
- **Statistical analysis**: Hyperfine provides mean, standard deviation, and range
- **Fair comparison**: All builds use the same source files and manual timing

## 🔗 Related Documentation

- [Hyperfine Documentation](https://github.com/sharkdp/hyperfine)
- [Rspack Experiments](https://rspack.rs/config/experiments)
- [Comparison Improvements](../COMPARISON_IMPROVEMENTS.md)
