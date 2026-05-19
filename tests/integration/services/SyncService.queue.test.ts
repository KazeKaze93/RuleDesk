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
import { artists, settings, SETTINGS_ID } from "@/main/db/schema";

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
      file: { level: "info", resolvePathFn: vi.fn() },
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

import { SyncService } from "@/main/services/sync-service";

const REPAIR_MAX_PAGES = 1000;
const SYNC_DELAY_MS = 30;

describe("SyncService runExclusive queue", () => {
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

    const [artist] = await mockDb.db
      .insert(artists)
      .values({
        name: "Queue Test Artist",
        tag: "queue_test_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/index.php",
        lastPostId: 42,
        newPostsCount: 0,
      })
      .returning({ id: artists.id });

    artistId = artist.id;
    server.resetHandlers();
    service = new SyncService();
  });

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // ignore
      }
    }
    mockDbInstance = null;
    mockSqliteInstance = null;
  });

  it("does not run repair syncArtist until syncAll has finished", async () => {
    let syncFinished = false;
    let syncStartedAt = 0;
    let repairStartedAt = 0;

    const syncArtistSpy = vi
      .spyOn(service, "syncArtist")
      .mockImplementation(async (_artist, _settings, maxPages) => {
        if (maxPages === REPAIR_MAX_PAGES) {
          repairStartedAt = Date.now();
          expect(syncFinished).toBe(true);
          return;
        }

        syncStartedAt = Date.now();
        await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));
        syncFinished = true;
      });

    const syncPromise = service.syncAllArtists();

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(syncFinished).toBe(false);

    const repairPromise = service.repairArtist(artistId);

    await Promise.all([syncPromise, repairPromise]);

    expect(syncFinished).toBe(true);
    expect(repairStartedAt).toBeGreaterThanOrEqual(syncStartedAt + SYNC_DELAY_MS);
    expect(syncArtistSpy).toHaveBeenCalledTimes(2);
    expect(syncArtistSpy.mock.calls[1]?.[2]).toBe(REPAIR_MAX_PAGES);
  });
});
