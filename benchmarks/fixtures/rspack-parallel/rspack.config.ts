import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { RspackBuildStatsPlugin } from '../../../packages/rspack-plugin/dist/index.js';
import type { Configuration } from '@rspack/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: Configuration = {
  mode: 'production',
  entry: path.resolve(__dirname, '../test-app/src/index.tsx'),
  output: {
    path: path.resolve(__dirname, '../../dist/rspack-parallel'),
    filename: 'bundle.js',
    clean: true,
    module: true,
    chunkFormat: 'module',
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
    css: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    parser: {
      javascript: {
        parallelLoader: true,
      },
    },
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, '../test-app/postcss.config.cjs'),
              },
            },
          },
        ],
        type: 'css',
      },
    ],
  },
  plugins: [
    new RspackBuildStatsPlugin({ customIdentifier: 'benchmark-rspack-parallel' }),
  ],
};

export default config;
