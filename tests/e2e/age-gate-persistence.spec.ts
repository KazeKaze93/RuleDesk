import { test, expect } from '@playwright/test';
import { _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Launches Electron app with a specific user data directory (for persistence testing)
 */
async function launchAppWithUserData(userDataDir: string) {
  const mainEntry = path.resolve(__dirname, '../../out/main/main.cjs');
  
  if (!fs.existsSync(mainEntry)) {
    throw new Error(`Main entry point not found: ${mainEntry}. Run 'npm run build' first.`);
  }

  // Determine if we're in headless mode (CI or when HEADLESS is not explicitly set to 'false')
  const isHeadless = process.env.CI === 'true' || process.env.HEADLESS !== 'false';

  const app = await electron.launch({
    args: [
      mainEntry,
      `--user-data-dir=${userDataDir}`,
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
      NODE_ENV: 'test',
      ELECTRON_ENABLE_LOGGING: 'true',
      // Additional headless environment variables for Linux CI
      ...(isHeadless && process.platform === 'linux' ? {
        DISPLAY: process.env.DISPLAY || ':99',
      } : {}),
    },
    timeout: 30000,
  });

  return app;
}

test.describe('Age Gate Persistence', () => {
  let userDataDir: string;

  test.beforeAll(() => {
    // Create a persistent temp directory for this test suite
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ruledesk-agegate-persistence-'));
    console.log('Created persistent userData directory:', userDataDir);
  });

  test.afterAll(() => {
    // Clean up the persistent directory after all tests
    if (userDataDir && fs.existsSync(userDataDir)) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        console.log('Cleaned up persistent userData directory:', userDataDir);
      } catch (error) {
        console.warn('Failed to clean up userData directory (files may be locked):', error);
      }
    }
  });

  test('should show Age Gate on first launch', async () => {
    // First launch: Age Gate should be visible
    const app = await launchAppWithUserData(userDataDir);
    
    try {
      // Wait for app to initialize (database migrations, etc.)
      // Give it more time in CI/headless mode
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the first window (with increased timeout for CI)
      // In headless mode, windows may take longer to appear
      const timeout = process.env.CI === 'true' ? 60000 : 30000;
      let page;
      try {
        page = await app.firstWindow({ timeout });
      } catch (error) {
        // If firstWindow fails, try waiting for window event
        console.warn('firstWindow failed, waiting for window event...', error);
        await app.waitForEvent('window', { timeout });
        const windows = app.windows();
        if (windows.length === 0) {
          throw new Error('No windows available after waiting. App may have failed to initialize.');
        }
        page = windows[0];
      }
      
      // Wait a moment for window to initialize (app may show loading window first)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if window is still open
      if (page.isClosed()) {
        const windows = app.windows();
        if (windows.length === 0) {
          throw new Error('No windows available. App may have closed immediately.');
        }
        page = windows[0];
        if (page.isClosed()) {
          throw new Error('All windows are closed');
        }
      }
      
      await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
      
      // Wait a bit more for app to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if Age Gate is visible
      const ageGateTitle = page.getByText('Age Verification & Terms');
      const ageCheckbox = page.locator('#age-confirm');
      
      const isAgeGateVisible = await ageGateTitle.isVisible().catch(() => false) || 
                               await ageCheckbox.isVisible().catch(() => false);
      
      expect(isAgeGateVisible).toBe(true);
      console.log('[E2E] Age Gate is visible on first launch (expected)');
    } finally {
      await app.close();
      // Wait for app to fully close
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  test('should NOT show Age Gate on second launch after confirmation', async () => {
    // Step 1: First launch - confirm Age Gate
    let app = await launchAppWithUserData(userDataDir);
    
    try {
      // Wait for app to initialize (database migrations, etc.)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the first window (with increased timeout for CI)
      const timeout = process.env.CI === 'true' ? 60000 : 30000;
      let page;
      try {
        page = await app.firstWindow({ timeout });
      } catch (error) {
        console.warn('firstWindow failed, waiting for window event...', error);
        await app.waitForEvent('window', { timeout });
        const windows = app.windows();
        if (windows.length === 0) {
          throw new Error('No windows available after waiting. App may have failed to initialize.');
        }
        page = windows[0];
      }
      
      // Wait a moment for window to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if window is still open
      if (page.isClosed()) {
        const windows = app.windows();
        if (windows.length === 0) {
          throw new Error('No windows available. App may have closed immediately.');
        }
        page = windows[0];
        if (page.isClosed()) {
          throw new Error('All windows are closed');
        }
      }
      
      await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
      
      // Wait a bit for app to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Confirm Age Gate
      const ageGateTitle = page.getByText('Age Verification & Terms');
      const ageCheckbox = page.locator('#age-confirm');
      
      const isAgeGateVisible = await ageGateTitle.isVisible().catch(() => false) || 
                               await ageCheckbox.isVisible().catch(() => false);
      
      if (isAgeGateVisible) {
        console.log('[E2E] Age Gate detected. Confirming...');
        
        // Check the checkboxes
        await ageCheckbox.check();
        const tosCheckbox = page.locator('#tos-accept');
        await tosCheckbox.check();
        
        // Click confirm button
        const confirmButton = page.getByRole('button', { name: /enter ruleDesk|enter|confirm|continue/i });
        await expect(confirmButton).toBeEnabled({ timeout: 3000 });
        await confirmButton.click();
        
        // Wait for Age Gate to disappear
        await expect(ageGateTitle).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
        
        console.log('[E2E] Age Gate confirmed successfully');
      }
    } finally {
      await app.close();
      // Wait a bit for app to fully close and release file locks
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Step 2: Second launch - Age Gate should NOT be visible
    app = await launchAppWithUserData(userDataDir);
    
    try {
      // Wait for app to initialize (database migrations, etc.)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the first window (with increased timeout for CI)
      const timeout = process.env.CI === 'true' ? 60000 : 30000;
      let page;
      try {
        page = await app.firstWindow({ timeout });
      } catch (error) {
        console.warn('firstWindow failed, waiting for window event...', error);
        await app.waitForEvent('window', { timeout });
        const windows = app.windows();
        if (windows.length === 0) {
          throw new Error('No windows available after waiting. App may have failed to initialize.');
        }
        page = windows[0];
      }
      
      // Wait a moment for window to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if window is still open
      if (page.isClosed()) {
        const windows = app.windows();
        if (windows.length === 0) {
          throw new Error('No windows available. App may have closed immediately.');
        }
        page = windows[0];
        if (page.isClosed()) {
          throw new Error('All windows are closed');
        }
      }
      
      await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
      
      // Wait a bit for app to initialize and check settings
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if Age Gate is visible (it should NOT be)
      const ageGateTitle = page.getByText('Age Verification & Terms');
      const ageCheckbox = page.locator('#age-confirm');
      
      const isAgeGateVisible = await ageGateTitle.isVisible({ timeout: 2000 }).catch(() => false) || 
                               await ageCheckbox.isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(isAgeGateVisible).toBe(false);
      console.log('[E2E] Age Gate is NOT visible on second launch (expected - persistence works!)');
      
      // Verify we're on the main app or onboarding (but NOT Age Gate)
      // Either we see the main app (if auth is configured) or onboarding (if not)
      const mainAppButton = page.getByRole('button', { name: /add source|add artist/i });
      const onboardingInput = page.locator('#user-id-input');
      
      const isMainApp = await mainAppButton.isVisible({ timeout: 2000 }).catch(() => false);
      const isOnboarding = await onboardingInput.isVisible({ timeout: 2000 }).catch(() => false);
      
      // We should be either on main app OR onboarding, but NOT on Age Gate
      expect(isMainApp || isOnboarding).toBe(true);
      console.log('[E2E] App navigated past Age Gate correctly');
    } finally {
      await app.close();
    }
  });
});
