import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './test-app';
import { completeOnboarding } from './utils/onboarding';
import { waitForWindow } from './utils/window-helpers';

test.describe('User Journeys', () => {
  let app: ElectronApplication;
  let page: Page;
  let tempDir: string;

  test.beforeEach(async () => {
    // Launch app
    const session = await launchTestApp();
    app = session.app;
    tempDir = session.tempDir;
    
    // Wait for app to initialize (database migrations, etc.)
    // Give it more time in CI/headless mode
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the first window (with increased timeout for CI)
    // In headless mode, windows may take longer to appear
    const timeout = process.env.CI === 'true' ? 60000 : 30000;
    try {
      page = await app.firstWindow({ timeout });
    } catch (error) {
      // If firstWindow fails, use retry helper
      console.warn('firstWindow failed, using retry helper...', error);
      page = await waitForWindow(app, timeout);
    }
    
    // Wait for window content to load (replaces setTimeout)
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    
    // Check if window is still open
    if (page.isClosed()) {
      // Try to get another window using retry helper
      page = await waitForWindow(app, timeout);
    }

    // Perform Onboarding (Age Gate + Real Auth)
    await completeOnboarding(page);
  });

  test.afterEach(async () => {
    await cleanupTestApp(app, tempDir);
  });

  test('should allow adding a new tracked artist', async () => {
    // Verify we are logged in
    const title = await page.title();
    expect(title).toContain('RuleDesk');

    // Open Add Modal
    const addButton = page.getByRole('button', { name: /^add artist$/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Scope to the modal — do not use bare text=Add Artist (matches the page button too).
    const addArtistDialog = page.getByRole('dialog', { name: /add artist/i });
    await expect(addArtistDialog).toBeVisible({ timeout: 5000 });
    
    // Fill the tag input
    const tagInput = addArtistDialog.locator('input[placeholder*="Search on"]');
    await expect(tagInput).toBeVisible({ timeout: 3000 });

    const testTag = 'sakimichan';
    const testTagPattern = new RegExp(testTag, 'i');

    await tagInput.clear();
    await tagInput.pressSequentially(testTag, { delay: 30 });

    const matchingOption = addArtistDialog
      .locator('[role="option"]')
      .filter({ hasText: testTagPattern })
      .first();
    const hasMatchingOption = await matchingOption
      .isVisible({ timeout: 4000 })
      .catch(() => false);

    if (hasMatchingOption) {
      await matchingOption.click();
    }

    await expect(tagInput).toHaveValue(testTagPattern);
    
    const submitButton = addArtistDialog.getByRole('button', { name: 'Start Tracking' });
    
    // Check if button exists and is visible
    await expect(submitButton).toBeVisible({ timeout: 3000 });
    
    // Wait for button to be enabled
    // Button is disabled if: isSubmitting || !tag || !!errors.tag
    // Check for validation errors first
    const errorText = addArtistDialog.locator('.text-destructive, .text-red-400, .text-red-500').first();
    const hasError = await errorText.isVisible().catch(() => false);
    if (hasError) {
      const errorMessage = await errorText.textContent();
      throw new Error(`Form validation error: ${errorMessage}`);
    }
    
    // Wait for button to be enabled
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    
    // Click submit and wait for the button to show loading state
    await submitButton.click();
    
    // Wait for form submission to complete
    // The button might show "Adding..." text during submission
    await page.waitForTimeout(2000);
    
    // Check for any error messages that might appear after submission
    const submissionErrorMessage = page.locator('text=/error|failed|invalid/i').first();
    const hasSubmissionError = await submissionErrorMessage.isVisible().catch(() => false);
    
    if (hasSubmissionError) {
      const errorText = await submissionErrorMessage.textContent();
      throw new Error(`Form submission failed with error: ${errorText}`);
    }

    // Verify modal closed and artist appears in the list
    await expect(addArtistDialog).toBeHidden({ timeout: 15000 });
    await expect(page.getByText(testTag, { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('should handle empty state and show "Add your first one" button', async () => {
    // Verify we are logged in
    const title = await page.title();
    expect(title).toContain('RuleDesk');

    // Check if there are no artists (empty state)
    const emptyStateText = page.getByText('No tracked sources yet.');
    const emptyStateVisible = await emptyStateText.isVisible().catch(() => false);
    
    if (emptyStateVisible) {
      // Click "Add your first one" button
      const addFirstButton = page.getByRole('button', { name: 'Add your first one' });
      await expect(addFirstButton).toBeVisible();
      await addFirstButton.click();
      
      // Verify modal opens (dialog role, not the page header button)
      await expect(page.getByRole('dialog', { name: /add artist/i })).toBeVisible({ timeout: 5000 });
    } else {
      // If there are already artists, just verify the "Add Artist" button is visible
      const addButton = page.getByRole('button', { name: /^add artist$/i });
      await expect(addButton).toBeVisible();
    }
  });
});
