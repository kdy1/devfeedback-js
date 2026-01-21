# Fair Comparison Improvements: Vite vs Rspack

This document outlines the improvements made to ensure apples-to-apples comparisons between Vite and Rspack build metrics.

## Problem Statement

The original implementation showed Rspack as artificially slow because:
1. **Different timing methods**: Rspack used `stats.startTime/endTime` while Vite used manual `Date.now()` timing
2. **Missing context**: No information about build complexity (module count, output size)
3. **Incomplete cache metrics**: Vite didn't track cache effectiveness like Rspack did
4. **No version tracking**: Tool versions weren't captured, making it hard to identify version-specific issues

## Solutions Implemented

### 1. ✅ Unified Timing Methodology (Priority 1)

**Before:**
- **Vite**: Manual `Date.now()` in `buildStart()` and `buildEnd()` hooks
- **Webpack**: Manual `Date.now()` at compile start
- **Rspack**: Used `stats.startTime` and `stats.endTime` (internal timing)

**After:**
- **All bundlers**: Use manual `Date.now()` timing at comparable lifecycle hooks
- **Rspack/Rsbuild**: Now captures `Date.now()` in `onBeforeBuild`/`compile` hooks
- **Result**: All three measure identical lifecycle phases

**Files Changed:**
- `packages/rspack-plugin/src/lib/rsbuild-stats-plugin.ts` (lines 16, 36-38, 51-54, 76-80, 107-112)
- `packages/rspack-plugin/src/lib/rspack-stats-plugin.ts` (lines 15, 28-30, 41-43, 74-76, 91-95)

---

### 2. ✅ Build Complexity Metrics (Priority 2)

**New Fields Added to All Plugins:**

```typescript
{
  totalModulesProcessed: number,      // Total modules (cached + rebuilt)
  totalOutputSizeBytes: number,       // Combined size of all output assets
  buildMode: 'development' | 'production' | 'unknown'
}
```

**Why This Matters:**
- Projects with more modules naturally take longer to build
- Larger output bundles require more processing time
- Production builds do minification/optimization (slower than dev builds)

**Files Changed:**
- `packages/common/src/lib/types.ts` (lines 22-24)
- `packages/common/src/lib/common.ts` (lines 23-30, 53-55, 58-60)
- `packages/vite-plugin/src/lib/vite-build-stats-plugin.ts` (lines 31-32, 178-198, 210-221)
- `packages/webpack-plugin/src/lib/webpack-build-stats-plugin.ts` (lines 75-89)
- `packages/rspack-plugin/src/lib/rsbuild-stats-plugin.ts` (lines 88-99)
- `packages/rspack-plugin/src/lib/rspack-stats-plugin.ts` (lines 77-89)

---

### 3. ✅ Cache Effectiveness Tracking (Priority 4)

**Before:**
- **Vite**: No cache metrics ❌
- **Webpack**: ✅ `nbrOfCachedModules`, `nbrOfRebuiltModules`
- **Rspack**: ✅ `nbrOfCachedModules`, `nbrOfRebuiltModules`

**After:**
- **Vite**: Now includes cache fields (set to 0 cached, all rebuilt)
  - Note: Vite uses HTTP/filesystem caching differently than module-level caching
- **All bundlers**: Uniform cache tracking

**Files Changed:**
- `packages/common/src/lib/types.ts` (lines 56-58)
- `packages/vite-plugin/src/lib/vite-build-stats-plugin.ts` (lines 217-218, 108-109)

---

### 4. ✅ Bundler Version Tracking (Bonus)

**New Field:**

```typescript
bundlerVersions?: {
  vite?: string,
  rollup?: string,
  esbuild?: string,
  webpack?: string,
  rspack?: string,
  rsbuild?: string
}
```

**Why This Matters:**
- Different versions have different performance characteristics
- Loader/plugin versions (postcss, babel, etc.) affect build times
- Helps identify if timing differences are version-specific

**Files Changed:**
- `packages/common/src/lib/types.ts` (lines 26-27)
- `packages/common/src/lib/common.ts` (lines 26, 59)
- `packages/vite-plugin/src/lib/vite-build-stats-plugin.ts` (lines 24-42, 204-207)
- `packages/webpack-plugin/src/lib/webpack-build-stats-plugin.ts` (lines 77-80)
- `packages/rspack-plugin/src/lib/rsbuild-stats-plugin.ts` (lines 91-95)
- `packages/rspack-plugin/src/lib/rspack-stats-plugin.ts` (lines 79-82)

---

## Comparison Example

### Same Project, Fair Comparison:

**Vite Build:**
```json
{
  "timeTaken": 2500,
  "totalModulesProcessed": 350,
  "totalOutputSizeBytes": 2048000,
  "buildMode": "production",
  "bundlerVersions": { "vite": "5.4.14", "rollup": "4.39.0", "esbuild": "0.24.0" },
  "nbrOfCachedModules": 0,
  "nbrOfRebuiltModules": 350
}
```

**Rspack Build:**
```json
{
  "timeTaken": 1850,
  "totalModulesProcessed": 350,
  "totalOutputSizeBytes": 2048000,
  "buildMode": "production",
  "bundlerVersions": { "rspack": "1.2.3", "rsbuild": "1.2.3" },
  "nbrOfCachedModules": 280,
  "nbrOfRebuiltModules": 70
}
```

**Analysis:**
- ✅ Same timing methodology (manual Date.now())
- ✅ Same build complexity (350 modules, ~2MB output)
- ✅ Same build mode (production)
- ✅ Rspack faster because 80% cache hit rate (280/350)
- ✅ Version info available for troubleshooting

---

## How to Use This Data

### When Comparing Builds:

1. **Verify Same Complexity:**
   ```
   Build A: 350 modules vs Build B: 1200 modules  ❌ Not comparable
   Build A: 350 modules vs Build B: 350 modules   ✅ Fair comparison
   ```

2. **Verify Same Mode:**
   ```
   Build A: development vs Build B: production  ❌ Not comparable
   Build A: production   vs Build B: production ✅ Fair comparison
   ```

3. **Account for Caching:**
   ```
   Rspack: 1850ms (280 cached, 70 rebuilt) = ~80% cache hit
   Vite:   2500ms (0 cached, 350 rebuilt)  = cold build

   Fair comparison: Compare Vite cold build vs Rspack cold build (all rebuilt)
   ```

4. **Check Version Differences:**
   ```
   If Vite 5.0 is 2500ms but Vite 5.4 is 2000ms → version matters!
   Check bundlerVersions to identify this
   ```

---

## Summary

These improvements ensure that:
- ✅ Timing is measured consistently across all bundlers
- ✅ Build complexity is quantified (module count, output size, mode)
- ✅ Cache effectiveness is tracked uniformly
- ✅ Tool versions are captured for version-specific analysis

**Result:** Fair, apples-to-apples comparisons between Vite and Rspack builds.
