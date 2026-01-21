# Quick Start: Benchmark Suite

## 🚀 3-Step Setup

```bash
# 1. Setup (first time only)
pnpm run benchmark:setup

# 2. Run benchmarks
pnpm run benchmark:run

# 3. View results
cat benchmarks/results/cold-builds.md
cat benchmarks/results/warm-builds.md
```

## 📋 All Commands

```bash
# Setup
pnpm run benchmark:setup       # Install dependencies, build plugins

# Run benchmarks
pnpm run benchmark:run         # Run all (cold + warm)
pnpm run benchmark:cold        # Run cold builds only
pnpm run benchmark:warm        # Run warm builds only

# Utilities
pnpm run benchmark:clear       # Clear all caches
```

## 🧪 What Gets Tested

| Configuration | Description |
|--------------|-------------|
| **Vite** | Standard Vite build |
| **Rspack Standard** | Baseline Rspack build |
| **Rspack + Incremental** | `experiments.incremental: true` |
| **Rspack + ParallelLoader** | `parallelLoader: true` |
| **Rspack Optimized** | Both features enabled |

## 📊 Results Location

```
benchmarks/results/
├── cold-builds.md       # Cold build results
├── cold-builds.json     # Cold build data
├── warm-builds.md       # Warm build results
└── warm-builds.json     # Warm build data
```

## 🔍 Key Metrics

Each build reports:
- `timeTaken` - Build time (manual Date.now())
- `totalModulesProcessed` - Number of modules
- `totalOutputSizeBytes` - Bundle size
- `nbrOfCachedModules` - Cached modules
- `nbrOfRebuiltModules` - Rebuilt modules
- `bundlerVersions` - Tool versions

## 📖 Full Documentation

- [Complete README](./README.md)
- [Detailed Guide](./BENCHMARK_GUIDE.md)
- [Comparison Improvements](../COMPARISON_IMPROVEMENTS.md)
