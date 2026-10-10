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
# Run all E2E tests (headless by default; HEADLESS is read in the specs, not via a separate npm script)
npm run test:e2e

# Run in headed mode (see Electron window, for debugging)
# On Windows PowerShell: $env:HEADLESS="false"; npm run test:e2e
# On Linux/Mac: HEADLESS=false npm run test:e2e
# Or use: npx playwright test --headed (if supported)
```

**Note:** E2E tests run in headless mode by default. This is optimal for CI/CD. Use headed mode only for local debugging.

## CI

E2E is **not** on GitHub Actions; run locally (or in your own runner) with Playwright. Typical steps: `npm ci` → `db:rebuild` → `build` → `npx playwright install --with-deps chromium` → `npm run test:e2e` (on Linux, under `xvfb-run` if headless).

**Secrets / env** for live API flows:

- `TEST_USER_ID` — Rule34 API user id
- `TEST_API_KEY` — Rule34 API key

Without these, tests that require real credentials fail with an explicit error.

**Onboarding selectors:** Age Gate uses `#age-confirm` / `#tos-accept`. Account credentials are saved in E2E via `window.api.saveSettings` (IPC) with trimmed `TEST_USER_ID` / `TEST_API_KEY`, then the page reloads. In `NODE_ENV=test`, main process uses a reversible test credential encoding when Linux headless has no OS keychain (`safeStorage` unavailable).

Tagged releases (`v*`) are packaged by [`.github/workflows/release.yml`](../../.github/workflows/release.yml) (Windows zip + Linux AppImage) without waiting on E2E — quality stays on local `pre-push`. See [docs/development.md](../../docs/development.md).

## Test Structure

- `global-setup.ts` - Ensures the app is built before tests run
- `*.spec.ts` - Individual test files

## Electron Launcher

The actual Electron launcher will be implemented in test fixtures (to be added in next phase).
