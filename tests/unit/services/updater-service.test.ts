import { beforeEach, describe, expect, it, vi } from "vitest";

const openExternal = vi.fn(async () => undefined);
const checkForUpdates = vi.fn(async () => undefined);
const listeners = new Map<string, (...args: unknown[]) => void>();

vi.mock("electron", () => ({
  BrowserWindow: class {},
  shell: {
    openExternal: (...args: unknown[]) => openExternal(...args),
  },
}));

vi.mock("electron-updater", () => ({
  default: {
    autoUpdater: {
      logger: null,
      autoDownload: false,
      autoInstallOnAppQuit: false,
      on: (event: string, cb: (...args: unknown[]) => void) => {
        listeners.set(event, cb);
      },
      checkForUpdates: (...args: unknown[]) => checkForUpdates(...args),
    },
  },
}));

vi.mock("@/main/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("UpdaterService", () => {
  beforeEach(() => {
    vi.resetModules();
    listeners.clear();
    openExternal.mockClear();
    checkForUpdates.mockClear();
  });

  async function loadService() {
    const mod = await import("@/main/services/updater-service");
    return new mod.UpdaterService();
  }

  function emit(event: string, ...args: unknown[]) {
    const cb = listeners.get(event);
    if (!cb) {
      throw new Error(`No listener for ${event}`);
    }
    cb(...args);
  }

  it("notifies the window on available and opens the tag URL from Main state", async () => {
    const service = await loadService();
    const send = vi.fn();
    const windowStub = {
      isDestroyed: () => false,
      webContents: { send },
    };
    service.setWindow(
      windowStub as unknown as import("electron").BrowserWindow
    );

    emit("update-available", { version: "18.2.0" });

    expect(send).toHaveBeenCalledWith("updater:status", {
      status: "available",
      version: "18.2.0",
    });

    await service.openReleasePage();
    expect(openExternal).toHaveBeenCalledWith(
      "https://github.com/KazeKaze93/ruledesk/releases/tag/v18.2.0"
    );
  });

  it("does not send error status to the renderer (log-only)", async () => {
    const service = await loadService();
    const send = vi.fn();
    const windowStub = {
      isDestroyed: () => false,
      webContents: { send },
    };
    service.setWindow(
      windowStub as unknown as import("electron").BrowserWindow
    );

    emit("error", new Error("ENOTFOUND api.github.com"));

    expect(send).not.toHaveBeenCalled();
  });

  it("falls back to /latest when no update-available version was stored", async () => {
    const service = await loadService();
    await service.openReleasePage();
    expect(openExternal).toHaveBeenCalledWith(
      "https://github.com/KazeKaze93/ruledesk/releases/latest"
    );
  });

  it("falls back to /latest when update-available version is not semver", async () => {
    const service = await loadService();
    emit("update-available", { version: "../not-semver" });
    await service.openReleasePage();
    expect(openExternal).toHaveBeenCalledWith(
      "https://github.com/KazeKaze93/ruledesk/releases/latest"
    );
  });
});
