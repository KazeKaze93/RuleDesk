import { Page, expect } from '@playwright/test';

/**
 * Completes the onboarding flow (Age Gate + API credentials)
 * 
 * This helper:
 * 1. Handles Age Gate if present
 * 2. Handles Onboarding (API credentials) if present
 * 3. Uses real credentials from environment variables (TEST_USER_ID, TEST_API_KEY)
 * 4. Throws error if credentials are missing
 * 5. Verifies successful navigation to main app
 * 
 * @param page - Playwright Page object
 * @throws {Error} If TEST_USER_ID or TEST_API_KEY are missing
 */
export async function completeOnboarding(page: Page) {
  // Check if page is closed before starting
  if (page.isClosed()) {
    throw new Error('[E2E] Page is closed before onboarding can start');
  }

  // --- 1. Age Gate ---
  // Check if Age Gate modal is visible by looking for the title or checkbox
  const ageGateTitle = page.getByText('Age Verification & Terms');
  const ageCheckbox = page.locator('#age-confirm');
  
  const isAgeGateVisible = await ageGateTitle.isVisible().catch(() => false) || 
                           await ageCheckbox.isVisible().catch(() => false);
  
  if (isAgeGateVisible) {
    console.log('[E2E] Age Gate detected. Accepting...');
    
    // Check if page is still open
    if (page.isClosed()) {
      throw new Error('[E2E] Page closed during Age Gate handling');
    }
    
    // Check the "I confirm that I am at least 18 years old" checkbox
    // Using the checkbox id from AgeGate.tsx
    await ageCheckbox.check({ timeout: 5000 });
    
    // Check the "I accept the Terms of Service" checkbox
    const tosCheckbox = page.locator('#tos-accept');
    await tosCheckbox.check({ timeout: 5000 });
    
    // Click the "Enter RuleDesk" button (from AgeGate.tsx line 113)
    const confirmButton = page.getByRole('button', { name: /enter ruleDesk|enter|confirm|continue/i });
    await expect(confirmButton).toBeEnabled({ timeout: 5000 });
    
    // Check if page is still open before clicking
    if (page.isClosed()) {
      throw new Error('[E2E] Page closed before clicking Age Gate confirm button');
    }
    
    await confirmButton.click();
    
    // Wait for Age Gate to disappear
    await expect(ageGateTitle).not.toBeVisible({ timeout: 10000 });
    
    // Check if page closed after Age Gate submission
    if (page.isClosed()) {
      throw new Error('[E2E] Page closed after Age Gate submission');
    }
    
    // Wait a bit for the app to transition
    await page.waitForTimeout(1000);
  }

  // --- 2. Auth / Login (Onboarding) ---
  // Check if Onboarding screen is visible by looking for the user ID input
  const userIdInput = page.locator('#user-id-input');
  const isOnboardingVisible = await userIdInput.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isOnboardingVisible) {
    console.log('[E2E] Auth screen detected. Logging in with env credentials...');

    // Check if page is still open
    if (page.isClosed()) {
      throw new Error('[E2E] Page closed before Auth screen handling');
    }

    // Read credentials from environment variables
    const userId = process.env.TEST_USER_ID;
    const apiKey = process.env.TEST_API_KEY;

    // CRITICAL: Throw error if credentials are missing
    if (!userId || !apiKey) {
      throw new Error(
        '⛔️ E2E FATAL: TEST_USER_ID or TEST_API_KEY are missing in .env or CI secrets. Cannot proceed with real auth.\n' +
        'Please create .env file with:\n' +
        'TEST_USER_ID=your_real_user_id\n' +
        'TEST_API_KEY=your_real_api_key'
      );
    }

    // Fill in the credentials
    await userIdInput.fill(userId, { timeout: 5000 });
    
    // Check if page is still open
    if (page.isClosed()) {
      throw new Error('[E2E] Page closed after filling user ID');
    }
    
    // Fill API Key input (from Onboarding.tsx line 154)
    const apiKeyInput = page.locator('#api-key-input');
    await apiKeyInput.fill(apiKey, { timeout: 5000 });
    
    // Check if page is still open
    if (page.isClosed()) {
      throw new Error('[E2E] Page closed after filling API key');
    }
    
    // Submit the form
    // The button text comes from translation, but we can use a flexible selector
    const submitButton = page.getByRole('button', { name: /save|login|start|save and login/i });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    
    // Check if page is still open before clicking
    if (page.isClosed()) {
      throw new Error('[E2E] Page closed before clicking submit button');
    }
    
    await submitButton.click();
    
    // Wait for form submission to complete and check for errors
    // First, wait a bit for any error messages to appear
    await page.waitForTimeout(2000);
    
    // Check if page closed after form submission
    if (page.isClosed()) {
      throw new Error('[E2E] Page closed immediately after form submission - app may have crashed');
    }
    
    // Check if form is still visible - if not, submission was successful
    const formStillVisible = await userIdInput.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (formStillVisible) {
      // Form is still visible - check for validation errors ONLY within the form
      // Use a more specific selector to avoid false positives from other page elements
      // (e.g., "Explicit" badges in post cards have text-red-400 class)
      const formElement = page.locator('form').first();
      const errorMessages = formElement.locator('.text-red-500, .text-red-400');
      const hasErrors = await errorMessages.count().then(count => count > 0).catch(() => false);
      
      if (hasErrors) {
        const errorTexts = await Promise.all(
          Array.from({ length: await errorMessages.count() }).map(async (_, i) => {
            return await errorMessages.nth(i).textContent();
          })
        ).catch(() => []);
        throw new Error(`Form submission failed with errors: ${errorTexts.join(', ')}`);
      }
      
      // Form is visible but no errors - might be waiting for submission
      // Wait a bit more and check again
      await page.waitForTimeout(2000);
      const stillVisible = await userIdInput.isVisible({ timeout: 1000 }).catch(() => false);
      if (stillVisible) {
        // Form still visible after additional wait - might be an issue
        console.log('[E2E] Warning: Form still visible after submission. Checking for errors again...');
        const finalErrors = formElement.locator('.text-red-500, .text-red-400');
        const finalErrorCount = await finalErrors.count().catch(() => 0);
        if (finalErrorCount > 0) {
          const finalErrorTexts = await Promise.all(
            Array.from({ length: finalErrorCount }).map(async (_, i) => {
              return await finalErrors.nth(i).textContent();
            })
          ).catch(() => []);
          throw new Error(`Form submission failed with errors: ${finalErrorTexts.join(', ')}`);
        }
      }
    } else {
      // Form disappeared - submission was successful, continue
      console.log('[E2E] Form disappeared after submission - submission successful');
    }
    
    // Wait for successful navigation to main app
    // Instead of waiting for form to disappear, wait for main app elements to appear
    // This is more reliable as it checks the actual result, not just UI state
    const sidebar = page.locator('aside, nav[class*="sidebar"], [role="navigation"]'); // Sidebar navigation
    const topBar = page.locator('header, [role="banner"]'); // GlobalTopBar with search
    const appLogo = page.locator('img[alt*="RuleDesk"], [class*="logo"]'); // App logo
    
    // Wait for main app layout elements to appear (indicates Router is mounted)
    // Use a more robust waiting strategy with timeout checks
    try {
      await Promise.race([
        sidebar.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
        topBar.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
        appLogo.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
      ]);
      
      // Check if page closed during wait
      if (page.isClosed()) {
        throw new Error('[E2E] Page closed while waiting for main app elements');
      }
    } catch (_error) {
      if (page.isClosed()) {
        throw new Error('[E2E] Page closed during main app navigation wait');
      }
      // If page is still open but elements didn't appear, log warning but continue
      console.warn('[E2E] Main app elements may not have appeared, but page is still open');
    }
    
    // Verify form is gone (double-check)
    const formStillVisibleAfterWait = await userIdInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (formStillVisibleAfterWait) {
      // Form is still visible, but main app elements appeared - wait a bit more
      console.log('[E2E] Warning: Onboarding form still visible, but main app elements detected. Waiting for transition...');
      await page.waitForTimeout(2000);
      
      // Check again if form is still visible
      const stillVisible = await userIdInput.isVisible({ timeout: 1000 }).catch(() => false);
      if (stillVisible) {
        // Form is still visible after waiting - this might indicate an issue
        // But continue anyway if main app elements are present
        console.log('[E2E] Warning: Onboarding form still visible after wait. Main app may be overlaying it.');
      }
    }
    
    // Wait a bit for the app to fully transition
    await page.waitForTimeout(1000);
    
    // Navigate to Tracked Artists page if we're not already there
    // The "Add Artist" button is on the Artists page, not the default Browse page
    const currentUrl = page.url();
    if (!currentUrl.includes('#/tracked')) {
      // Click on "Artists" link in sidebar to navigate to Artists page
      const artistsLink = page.getByRole('link', { name: /artists/i });
      const artistsLinkVisible = await artistsLink.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (artistsLinkVisible) {
        await artistsLink.click();
        await page.waitForTimeout(1000); // Wait for navigation
      } else {
        // Fallback: try to navigate via URL
        await page.goto(page.url().split('#')[0] + '#/tracked');
        await page.waitForTimeout(1000);
      }
    }
  }

  // --- 3. Verify Dashboard / Main App ---
  // Verify we're on the main app by looking for the "Add Artist" button
  // This button appears on the Artists page
  const addArtistButton = page.getByRole('button', { name: /add artist/i });
  await expect(addArtistButton).toBeVisible({ timeout: 15000 });
  
  console.log('[E2E] Onboarding completed successfully. Main app is visible.');
}
