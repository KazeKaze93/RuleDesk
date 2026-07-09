import { Page, expect } from '@playwright/test';
import { waitForAppReady } from './app-ready';

const AGE_GATE_CHECKBOX = '#age-confirm';
const ACCOUNT_GATE_HEADING = /sign in to ruledesk/i;
const MAIN_APP_ARTISTS_LINK = /^artists$/i;

function readTestCredentials(): { userId: string; apiKey: string } {
  const userId = process.env.TEST_USER_ID?.trim();
  const apiKey = process.env.TEST_API_KEY?.trim();

  if (!userId || !apiKey) {
    throw new Error(
      '⛔️ E2E FATAL: TEST_USER_ID or TEST_API_KEY are missing in .env or CI secrets. Cannot proceed with real auth.\n' +
        'Please create .env file with:\n' +
        'TEST_USER_ID=your_real_user_id\n' +
        'TEST_API_KEY=your_real_api_key'
    );
  }

  return { userId, apiKey };
}

async function acceptAgeGateIfVisible(page: Page): Promise<void> {
  const ageCheckbox = page.locator(AGE_GATE_CHECKBOX);
  const isAgeGateVisible = await ageCheckbox.isVisible({ timeout: 5000 }).catch(() => false);

  if (!isAgeGateVisible) {
    return;
  }

  console.log('[E2E] Age Gate detected. Accepting...');

  if (page.isClosed()) {
    throw new Error('[E2E] Page closed during Age Gate handling');
  }

  await ageCheckbox.check({ timeout: 5000 });

  const tosCheckbox = page.locator('#tos-accept');
  await tosCheckbox.check({ timeout: 5000 });

  const confirmButton = page.getByRole('button', { name: /enter ruledesk/i });
  await expect(confirmButton).toBeEnabled({ timeout: 5000 });

  if (page.isClosed()) {
    throw new Error('[E2E] Page closed before clicking Age Gate confirm button');
  }

  await confirmButton.click();
  await expect(ageCheckbox).not.toBeVisible({ timeout: 10000 });

  if (page.isClosed()) {
    throw new Error('[E2E] Page closed after Age Gate submission');
  }

  await page.waitForTimeout(1000);
}

async function waitForMainAppShell(page: Page): Promise<void> {
  const accountGateHeading = page.getByRole('heading', { name: ACCOUNT_GATE_HEADING });
  const artistsLink = page.getByRole('link', { name: MAIN_APP_ARTISTS_LINK });

  await expect(accountGateHeading).not.toBeVisible({ timeout: 30000 });
  await expect(artistsLink).toBeVisible({ timeout: 30000 });
}

async function saveCredentialsViaIpc(page: Page, userId: string, apiKey: string): Promise<void> {
  await page.evaluate(
    async ({ userId, apiKey }) => {
      const saved = await window.api.saveSettings({
        userId,
        apiKey,
        provider: 'rule34',
      });
      if (!saved) {
        throw new Error('saveSettings returned false');
      }
    },
    { userId, apiKey }
  );
}

async function completeAccountGateIfVisible(page: Page): Promise<void> {
  const accountGateVisible = await isAccountGateVisible(page);

  if (!accountGateVisible) {
    return;
  }

  console.log('[E2E] Account gate detected. Saving API credentials via IPC...');

  if (page.isClosed()) {
    throw new Error('[E2E] Page closed before account gate handling');
  }

  const { userId, apiKey } = readTestCredentials();
  await saveCredentialsViaIpc(page, userId, apiKey);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppReady(page, 30000);

  await acceptAgeGateIfVisible(page);
  await waitForMainAppShell(page);
}

async function navigateToArtistsPage(page: Page): Promise<void> {
  const addArtistButton = page.getByRole('button', { name: /add artist/i });
  if (await addArtistButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    return;
  }

  const artistsLink = page.getByRole('link', { name: MAIN_APP_ARTISTS_LINK });
  await expect(artistsLink).toBeVisible({ timeout: 15000 });
  await artistsLink.click();
  await expect(addArtistButton).toBeVisible({ timeout: 15000 });
}

/**
 * Completes the onboarding flow (Age Gate + API credentials)
 */
export async function completeOnboarding(page: Page): Promise<void> {
  if (page.isClosed()) {
    throw new Error('[E2E] Page is closed before onboarding can start');
  }

  await waitForAppReady(page, 30000);
  await acceptAgeGateIfVisible(page);
  await completeAccountGateIfVisible(page);
  await navigateToArtistsPage(page);

  console.log('[E2E] Onboarding completed successfully. Main app is visible.');
}

export async function isAccountGateVisible(page: Page): Promise<boolean> {
  const accountGateHeading = page.getByRole('heading', { name: ACCOUNT_GATE_HEADING });
  const apiKeyInput = page.locator('#api-key');
  return (
    (await accountGateHeading.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await apiKeyInput.isVisible({ timeout: 2000 }).catch(() => false))
  );
}

export async function isAgeGateVisible(page: Page): Promise<boolean> {
  return page.locator(AGE_GATE_CHECKBOX).isVisible({ timeout: 2000 }).catch(() => false);
}

export async function isMainAppShellVisible(page: Page): Promise<boolean> {
  const artistsLink = page.getByRole('link', { name: MAIN_APP_ARTISTS_LINK });
  const addArtistButton = page.getByRole('button', { name: /add artist/i });
  return (
    (await artistsLink.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await addArtistButton.isVisible({ timeout: 2000 }).catch(() => false))
  );
}
