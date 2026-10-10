import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createMockDb } from "../../helpers/mock-db";
import { SETTINGS_ID, settings } from "../../../src/main/db/schema";
import {
  MINIMIZE_TO_TRAY_DEFAULT,
  readMinimizeToTrayEnabled,
  revealMainWindow,
  type RevealableMainWindow,
} from "../../../src/main/lib/tray-window-lifecycle";

function createRevealableWindow(
  overrides: Partial<RevealableMainWindow> = {}
): RevealableMainWindow {
  return {
    isDestroyed: () => false,
    isMinimized: () => false,
    isVisible: () => true,
    restore: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    ...overrides,
  };
}

describe("readMinimizeToTrayEnabled", () => {
  it("returns default true when settings row is missing", () => {
    const mockDb = createMockDb();
    expect(readMinimizeToTrayEnabled(mockDb.db)).toBe(MINIMIZE_TO_TRAY_DEFAULT);
    expect(readMinimizeToTrayEnabled(mockDb.db)).toBe(true);
    mockDb.sqlite.close();
  });

  it("reads the stored minimizeToTray flag at call time", () => {
    const mockDb = createMockDb();
    mockDb.db
      .insert(settings)
      .values({
        id: SETTINGS_ID,
        userId: "1",
        encryptedApiKey: "enc",
        minimizeToTray: false,
      })
      .run();

    expect(readMinimizeToTrayEnabled(mockDb.db)).toBe(false);

    mockDb.db
      .update(settings)
      .set({ minimizeToTray: true })
      .where(eq(settings.id, SETTINGS_ID))
      .run();

    expect(readMinimizeToTrayEnabled(mockDb.db)).toBe(true);
    mockDb.sqlite.close();
  });
});

describe("revealMainWindow", () => {
  it("recreates when the window is missing or destroyed", () => {
    const recreateWindow = vi.fn();
    revealMainWindow({ mainWindow: null, recreateWindow });
    expect(recreateWindow).toHaveBeenCalledOnce();

    recreateWindow.mockClear();
    revealMainWindow({
      mainWindow: createRevealableWindow({ isDestroyed: () => true }),
      recreateWindow,
    });
    expect(recreateWindow).toHaveBeenCalledOnce();
  });

  it("restores minimized, shows hidden, then focuses", () => {
    const restore = vi.fn();
    const show = vi.fn();
    const focus = vi.fn();
    const recreateWindow = vi.fn();

    revealMainWindow({
      mainWindow: createRevealableWindow({
        isMinimized: () => true,
        isVisible: () => false,
        restore,
        show,
        focus,
      }),
      recreateWindow,
    });

    expect(recreateWindow).not.toHaveBeenCalled();
    expect(restore).toHaveBeenCalledOnce();
    expect(show).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
  });

  it("shows a hidden non-minimized window and focuses", () => {
    const restore = vi.fn();
    const show = vi.fn();
    const focus = vi.fn();

    revealMainWindow({
      mainWindow: createRevealableWindow({
        isMinimized: () => false,
        isVisible: () => false,
        restore,
        show,
        focus,
      }),
      recreateWindow: vi.fn(),
    });

    expect(restore).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
  });
});
