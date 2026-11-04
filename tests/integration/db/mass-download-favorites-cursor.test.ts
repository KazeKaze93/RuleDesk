import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "../../../src/main/db/schema";
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
    },
    errorHandler: {
      startCatching: vi.fn(),
    },
  },
}));

let mockDb: ReturnType<typeof createMockDb>;

vi.mock("../../../src/main/db/client", () => ({
  getSqliteInstance: () => mockDb.sqlite,
  getDb: () => mockDb.db,
}));

import { PostsController } from "../../../src/main/ipc/controllers/PostsController";

describe("favorites mass-download cursor", () => {
  let artistId: number;

  beforeEach(() => {
    mockDb = createMockDb();

    const inserted = mockDb.db
      .insert(artists)
      .values({
        name: "fav-artist",
        tag: "fav_artist",
        type: "tag",
        provider: "rule34",
        apiEndpoint: "https://api.rule34.xxx/",
        createdAt: new Date(),
      })
      .returning({ id: artists.id })
      .get();
    artistId = inserted.id;

    const now = new Date();
    for (let i = 1; i <= 40; i++) {
      mockDb.db
        .insert(posts)
        .values({
          postId: 20_000 + i,
          artistId,
          fileUrl: `https://example.com/fav-${i}.jpg`,
          previewUrl: `https://example.com/fav-p${i}.jpg`,
          tags: "tag",
          publishedAt: now,
          createdAt: now,
          isFavorited: i <= 25,
        })
        .run();
    }
  });

  afterEach(() => {
    mockDb.sqlite.close();
  });

  it("snapshots only favorited posts and walks id ASC within upperBound", () => {
    const controller = new PostsController();
    const snap = controller.snapshotMassDownload({ kind: "favorites" });
    expect(snap.total).toBe(25);
    expect(snap.upperBoundId).toBeGreaterThan(0);

    mockDb.db
      .insert(posts)
      .values({
        postId: 99_999,
        artistId,
        fileUrl: "https://example.com/new-fav.jpg",
        previewUrl: "https://example.com/new-fav-p.jpg",
        tags: "tag",
        publishedAt: new Date(),
        createdAt: new Date(),
        isFavorited: true,
      })
      .run();

    let cursorId = 0;
    const seen: number[] = [];
    for (;;) {
      const chunk = controller.fetchMassDownloadChunk({
        target: { kind: "favorites" },
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

    expect(seen).toHaveLength(25);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  it("applies optional filters on top of isFavorited", () => {
    const controller = new PostsController();
    const mediaSnap = controller.snapshotMassDownload({
      kind: "favorites",
      filters: { mediaType: "videos" },
    });
    expect(mediaSnap.total).toBe(0);

    const allSnap = controller.snapshotMassDownload({
      kind: "favorites",
      filters: { mediaType: "images" },
    });
    expect(allSnap.total).toBe(25);
  });
});
