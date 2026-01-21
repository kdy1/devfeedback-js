import { defineConfig } from '@rsbuild/core';
import { RsbuildBuildStatsPlugin } from '../../../packages/rspack-plugin/dist/index.js';

export default defineConfig({
  source: {
    entry: {
      index: '../test-app/src/index.tsx',
    },
  },
  output: {
    distPath: {
      root: '../../dist/rsbuild-app',
    },
    module: true,
  },
  tools: {
    postcss: {
      postcssOptions: {
        config: '../test-app/postcss.config.cjs',
      },
    },
  },
  plugins: [RsbuildBuildStatsPlugin],
});
