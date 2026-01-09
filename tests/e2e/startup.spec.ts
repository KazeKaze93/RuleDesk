import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './test-app';
import type { ElectronApplication } from '@playwright/test';

test.describe('Application Startup', () => {
  let app: ElectronApplication | undefined;
  let tempDir: string | undefined;

  test.beforeAll(async () => {
    // Launch app with isolated user data directory
    const result = await launchTestApp();
    app = result.app;
    tempDir = result.tempDir;
  });

  test.afterAll(async () => {
    // Clean up app and temp directory
    await cleanupTestApp(app, tempDir);
  });

  test('app window should open and load content', async () => {
    // Wait for window to appear
    // The app may show a loading window first, then main window
    console.log('Waiting for window to appear...');
    
    // Get the first window (with timeout)
    const window = await app.firstWindow({ timeout: 30000 });
    console.log('Window obtained');
    
    // Wait a moment for window to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if window is still open
    if (window.isClosed()) {
      // Try to get another window
      const windows = app.windows();
      console.log('First window closed, available windows:', windows.length);
      if (windows.length === 0) {
        throw new Error('No windows available. App may have closed immediately.');
      }
      // Use the first available window (might be a different one)
      const newWindow = windows[0];
      if (newWindow.isClosed()) {
        throw new Error('All windows are closed');
      }
      // Continue with the new window
      await testWindow(newWindow);
    } else {
      await testWindow(window);
    }
  });
  
  async function testWindow(window: any) {
    // Wait for window to be ready
    // The app shows a loading window first, then main window
    try {
      await window.waitForLoadState('domcontentloaded', { timeout: 20000 });
    } catch (error) {
      // If window closed, throw a clearer error
      if (window.isClosed()) {
        throw new Error('Window closed during load state wait');
      }
      // Otherwise, log and continue
      console.log('Load state wait failed, but window is still open:', error);
    }
    
    // Wait for React to hydrate and content to be ready
    try {
      await window.waitForFunction(
        () => document.readyState === 'complete' || document.readyState === 'interactive',
        { timeout: 10000 }
      );
    } catch (error) {
      if (window.isClosed()) {
        throw new Error('Window closed during ready state wait');
      }
      console.log('Ready state wait failed, but window is still open:', error);
    }
    
    // Check title
    // From main.ts line 291: title is set to `RuleDesk v${app.getVersion()}`
    const title = await window.title();
    expect(title).toBeDefined();
    expect(title).toContain('RuleDesk'); // Should contain "RuleDesk"
    
    // Screenshot for debugging (saved to test-results/)
    await window.screenshot({ path: 'test-results/startup.png' });
    
    // Additional check: verify window content is loaded
    const isReady = await window.evaluate(() => {
      return document.readyState === 'complete' || document.readyState === 'interactive';
    });
    expect(isReady).toBe(true);
    
    // Verify window has some content (not blank)
    const bodyText = await window.textContent('body');
    expect(bodyText).toBeTruthy(); // Body should have some content
  }
});
