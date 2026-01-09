import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Global setup for E2E tests
 * 
 * Ensures the Electron app is built before running tests.
 * The built main process should be at: out/main/main.cjs
 */
export default async function globalSetup() {
  const mainPath = path.resolve(process.cwd(), 'out/main/main.cjs');
  
  // Check if build exists
  if (!existsSync(mainPath)) {
    console.log('⚠️  Build not found. Running build...');
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: process.cwd() 
      });
      console.log('✅ Build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error);
      throw new Error('Failed to build Electron app for E2E tests');
    }
  } else {
    console.log('✅ Build already exists at:', mainPath);
  }
}
