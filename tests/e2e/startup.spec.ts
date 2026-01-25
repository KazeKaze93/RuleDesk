import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { waitForWindow } from './utils/window-helpers';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type { ElectronApplication, Page } from '@playwright/test';

test.describe('Application Startup', () => {
  let app: ElectronApplication | undefined;

  test.beforeAll(async () => {
    // Determine path to the main process entry point
    // electron-vite builds to: out/main/main.cjs
    const mainEntry = path.resolve(__dirname, '../../out/main/main.cjs');
    
    console.log('Launching Electron app from:', mainEntry);
    console.log('File exists:', existsSync(mainEntry));
    
    // Determine if we're in headless mode (CI or when HEADLESS is not explicitly set to 'false')
    const isHeadless = process.env.CI === 'true' || process.env.HEADLESS !== 'false';
    
    // Launch app
    // Note: _electron is experimental API, requires Playwright 1.40+
    // The app uses requestSingleInstanceLock(), which may prevent multiple instances
    // In test mode, we rely on the app's behavior (it should quit if lock fails)
    try {
      app = await electron.launch({
        args: [
          mainEntry,
          // Headless mode flags for Electron (Electron doesn't support --headless flag directly)
          // Playwright handles headless mode automatically, but we add stability flags for CI
          // SECURITY WARNING: --no-sandbox is UNSAFE and only used in isolated test environment
          ...(isHeadless ? [
            '--disable-gpu',
            '--no-sandbox', // ⚠️ UNSAFE: Only for CI/test environment, never in production
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--force-device-scale-factor=1', // Force device scale factor for consistent rendering
            '--enable-logging', // Enable logging for debugging in CI
            '--disable-features=CalculateNativeWinOcclusion', // Disable window occlusion calculation for headless
            '--disable-background-timer-throttling', // Prevent throttling in background
            '--disable-backgrounding-occluded-windows', // Prevent backgrounding occluded windows
            '--disable-renderer-backgrounding', // Prevent renderer backgrounding
          ] : []),
        ],
        env: {
          ...process.env,
          NODE_ENV: 'test', // Tell app it's in test mode
          ELECTRON_ENABLE_LOGGING: 'true',
          // Additional headless environment variables for Linux CI
          ...(isHeadless && process.platform === 'linux' ? {
            DISPLAY: process.env.DISPLAY || ':99',
          } : {}),
        },
        // Increase timeout for app initialization (DB migrations, etc.)
        timeout: 30000,
      });
      console.log('Electron app launched successfully');
    } catch (error) {
      console.error('Failed to launch Electron app:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  test('app window should open and load content', async () => {
    // Wait for window to appear
    // The app may show a loading window first, then main window
    console.log('Waiting for window to appear...');
    
    // Wait for app to initialize (database migrations, etc.)
    // Give it more time in CI/headless mode
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the first window (with increased timeout for CI)
    // In headless mode, windows may take longer to appear
    const timeout = process.env.CI === 'true' ? 60000 : 30000;
    let window: Page;
    try {
      window = await app.firstWindow({ timeout });
    } catch (error) {
      // If firstWindow fails, use retry helper
      console.warn('firstWindow failed, using retry helper...', error);
      window = await waitForWindow(app, timeout);
    }
    console.log('Window obtained');
    
    // Wait for window content to load (replaces setTimeout)
    await window.waitForLoadState('domcontentloaded', { timeout: 20000 });
    
    // Check if window is still open
    if (window.isClosed()) {
      // Try to get another window using retry helper
      window = await waitForWindow(app, timeout);
    }
  });
  
  async function testWindow(window: Page) {
    // Wait for window to be ready
    // The app shows a loading window first, then main window
    try {
      await window.waitForLoadState('domcontentloaded', { timeout: 20000 });
    } catch (error) {
      // If window closed, throw a clearer error
      if (window.isClosed()) {
        throw new Error('Window closed during load state wait');
      }
      // Otherwise, log and continue
      console.log('Load state wait failed, but window is still open:', error);
    }
    
    // Wait for React to hydrate and content to be ready
    try {
      await window.waitForFunction(
        () => document.readyState === 'complete' || document.readyState === 'interactive',
        { timeout: 10000 }
      );
    } catch (error) {
      if (window.isClosed()) {
        throw new Error('Window closed during ready state wait');
      }
      console.log('Ready state wait failed, but window is still open:', error);
    }
    
    // Check title
    // From main.ts line 291: title is set to `RuleDesk v${app.getVersion()}`
    const title = await window.title();
    expect(title).toBeDefined();
    expect(title).toContain('RuleDesk'); // Should contain "RuleDesk"
    
    // Screenshot for debugging (saved to test-results/)
    await window.screenshot({ path: 'test-results/startup.png' });
    
    // Additional check: verify window content is loaded
    const isReady = await window.evaluate(() => {
      return document.readyState === 'complete' || document.readyState === 'interactive';
    });
    expect(isReady).toBe(true);
    
    // Verify window has some content (not blank)
    const bodyText = await window.textContent('body');
    expect(bodyText).toBeTruthy(); // Body should have some content
  }
});
