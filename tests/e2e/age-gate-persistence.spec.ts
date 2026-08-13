import { test, expect } from '@playwright/test';
import { _electron as electron, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { waitForWindow } from './utils/window-helpers';
import { waitForAppReady } from './utils/app-ready';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGE_GATE_CHECKBOX = '#age-confirm';

async function launchAppWithUserData(userDataDir: string) {
  const mainEntry = path.resolve(__dirname, '../../out/main/main.cjs');

  if (!fs.existsSync(mainEntry)) {
    throw new Error(`Main entry point not found: ${mainEntry}. Run 'npm run build' first.`);
  }

  const isHeadless = process.env.CI === 'true' || process.env.HEADLESS !== 'false';

  const app = await electron.launch({
    args: [
      mainEntry,
      `--user-data-dir=${userDataDir}`,
      ...(isHeadless ? [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--force-device-scale-factor=1',
        '--enable-logging',
        '--disable-features=CalculateNativeWinOcclusion',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ] : []),
    ],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ELECTRON_ENABLE_LOGGING: 'true',
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

function createUserDataDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ruledesk-agegate-persistence-'));
}

function removeUserDataDir(userDataDir: string): void {
  if (!fs.existsSync(userDataDir)) {
    return;
  }
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to clean up userData directory (files may be locked):', error);
  }
}

test.describe('Age Gate Persistence', () => {
  test('should show Age Gate on first launch', async () => {
    const userDataDir = createUserDataDir();
    const app = await launchAppWithUserData(userDataDir);

    try {
      const page = await getFirstWindowPage(app);
      await waitForAppReady(page, 30000);

      await expect(page.locator(AGE_GATE_CHECKBOX)).toBeVisible({ timeout: 10000 });
    } finally {
      await app.close();
      removeUserDataDir(userDataDir);
    }
  });

  test('should NOT show Age Gate on second launch after confirmation', async () => {
    const userDataDir = createUserDataDir();

    try {
      let app = await launchAppWithUserData(userDataDir);

      try {
        const page = await getFirstWindowPage(app);
        await waitForAppReady(page, 30000);

        const ageCheckbox = page.locator(AGE_GATE_CHECKBOX);
        await expect(ageCheckbox).toBeVisible({ timeout: 10000 });

        await ageCheckbox.check();
        await page.locator('#tos-accept').check();

        const confirmButton = page.getByRole('button', { name: /enter ruledesk/i });
        await expect(confirmButton).toBeEnabled({ timeout: 3000 });
        await confirmButton.click();

        await expect(ageCheckbox).not.toBeVisible({ timeout: 10000 });
      } finally {
        await app.close();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      app = await launchAppWithUserData(userDataDir);

      try {
        const page = await getFirstWindowPage(app);
        await waitForAppReady(page, 30000);

        await expect(page.locator(AGE_GATE_CHECKBOX)).not.toBeVisible({ timeout: 15000 });
        await expect(
          page.getByRole('heading', { name: /sign in to ruledesk/i })
        ).toBeVisible({ timeout: 15000 });
      } finally {
        await app.close();
      }
    } finally {
      removeUserDataDir(userDataDir);
    }
  });
});
