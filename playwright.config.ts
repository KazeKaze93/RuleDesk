import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 * 
 * This config is set up for Electron E2E testing.
 * 
 * IMPORTANT: Playwright doesn't natively support Electron apps.
 * For Electron testing, we need to:
 * 1. Build the app first: `npm run build`
 * 2. Use a custom launcher that spawns Electron with the built main process
 * 3. Connect to the Electron window via CDP (Chrome DevTools Protocol)
 * 
 * The actual Electron launcher will be implemented in test fixtures.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1, // Electron не любит параллельные запуски
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Headless mode: Playwright for Electron runs headless by default
    // Set to false only if you want to see the Electron window (for debugging)
    headless: process.env.HEADLESS !== 'false',
  },
  
  // Global setup: ensure app is built before tests
  globalSetup: './tests/e2e/global-setup.ts',
});
