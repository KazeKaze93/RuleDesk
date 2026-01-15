import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

/**
 * Vitest Configuration for Electron Main Process Testing
 * 
 * Architecture: Separates E2E (Playwright) from Unit/Integration (Vitest)
 * 
 * CRITICAL: Tests run in Node.js environment, but better-sqlite3 must be
 * rebuilt for Electron ABI. Use `npm run db:rebuild` after installing dependencies.
 * 
 * For native modules to work correctly:
 * 1. Ensure better-sqlite3 is in dependencies (not devDependencies)
 * 2. Run `npm run db:rebuild` to rebuild for Electron ABI
 * 3. Tests use Node.js environment but native modules are Electron-compatible
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Architecture strictness: separate E2E (Playwright) from Unit/Integration (Vitest)
    include: ['tests/unit/**/*.{test,spec}.ts', 'tests/integration/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**', 'tests/e2e/**'],
    
    // Node environment for Main Process testing (native modules work here)
    globals: true,
    environment: 'node',
    
    // Timeout adjustment for Electron startup overhead and native module loading
    testTimeout: 15000,
    hookTimeout: 15000,
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/out/**', '**/dist/**'],
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
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
