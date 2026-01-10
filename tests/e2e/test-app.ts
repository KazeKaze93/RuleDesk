import { _electron as electron, type ElectronApplication } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Launches Electron app for E2E testing with a temporary user data directory.
 * This ensures each test run has a clean state (no existing database, settings, etc.)
 * 
 * @returns Object containing the Electron app instance and temp directory path
 */
export async function launchTestApp() {
  // 1. Create a temp directory for userData to ensure a clean state every test
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ruledesk-e2e-'));
  console.log('Created temp userData directory:', tempDir);
  
  // 2. Resolve main entry point
  // electron-vite builds to: out/main/main.cjs
  const mainEntry = path.resolve(__dirname, '../../out/main/main.cjs');
  
  if (!fs.existsSync(mainEntry)) {
    throw new Error(`Main entry point not found: ${mainEntry}. Run 'npm run build' first.`);
  }

  // 3. Launch with custom userData path
  // Determine if we're in headless mode (CI or when HEADLESS is not explicitly set to 'false')
  // Playwright for Electron runs headless by default
  const isHeadless = process.env.CI === 'true' || process.env.HEADLESS !== 'false';
  
  // SECURITY: Only use unsafe flags in test environment
  // These flags are NEVER used in production builds - they're only passed via Playwright's electron.launch()
  // which is exclusively called from test files (tests/e2e/*.spec.ts)
  const isTestEnv = process.env.NODE_ENV === 'test';
  if (!isTestEnv) {
    throw new Error('launchTestApp() can only be called in test environment (NODE_ENV=test)');
  }
  
  const app = await electron.launch({
    args: [
      mainEntry,
      `--user-data-dir=${tempDir}`,
      // Headless mode flags for Electron (Electron doesn't support --headless flag directly)
      // Playwright handles headless mode automatically, but we add stability flags for CI
      // SECURITY WARNING: --no-sandbox is UNSAFE and only used in isolated test environment
      // This code path is NEVER executed in production - only in E2E tests via Playwright
      ...(isHeadless ? [
        '--disable-gpu',
        '--no-sandbox', // ⚠️ UNSAFE: Only for CI/test environment, never in production
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
      ] : []),
    ],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      // Disable hardware acceleration in CI/Headless environments to prevent crashes
      ELECTRON_ENABLE_LOGGING: 'true',
      // Additional headless environment variables for Linux CI
      ...(isHeadless && process.platform === 'linux' ? {
        DISPLAY: process.env.DISPLAY || ':99',
      } : {}),
    },
    timeout: 30000, // Increase timeout for app initialization (DB migrations, etc.)
  });

  return { app, tempDir };
}

/**
 * Cleans up the test app and optionally removes the temporary directory.
 * 
 * @param app - Electron application instance (may be undefined if launch failed)
 * @param tempDir - Temporary directory path (may be undefined if creation failed)
 */
export async function cleanupTestApp(app: ElectronApplication | undefined, _tempDir: string | undefined) {
  if (app) {
    try {
      await app.close();
    } catch (error) {
      console.error('Error closing Electron app:', error);
    }
  }
  
  // Optional: Clean up temp dir (sometimes risky if app holds locks, OS cleans tmp eventually)
  // Uncomment if you want to clean up immediately (may fail if files are locked)
  // if (tempDir && fs.existsSync(tempDir)) {
  //   try {
  //     fs.rmSync(tempDir, { recursive: true, force: true });
  //     console.log('Cleaned up temp directory:', tempDir);
  //   } catch (error) {
  //     console.warn('Failed to clean up temp directory (files may be locked):', error);
  //   }
  // }
}
