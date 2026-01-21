# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "rspack: command not found" or "vite: command not found"

**Symptom:**
```bash
Error: Command terminated with non-zero exit code: 1
sh: rspack: command not found
```

**Cause:** Dependencies not installed in fixture directories.

**Solution:**
```bash
# Re-run setup with proper flags
cd /Users/zackarychapple/code/devfeedback-js
./benchmarks/scripts/setup.sh

# Or manually install for a specific fixture
cd benchmarks/fixtures/rspack-app
pnpm install --ignore-workspace
```

### Issue: Builds failing due to "ENOTFOUND compilation-metrics"

**Symptom:**
```bash
getaddrinfo ENOTFOUND compilation-metrics
Your build stats has not been sent. See logs in devfeedback.log for more info.
```

**Status:** This is expected behavior and NOT an error!

**Explanation:**
- The devfeedback plugins try to send metrics to an endpoint
- The endpoint doesn't exist in the benchmark environment
- The error is caught and logged to `devfeedback.log`
- The build still succeeds with exit code 0
- Hyperfine correctly measures the build time

**No action needed** - this is by design for benchmarking.

### Issue: Workspace dependency conflicts

**Symptom:**
```bash
Scope: all 6 workspace projects
# But rspack/vite not actually installed
```

**Cause:** pnpm treating benchmark fixtures as workspace packages.

**Solution:** Already fixed in setup script with `--ignore-workspace` flag.

### Issue: hyperfine not found

**Symptom:**
```bash
hyperfine: command not found
```

**Solution:**
```bash
# macOS
brew install hyperfine

# Linux with cargo
cargo install hyperfine

# Or download from: https://github.com/sharkdp/hyperfine
```

### Issue: Inconsistent benchmark results

**Symptom:** Wide variance in timing results across runs.

**Solutions:**
1. Close other resource-intensive applications
2. Ensure your system isn't thermal throttling
3. Increase the number of runs:
   ```bash
   hyperfine --runs 20 [commands]
   ```
4. Ensure caches are cleared for cold builds:
   ```bash
   ./benchmarks/scripts/clear-cache.sh
   ```

### Issue: "Cannot find module" errors in builds

**Symptom:**
```bash
Error: Cannot find module '../../../packages/vite-plugin/dist/index.js'
```

**Cause:** Plugins not built.

**Solution:**
```bash
cd /Users/zackarychapple/code/devfeedback-js
pnpm build
./benchmarks/scripts/setup.sh
```

### Issue: Benchmark fixtures have stale dependencies

**Solution:**
```bash
# Clean install all fixtures
cd benchmarks/fixtures/vite-app && rm -rf node_modules pnpm-lock.yaml && pnpm install --ignore-workspace
cd ../rspack-app && rm -rf node_modules pnpm-lock.yaml && pnpm install --ignore-workspace
cd ../rspack-incremental && rm -rf node_modules pnpm-lock.yaml && pnpm install --ignore-workspace
cd ../rspack-parallel && rm -rf node_modules pnpm-lock.yaml && pnpm install --ignore-workspace
cd ../rspack-optimized && rm -rf node_modules pnpm-lock.yaml && pnpm install --ignore-workspace
cd ../../..

# Or just re-run setup
./benchmarks/scripts/setup.sh
```

## Verifying Setup

Run this command to verify all builds work:

```bash
cd /Users/zackarychapple/code/devfeedback-js

echo "Testing all builds..."
cd benchmarks/fixtures/vite-app && pnpm build && echo "✅ Vite OK"
cd ../rspack-app && pnpm build && echo "✅ Rspack standard OK"
cd ../rspack-incremental && pnpm build && echo "✅ Rspack incremental OK"
cd ../rspack-parallel && pnpm build && echo "✅ Rspack parallel OK"
cd ../rspack-optimized && pnpm build && echo "✅ Rspack optimized OK"
cd ../../..
```

Expected output:
```
✅ Vite OK
✅ Rspack standard OK
✅ Rspack incremental OK
✅ Rspack parallel OK
✅ Rspack optimized OK
```

## Quick Test

Run a quick 3-iteration benchmark to verify everything works:

```bash
cd /Users/zackarychapple/code/devfeedback-js

hyperfine \
  --warmup 1 \
  --runs 3 \
  'cd benchmarks/fixtures/vite-app && pnpm build' \
  'cd benchmarks/fixtures/rspack-app && pnpm build'
```

Expected: Should complete without errors and show comparative timing.

## Getting Help

If you're still stuck:

1. Check all builds work individually (see "Verifying Setup" above)
2. Ensure hyperfine is installed: `hyperfine --version`
3. Check the error logs: `cat benchmarks/fixtures/*/devfeedback.log`
4. Re-run full setup: `./benchmarks/scripts/setup.sh`
