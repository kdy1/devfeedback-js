import { defineConfig } from 'vite';
import { viteBuildStatsPlugin } from '../../../packages/vite-plugin/dist/index.js';

export default defineConfig({
  root: '../test-app/src',
  build: {
    outDir: '../../../dist/vite-app',
    emptyOutDir: true,
  },
  css: {
    postcss: '../test-app/postcss.config.cjs',
  },
  plugins: [
    viteBuildStatsPlugin('benchmark-vite'),
  ],
});
