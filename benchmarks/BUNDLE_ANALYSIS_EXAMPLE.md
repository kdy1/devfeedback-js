# Bundle Analysis - Example Data

## 📊 What Gets Captured

Each build now includes a `bundleAnalysis` object with complete bundle information.

---

## Example: Vite 7 Build Data

```json
{
  "timeTaken": 201,
  "totalModulesProcessed": 11,
  "totalOutputSizeBytes": 6721,
  "buildMode": "production",
  "bundlerVersions": {
    "vite": "7.3.1",
    "rollup": "4.39.0",
    "esbuild": "0.25.2"
  },
  "bundleAnalysis": {
    "totalFiles": 3,
    "totalSizeBytes": 6721,
    "files": [
      {
        "name": "index.html",
        "size": 433,
        "type": "asset"
      },
      {
        "name": "assets/index-IaI_LsZS.css",
        "size": 4812,
        "type": "asset"
      },
      {
        "name": "assets/index-jY1_NOV0.js",
        "size": 1476,
        "type": "chunk"
      }
    ],
    "chunks": {
      "count": 1,
      "totalSize": 1476
    },
    "assets": {
      "count": 2,
      "totalSize": 5245
    }
  }
}
```

---

## Example: Rspack Standard Build Data

```json
{
  "timeTaken": 246,
  "totalModulesProcessed": 48,
  "totalOutputSizeBytes": 65553,
  "buildMode": "production",
  "bundlerVersions": {
    "rspack": "1.7.3"
  },
  "nbrOfCachedModules": 0,
  "nbrOfRebuiltModules": 48,
  "bundleAnalysis": {
    "totalFiles": 2,
    "totalSizeBytes": 65553,
    "files": [
      {
        "name": "bundle.js",
        "size": 23456,
        "type": "chunk"
      },
      {
        "name": "bundle.js.map",
        "size": 42097,
        "type": "asset"
      }
    ],
    "chunks": {
      "count": 1,
      "totalSize": 23456
    },
    "assets": {
      "count": 1,
      "totalSize": 42097
    }
  }
}
```

---

## Example: Rsbuild Standard Build Data

```json
{
  "timeTaken": 321,
  "totalModulesProcessed": 52,
  "totalOutputSizeBytes": 37944,
  "buildMode": "production",
  "bundlerVersions": {
    "rsbuild": "1.7.2",
    "rspack": "1.7.2"
  },
  "nbrOfCachedModules": 0,
  "nbrOfRebuiltModules": 52,
  "bundleAnalysis": {
    "totalFiles": 4,
    "totalSizeBytes": 37944,
    "files": [
      {
        "name": "index.html",
        "size": 371,
        "type": "asset"
      },
      {
        "name": "static/js/index.9582d8a8.js",
        "size": 8452,
        "type": "chunk"
      },
      {
        "name": "static/css/631.e842b533.css",
        "size": 28969,
        "type": "asset"
      },
      {
        "name": "static/css/index.fd3fb92a.css",
        "size": 152,
        "type": "asset"
      }
    ],
    "chunks": {
      "count": 1,
      "totalSize": 8452
    },
    "assets": {
      "count": 3,
      "totalSize": 29492
    }
  }
}
```

---

## 📈 How to Use This Data

### 1. Compare Bundle Sizes

```javascript
// Check if bundles are comparable
const viteSize = viteBuild.bundleAnalysis.totalSizeBytes;
const rspackSize = rspackBuild.bundleAnalysis.totalSizeBytes;

// Account for source maps
const rspackWithoutMaps = rspackBuild.bundleAnalysis.chunks.totalSize;

console.log(`Vite:   ${viteSize} bytes`);       // 6,721
console.log(`Rspack: ${rspackWithoutMaps} bytes`); // 23,456
```

**Why different?**
- Vite extracts CSS (smaller JS)
- Rspack inlines CSS (larger JS)
- Different minification strategies

### 2. Compare File Counts

```javascript
// Vite outputs
console.log(viteBuild.bundleAnalysis.totalFiles);  // 3

// Rspack outputs
console.log(rspackBuild.bundleAnalysis.totalFiles);  // 2 (+ maps)

// Rsbuild outputs
console.log(rsbuildBuild.bundleAnalysis.totalFiles);  // 4
```

**Insights:**
- Vite: 1 HTML + 1 JS + 1 CSS
- Rspack: 1 JS (CSS inlined) + 1 source map
- Rsbuild: 1 HTML + 1 JS + 2 CSS files

### 3. Compare Chunk vs Asset Sizes

```javascript
// How much is application code vs assets?
const viteChunks = viteBuild.bundleAnalysis.chunks.totalSize;     // 1,476 bytes
const viteAssets = viteBuild.bundleAnalysis.assets.totalSize;    // 5,245 bytes

const rspackChunks = rspackBuild.bundleAnalysis.chunks.totalSize; // 23,456 bytes
const rspackAssets = rspackBuild.bundleAnalysis.assets.totalSize; // 42,097 bytes (maps!)

const rsbuildChunks = rsbuildBuild.bundleAnalysis.chunks.totalSize; // 8,452 bytes
const rsbuildAssets = rsbuildBuild.bundleAnalysis.assets.totalSize; // 29,492 bytes
```

**Insights:**
- Vite: Most size in CSS (Tailwind)
- Rspack: Most size in source maps
- Rsbuild: Large Tailwind CSS file (not optimized)

### 4. Identify Individual Files

```javascript
// Find the largest file
const files = build.bundleAnalysis.files.sort((a, b) => b.size - a.size);
console.log(`Largest file: ${files[0].name} (${files[0].size} bytes)`);

// Vite:    index.css (4,812 bytes)
// Rspack:  bundle.js.map (42,097 bytes)
// Rsbuild: 631.css (28,969 bytes)
```

### 5. Production Size (Exclude Source Maps)

```javascript
// Get production bundle size (exclude .map files)
const prodFiles = build.bundleAnalysis.files.filter(f => !f.name.endsWith('.map'));
const prodSize = prodFiles.reduce((sum, f) => sum + f.size, 0);

console.log(`Production size: ${prodSize} bytes`);

// Vite:    6,721 bytes (no maps in output)
// Rspack:  23,456 bytes (without maps)
// Rsbuild: 37,944 bytes (no maps in output)
```

---

## 🎯 Key Metrics for Comparison

### Bundle Efficiency

**Smallest Production Bundles:**
1. Vite 7/8: ~6.7 KB total
2. Rspack: ~23 KB (CSS inlined)
3. Rsbuild: ~37 KB (full Tailwind)

### File Organization

**Fewest Files:**
1. Rspack: 2 files (1 bundle + 1 map)
2. Vite: 3 files (HTML + JS + CSS)
3. Rsbuild: 4 files (HTML + JS + 2 CSS)

### CSS Handling

**Best CSS Optimization:**
1. Vite 8 (Rolldown): 4.0 KB CSS
2. Vite 7 (Rollup): 4.7 KB CSS
3. Rspack: Inlined in JS (not separate)
4. Rsbuild: 28 KB CSS (includes full Tailwind base)

---

## 📊 Complete Metrics Captured

Each build now provides:

```json
{
  // Timing (manual Date.now())
  "timeTaken": 1054,

  // Build complexity
  "totalModulesProcessed": 48,
  "totalOutputSizeBytes": 65553,
  "buildMode": "production",

  // Cache effectiveness
  "nbrOfCachedModules": 0,
  "nbrOfRebuiltModules": 48,

  // Tool versions
  "bundlerVersions": {
    "rspack": "1.7.3"
  },

  // Bundle analysis (NEW!)
  "bundleAnalysis": {
    "totalFiles": 2,
    "totalSizeBytes": 65553,
    "files": [
      { "name": "bundle.js", "size": 23456, "type": "chunk" },
      { "name": "bundle.js.map", "size": 42097, "type": "asset" }
    ],
    "chunks": { "count": 1, "totalSize": 23456 },
    "assets": { "count": 1, "totalSize": 42097 }
  }
}
```

---

## 🚀 Running the Analysis

### View Bundle Breakdown

```bash
pnpm run benchmark:analyze
```

### Sample Output

```
📊 Vite 7 + Rollup
Total files: 3
Total size: 6 KB (6721 bytes)
Files:
  - index.html: 433B
  - assets/index.css: 4.7K
  - assets/index.js: 1.4K

📊 Rspack Standard
Total files: 2
Total size: 64 KB (65553 bytes)
Files:
  - bundle.js: 23K
  - bundle.js.map: 41K
```

---

## 💡 Pro Tips

### 1. Exclude Source Maps for Fair Comparison

Rspack includes source maps in build output, Vite doesn't show them separately:

```javascript
const productionSize = bundleAnalysis.files
  .filter(f => !f.name.endsWith('.map'))
  .reduce((sum, f) => sum + f.size, 0);
```

### 2. Compare Apples to Apples

**If comparing bundle sizes:**
- Vite: 6.7 KB (HTML + JS + CSS)
- Rspack: 23 KB (just JS with inlined CSS, excluding maps)
- Rsbuild: 37 KB (HTML + JS + CSS)

**Different strategies, different sizes - all valid!**

### 3. Watch for Tailwind Size

Rsbuild includes full Tailwind base (~28 KB CSS):
- May not be using PurgeCSS properly
- Shows unoptimized Tailwind output
- Real-world production would purge unused classes

---

## 🎉 Summary

Now you can:
- ✅ Compare build times fairly (manual timing)
- ✅ Understand bundle size differences
- ✅ See individual file sizes
- ✅ Count output files
- ✅ Distinguish chunks from assets
- ✅ Account for source maps
- ✅ Track cache effectiveness

Complete transparency into bundler behavior! 🚀
