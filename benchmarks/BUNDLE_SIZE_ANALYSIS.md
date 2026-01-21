# Bundle Size Analysis - Vite vs Rspack vs Rsbuild

## Current Bundle Sizes (After Initial Optimizations)

| Bundler | Total | JS | CSS | vs Vite |
|---------|-------|-----|-----|---------|
| **Vite 7** | **6.14KB** | 1.46KB | 4.72KB | **1.0x** |
| Rspack (optimized) | 19.67KB | 6.57KB | 13.09KB | 3.2x |
| Rsbuild | 36.69KB | 8.34KB | 28.35KB | 6.0x |

## Key Findings

### 1. JavaScript Bundle Analysis

**Vite** (1,457 bytes):
- ✅ Perfect tree-shaking - removed ALL unused components (Button, Card, Modal, Form, List)
- ✅ Modern ES2020+ output with template literals
- ✅ Minimal polyfills
- ✅ Compact variable names (`const n`, `const o`)

**Rspack** (6,574 bytes - 4.5x larger):
- ❌ **DOES NOT tree-shake unused components** - includes full Button, Card, Modal, Form, List definitions
- ❌ Still using `.concat()` instead of template literals in places  
- ⚠️ Object spread polyfills present
- ⚠️ Less aggressive name mangling

**Problem**: The source code passes unused components as props:
```ts
render(app, {
  ...data,
  Button,  // Never actually called!
  Card,    // Never actually called!
  Modal,   // Never actually called!
  Form,    // Never actually called!
  List,    // Never actually called!
});
```

Vite's tree-shaker correctly identifies these as dead code. Rspack sees them as "used" because they're in the object.

### 2. CSS Bundle Analysis

**Vite** (4,831 bytes):
- ✅ Clean, deduplicated CSS
- ✅ Consolidated vendor prefixes
- ✅ Modern logical properties

**Rspack** (13,094 bytes - 2.7x larger):
- ❌ **Massive duplication** of vendor prefixes
- ❌ Separate rules for `::-webkit-file-upload-button`, `::file-selector-button`, `::-ms-browse`
- ❌ Verbose language-specific padding rules repeated multiple times
- ❌ Includes unused `@layer properties` with custom properties

### 3. Configuration Differences

**Vite's implicit optimizations:**
```js
// Vite defaults (implicit):
build: {
  target: 'modules',  // Modern browsers only
  minify: 'esbuild',  // Very aggressive
  cssMinify: true,    // LightningCSS by default
}
```

**Rspack configuration added:**
```ts
optimization: {
  usedExports: true,      // Enable tree-shaking
  sideEffects: true,      // Respect package.json sideEffects
  minimize: true,
  minimizer: [
    SwcJsMinimizerRspackPlugin,  // JS minification
    LightningCssMinimizerRspackPlugin  // CSS minification
  ]
},
module: {
  rules: [{
    test: /\.tsx?$/,
    use: {
      loader: 'builtin:swc-loader',
      options: {
        jsc: {
          target: 'es2020',  // Modern target
          minify: { compress: {}, mangle: true }
        }
      }
    }
  }]
}
```

## Remaining Issues

### Critical
1. **Tree-shaking limitation**: Rspack cannot detect that object properties are never accessed
2. **CSS duplication**: LightningCSS not deduplicating vendor prefixes as aggressively as Vite

### Solutions Needed
1. **Source code fix**: Remove unused component imports/props
2. **CSS optimization**: May need PostCSS plugins for better deduplication
3. **Consider**: Different CSS processing strategy (cssnano?)

## Recommendations

1. ✅ Applied: Modern JS target (es2020)
2. ✅ Applied: Enable tree-shaking flags
3. ✅ Applied: Aggressive minification
4. ⚠️  **TODO**: Fix source code to not pass unused components
5. ⚠️  **TODO**: Investigate better CSS minification strategy

## Conclusion

Rspack's optimizations brought bundle size from **22.5KB to 19.67KB** (13% improvement), but still **3.2x larger than Vite** due to:
- Unused component code (~4KB)
- CSS duplication (~8KB)

The fundamental issue is that Vite has more aggressive dead code elimination and CSS optimization out of the box.
