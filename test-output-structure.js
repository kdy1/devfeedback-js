/**
 * Test script to demonstrate the structure of data sent by each plugin
 * This shows the improved metrics for fair comparison between Vite and Rspack
 */

const { getCommonMetadata } = require('./packages/common/dist/index.cjs');

console.log('='.repeat(80));
console.log('DATA STRUCTURE COMPARISON - Updated Plugins');
console.log('='.repeat(80));
console.log('');

// Simulate Vite build data
console.log('📦 VITE BUILD DATA:');
console.log('-'.repeat(80));
const viteBuildData = {
  ...getCommonMetadata(2345, 'build', {
    totalModulesProcessed: 150,
    totalOutputSizeBytes: 524288, // 512 KB
    buildMode: 'production',
    bundlerVersions: {
      vite: '5.4.14',
      rollup: '4.39.0',
      esbuild: '0.24.0'
    }
  }),
  type: 'vite',
  viteVersion: '4.39.0',
  bundleStats: {
    bootstrapChunkSizeBytes: 102400, // 100 KB
    bootstrapChunkSizeLimitBytes: 512000 // 500 KB
  },
  file: null,
  nbrOfCachedModules: 0,
  nbrOfRebuiltModules: 150
};

console.log(JSON.stringify(viteBuildData, null, 2));
console.log('');

// Simulate Rspack build data
console.log('📦 RSPACK/RSBUILD BUILD DATA:');
console.log('-'.repeat(80));
const rspackBuildData = {
  ...getCommonMetadata(1823, 'build', {
    totalModulesProcessed: 150,
    totalOutputSizeBytes: 524288, // 512 KB (same as Vite for comparison)
    buildMode: 'production',
    bundlerVersions: {
      rspack: '1.2.3',
      rsbuild: '1.2.3'
    }
  }),
  type: 'rspack',
  compilationHash: 'abc123def456',
  toolVersion: '1.2.3',
  nbrOfCachedModules: 120,
  nbrOfRebuiltModules: 30,
  devFeedback: [
    { type: 'compileDone', elapsedMs: 1823 }
  ]
};

console.log(JSON.stringify(rspackBuildData, null, 2));
console.log('');

console.log('='.repeat(80));
console.log('KEY IMPROVEMENTS FOR FAIR COMPARISON:');
console.log('='.repeat(80));
console.log('');
console.log('✅ Timing Method:');
console.log('   - Both now use manual Date.now() timing (not stats.startTime/endTime)');
console.log('   - Measures identical lifecycle phases');
console.log('');
console.log('✅ Build Complexity Metrics:');
console.log('   - totalModulesProcessed: Number of modules built/cached');
console.log('   - totalOutputSizeBytes: Total bundle size (all chunks)');
console.log('   - buildMode: development vs production');
console.log('');
console.log('✅ Cache Effectiveness:');
console.log('   - nbrOfCachedModules: Modules loaded from cache');
console.log('   - nbrOfRebuiltModules: Modules rebuilt from source');
console.log('   - Vite: All modules counted as "rebuilt" (different caching model)');
console.log('   - Rspack: Shows actual cache hits/misses');
console.log('');
console.log('✅ Tool Versions:');
console.log('   - bundlerVersions: Records versions of vite, rollup, esbuild, rspack, etc.');
console.log('   - Helps identify version-specific performance differences');
console.log('');
console.log('='.repeat(80));
console.log('ANALYSIS TIPS:');
console.log('='.repeat(80));
console.log('');
console.log('When comparing builds, ensure:');
console.log('1. Same totalModulesProcessed (similar project size)');
console.log('2. Same buildMode (dev vs prod have very different characteristics)');
console.log('3. Compare cache ratios (Rspack cache hits should speed up rebuilds)');
console.log('4. Same totalOutputSizeBytes (larger bundles take longer)');
console.log('5. Check bundlerVersions for differences in tooling');
console.log('');
console.log('Example comparison:');
console.log('- Vite: 2345ms, 150 modules, 512KB output, production mode');
console.log('- Rspack: 1823ms, 150 modules (120 cached, 30 rebuilt), 512KB output, production mode');
console.log('- Fair comparison: Both measured same way, same complexity, Rspack faster due to caching');
console.log('');
