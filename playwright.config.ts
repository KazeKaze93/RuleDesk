import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

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
  },
  
  // Global setup: ensure app is built before tests
  globalSetup: './tests/e2e/global-setup.ts',
});
