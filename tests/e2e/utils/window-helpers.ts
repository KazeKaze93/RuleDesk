import type { ElectronApplication, Page } from '@playwright/test';

/**
 * Helper function to wait for a window with retry logic
 * Wraps app.windows() check in a retry loop (3-5 attempts) to give Electron time to initialize
 */
export async function waitForWindow(app: ElectronApplication, timeout: number): Promise<Page> {
  const maxRetries = 5;
  const retryDelay = 1000; // 1 second between retries
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try firstWindow first
      try {
        return await app.firstWindow({ timeout: Math.min(timeout, 10000) });
      } catch {
        // If firstWindow fails, check windows() directly
      }
      
      // Check if windows are available
      const windows = app.windows();
      if (windows.length > 0) {
        const window = windows[0];
        if (!window.isClosed()) {
          return window;
        }
      }
      
      // Wait for window event if no windows available
      if (attempt < maxRetries) {
        await app.waitForEvent('window', { timeout: Math.min(timeout, 5000) }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (_error) {
      if (attempt === maxRetries) {
        throw new Error(`No windows available after ${maxRetries} attempts. App may have failed to initialize.`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // Final check
  const windows = app.windows();
  if (windows.length === 0) {
    throw new Error('No windows available. App may have closed immediately.');
  }
  const window = windows[0];
  if (window.isClosed()) {
    throw new Error('All windows are closed');
  }
  return window;
}
