# Build Failure Root Cause Analysis
The Cloudflare Pages CI/CD pipeline was secretly failing due to a combination of corrupted dependencies, broken package exports from `better-auth`, and a syntax error in the post-build script.

### 1. `defu` Package Corruption
The first blocker was an empty (0-byte) file in the `defu` package (`node_modules/defu/dist/defu.mjs`). This caused Nitro/Vite to fail immediately when resolving config defaults.
**Fix**: Ran a hard `pnpm store prune` and `pnpm install --force` to flush the corrupted file from the local virtual store and redownload the proper artifact.

### 2. `@better-auth` Broken Exports Map
Once `defu` was restored, `orderking-customers` failed on multiple unresolved exports related to `better-auth@1.7.6`:
- `kyselyAdapter` (imported in `orderking-customers`) attempted to load `@better-auth/core/db/adapter`, but the `better-auth/core` `package.json` resolves this path to a non-existent or incorrectly bundled file.
- `@better-auth/telemetry` crashed the Rolldown step because it couldn't resolve `@better-auth/utils/base64` and `@better-auth/core/env`.
*Note*: `orderking-riders` built successfully because it didn't utilize the `kyselyAdapter`, thus successfully tree-shaking the faulty telemetry and adapter dependencies.
**Fix**: 
- Replaced `kyselyAdapter` in `orderking-customers/src/lib/auth/server.ts` to directly use the connection pool, identical to how `orderking-riders` functions.
- Created a Vite alias pointing `@better-auth/telemetry` to an empty mock file (`scripts/empty.mjs`) providing dummy `createTelemetry` and `getTelemetryAuthConfig` exports to satisfy the bundler without crashing.

### 3. Post-Build Script Syntax Error
After the bundler successfully completed, the build failed right before the finish line due to a syntax error (an orphaned `}`) in `scripts/copy-to-dist.mjs`.
**Fix**: Fixed the syntax in `copy-to-dist.mjs`.

The local simulation of the CI/CD environment is now 100% successful for both apps.
