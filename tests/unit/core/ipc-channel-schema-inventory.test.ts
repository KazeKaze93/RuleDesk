import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ipcMain } from "electron";
import { z } from "zod";
import { BaseController } from "@/main/core/ipc/BaseController";

vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
    on: vi.fn(),
  },
  app: {
    getPath: vi.fn(() => "/tmp"),
    getVersion: vi.fn(() => "0.0.0"),
  },
  clipboard: { writeText: vi.fn() },
  shell: { openPath: vi.fn(), openExternal: vi.fn() },
  dialog: { showOpenDialog: vi.fn() },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      console: { level: false, format: "" },
      file: {
        level: "info",
        resolvePathFn: vi.fn(),
        getFile: () => ({ path: "/tmp/ruledesk.log" }),
      },
      ipc: {},
    },
    errorHandler: {
      startCatching: () => undefined,
    },
  },
}));

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn(() => ({
    id: "rule34",
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: vi.fn().mockResolvedValue([]),
    searchTags: vi.fn().mockResolvedValue([]),
  })),
  PROVIDER_IDS: ["rule34", "gelbooru"],
}));

vi.mock("@/main/db/client", () => ({
  getDb: vi.fn(),
  getSqliteInstance: vi.fn(),
  closeDatabase: vi.fn(),
  initializeDatabase: vi.fn(),
}));

import { ArtistsController } from "@/main/ipc/controllers/ArtistsController";
import { AuthController } from "@/main/ipc/controllers/AuthController";
import { BlacklistController } from "@/main/ipc/controllers/BlacklistController";
import { FileController } from "@/main/ipc/controllers/FileController";
import { MaintenanceController } from "@/main/ipc/controllers/MaintenanceController";
import { PlaylistController } from "@/main/ipc/controllers/PlaylistController";
import { PostsController } from "@/main/ipc/controllers/PostsController";
import { SearchController } from "@/main/ipc/controllers/SearchController";
import { SettingsController } from "@/main/ipc/controllers/SettingsController";
import { StatsController } from "@/main/ipc/controllers/StatsController";
import { SystemController } from "@/main/ipc/controllers/SystemController";
import { UpdatesController } from "@/main/ipc/controllers/UpdatesController";
import { VideoProxyController } from "@/main/ipc/controllers/VideoProxyController";
import { ViewerController } from "@/main/ipc/controllers/ViewerController";
import type { MaintenanceService } from "@/main/services/MaintenanceService";
import type { UpdaterService } from "@/main/services/updater-service";
import type { VideoProxyServer } from "@/main/services/video-proxy-server";

/**
 * Mirror `setupIpc()` controller registration so the inventory covers every
 * production `BaseController.handle` path (Zod schema required).
 */
function registerAllProductionControllers(): void {
  // boundary: test stub for VideoProxyController constructor
  const videoProxy = {
    getProxyUrl: () => "",
  } as unknown as VideoProxyServer;

  // boundary: test stub for SystemController constructor
  const updater = {
    checkForUpdates: vi.fn(),
    openReleasePage: vi.fn(),
  } as unknown as UpdaterService;

  // boundary: test stub for MaintenanceController constructor
  const maintenance = {
    getVacuumStatus: vi.fn(),
    runVacuum: vi.fn(),
    getVacuumSchedule: vi.fn(),
    setVacuumSchedule: vi.fn(),
  } as unknown as MaintenanceService;

  new VideoProxyController(videoProxy).setup();
  new SystemController(videoProxy, updater).setup();
  new ArtistsController().setup();
  const postsController = new PostsController();
  postsController.setup();
  new SettingsController().setup();
  new AuthController().setup();
  new MaintenanceController(maintenance).setup();
  new ViewerController().setup();
  const fileController = new FileController();
  fileController.setPostsController(postsController);
  fileController.setup();
  new SearchController().setup();
  new PlaylistController().setup();
  new StatsController().setup();
  new BlacklistController().setup();
  new UpdatesController().setup();
}

describe("IPC channel Zod schema inventory", () => {
  beforeEach(() => {
    vi.mocked(ipcMain.handle).mockClear();
    vi.mocked(ipcMain.removeHandler).mockClear();
    BaseController.clearRegisteredChannelSchemasForTests();
  });

  afterEach(() => {
    BaseController.clearRegisteredChannelSchemasForTests();
    vi.clearAllMocks();
  });

  it("registers every production channel with a Zod schema", () => {
    registerAllProductionControllers();

    const inventory = BaseController.getRegisteredChannelSchemas();
    const channels = [...inventory.keys()].sort();

    expect(channels.length).toBeGreaterThan(0);
    expect(inventory.size).toBe(channels.length);

    const missingSchema: string[] = [];
    for (const [channel, schema] of inventory) {
      expect(channel.length).toBeGreaterThan(0);
      if (schema === undefined || schema === null) {
        missingSchema.push(channel);
        continue;
      }
      // Zod schemas expose safeParse; empty-arg channels use z.tuple([]) (or equivalent).
      expect(typeof schema.safeParse).toBe("function");
      expect(schema).toBeInstanceOf(z.ZodType);
    }

    expect(missingSchema).toEqual([]);

    // Stable inventory size: bump intentionally when adding a handle() registration.
    expect(inventory.size).toBe(90);
  });
});
