import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { RspackBuildStatsPlugin } from '../../../packages/rspack-plugin/dist/index.js';
import { SwcJsMinimizerRspackPlugin, LightningCssMinimizerRspackPlugin } from '@rspack/core';
import type { Configuration } from '@rspack/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: Configuration = {
  mode: 'production',
  entry: path.resolve(__dirname, '../test-app/src/index.tsx'),
  output: {
    path: path.resolve(__dirname, '../../dist/rspack-app'),
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
  optimization: {
    moduleIds: 'deterministic',
    usedExports: true,
    sideEffects: true,
    minimize: true,
    minimizer: [
      new SwcJsMinimizerRspackPlugin({
        minimizerOptions: {
          compress: {
            drop_console: false,
            drop_debugger: true,
            pure_funcs: [],
            passes: 2,
          },
          mangle: true,
          format: {
            comments: false,
          },
        },
      }),
      new LightningCssMinimizerRspackPlugin({
        minimizerOptions: {
          errorRecovery: true,
        },
      }),
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {},
              target: 'es2020',
              minify: {
                compress: {},
                mangle: true,
              },
            },
          },
        },
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
    new RspackBuildStatsPlugin({ customIdentifier: 'benchmark-rspack-standard' }),
  ],
};

export default config;
