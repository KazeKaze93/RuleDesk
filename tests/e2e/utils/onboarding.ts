import { Page, expect } from '@playwright/test';
import { waitForAppReady } from './app-ready';

const ACCOUNT_GATE_HEADING = /sign in to ruledesk/i;
const ACCOUNT_GATE_CONTENT_WARNING =
  /RuleDesk displays sexually explicit content from Rule34\. Use only if you are an adult\./i;
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

async function waitForMainAppShell(page: Page): Promise<void> {
  const accountGateHeading = page.getByRole('heading', { name: ACCOUNT_GATE_HEADING });
  const artistsLink = page.getByRole('link', { name: MAIN_APP_ARTISTS_LINK });

  await expect(accountGateHeading).not.toBeVisible({ timeout: 30000 });
  await expect(artistsLink).toBeVisible({ timeout: 30000 });
}

async function saveCredentialsViaIpc(page: Page, userId: string, apiKey: string): Promise<void> {
  if (!/^\d+$/.test(userId)) {
    throw new Error(
      `[E2E] TEST_USER_ID must be a numeric Rule34 user id (got "${userId.slice(0, 8)}...")`
    );
  }

  try {
    await page.evaluate(
      async ({ userId, apiKey }) => {
        try {
          const saved = await window.api.saveSettings({
            userId,
            apiKey,
            provider: "rule34",
          });
          if (!saved) {
            throw new Error("saveSettings returned false");
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          if (typeof error === "object" && error !== null && "message" in error) {
            const message = Reflect.get(error, "message");
            if (typeof message === "string" && message.length > 0) {
              throw new Error(message);
            }
          }
          throw new Error(`saveSettings failed: ${String(error)}`);
        }
      },
      { userId, apiKey }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[E2E] saveSettings IPC failed: ${message}`);
  }
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
 * Completes the onboarding flow (AccountGate credentials when needed)
 */
export async function completeOnboarding(page: Page): Promise<void> {
  if (page.isClosed()) {
    throw new Error('[E2E] Page is closed before onboarding can start');
  }

  await waitForAppReady(page, 30000);
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

export async function isAccountGateContentWarningVisible(page: Page): Promise<boolean> {
  return page.getByText(ACCOUNT_GATE_CONTENT_WARNING).isVisible({ timeout: 2000 }).catch(() => false);
}

export async function isMainAppShellVisible(page: Page): Promise<boolean> {
  const artistsLink = page.getByRole('link', { name: MAIN_APP_ARTISTS_LINK });
  const addArtistButton = page.getByRole('button', { name: /add artist/i });
  return (
    (await artistsLink.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await addArtistButton.isVisible({ timeout: 2000 }).catch(() => false))
  );
}
