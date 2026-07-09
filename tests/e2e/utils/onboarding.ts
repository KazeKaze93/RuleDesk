import { Page, expect } from '@playwright/test';

const AGE_GATE_CHECKBOX = '#age-confirm';
const ACCOUNT_GATE_HEADING = /sign in to ruledesk/i;
const ACCOUNT_GATE_USER_ID = '#user-id';
const ACCOUNT_GATE_API_KEY = '#api-key';

async function fillControlledInput(
  page: Page,
  selector: string,
  value: string,
  options?: { verifyValue?: boolean }
): Promise<void> {
  const input = page.locator(selector);
  await input.click();
  await input.fill('');
  await input.pressSequentially(value, { delay: 10 });
  if (options?.verifyValue !== false) {
    await expect(input).toHaveValue(value, { timeout: 5000 });
  }
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

async function waitForAccountGateDismiss(page: Page): Promise<void> {
  const accountGateHeading = page.getByRole('heading', { name: ACCOUNT_GATE_HEADING });
  const artistsLink = page.getByRole('link', { name: /^artists$/i });

  await expect
    .poll(async () => {
      const gateVisible = await accountGateHeading.isVisible().catch(() => false);
      const mainVisible = await artistsLink.isVisible().catch(() => false);
      return !gateVisible || mainVisible;
    }, { timeout: 30000 })
    .toBe(true);

  const saveFailed = page.getByText('Save failed');
  if (await saveFailed.isVisible({ timeout: 1000 }).catch(() => false)) {
    throw new Error('[E2E] Account gate reported Save failed after submitting credentials');
  }

  await expect(accountGateHeading).not.toBeVisible({ timeout: 5000 });
}

async function completeAccountGateIfVisible(page: Page): Promise<void> {
  const accountGateHeading = page.getByRole('heading', { name: ACCOUNT_GATE_HEADING });
  const apiKeyInput = page.locator(ACCOUNT_GATE_API_KEY);
  const isAccountGateVisible =
    (await accountGateHeading.isVisible({ timeout: 5000 }).catch(() => false)) ||
    (await apiKeyInput.isVisible({ timeout: 5000 }).catch(() => false));

  if (!isAccountGateVisible) {
    return;
  }

  console.log('[E2E] Account gate detected. Saving API credentials...');

  if (page.isClosed()) {
    throw new Error('[E2E] Page closed before account gate handling');
  }

  const userId = process.env.TEST_USER_ID;
  const apiKey = process.env.TEST_API_KEY;

  if (!userId || !apiKey) {
    throw new Error(
      '⛔️ E2E FATAL: TEST_USER_ID or TEST_API_KEY are missing in .env or CI secrets. Cannot proceed with real auth.\n' +
        'Please create .env file with:\n' +
        'TEST_USER_ID=your_real_user_id\n' +
        'TEST_API_KEY=your_real_api_key'
    );
  }

  await fillControlledInput(page, ACCOUNT_GATE_USER_ID, userId);
  await fillControlledInput(page, ACCOUNT_GATE_API_KEY, apiKey, { verifyValue: false });

  const saveButton = page.getByRole('button', { name: /save api key/i });
  await expect(saveButton).toBeEnabled({ timeout: 5000 });
  await saveButton.click();

  await waitForAccountGateDismiss(page);

  const sidebar = page.locator('aside, nav[class*="sidebar"], [role="navigation"]');
  const topBar = page.locator('header, [role="banner"]');

  await Promise.race([
    sidebar.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
    topBar.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
  ]);

  await page.waitForTimeout(1000);
}

async function navigateToArtistsPage(page: Page): Promise<void> {
  const addArtistButton = page.getByRole('button', { name: /add artist/i });
  if (await addArtistButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    return;
  }

  const artistsLink = page.getByRole('link', { name: /^artists$/i });
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

  await acceptAgeGateIfVisible(page);
  await completeAccountGateIfVisible(page);
  await navigateToArtistsPage(page);

  console.log('[E2E] Onboarding completed successfully. Main app is visible.');
}

export async function isAccountGateVisible(page: Page): Promise<boolean> {
  const accountGateHeading = page.getByRole('heading', { name: ACCOUNT_GATE_HEADING });
  const apiKeyInput = page.locator(ACCOUNT_GATE_API_KEY);
  return (
    (await accountGateHeading.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await apiKeyInput.isVisible({ timeout: 2000 }).catch(() => false))
  );
}

export async function isAgeGateVisible(page: Page): Promise<boolean> {
  return page.locator(AGE_GATE_CHECKBOX).isVisible({ timeout: 2000 }).catch(() => false);
}

export async function isMainAppShellVisible(page: Page): Promise<boolean> {
  const artistsLink = page.getByRole('link', { name: /^artists$/i });
  const addArtistButton = page.getByRole('button', { name: /add artist/i });
  return (
    (await artistsLink.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await addArtistButton.isVisible({ timeout: 2000 }).catch(() => false))
  );
}
