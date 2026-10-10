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

/**
 * Read minimize-to-tray at close time (synchronous). Missing row → default true.
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
  return row.minimizeToTray ?? MINIMIZE_TO_TRAY_DEFAULT;
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
