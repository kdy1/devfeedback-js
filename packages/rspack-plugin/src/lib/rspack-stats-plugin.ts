import { Compiler, Stats, StatsCompilation } from '@rspack/core';
import { WebSocketServer, Server as WebSocketServerType } from 'ws';
import path from 'node:path';
import { createServer, Server as HttpServerType } from 'node:http';
import { getCommonMetadata, sendBuildData } from 'agoda-devfeedback-common';
import type { RspackBuildData, DevFeedbackEvent, BundleAnalysis, BundleFileInfo } from 'agoda-devfeedback-common';

class RspackBuildStatsPlugin {
  private customIdentifier: string;
  private devFeedbackBuffer: DevFeedbackEvent[] = [];
  private wsServer: WebSocketServerType;
  private httpServer: HttpServerType;
  private toolVersion: string = '';
  private buildStartTime: number = 0;

  constructor(options: { customIdentifier?: string } = {}) {
    this.customIdentifier =
      options.customIdentifier || process.env.npm_lifecycle_event || '';
    this.httpServer = createServer();
    this.wsServer = new WebSocketServer({ server: this.httpServer });
    this.setupWebSocketServer();
  }

  apply(compiler: Compiler) {
    const pluginName = 'RspackBuildStatsPlugin';

    // Set the toolVersion from the compiler
    this.toolVersion = compiler.rspack?.version || '';
    compiler.hooks.compile.tap(pluginName, () => {
      this.buildStartTime = Date.now();
      this.devFeedbackBuffer = [];
    });

    compiler.hooks.done.tapAsync(pluginName, async (stats, callback) => {
      const statsJson = stats.toJson({
        preset: 'none',
        modules: true,
      });
      this.processStats(stats, statsJson);
      callback();
    });

    compiler.hooks.watchRun.tap(pluginName, () => {
      this.buildStartTime = Date.now();
      this.devFeedbackBuffer = [];
      console.log('[RspackBuildStatsPlugin] Watching for changes...');
    });

    compiler.hooks.failed.tap(pluginName, (error) => {
      console.error('[RspackBuildStatsPlugin] Compilation failed:', error);
    });

    // Cleanup
    compiler.hooks.shutdown.tap(pluginName, () => {
      this.wsServer.close();
      this.httpServer.close();
    });
  }

  private setupWebSocketServer() {
    this.httpServer.listen(0, () => {
      const address = this.httpServer.address();
      const port = typeof address === 'object' ? address?.port : null;
      console.log(`[DevFeedback] WebSocket server on port ${port}`);
    });

    this.wsServer.on('connection', (socket) => {
      socket.on('message', (rawMsg: string) => {
        this.handleIncomingWebSocketMessage(rawMsg);
      });
    });
  }

  private async processStats(stats: Stats, statsJson: StatsCompilation) {
    const buildEndTime = Date.now();
    this.recordEvent(stats, { type: 'compileDone' });

    // Use manual timing for consistency with Vite and Webpack
    const timeTaken = this.buildStartTime > 0 ? buildEndTime - this.buildStartTime : -1;

    const cachedModules = this.getCachedModulesCount(statsJson);
    const rebuiltModules = this.getRebuiltModulesCount(statsJson);
    const totalModulesProcessed = cachedModules + rebuiltModules;
    const totalOutputSizeBytes = statsJson.assets?.reduce((sum, asset) => sum + (asset.size || 0), 0) || 0;

    const bundlerVersions: Record<string, string> = {};
    if (this.toolVersion) {
      bundlerVersions.rspack = this.toolVersion;
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
      ...getCommonMetadata(timeTaken, this.customIdentifier, {
        totalModulesProcessed,
        totalOutputSizeBytes,
        buildMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        bundlerVersions,
        bundleAnalysis,
      }),
      type: 'rspack',
      compilationHash: stats.hash || '',
      toolVersion: this.toolVersion,
      nbrOfCachedModules: cachedModules,
      nbrOfRebuiltModules: rebuiltModules,
      devFeedback: this.devFeedbackBuffer,
    };

    await sendBuildData(buildStats);
  }

  private recordEvent(stats: Stats, partial: Omit<DevFeedbackEvent, 'elapsedMs'>) {
    const now = Date.now();
    const elapsedMs = this.buildStartTime > 0 ? now - this.buildStartTime : 0;
    const fileNormalized = partial.file ? this.normalizePath(partial.file) : undefined;

    this.devFeedbackBuffer.push({
      ...partial,
      file: fileNormalized,
      elapsedMs,
    });
  }

  private handleIncomingWebSocketMessage(rawMsg: string) {
    try {
      const parsed = JSON.parse(rawMsg) as DevFeedbackEvent;
      this.devFeedbackBuffer.push(parsed);
      console.log(
        `[DevFeedback] Client event: ${parsed.type}, elapsedMs=${parsed.elapsedMs}`,
      );
    } catch (err) {
      // Ignore parse errors
      console.error('[DevFeedback] Error parsing incoming message:', err);
    }
  }

  private normalizePath(filePath: string): string {
    return path.relative(process.cwd(), path.normalize(filePath));
  }

  private getCachedModulesCount(stats: StatsCompilation): number {
    return stats.modules?.filter((m) => m.cached).length ?? 0;
  }

  private getRebuiltModulesCount(stats: StatsCompilation): number {
    return stats.modules?.filter((m) => m.built).length ?? 0;
  }
}

export { RspackBuildStatsPlugin };
