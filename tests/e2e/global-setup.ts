import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Global setup for E2E tests
 *
 * Ensures the Electron app is built before running tests.
 * The built main process should be at: out/main/main.cjs
 *
 * On CI (`process.env.CI`), always rebuild so a stale `out/` cannot silently
 * serve yesterday's main. Locally, skip when the artifact already exists
 * (speed over freshness for iterative e2e).
 */
export default async function globalSetup() {
  const mainPath = path.resolve(process.cwd(), 'out/main/main.cjs');
  const isCi = process.env.CI === 'true' || process.env.CI === '1';
  const shouldSkipBuild = !isCi && existsSync(mainPath);

  if (shouldSkipBuild) {
    console.log('✅ Build already exists at:', mainPath);
    return;
  }

  if (isCi) {
    console.log('CI detected — always running build for E2E...');
  } else {
    console.log('⚠️  Build not found. Running build...');
  }

  try {
    execSync('npm run build', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw new Error('Failed to build Electron app for E2E tests');
  }
}
