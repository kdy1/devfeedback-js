# Workspace Setup for Benchmarks

## ✅ What Was Done

The benchmark fixtures have been converted to a proper pnpm workspace with hoisted bundler dependencies.

### 1. Updated pnpm-workspace.yaml

```yaml
packages:
  - "packages/*"
  - "benchmarks/fixtures/*"
```

All benchmark fixtures are now part of the workspace.

### 2. Hoisted Bundler Versions to Root

All bundler dependencies are now managed at the workspace root level:

```json
{
  "devDependencies": {
    "@rsbuild/core": "^1.7.2",
    "@rspack/cli": "^1.7.3",
    "@rspack/core": "^1.7.3",
    "vite": "7.3.1"
  }
}
```

### 3. Version Updates

| Bundler | Previous | Current | Change |
|---------|----------|---------|--------|
| **Vite** | 5.4.14 | **7.3.1** | ⬆️ Major update |
| **@rspack/cli** | 1.2.0 | **1.7.3** | ⬆️ Minor update |
| **@rspack/core** | 1.2.0 | **1.7.3** | ⬆️ Minor update |
| **@rsbuild/core** | ❌ Not used | **1.7.2** | ✅ Added |

### 4. Fixture Package.json Simplified

All fixture `package.json` files now only contain:
- Package name
- Scripts
- **No dependencies** - they use hoisted versions from root

Example:
```json
{
  "name": "vite-benchmark-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "build:clean": "rm -rf ../../../dist/vite-app node_modules/.vite && vite build"
  }
}
```

### 5. Setup Script Updated

The setup script now:
1. Runs `pnpm install` at workspace root (links all fixtures)
2. Builds all plugins
3. Checks fixture configuration
4. Creates results directory

No more per-fixture installations needed!

## 🎯 Benefits

1. **Single Source of Truth**: All bundler versions managed in one place
2. **Faster Installs**: Hoisted dependencies shared across fixtures
3. **Easier Updates**: Update once in root, all fixtures get the update
4. **Reduced Disk Usage**: No duplicate node_modules in each fixture
5. **Version Consistency**: All fixtures use exact same bundler versions

## 🔍 Verification

### Check Dependency Status

```bash
# Check for outdated dependencies
pnpm outdated

# Output: (empty - all up to date!)
```

### Test All Builds

```bash
cd /Users/zackarychapple/code/devfeedback-js

# Test each build
cd benchmarks/fixtures/vite-app && pnpm build
cd ../rspack-app && pnpm build
cd ../rspack-incremental && pnpm build
cd ../rspack-parallel && pnpm build
cd ../rspack-optimized && pnpm build
```

All builds verified working ✅:
- ✅ Vite 7.3.1 build OK
- ✅ Rspack 1.7.3 build OK
- ✅ Rspack incremental 1.7.3 OK
- ✅ Rspack parallel 1.7.3 OK
- ✅ Rspack optimized 1.7.3 OK

## 📦 Workspace Structure

```
devfeedback-js/
├── package.json                      # Root with hoisted dependencies
├── pnpm-workspace.yaml              # Workspace configuration
├── packages/                        # Plugin packages
│   ├── common/
│   ├── vite-plugin/
│   ├── webpack-plugin/
│   └── rspack-plugin/
└── benchmarks/
    └── fixtures/                    # Benchmark fixtures (workspace packages)
        ├── vite-app/
        ├── rspack-app/
        ├── rspack-incremental/
        ├── rspack-parallel/
        └── rspack-optimized/
```

## 🚀 How to Use

### Initial Setup

```bash
# Run once to set up everything
pnpm run benchmark:setup
```

This will:
1. Install all workspace dependencies (including hoisted bundlers)
2. Build all devfeedback plugins
3. Verify fixture configuration

### Running Benchmarks

```bash
# Run all benchmarks
pnpm run benchmark:run

# Or specific modes
pnpm run benchmark:cold    # Cold builds only
pnpm run benchmark:warm    # Warm builds only
```

### Updating Bundler Versions

```bash
# Update all bundlers to latest
pnpm add -D -w vite@latest @rspack/cli@latest @rspack/core@latest @rsbuild/core@latest

# Then test
pnpm run benchmark:setup
pnpm test
```

## 📝 Notes

- All fixtures automatically use hoisted versions from root
- No need to update individual fixture `package.json` files
- `pnpm install` at root handles all workspace linking
- Perfect for consistent benchmarking across all configurations

## 🔗 Related Documentation

- [Benchmark README](./README.md)
- [Quick Start Guide](./QUICK_START.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
