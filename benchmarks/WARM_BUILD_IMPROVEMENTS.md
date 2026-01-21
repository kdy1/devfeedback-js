# Warm Build Improvements

## Changes Made

### 1. ✅ Proper Warmup for Warm Builds

**Before:**
- Warmup: 2 runs
- Could potentially still have some "cold start" effects

**After:**
- Warmup: 1 run
- More realistic warm build simulation
- Each command gets exactly 1 warmup + 10 measured runs

### 2. ✅ Cache Preservation Confirmed

**Cold Builds:**
```bash
hyperfine \
  --warmup 1 \
  --runs 10 \
  --prepare './benchmarks/scripts/clear-cache.sh'  # ← Clears cache before EACH run
  [commands...]
```

**Warm Builds:**
```bash
# Pre-build ONCE to populate caches
cd benchmarks/fixtures/vite-app && pnpm build
cd ../rspack-app && pnpm build
# ... etc

hyperfine \
  --warmup 1 \
  --runs 10 \
  # NO --prepare flag! ← Cache remains intact across ALL runs
  [commands...]
```

### 3. ✅ New Rspack Persistent Cache Variant

Added `rspack-buildcache` fixture with Rspack's persistent cache:

```js
{
  experiments: {
    cache: {
      type: 'persistent',
    },
  }
}
```

**What it tests:**
- Rspack's persistent build cache feature
- Should significantly improve warm build performance
- Caches across process restarts

**Expected benefits:**
- Much faster warm builds (30-50% improvement expected)
- Best performance for incremental development

## Test Configurations Summary

| Configuration | Description | Cold Build Expected | Warm Build Expected |
|--------------|-------------|-------------------|-------------------|
| **Vite** | Standard Vite | Baseline | Fast (HTTP cache) |
| **Rspack Standard** | Baseline Rspack | Fast | Fast |
| **Rspack + Incremental** | `experiments.incremental` | Similar to standard | ~20-30% faster |
| **Rspack + ParallelLoader** | `parallelLoader: true` | ~5-10% faster | ~10-20% faster |
| **Rspack + Persistent Cache** | `cache: { type: 'persistent' }` | Similar to standard | ~30-50% faster ⭐ |
| **Rspack Optimized** | incremental + parallelLoader | Best cold | Best warm |

## How Warm Builds Work Now

### Process Flow

```
1. Pre-build Phase (once before benchmark suite):
   ├─ Build vite-app (populates Vite cache)
   ├─ Build rspack-app (populates Rspack cache)
   ├─ Build rspack-incremental (populates cache)
   ├─ Build rspack-parallel (populates cache)
   ├─ Build rspack-buildcache (populates persistent cache)
   └─ Build rspack-optimized (populates cache)

2. Benchmark Phase (for each command):
   ├─ Warmup: 1 run (cache intact)
   └─ Measured: 10 runs (cache intact)

3. NO cache clearing between runs!
```

### Cache States

**Cold Builds:**
```
Run 1: clear cache → build → measure
Run 2: clear cache → build → measure
Run 3: clear cache → build → measure
...
```
Every run starts fresh with empty caches.

**Warm Builds:**
```
Pre-build: build (populate cache)
Run 1: warmup (use cache)
Run 2: measure (use cache)
Run 3: measure (use cache)
...
```
Cache is populated once and reused for all runs.

## Verification

### Test Cache is Working

Run a quick test:

```bash
# Build once to populate cache
cd benchmarks/fixtures/rspack-buildcache
pnpm build

# Time should be fast (cache hit)
time pnpm build

# Clear cache
rm -rf node_modules/.cache

# Time should be slower (cache miss)
time pnpm build
```

### Expected Results

**With cache (warm):**
```
Your build time was 13.00ms.
Rspack compiled successfully in 11 ms
```

**Without cache (cold):**
```
Your build time was 45.00ms.
Rspack compiled successfully in 43 ms
```

Cache should show ~3-4x speedup for this small test app.

## Running the Benchmarks

```bash
# Setup (first time)
pnpm run benchmark:setup

# Run all benchmarks
pnpm run benchmark:run

# Or specific modes
pnpm run benchmark:cold    # Cold builds (cache cleared each run)
pnpm run benchmark:warm    # Warm builds (cache preserved)
```

## Documentation Updated

- ✅ `benchmarks/scripts/run-hyperfine.sh` - Added comments about cache behavior
- ✅ `benchmarks/README.md` - Updated warm build description
- ✅ `benchmarks/BENCHMARK_GUIDE.md` - Clarified warmup and cache handling
- ✅ `benchmarks/scripts/clear-cache.sh` - Added persistent cache clearing
- ✅ `benchmarks/scripts/setup.sh` - Added buildcache fixture

## Key Takeaways

1. **Warm builds now have exactly 1 warmup run** - More realistic
2. **Cache is NEVER cleared during warm builds** - Proper simulation
3. **New persistent cache variant** - Tests Rspack's advanced caching
4. **All builds tested and working** - Ready to benchmark!

## Next Steps

Run the full benchmark suite:

```bash
pnpm run benchmark:run
```

Then compare:
- Cold vs Warm builds (should see significant difference)
- Standard Rspack vs Persistent Cache (should see ~30-50% improvement in warm)
- All variants to find optimal configuration
