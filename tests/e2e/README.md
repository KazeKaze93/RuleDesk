# E2E Tests with Playwright

This directory contains end-to-end (E2E) tests for the Electron application using Playwright.

## Important Note

**Playwright doesn't natively support Electron apps.** To test Electron applications, we need to:

1. **Build the app first**: `npm run build` (creates `out/main/main.cjs`)
2. **Use a custom Electron launcher** that spawns Electron with the built main process
3. **Connect to the Electron window** via CDP (Chrome DevTools Protocol)

## Setup

1. Install Playwright browsers (if not already installed):

   ```bash
   npx playwright install
   ```

2. Build the Electron app:
   ```bash
   npm run build
   ```

## Running Tests

```bash
# Run all E2E tests (headless by default)
npm run test:e2e

# Run in headless mode (explicit, same as default)
npm run test:e2e:headless

# Run in headed mode (see Electron window, for debugging)
# On Windows PowerShell: $env:HEADLESS="false"; npm run test:e2e
# On Linux/Mac: HEADLESS=false npm run test:e2e
# Or use: npx playwright test --headed (if supported)
```

**Note:** E2E tests run in headless mode by default. This is optimal for CI/CD. Use headed mode only for local debugging.

## CI

GitHub Actions runs E2E after the **quality** job (`validate`, `npm test`, production audit). Steps: `npm ci` → `db:rebuild` → `build` → Playwright Chromium → `npm run test:e2e` under `xvfb-run` on Ubuntu.

**Secrets** (repository Settings → Actions):

- `TEST_USER_ID` — Rule34 API user id for live auth flows
- `TEST_API_KEY` — Rule34 API key

Without these secrets, tests that require real credentials will fail in CI with an explicit error.

Tagged releases (`v*`) wait for both **quality** and **e2e** before the Windows portable build.

## Test Structure

- `global-setup.ts` - Ensures the app is built before tests run
- `*.spec.ts` - Individual test files

## Electron Launcher

The actual Electron launcher will be implemented in test fixtures (to be added in next phase).
