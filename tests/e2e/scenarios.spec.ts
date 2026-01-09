import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './test-app';
import { completeOnboarding } from './utils/onboarding';

test.describe('User Journeys', () => {
  let app: ElectronApplication;
  let page: Page;
  let tempDir: string;

  test.beforeEach(async () => {
    // Launch app
    const session = await launchTestApp();
    app = session.app;
    tempDir = session.tempDir;
    
    // Get the first window (with timeout)
    page = await app.firstWindow({ timeout: 30000 });
    
    // Wait a moment for window to initialize (app may show loading window first)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if window is still open
    if (page.isClosed()) {
      // Try to get another window
      const windows = app.windows();
      if (windows.length === 0) {
        throw new Error('No windows available. App may have closed immediately.');
      }
      page = windows[0];
      if (page.isClosed()) {
        throw new Error('All windows are closed');
      }
    }
    
    // Wait for app to settle (loading screen -> main window)
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });

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
    const addButton = page.getByRole('button', { name: /add source|add artist/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Fill Form
    // Wait for modal to appear
    const dialog = page.locator('text=Track New Artist').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Fill the tag input
    // AsyncAutocomplete uses @headlessui/react Combobox
    // The input has placeholder "Search on Rule34.xxx..." or "Search on Gelbooru..."
    const tagInput = page.locator('input[placeholder*="Search on"]').first();
    await expect(tagInput).toBeVisible({ timeout: 3000 });
    
    // Use a real tag for realism (sakimichan is a popular artist tag)
    const testTag = 'sakimichan';
    
    // Clear any existing value first
    await tagInput.clear();
    await page.waitForTimeout(100);
    
    // Type the tag character by character to simulate real user input
    // This triggers handleTagChange which sets the value via react-hook-form
    await tagInput.type(testTag, { delay: 30 });
    
    // Wait for debounce (300ms) + potential API call
    await page.waitForTimeout(800);
    
    // Option 1: Try to select from dropdown if it appears (user clicks on suggestion)
    const dropdownOption = page.locator('[role="option"]').first();
    const hasDropdown = await dropdownOption.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasDropdown) {
      console.log('[E2E] Dropdown appeared, selecting first option');
      await dropdownOption.click();
      await page.waitForTimeout(500);
    } else {
      // Option 2: User typed text directly (no dropdown or user wants to use typed text)
      // The value is already set via handleTagChange, just need to ensure it's committed
      console.log('[E2E] No dropdown, using typed text directly');
      // Press Tab or blur to ensure the value is committed
      await tagInput.press('Tab');
      await page.waitForTimeout(300);
    }
    
    // Verify that the input has the value
    const inputValue = await tagInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
    expect(inputValue.toLowerCase()).toContain(testTag.toLowerCase());
    
    // Wait a bit more for react-hook-form to update the form state
    await page.waitForTimeout(500);
    
    // Find the submit button - it should be visible in the modal
    // The button text is "Start Tracking" (from AddArtistModal.tsx line 170)
    // Use a more reliable selector - find by text within the form
    const submitButton = page.getByRole('button', { name: 'Start Tracking' });
    
    // Check if button exists and is visible
    await expect(submitButton).toBeVisible({ timeout: 3000 });
    
    // Wait for button to be enabled
    // Button is disabled if: isSubmitting || !tag || !!errors.tag
    // Check for validation errors first
    const errorText = page.locator('.text-red-400, .text-red-500').first();
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

    // Verify
    // Dialog should close (wait longer for async operation to complete)
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    
    // Artist should appear in the list (the tag will be normalized, so we check for partial match)
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
      
      // Verify modal opens
      const dialog = page.locator('text=Track New Artist').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });
    } else {
      // If there are already artists, just verify the "Add Source" button is visible
      const addButton = page.getByRole('button', { name: /add source|add artist/i });
      await expect(addButton).toBeVisible();
    }
  });
});
