/* eslint-disable @typescript-eslint/no-explicit-any */
import { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import { createServer } from 'node:http';
import { getCommonMetadata, sendBuildData } from 'agoda-devfeedback-common';
import type { RspackBuildData, DevFeedbackEvent, BundleAnalysis, BundleFileInfo } from 'agoda-devfeedback-common';
import { Rspack, rspack } from '@rsbuild/core';

export const RsbuildBuildStatsPlugin: RsbuildPlugin = {
  name: 'RsbuildBuildStatsPlugin',
  async setup(api: RsbuildPluginAPI) {
    const customIdentifier = process.env.npm_lifecycle_event;
    let devFeedbackBuffer: DevFeedbackEvent[] = [];
    let buildStartTime = 0;

    // Retrieve the Rsbuild core version from the context
    const rspackVersion = api.context.version;

    // Start a tiny HTTP + WebSocket server for dev feedback
    const httpServer = createServer();
    const wsServer = new WebSocketServer({ server: httpServer });

    httpServer.listen(0, () => {
      const port = (httpServer.address() as any)?.port;
      console.log(`[DevFeedback] WebSocket server on port ${port}`);
    });

    wsServer.on('connection', (socket) => {
      socket.on('message', (rawMsg: string) => {
        handleIncomingWebSocketMessage(rawMsg);
      });
    });

    // Hook into the build start (production)
    api.onBeforeBuild(() => {
      buildStartTime = Date.now();
      devFeedbackBuffer = [];
    });

    // Hook into the build end (production)
    api.onAfterBuild(async (params) => {
      const { stats } = params;
      if (!stats) {
        console.warn('[RsbuildBuildStatsPlugin] Warning: Stats object is undefined.');
        return;
      }
      await processStats(stats);
    });

    // Hook into the dev server start
    api.onBeforeStartDevServer(() => {
      console.log('[RsbuildBuildStatsPlugin] Development server is starting...');
      buildStartTime = Date.now();
      devFeedbackBuffer = [];
    });

    // Hook into the dev server compile done
    api.onDevCompileDone(async (params) => {
      const { stats } = params;
      if (!stats) {
        console.warn('[RsbuildBuildStatsPlugin] Warning: Stats object is undefined.');
        return;
      }
      await processStats(stats);
    });

    // Hook into the close build phase for cleanup
    api.onCloseBuild(() => {
      wsServer.close();
      httpServer.close();
    });

    // Shared function to process stats
    async function processStats(stats: Rspack.Stats | Rspack.MultiStats) {
      const buildEndTime = Date.now();
      recordEvent(stats, { type: 'compileDone' });

      // Calculate timeTaken using manual timing
      const timeTaken = buildStartTime > 0 ? buildEndTime - buildStartTime : -1;

      // Collect build stats
      const modulesCount = getModulesCount(stats);
      const statsJson = stats instanceof rspack.MultiStats
        ? (stats.stats[0]?.toJson({ all: false, assets: true }) ?? { assets: [] })
        : stats.toJson({ all: false, assets: true });

      const totalOutputSizeBytes = statsJson.assets?.reduce((sum, asset) => sum + (asset.size || 0), 0) || 0;
      const totalModulesProcessed = modulesCount.cached + modulesCount.rebuilt;

      const bundlerVersions: Record<string, string> = {};
      if (rspackVersion) {
        bundlerVersions.rsbuild = rspackVersion;
        bundlerVersions.rspack = rspackVersion; // rsbuild uses rspack under the hood
      }

      // Create bundle analysis
      const bundleFiles: BundleFileInfo[] = (statsJson.assets || []).map(asset => ({
        name: asset.name || 'unknown',
        size: asset.size || 0,
        type: asset.name?.endsWith('.js') || asset.name?.endsWith('.mjs') ? 'chunk' : 'asset',
      }));

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

      const buildStats: RspackBuildData = {
        ...getCommonMetadata(timeTaken, customIdentifier, {
          totalModulesProcessed,
          totalOutputSizeBytes,
          buildMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
          bundlerVersions,
          bundleAnalysis,
        }),
        type: 'rsbuild',
        compilationHash: getHash(stats),
        toolVersion: rspackVersion, // Use the version from api.context.version
        nbrOfCachedModules: modulesCount.cached,
        nbrOfRebuiltModules: modulesCount.rebuilt,
        devFeedback: devFeedbackBuffer,
      };

      // Send everything to your existing endpoint
      sendBuildData(buildStats);
    }

    // Helper function to record events
    function recordEvent(
      stats: Rspack.Stats | Rspack.MultiStats,
      partial: Omit<DevFeedbackEvent, 'elapsedMs'>,
    ) {
      const now = Date.now();
      const elapsedMs = buildStartTime > 0 ? now - buildStartTime : 0;
      const fileNormalized = partial.file ? normalizePath(partial.file) : undefined;

      devFeedbackBuffer.push({
        ...partial,
        file: fileNormalized,
        elapsedMs,
      });
    }

    // Handle incoming WebSocket messages
    function handleIncomingWebSocketMessage(rawMsg: string) {
      try {
        const parsed = JSON.parse(rawMsg) as DevFeedbackEvent;
        devFeedbackBuffer.push(parsed);
        console.log(
          `[DevFeedback] Client event: ${parsed.type}, elapsedMs=${parsed.elapsedMs}`,
        );
      } catch (err) {
        // Ignore parse errors
        console.error('[DevFeedback] Error parsing incoming WebSocket message:', err);
      }
    }

    // Normalize file paths
    function normalizePath(filePath: string): string {
      return path.relative(process.cwd(), path.normalize(filePath));
    }

    // Extract hash from Stats or MultiStats
    function getHash(stats?: Rspack.Stats | Rspack.MultiStats): string | null {
      if (!stats) return null;
      if (stats instanceof rspack.MultiStats) {
        return stats.hash;
      }
      return stats.hash ?? null;
    }

    // Count cached modules
    function getModulesCount(stats?: Rspack.Stats | Rspack.MultiStats): { cached: number, rebuilt: number } {
      const counts = {
        cached: 0,
        rebuilt: 0,
      };
      if (!stats) return counts;
      const allStats = stats instanceof rspack.MultiStats ? stats.stats : [stats];
      allStats.forEach((stats) => {
        stats.toJson().modules?.forEach((module) => {
          if (module.built) {
            counts.rebuilt++;
          } else if (module.cached) {
            counts.cached++;
          }
        });
      });
      return counts;
    }
  },
};
