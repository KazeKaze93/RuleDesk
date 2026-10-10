import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { ipcMain } from "electron";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { settings, SETTINGS_ID } from "@/main/db/schema";
import { IPC_CHANNELS } from "@/main/ipc/channels";
import { SettingsController } from "@/main/ipc/controllers/SettingsController";

vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      console: {
        level: false,
        format: "",
      },
      file: {
        level: "info",
        resolvePathFn: vi.fn(),
      },
      ipc: {},
    },
    errorHandler: {
      startCatching: vi.fn(),
    },
  },
}));

describe("SettingsController Integration", () => {
  const scheduler = {
    restart: vi.fn(),
  };

  let mockDb: ReturnType<typeof createMockDb>;
  let controller: SettingsController;

  beforeEach(async () => {
    vi.clearAllMocks();
    container.clear();

    mockDb = createMockDb();
    container.register(DI_TOKENS.DB, mockDb.db);
    container.register(DI_TOKENS.SYNC_SCHEDULER, scheduler);

    await mockDb.db
      .insert(settings)
      .values({
        id: SETTINGS_ID,
        userId: "123",
        encryptedApiKey: "encrypted",
        isSafeMode: true,
        isAdultConfirmed: false,
        isAdultVerified: false,
        tosAcceptedAt: null,
        theme: "system",
        autoSyncOnStartup: false,
        autoSyncOnArtistAdd: false,
        syncIntervalMinutes: 30,
      })
      .run();

    controller = new SettingsController();
    controller.setup();
  });

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // ignore close errors in tests
      }
    }
    container.clear();
  });

  it("keeps existing sync interval on partial save", async () => {
    const saveCall = vi
      .mocked(ipcMain.handle)
      .mock.calls.find(([channel]) => channel === IPC_CHANNELS.SETTINGS.SAVE);

    expect(saveCall).toBeDefined();
    if (!saveCall) {
      throw new Error("SETTINGS.SAVE handler was not registered");
    }

    const invokeHandler = saveCall[1];
    await invokeHandler(undefined, { autoSyncOnStartup: true });

    const updated = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    expect(updated).toBeDefined();
    expect(updated?.syncIntervalMinutes).toBe(30);
    expect(updated?.autoSyncOnStartup).toBe(true);
    expect(updated?.autoSyncOnArtistAdd).toBe(false);
    expect(scheduler.restart).toHaveBeenCalledWith(30);
  });

  it("keeps existing proxyUrl when partial save only updates syncIntervalMinutes", async () => {
    await mockDb.db
      .update(settings)
      .set({ proxyUrl: "http://127.0.0.1:8080" })
      .where(eq(settings.id, SETTINGS_ID))
      .run();

    const saveCall = vi
      .mocked(ipcMain.handle)
      .mock.calls.find(([channel]) => channel === IPC_CHANNELS.SETTINGS.SAVE);

    expect(saveCall).toBeDefined();
    if (!saveCall) {
      throw new Error("SETTINGS.SAVE handler was not registered");
    }

    const invokeHandler = saveCall[1];
    await invokeHandler(undefined, { syncIntervalMinutes: 15 });

    const updated = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    expect(updated).toBeDefined();
    expect(updated?.syncIntervalMinutes).toBe(15);
    expect(updated?.proxyUrl).toBe("http://127.0.0.1:8080");
    expect(scheduler.restart).toHaveBeenCalledWith(15);
  });

  it("clears proxyUrl when save explicitly sends null", async () => {
    await mockDb.db
      .update(settings)
      .set({ proxyUrl: "http://127.0.0.1:8080" })
      .where(eq(settings.id, SETTINGS_ID))
      .run();

    const saveCall = vi
      .mocked(ipcMain.handle)
      .mock.calls.find(([channel]) => channel === IPC_CHANNELS.SETTINGS.SAVE);

    expect(saveCall).toBeDefined();
    if (!saveCall) {
      throw new Error("SETTINGS.SAVE handler was not registered");
    }

    const invokeHandler = saveCall[1];
    await invokeHandler(undefined, { proxyUrl: null });

    const updated = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    expect(updated).toBeDefined();
    expect(updated?.proxyUrl).toBeNull();
  });

  it("keeps other sync fields when saving autoSyncOnArtistAdd", async () => {
    const saveCall = vi
      .mocked(ipcMain.handle)
      .mock.calls.find(([channel]) => channel === IPC_CHANNELS.SETTINGS.SAVE);

    expect(saveCall).toBeDefined();
    if (!saveCall) {
      throw new Error("SETTINGS.SAVE handler was not registered");
    }

    const invokeHandler = saveCall[1];
    await invokeHandler(undefined, { autoSyncOnArtistAdd: true });

    const updated = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    expect(updated).toBeDefined();
    expect(updated?.syncIntervalMinutes).toBe(30);
    expect(updated?.autoSyncOnStartup).toBe(false);
    expect(updated?.autoSyncOnArtistAdd).toBe(true);
    expect(scheduler.restart).toHaveBeenCalledWith(30);
  });

  it("keeps minimizeToTray when saving unrelated fields and updates on explicit save", async () => {
    const saveCall = vi
      .mocked(ipcMain.handle)
      .mock.calls.find(([channel]) => channel === IPC_CHANNELS.SETTINGS.SAVE);

    expect(saveCall).toBeDefined();
    if (!saveCall) {
      throw new Error("SETTINGS.SAVE handler was not registered");
    }

    const invokeHandler = saveCall[1];
    await invokeHandler(undefined, { autoSyncOnStartup: true });

    let updated = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });
    expect(updated?.minimizeToTray).toBe(true);

    await invokeHandler(undefined, { minimizeToTray: false });

    updated = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });
    expect(updated?.minimizeToTray).toBe(false);
    expect(updated?.autoSyncOnStartup).toBe(true);
  });
});
