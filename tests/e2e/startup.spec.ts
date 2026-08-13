import { test, expect, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { waitForWindow } from "./utils/window-helpers";
import { waitForAppReady } from "./utils/app-ready";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGE_GATE_CHECKBOX = "#age-confirm";

function createUserDataDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ruledesk-startup-"));
}

function removeUserDataDir(userDataDir: string): void {
  if (!fs.existsSync(userDataDir)) {
    return;
  }
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(
      "Failed to clean up userData directory (files may be locked):",
      error
    );
  }
}

async function launchApp(userDataDir: string): Promise<ElectronApplication> {
  const mainEntry = path.resolve(__dirname, "../../out/main/main.cjs");
  if (!fs.existsSync(mainEntry)) {
    throw new Error(
      `Main entry point not found: ${mainEntry}. Run 'npm run build' first.`
    );
  }

  const isHeadless =
    process.env.CI === "true" || process.env.HEADLESS !== "false";

  return electron.launch({
    args: [
      mainEntry,
      `--user-data-dir=${userDataDir}`,
      ...(isHeadless
        ? [
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-software-rasterizer",
            "--force-device-scale-factor=1",
            "--enable-logging",
            "--disable-features=CalculateNativeWinOcclusion",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
          ]
        : []),
    ],
    env: {
      ...process.env,
      NODE_ENV: "test",
      ELECTRON_ENABLE_LOGGING: "true",
      ...(isHeadless && process.platform === "linux"
        ? {
            DISPLAY: process.env.DISPLAY || ":99",
          }
        : {}),
    },
    timeout: 30000,
  });
}

async function getFirstWindowPage(
  app: ElectronApplication
): Promise<Page> {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const timeout = process.env.CI === "true" ? 60000 : 30000;
  try {
    return await app.firstWindow({ timeout });
  } catch (error) {
    console.warn("firstWindow failed, using retry helper...", error);
    return waitForWindow(app, timeout);
  }
}

test.describe("Application Startup", () => {
  test("fresh profile opens Age Gate as the first rendered UI", async () => {
    const userDataDir = createUserDataDir();
    const app = await launchApp(userDataDir);

    try {
      const window = await getFirstWindowPage(app);
      await waitForAppReady(window, 30000);

      const title = await window.title();
      expect(title).toContain("RuleDesk");

      await expect(window.locator(AGE_GATE_CHECKBOX)).toBeVisible({
        timeout: 15000,
      });

      await window.screenshot({ path: "test-results/startup.png" });
    } finally {
      await app.close();
      removeUserDataDir(userDataDir);
    }
  });
});
