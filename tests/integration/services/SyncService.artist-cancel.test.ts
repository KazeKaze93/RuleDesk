import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { server } from "../../mocks/server";
import { artists, posts, settings, SETTINGS_ID } from "@/main/db/schema";
import { eq } from "drizzle-orm";
import { getProvider } from "@/main/providers";
import type { FetchPostsResult } from "@/main/providers/types";
import {
  areRuntimeDroppableFtsTriggersPresent,
  ensureFtsTriggers,
} from "@/main/db/fts-triggers";
import { SyncService } from "@/main/services/sync-service";

vi.mock("electron", () => ({
  app: { getPath: () => "/tmp" },
  safeStorage: {
    isEncryptionAvailable: () => true,
    decryptString: () => "test-api-key-12345",
    encryptString: (text: string) => Buffer.from(text).toString("base64"),
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

let mockDbInstance: ReturnType<typeof createMockDb>["db"] | null = null;
let mockSqliteInstance: ReturnType<typeof createMockDb>["sqlite"] | null = null;

vi.mock("@/main/db/client", () => ({
  getDb: () => {
    if (!mockDbInstance) {
      throw new Error("Mock DB not set");
    }
    return mockDbInstance;
  },
  initializeDatabase: vi.fn(),
  getSqliteInstance: () => {
    if (!mockSqliteInstance) {
      throw new Error("Mock SQLite not set");
    }
    return mockSqliteInstance;
  },
  closeDatabase: vi.fn(),
}));

const EMPTY_PAGE: FetchPostsResult = {
  posts: [],
  rawItemCount: 0,
  rejectedPostIds: [],
};

function assertIntegrityOk(
  sqlite: ReturnType<typeof createMockDb>["sqlite"]
): void {
  const rows = sqlite.pragma("integrity_check");
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("unexpected integrity_check shape");
  }
  const first = rows[0];
  if (
    typeof first !== "object" ||
    first === null ||
    !("integrity_check" in first) ||
    first.integrity_check !== "ok"
  ) {
    throw new Error(`integrity_check failed: ${JSON.stringify(rows)}`);
  }
  sqlite.exec(`INSERT INTO posts_fts(posts_fts) VALUES('integrity-check');`);
}

function ftsMatchCount(
  sqlite: ReturnType<typeof createMockDb>["sqlite"],
  token: string
): number {
  const row = sqlite
    .prepare(
      `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH ?`
    )
    .get(token);
  if (
    typeof row !== "object" ||
    row === null ||
    !("c" in row) ||
    typeof row.c !== "number"
  ) {
    throw new Error("unexpected MATCH count shape");
  }
  return row.c;
}

describe("SyncService per-artist cancel + FTS window", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let service: SyncService;
  let artistId: number;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    mockDb = createMockDb();
    mockDbInstance = mockDb.db;
    mockSqliteInstance = mockDb.sqlite;

    await mockDb.db.insert(settings).values({
      id: SETTINGS_ID,
      userId: "12345",
      encryptedApiKey: Buffer.from("test-api-key-12345").toString("base64"),
      isSafeMode: false,
      isAdultConfirmed: true,
      isAdultVerified: true,
    });

    // Name sorts before "Indexed Other" so Sync All starts initial sync here first
    const [artist] = await mockDb.db
      .insert(artists)
      .values({
        name: "AAA Cancel Artist",
        tag: "cancel_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/index.php",
        lastPostId: 0,
        newPostsCount: 0,
      })
      .returning({ id: artists.id });

    artistId = artist.id;
    server.resetHandlers();
    service = new SyncService();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // ignore
    }
    mockDbInstance = null;
    mockSqliteInstance = null;
  });

  it("cancelArtistSyncAndWait ends initial sync with all three FTS triggers restored", async () => {
    const provider = getProvider("rule34");
    let releaseFetch: (() => void) | null = null;
    const fetchGate = new Promise<void>((resolve) => {
      releaseFetch = resolve;
    });

    vi.spyOn(provider, "fetchPosts").mockImplementation(async () => {
      await fetchGate;
      return EMPTY_PAGE;
    });

    const syncPromise = service.syncAllArtists();

    await vi.waitFor(() => {
      expect(service.isArtistSyncActive(artistId)).toBe(true);
    });

    expect(areRuntimeDroppableFtsTriggersPresent(mockDb.sqlite)).toBe(false);

    const waitPromise = service.cancelArtistSyncAndWait(artistId, 5_000);
    releaseFetch?.();
    const drained = await waitPromise;
    await syncPromise;

    expect(drained).toBe(true);
    expect(service.isArtistSyncActive(artistId)).toBe(false);
    expect(areRuntimeDroppableFtsTriggersPresent(mockDb.sqlite)).toBe(true);
    expect(ensureFtsTriggers(mockDb.sqlite).recreated).toEqual([]);
    assertIntegrityOk(mockDb.sqlite);
  });

  it("cancelArtistSyncAndWait ends hung fetchPosts that honors AbortSignal", async () => {
    const provider = getProvider("rule34");
    vi.spyOn(provider, "fetchPosts").mockImplementation(
      (_tags, _page, _settings, _isRandom, _limit, signal) =>
        new Promise((_resolve, reject) => {
          if (signal?.aborted) {
            reject(new DOMException("The operation was aborted.", "AbortError"));
            return;
          }
          const onAbort = () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          };
          signal?.addEventListener("abort", onAbort, { once: true });
        })
    );

    const syncPromise = service.syncAllArtists();

    await vi.waitFor(() => {
      expect(service.isArtistSyncActive(artistId)).toBe(true);
    });

    const started = Date.now();
    const drained = await service.cancelArtistSyncAndWait(artistId, 1000);
    const elapsed = Date.now() - started;
    await syncPromise;

    expect(drained).toBe(true);
    expect(elapsed).toBeLessThan(1000);
    expect(service.isArtistSyncActive(artistId)).toBe(false);
  });

  it("deleting a non-active artist does not require cancel wait", async () => {
    const [other] = await mockDb.db
      .insert(artists)
      .values({
        name: "Idle Artist",
        tag: "idle_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/index.php",
        lastPostId: 10,
        newPostsCount: 0,
      })
      .returning({ id: artists.id });

    expect(service.isArtistSyncActive(other.id)).toBe(false);
    const drained = await service.cancelArtistSyncAndWait(other.id, 100);
    expect(drained).toBe(true);

    mockDb.db.delete(artists).where(eq(artists.id, other.id)).run();
    const gone = await mockDb.db.query.artists.findFirst({
      where: eq(artists.id, other.id),
    });
    expect(gone).toBeUndefined();
  });

  it("deleting another indexed artist during bulk window stays healthy after sync finally", async () => {
    const [other] = await mockDb.db
      .insert(artists)
      .values({
        name: "Indexed Other",
        tag: "indexed_other",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/index.php",
        lastPostId: 99,
        newPostsCount: 0,
      })
      .returning({ id: artists.id });

    await mockDb.db.insert(posts).values({
      postId: 9001,
      artistId: other.id,
      fileUrl: "https://example.com/9001.jpg",
      previewUrl: "https://example.com/9001_p.jpg",
      sampleUrl: "",
      tags: "other_artist_fts_token",
      rating: "s",
      mediaType: "image",
      publishedAt: new Date(),
      createdAt: new Date(),
    });

    expect(ftsMatchCount(mockDb.sqlite, "other_artist_fts_token")).toBe(1);

    const provider = getProvider("rule34");
    let releaseFetch: (() => void) | null = null;
    const fetchGate = new Promise<void>((resolve) => {
      releaseFetch = resolve;
    });
    vi.spyOn(provider, "fetchPosts").mockImplementation(async () => {
      await fetchGate;
      return EMPTY_PAGE;
    });

    const syncPromise = service.syncAllArtists();
    await vi.waitFor(() => {
      expect(service.isArtistSyncActive(artistId)).toBe(true);
    });
    expect(areRuntimeDroppableFtsTriggersPresent(mockDb.sqlite)).toBe(false);

    expect(service.isArtistSyncActive(other.id)).toBe(false);
    mockDb.db.delete(artists).where(eq(artists.id, other.id)).run();

    releaseFetch?.();
    await syncPromise;

    expect(areRuntimeDroppableFtsTriggersPresent(mockDb.sqlite)).toBe(true);
    assertIntegrityOk(mockDb.sqlite);
    expect(ftsMatchCount(mockDb.sqlite, "other_artist_fts_token")).toBe(0);
    expect(ensureFtsTriggers(mockDb.sqlite).recreated).toEqual([]);
  });
});
