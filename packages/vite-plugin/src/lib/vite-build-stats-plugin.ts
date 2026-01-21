import { type Plugin, ViteDevServer } from 'vite';
import { NormalizedOutputOptions, OutputBundle } from 'rollup';
import { Blob } from 'node:buffer';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'http';

import type { ViteBuildData, ViteBundleStats, BundleAnalysis, BundleFileInfo } from 'agoda-devfeedback-common';
import { getCommonMetadata, sendBuildData } from 'agoda-devfeedback-common';

interface TimingEntry {
  file: string;
  changeDetectedAt: number;
}

interface ClientMessage {
  file: string;
  clientTimestamp: number;
}

export interface ViteTimingPlugin extends Plugin {
  _TEST_getChangeMap?: () => Map<string, TimingEntry>;
}

function getToolVersions(): Record<string, string> {
  const versions: Record<string, string> = {};

  try {
    // Try to get Vite version - use dynamic require for ESM compatibility
    const vitePackage = require('vite/package.json');
    versions.vite = vitePackage.version || 'unknown';
  } catch {
    // Vite version not available
  }

  try {
    // Try to get esbuild version
    const esbuildPackage = require('esbuild/package.json');
    versions.esbuild = esbuildPackage.version || 'unknown';
  } catch {
    // esbuild version not available
  }

  return versions;
}

export function viteBuildStatsPlugin(
  customIdentifier: string | undefined = process.env.npm_lifecycle_event,
  bootstrapBundleSizeLimitKb?: number,
): ViteTimingPlugin {
  let buildStart: number;
  let buildEnd: number;
  let bootstrapChunkSizeBytes: number | undefined = undefined;
  let rollupVersion: string | undefined = undefined;
  let totalModulesProcessed = 0;
  let totalOutputSizeBytes = 0;
  const bundleFiles: BundleFileInfo[] = [];
  const changeMap = new Map<string, TimingEntry>();

  const normalizePath = (filePath: string): string => {
    return filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  };

  const clientScript = {
    virtualHmrModule: `
      import { createHotContext as __vite__createHotContext } from '/@vite/client';
      const hot = __vite__createHotContext('/@vite-timing/hmr');
      if (hot) {
        hot.on('vite:afterUpdate', (data) => {
          if (Array.isArray(data.updates)) {
            data.updates.forEach(update => {
              if (update.path) {
                const endTime = Date.now();
                fetch('/__vite_timing_hmr_complete', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Silent': 'true' 
                  },
                  body: JSON.stringify({ 
                    file: update.path,
                    clientTimestamp: endTime 
                  })
                }).catch(err => console.error('[vite-timing] Failed to send metrics:', err));
              }
            });
          }
        });
      }
    `,
  };

  const plugin: ViteTimingPlugin = {
    name: 'vite-plugin-agoda-build-reporter',

    configureServer(server: ViteDevServer) {
      server.watcher.on('change', (file: string) => {
        const timestamp = Date.now();
        const relativePath = normalizePath(path.relative(process.cwd(), file));

        changeMap.set(relativePath, {
          file: relativePath,
          changeDetectedAt: timestamp,
        });
      });

      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next) => {
        if (req.url === '/__vite_timing_hmr_complete') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { file, clientTimestamp } = JSON.parse(body) as ClientMessage;
              const normalizedFile = normalizePath(file);

              const entry = changeMap.get(normalizedFile);
              if (entry) {
                const totalTime = clientTimestamp - entry.changeDetectedAt;

                const metricsData: ViteBuildData = {
                  ...getCommonMetadata(totalTime, customIdentifier, {
                    totalModulesProcessed: 0, // Not tracked for HMR
                    totalOutputSizeBytes: 0, // Not tracked for HMR
                    buildMode: 'development', // HMR is always development
                  }),
                  type: 'vitehmr',
                  viteVersion: rollupVersion ?? null,
                  bundleStats: {
                    bootstrapChunkSizeBytes: undefined,
                    bootstrapChunkSizeLimitBytes: undefined,
                  },
                  file: entry.file,
                  nbrOfCachedModules: 0, // Not tracked for HMR
                  nbrOfRebuiltModules: 1, // Typically 1 file changed for HMR
                };

                await sendBuildData(metricsData);
                changeMap.delete(normalizedFile);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    reason: 'No timing entry found for file',
                    file: normalizedFile,
                    availableFiles: Array.from(changeMap.keys()),
                  }),
                );
              }
            } catch (err) {
              console.error('[vite-timing] Error processing timing data:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  error: err instanceof Error ? err.message : 'Unknown error',
                }),
              );
            }
          });
        } else {
          next();
        }
      });
    },

    resolveId(id: string) {
      if (id === '/@vite-timing/hmr') {
        return id;
      }
      return null;
    },

    load(id: string) {
      if (id === '/@vite-timing/hmr') {
        return clientScript.virtualHmrModule;
      }
      return null;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformIndexHtml(html: string, ctx?: { [key: string]: any }) {
      if (!ctx || ctx.command !== 'build') {
        return html.replace(
          '</head>',
          `<script type="module" src="/@vite-timing/hmr"></script></head>`,
        );
      }
      return html;
    },

    buildStart() {
      buildStart = Date.now();
      rollupVersion = this.meta.rollupVersion;
    },

    buildEnd() {
      buildEnd = Date.now();
    },

    generateBundle(outputOptions: NormalizedOutputOptions, outputBundle: OutputBundle) {
      try {
        totalOutputSizeBytes = 0;
        totalModulesProcessed = 0;
        bundleFiles.length = 0; // Clear previous data

        for (const [fileName, bundle] of Object.entries(outputBundle)) {
          if (bundle.type === 'chunk') {
            const size = new Blob([bundle.code]).size;

            // Calculate total output size
            totalOutputSizeBytes += size;

            // Track individual file
            bundleFiles.push({
              name: fileName,
              size: size,
              type: 'chunk',
            });

            // Count modules
            if (bundle.modules) {
              totalModulesProcessed += Object.keys(bundle.modules).length;
            }

            // Track bootstrap chunk specifically
            if (bundle.name === 'bootstrap') {
              bootstrapChunkSizeBytes = size;
            }
          } else if (bundle.type === 'asset') {
            const size = typeof bundle.source === 'string'
              ? bundle.source.length
              : bundle.source.byteLength;

            // Include asset sizes
            totalOutputSizeBytes += size;

            // Track individual file
            bundleFiles.push({
              name: fileName,
              size: size,
              type: 'asset',
            });
          }
        }
      } catch (err) {
        console.warn('Failed to measure bundle statistics because of error', err);
      }
    },

    closeBundle: async function () {
      const bundleStats: ViteBundleStats = {
        bootstrapChunkSizeBytes: bootstrapChunkSizeBytes,
        bootstrapChunkSizeLimitBytes:
          bootstrapBundleSizeLimitKb != null
            ? bootstrapBundleSizeLimitKb * 1000
            : undefined,
      };

      const toolVersions = getToolVersions();
      if (rollupVersion) {
        toolVersions.rollup = rollupVersion;
      }

      // Create bundle analysis
      const chunks = bundleFiles.filter(f => f.type === 'chunk');
      const assets = bundleFiles.filter(f => f.type === 'asset');

      const bundleAnalysis: BundleAnalysis = {
        totalFiles: bundleFiles.length,
        totalSizeBytes: totalOutputSizeBytes,
        files: bundleFiles,
        chunks: {
          count: chunks.length,
          totalSize: chunks.reduce((sum, f) => sum + f.size, 0),
        },
        assets: {
          count: assets.length,
          totalSize: assets.reduce((sum, f) => sum + f.size, 0),
        },
      };

      const buildStats: ViteBuildData = {
        ...getCommonMetadata(buildEnd - buildStart, customIdentifier, {
          totalModulesProcessed,
          totalOutputSizeBytes,
          buildMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
          bundlerVersions: toolVersions,
          bundleAnalysis,
        }),
        type: 'vite',
        viteVersion: rollupVersion ?? null,
        bundleStats,
        file: null,
        // Vite doesn't expose cache statistics in the same way, so we set these to 0
        // In practice, Vite's caching is handled differently (HTTP cache, filesystem cache)
        nbrOfCachedModules: 0,
        nbrOfRebuiltModules: totalModulesProcessed,
      };

      await sendBuildData(buildStats);
    },
  };

  if (process.env.NODE_ENV === 'test') {
    plugin._TEST_getChangeMap = () => changeMap;
  }

  return plugin;
}
