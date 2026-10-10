import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import type * as schema from "../db/schema";
import { SETTINGS_ID, settings } from "../db/schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/** Default matches pre-setting behavior: close keeps the process in the tray. */
export const MINIMIZE_TO_TRAY_DEFAULT = true;

/** Narrow window surface for second-instance / tray reveal (BrowserWindow satisfies). */
export type RevealableMainWindow = {
  isDestroyed: () => boolean;
  isMinimized: () => boolean;
  isVisible: () => boolean;
  restore: () => void;
  show: () => void;
  focus: () => void;
};

export type MainWindowCloseAction = "allow-close" | "hide-to-tray";

export type DecideMainWindowCloseInput = {
  /** True once quit has started (before-quit / isShuttingDown). Do not touch DB. */
  isQuitInProgress: boolean;
  isTestMode: boolean;
  platform: NodeJS.Platform;
  readMinimizeToTrayEnabled: () => boolean;
};

/**
 * NULL / undefined → default true (legacy tray-hide behavior).
 */
export function resolveMinimizeToTraySetting(
  value: boolean | null | undefined
): boolean {
  if (value === undefined || value === null) {
    return MINIMIZE_TO_TRAY_DEFAULT;
  }
  return value;
}

/**
 * Read minimize-to-tray at close time (synchronous). Missing row / NULL → default true.
 */
export function readMinimizeToTrayEnabled(db: AppDatabase): boolean {
  const row = db
    .select({ minimizeToTray: settings.minimizeToTray })
    .from(settings)
    .where(eq(settings.id, SETTINGS_ID))
    .limit(1)
    .all()[0];
  if (row === undefined) {
    return MINIMIZE_TO_TRAY_DEFAULT;
  }
  return resolveMinimizeToTraySetting(row.minimizeToTray);
}

/**
 * Window close policy. When quit is in progress: always allow-close and never call
 * readMinimizeToTrayEnabled (DB may already be closed).
 */
export function decideMainWindowCloseAction(
  input: DecideMainWindowCloseInput
): MainWindowCloseAction {
  if (input.isQuitInProgress || input.isTestMode) {
    return "allow-close";
  }
  // macOS: closing the window must not quit the app (Dock convention).
  if (input.platform === "darwin") {
    return "hide-to-tray";
  }
  if (input.readMinimizeToTrayEnabled()) {
    return "hide-to-tray";
  }
  return "allow-close";
}

export type RevealMainWindowOptions = {
  mainWindow: RevealableMainWindow | null;
  recreateWindow: () => void;
};

/**
 * second-instance / tray reveal: recreate if gone, restore if minimized, show if hidden, focus.
 */
export function revealMainWindow(options: RevealMainWindowOptions): void {
  const { mainWindow, recreateWindow } = options;
  if (!mainWindow || mainWindow.isDestroyed()) {
    recreateWindow();
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  mainWindow.focus();
}
