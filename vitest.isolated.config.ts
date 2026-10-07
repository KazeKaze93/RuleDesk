import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

/**
 * Isolated suite only: jsdom renderer tests + video-proxy (open-handle risk).
 * Invoked by `npm run test:isolated` under a hard wall-clock in pre-push.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: [
      "tests/unit/services/video-proxy-server.test.ts",
      "tests/unit/hooks/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/components/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/features/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "**/out/**", "tests/e2e/**"],
    globals: true,
    // happy-dom avoids jsdom/undici markAsUncloneable crashes on Node 20.
    environment: "happy-dom",
    pool: "forks",
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 15000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
    alias: {
      "@/lib": path.resolve(__dirname, "./src/renderer/lib"),
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    rollupOptions: {
      external: ["better-sqlite3"],
    },
  },
});
