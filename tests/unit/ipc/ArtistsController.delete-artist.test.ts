import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { IpcMainInvokeEvent } from "electron";
import { eq } from "drizzle-orm";
import { createMockDb } from "../../helpers/mock-db";
import { artists, SETTINGS_ID, settings } from "@/main/db/schema";
import { EXTERNAL_ARTIST_ID } from "@/shared/constants";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { DELETE_ARTIST_SYNC_DRAIN_MS } from "@/main/config/constants";

vi.mock("electron", () => ({
  app: { getPath: () => "/tmp" },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      console: { level: false, format: "" },
      file: {
        level: "info",
        fileName: "app.log",
        resolvePathFn: vi.fn(),
      },
      ipc: {},
    },
    errorHandler: { startCatching: vi.fn() },
  },
}));

import { ArtistsController } from "@/main/ipc/controllers/ArtistsController";

// boundary: test stub for unused IpcMainInvokeEvent parameter
const dummyEvent = {} as IpcMainInvokeEvent;

describe("ArtistsController.deleteArtist sync coordination", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: ArtistsController;
  let cancelArtistSyncAndWait: ReturnType<typeof vi.fn>;
  let isArtistSyncActive: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container.clear();
    mockDb = createMockDb();
    container.register(DI_TOKENS.DB, mockDb.db);

    cancelArtistSyncAndWait = vi.fn();
    isArtistSyncActive = vi.fn();
    container.register(DI_TOKENS.SYNC_SERVICE, {
      cancelArtistSyncAndWait,
      isArtistSyncActive,
    });

    mockDb.db
      .insert(settings)
      .values({
        id: SETTINGS_ID,
        userId: "1",
        encryptedApiKey: "x",
        isSafeMode: false,
        isAdultConfirmed: true,
        isAdultVerified: true,
      })
      .run();

    controller = new ArtistsController();
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // ignore
    }
    container.clear();
  });

  function insertArtist(tag: string): number {
    const [row] = mockDb.db
      .insert(artists)
      .values({
        name: tag,
        tag,
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
        lastPostId: 0,
        newPostsCount: 0,
      })
      .returning({ id: artists.id })
      .all();
    return row.id;
  }

  async function deleteArtist(id: number) {
    return controller["deleteArtist"](dummyEvent, id);
  }

  it("deletes immediately when artist is not syncing", async () => {
    const id = insertArtist("idle_del");
    isArtistSyncActive.mockReturnValue(false);

    const result = await deleteArtist(id);

    expect(result).toEqual({ ok: true });
    expect(cancelArtistSyncAndWait).not.toHaveBeenCalled();
    expect(
      mockDb.db.select().from(artists).where(eq(artists.id, id)).all()
    ).toHaveLength(0);
  });

  it("waits for sync cancel then deletes", async () => {
    const id = insertArtist("syncing_del");
    isArtistSyncActive.mockReturnValue(true);
    cancelArtistSyncAndWait.mockResolvedValue(true);

    const result = await deleteArtist(id);

    expect(cancelArtistSyncAndWait).toHaveBeenCalledWith(
      id,
      DELETE_ARTIST_SYNC_DRAIN_MS
    );
    expect(result).toEqual({ ok: true });
    expect(
      mockDb.db.select().from(artists).where(eq(artists.id, id)).all()
    ).toHaveLength(0);
  });

  it("refuses delete on sync cancel timeout without removing the row", async () => {
    const id = insertArtist("timeout_del");
    isArtistSyncActive.mockReturnValue(true);
    cancelArtistSyncAndWait.mockResolvedValue(false);

    const result = await deleteArtist(id);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected timeout result");
    }
    expect(result.reason).toBe("sync_busy_timeout");
    expect(
      mockDb.db.select().from(artists).where(eq(artists.id, id)).all()
    ).toHaveLength(1);
  });

  it("rejects EXTERNAL_ARTIST_ID", async () => {
    isArtistSyncActive.mockReturnValue(false);
    await expect(deleteArtist(EXTERNAL_ARTIST_ID)).rejects.toThrow(
      /external artist/i
    );
  });
});
