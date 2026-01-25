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
  // --- 1. Age Gate ---
  // Check if Age Gate modal is visible by looking for the title or checkbox
  const ageGateTitle = page.getByText('Age Verification & Terms');
  const ageCheckbox = page.locator('#age-confirm');
  
  const isAgeGateVisible = await ageGateTitle.isVisible().catch(() => false) || 
                           await ageCheckbox.isVisible().catch(() => false);
  
  if (isAgeGateVisible) {
    console.log('[E2E] Age Gate detected. Accepting...');
    
    // Check the "I confirm that I am at least 18 years old" checkbox
    // Using the checkbox id from AgeGate.tsx
    await ageCheckbox.check();
    
    // Check the "I accept the Terms of Service" checkbox
    const tosCheckbox = page.locator('#tos-accept');
    await tosCheckbox.check();
    
    // Click the "Enter RuleDesk" button (from AgeGate.tsx line 113)
    const confirmButton = page.getByRole('button', { name: /enter ruleDesk|enter|confirm|continue/i });
    await expect(confirmButton).toBeEnabled({ timeout: 3000 });
    await confirmButton.click();
    
    // Wait for Age Gate to disappear
    await expect(ageGateTitle).not.toBeVisible({ timeout: 10000 });
    
    // Wait a bit for the app to transition
    await page.waitForTimeout(1000);
  }

  // --- 2. Auth / Login (Onboarding) ---
  // Check if Onboarding screen is visible by looking for the user ID input
  const userIdInput = page.locator('#user-id-input');
  const isOnboardingVisible = await userIdInput.isVisible().catch(() => false);
  
  if (isOnboardingVisible) {
    console.log('[E2E] Auth screen detected. Logging in with env credentials...');

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
    await userIdInput.fill(userId);
    
    // Fill API Key input (from Onboarding.tsx line 154)
    const apiKeyInput = page.locator('#api-key-input');
    await apiKeyInput.fill(apiKey);
    
    // Submit the form
    // The button text comes from translation, but we can use a flexible selector
    const submitButton = page.getByRole('button', { name: /save|login|start|save and login/i });
    await expect(submitButton).toBeEnabled({ timeout: 3000 });
    await submitButton.click();
    
    // Wait for form submission to complete and check for errors
    // First, wait a bit for any error messages to appear
    await page.waitForTimeout(1000);
    
    // Check for error messages (validation or API errors)
    const errorMessages = page.locator('.text-red-500, .text-red-400, [role="alert"]');
    const hasErrors = await errorMessages.count().then(count => count > 0);
    
    if (hasErrors) {
      const errorTexts = await Promise.all(
        Array.from({ length: await errorMessages.count() }).map(async (_, i) => {
          return await errorMessages.nth(i).textContent();
        })
      );
      throw new Error(`Form submission failed with errors: ${errorTexts.join(', ')}`);
    }
    
    // Wait for successful navigation to main app
    // Instead of waiting for form to disappear, wait for main app elements to appear
    // This is more reliable as it checks the actual result, not just UI state
    const addSourceButton = page.getByRole('button', { name: /add source|add artist/i });
    const sidebar = page.locator('nav, [role="navigation"], aside'); // Sidebar navigation
    
    // Wait for either main app element to appear (indicates successful navigation)
    await Promise.race([
      addSourceButton.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
      sidebar.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
    ]);
    
    // Verify form is gone (double-check)
    const formStillVisible = await userIdInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (formStillVisible) {
      // Form is still visible, but main app elements appeared - this is acceptable
      // The form might be fading out while main app is rendering
      console.log('[E2E] Warning: Onboarding form still visible, but main app elements detected');
    }
    
    // Wait a bit for the app to fully transition
    await page.waitForTimeout(1000);
  }

  // --- 3. Verify Dashboard / Main App ---
  // Verify we're on the main app by looking for the "Add Source" button
  // This button appears on the Tracked Artists page (default route)
  const addSourceButton = page.getByRole('button', { name: /add source|add artist/i });
  await expect(addSourceButton).toBeVisible({ timeout: 15000 });
  
  console.log('[E2E] Onboarding completed successfully. Main app is visible.');
}
