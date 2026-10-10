import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "../../../src/main/db/schema";
import { container, DI_TOKENS } from "../../../src/main/core/di/Container";
import { BATCH_DOWNLOAD_CHUNK_SIZE } from "../../../src/shared/constants";

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
    debug: vi.fn(),
    warn: vi.fn(),
    transports: {
      main: { level: false },
      file: {
        level: false,
        fileName: "app.log",
        resolvePathFn: vi.fn(),
      },
      console: { level: false },
      renderer: { level: false },
      ipc: {},
    },
    errorHandler: {
      startCatching: vi.fn(),
    },
  },
}));

let mockDb: ReturnType<typeof createMockDb>;

vi.mock("../../../src/main/db/client", () => ({
  getSqliteInstance: () => mockDb.sqlite,
}));

import { PostsController } from "../../../src/main/ipc/controllers/PostsController";

describe("artist mass-download cursor", () => {
  let artistId: number;

  beforeEach(() => {
    container.clear();
    mockDb = createMockDb();
    container.register(DI_TOKENS.DB, mockDb.db);

    const inserted = mockDb.db
      .insert(artists)
      .values({
        name: "krekk0v",
        tag: "krekk0v",
        type: "tag",
        provider: "rule34",
        apiEndpoint: "https://api.rule34.xxx/",
        createdAt: new Date(),
      })
      .returning({ id: artists.id })
      .get();
    artistId = inserted.id;

    const now = new Date();
    for (let i = 1; i <= 250; i++) {
      mockDb.db
        .insert(posts)
        .values({
          postId: 10_000 + i,
          artistId,
          fileUrl: `https://example.com/${i}.jpg`,
          previewUrl: `https://example.com/p${i}.jpg`,
          tags: "tag",
          publishedAt: now,
          createdAt: now,
        })
        .run();
    }
  });

  afterEach(() => {
    mockDb.sqlite.close();
    container.clear();
  });

  it("snapshots upperBound and walks id ASC in fixed chunks without including later inserts", () => {
    const controller = new PostsController();
    const snap = controller.snapshotArtistMassDownload(artistId, undefined);
    expect(snap.total).toBe(250);
    expect(snap.upperBoundId).toBeGreaterThan(0);

    mockDb.db
      .insert(posts)
      .values({
        postId: 99_999,
        artistId,
        fileUrl: "https://example.com/new.jpg",
        previewUrl: "https://example.com/newp.jpg",
        tags: "tag",
        publishedAt: new Date(),
        createdAt: new Date(),
      })
      .run();

    let cursorId = 0;
    const seen: number[] = [];
    for (;;) {
      const chunk = controller.fetchArtistMassDownloadChunk({
        artistId,
        filters: undefined,
        cursorId,
        upperBoundId: snap.upperBoundId,
        limit: BATCH_DOWNLOAD_CHUNK_SIZE,
      });
      if (chunk.length === 0) {
        break;
      }
      expect(chunk.length).toBeLessThanOrEqual(BATCH_DOWNLOAD_CHUNK_SIZE);
      for (const row of chunk) {
        expect(row.id).toBeGreaterThan(cursorId);
        expect(row.id).toBeLessThanOrEqual(snap.upperBoundId);
        seen.push(row.id);
      }
      const last = chunk[chunk.length - 1];
      if (!last) {
        break;
      }
      cursorId = last.id;
    }

    expect(seen).toHaveLength(250);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(seen.every((id) => id <= snap.upperBoundId)).toBe(true);
  });
});
