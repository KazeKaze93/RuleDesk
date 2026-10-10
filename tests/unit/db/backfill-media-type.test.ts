import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "../../../src/main/db/schema";
import log from "electron-log";
import * as mediaUtils from "@shared/utils/media";

vi.mock("electron", () => ({
  app: { getPath: () => "/tmp" },
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

import {
  BACKFILL_MEDIA_TYPE_BATCH_SIZE,
  backfillMediaType,
} from "../../../src/main/db/backfill-media-type";

function readCount(row: unknown): number {
  if (
    typeof row === "object" &&
    row !== null &&
    "c" in row &&
    typeof row.c === "number"
  ) {
    return row.c;
  }
  throw new Error(`unexpected count row: ${JSON.stringify(row)}`);
}

function readMediaType(row: unknown): string | null {
  if (typeof row !== "object" || row === null || !("mediaType" in row)) {
    throw new Error(`unexpected media row: ${JSON.stringify(row)}`);
  }
  const value = row.mediaType;
  if (value === null || typeof value === "string") {
    return value;
  }
  throw new Error(`unexpected mediaType: ${JSON.stringify(value)}`);
}

describe("backfillMediaType cursor", () => {
  let artistId: number;

  beforeEach(() => {
    mockDb = createMockDb();
    vi.clearAllMocks();

    const inserted = mockDb.db
      .insert(artists)
      .values({
        name: "Backfill Artist",
        tag: "backfill_artist",
        type: "tag",
        provider: "rule34",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .returning({ id: artists.id })
      .get();
    artistId = inserted.id;
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // ignore
    }
    vi.restoreAllMocks();
  });

  function insertPost(opts: { postId: number; fileUrl: string }): number {
    const row = mockDb.db
      .insert(posts)
      .values({
        postId: opts.postId,
        artistId,
        fileUrl: opts.fileUrl,
        previewUrl: "",
        sampleUrl: "",
        tags: "t",
        publishedAt: new Date(),
        createdAt: new Date(),
        mediaType: null,
      })
      .returning({ id: posts.id })
      .get();
    return row.id;
  }

  function nullMediaCount(): number {
    return readCount(
      mockDb.sqlite
        .prepare("SELECT COUNT(*) AS c FROM posts WHERE media_type IS NULL")
        .get()
    );
  }

  it("leaves empty-URL rows NULL and finishes", async () => {
    const emptyId = insertPost({ postId: 1, fileUrl: "" });
    insertPost({ postId: 2, fileUrl: "https://cdn.example.com/a.jpg" });

    await backfillMediaType();

    expect(
      readMediaType(
        mockDb.sqlite
          .prepare("SELECT media_type AS mediaType FROM posts WHERE id = ?")
          .get(emptyId)
      )
    ).toBeNull();
    expect(nullMediaCount()).toBe(1);

    const complete = vi
      .mocked(log.info)
      .mock.calls.map((c) => String(c[0]))
      .find((m) => m.includes("Backfill complete"));
    expect(complete).toMatch(/filled 1/);
    expect(complete).toMatch(/undetermined 1/);
  });

  it("treats spy-null unknown URLs as undetermined and still exits", async () => {
    insertPost({ postId: 10, fileUrl: "https://cdn.example.com/x.unknown" });
    insertPost({ postId: 11, fileUrl: "https://cdn.example.com/y.mp4" });

    vi.spyOn(mediaUtils, "getMediaTypeFromUrl").mockImplementation((url) => {
      if (url?.includes(".unknown")) return null;
      if (url?.includes(".mp4")) return "video";
      return "image";
    });

    await backfillMediaType();

    expect(nullMediaCount()).toBe(1);
    expect(
      readMediaType(
        mockDb.sqlite
          .prepare(
            "SELECT media_type AS mediaType FROM posts WHERE post_id = 11"
          )
          .get()
      )
    ).toBe("video");
  });

  it("fills known types across multiple batches and exits", async () => {
    const total = BACKFILL_MEDIA_TYPE_BATCH_SIZE + 20;
    for (let i = 1; i <= total; i += 1) {
      const empty = i % 7 === 0;
      insertPost({
        postId: 1000 + i,
        fileUrl: empty
          ? ""
          : i % 5 === 0
            ? `https://cdn.example.com/${i}.webm`
            : `https://cdn.example.com/${i}.jpg`,
      });
    }

    const expectedIterations = Math.ceil(
      total / BACKFILL_MEDIA_TYPE_BATCH_SIZE
    );

    await backfillMediaType();

    const stillNull = nullMediaCount();
    expect(stillNull).toBeGreaterThan(0);
    const filled = readCount(
      mockDb.sqlite
        .prepare(
          "SELECT COUNT(*) AS c FROM posts WHERE media_type IS NOT NULL"
        )
        .get()
    );
    expect(filled).toBe(total - stillNull);

    const complete = vi
      .mocked(log.info)
      .mock.calls.map((c) => String(c[0]))
      .find((m) => m.includes("Backfill complete"));
    expect(complete).toMatch(new RegExp(`in ${expectedIterations} batches`));
  });

  it("logs a batch error and continues past the failed batch", async () => {
    insertPost({ postId: 50, fileUrl: "https://cdn.example.com/ok.jpg" });
    insertPost({
      postId: 51,
      fileUrl: "https://cdn.example.com/boom.jpg",
    });
    insertPost({ postId: 52, fileUrl: "https://cdn.example.com/after.jpg" });

    vi.spyOn(mediaUtils, "getMediaTypeFromUrl").mockImplementation((url) => {
      if (url?.includes("boom")) {
        throw new Error("simulated media probe failure");
      }
      return "image";
    });

    await backfillMediaType();

    expect(vi.mocked(log.error)).toHaveBeenCalled();
    const errorMsg = String(vi.mocked(log.error).mock.calls[0]?.[0] ?? "");
    expect(errorMsg).toMatch(/Batch failed ids/);

    expect(
      readMediaType(
        mockDb.sqlite
          .prepare(
            "SELECT media_type AS mediaType FROM posts WHERE post_id = 52"
          )
          .get()
      )
    ).toBeNull();

    vi.mocked(mediaUtils.getMediaTypeFromUrl).mockRestore();
    await backfillMediaType();
    expect(nullMediaCount()).toBe(0);
  });
});
