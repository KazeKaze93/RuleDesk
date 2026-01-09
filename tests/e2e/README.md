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
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

## Test Structure

- `global-setup.ts` - Ensures the app is built before tests run
- `*.spec.ts` - Individual test files

## Electron Launcher

The actual Electron launcher will be implemented in test fixtures (to be added in next phase).
