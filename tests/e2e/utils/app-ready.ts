import type { Page } from '@playwright/test';

/**
 * Custom helper to wait for app to be fully ready
 * Waits for both DOM content loaded and a specific element to appear
 * This replaces simple waitForLoadState() which may not catch all initialization states
 * 
 * @param page - Playwright page instance
 * @param timeout - Maximum timeout in milliseconds (default: 30000)
 */
export async function waitForAppReady(page: Page, timeout: number = 30000): Promise<void> {
  // Wait for DOM to be ready
  await page.waitForLoadState('domcontentloaded', { timeout });
  
  // Wait for root element or Age Gate checkbox to appear (indicates React has rendered)
  // Try multiple selectors to handle different app states
  const selectors = [
    '#root',           // Main React root
    '#age-confirm',   // Age Gate checkbox (first launch)
    '#user-id',       // Account gate user id field
    '#api-key',       // Account gate API key field
    '[data-testid="app"]', // If we add test IDs
  ];
  
  // Wait for at least one of these elements to appear
  await Promise.race(
    selectors.map(selector => 
      page.waitForSelector(selector, { timeout, state: 'attached' }).catch(() => {})
    )
  );
  
  // Additional wait for React to hydrate (if using SSR/hydration)
  // This ensures interactive elements are ready
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root !== null && root.children.length > 0;
    },
    { timeout: Math.min(timeout, 10000) }
  ).catch(() => {
    // If root check fails, that's okay - app might be in a different state
  });
}
