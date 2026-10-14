import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

/**
 * Vitest Configuration for Electron Main Process Testing
 *
 * Architecture: Separates E2E (Playwright) from Unit/Integration (Vitest)
 *
 * Path aliases match tsconfig / electron-vite renderer:
 *   `@`  → `src/renderer`
 *   `@shared` → `src/shared`
 * Main/preload test imports use relative `src/main` / `src/preload` paths.
 *
 * Native ABI: Vitest npm scripts use `scripts/with-node-sqlite.mjs`
 * (`db:rebuild:node` → suite → always `db:rebuild` for Electron).
 * Direct `vitest` / `npx vitest` skips that — use `npm test` instead.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Architecture strictness: separate E2E (Playwright) from Unit/Integration (Vitest)
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.ts',
      'tests/property/**/*.{test,spec}.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      'tests/e2e/**',
      // Run via `npm run test:isolated` (separate pool + wall-clock in pre-push).
      'tests/unit/services/video-proxy-server.test.ts',
      'tests/unit/hooks/**',
      'tests/unit/components/**',
      'tests/unit/features/**',
    ],
    
    // Node environment for Main Process testing (native modules work here)
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/vitest-setup-logger.ts'],
    
    // Timeout adjustment for Electron startup overhead and native module loading
    testTimeout: 15000,
    hookTimeout: 15000,
    // Kill stuck workers instead of waiting until the GH step timeout.
    teardownTimeout: 5000,
    pool: "forks",
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/out/**', '**/dist/**'],
    },
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  // Externalize native modules to prevent Vite from bundling them
  // This ensures better-sqlite3 .node files are loaded correctly
  build: {
    rollupOptions: {
      external: ['better-sqlite3'],
    },
  },
});
