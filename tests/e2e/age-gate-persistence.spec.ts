import { test, expect } from '@playwright/test';
import { _electron as electron, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { waitForWindow } from './utils/window-helpers';
import { waitForAppReady } from './utils/app-ready';
import {
  isAccountGateVisible,
  isAgeGateVisible,
  isMainAppShellVisible,
} from './utils/onboarding';

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

async function getFirstWindowPage(app: Awaited<ReturnType<typeof launchAppWithUserData>>): Promise<Page> {
  await new Promise(resolve => setTimeout(resolve, 5000));

  const timeout = process.env.CI === 'true' ? 60000 : 30000;
  try {
    return await app.firstWindow({ timeout });
  } catch (error) {
    console.warn('firstWindow failed, using retry helper...', error);
    return waitForWindow(app, timeout);
  }
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
    const app = await launchAppWithUserData(userDataDir);
    
    try {
      const page = await getFirstWindowPage(app);
      await waitForAppReady(page, 30000);

      const ageCheckbox = page.locator('#age-confirm');
      await expect(ageCheckbox).toBeVisible({ timeout: 10000 });
      console.log('[E2E] Age Gate is visible on first launch (expected)');
    } finally {
      await app.close();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  test('should NOT show Age Gate on second launch after confirmation', async () => {
    let app = await launchAppWithUserData(userDataDir);
    
    try {
      const page = await getFirstWindowPage(app);
      await waitForAppReady(page, 30000);

      if (await isAgeGateVisible(page)) {
        console.log('[E2E] Age Gate detected. Confirming...');

        await page.locator('#age-confirm').check();
        await page.locator('#tos-accept').check();

        const confirmButton = page.getByRole('button', { name: /enter ruledesk/i });
        await expect(confirmButton).toBeEnabled({ timeout: 3000 });
        await confirmButton.click();

        await expect(page.locator('#age-confirm')).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        console.log('[E2E] Age Gate confirmed successfully');
      }
    } finally {
      await app.close();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    app = await launchAppWithUserData(userDataDir);
    
    try {
      const page = await getFirstWindowPage(app);
      await waitForAppReady(page, 30000);

      await Promise.race([
        page.getByRole('heading', { name: /sign in to ruledesk/i }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
        page.getByRole('link', { name: /^artists$/i }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
        page.locator('#api-key').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      ]);

      expect(await isAgeGateVisible(page)).toBe(false);
      console.log('[E2E] Age Gate is NOT visible on second launch (expected - persistence works!)');

      const isAccountGate = await isAccountGateVisible(page);
      const isMainApp = await isMainAppShellVisible(page);

      expect(isMainApp || isAccountGate).toBe(true);
      console.log('[E2E] App navigated past Age Gate correctly');
    } finally {
      await app.close();
    }
  });
});
