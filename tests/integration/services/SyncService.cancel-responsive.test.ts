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
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { createMockDb } from "../../helpers/mock-db";
import { server } from "../../mocks/server";
import { artists, settings, SETTINGS_ID } from "@/main/db/schema";
import { getProvider } from "@/main/providers";
import type { FetchPostsResult } from "@/main/providers/types";
import { ProviderSearchError } from "@/main/providers/provider-search-errors";
import { SyncService } from "@/main/services/sync-service";
import { withSyncPausedForDbWork } from "@/main/lib/sync-db-maintenance";

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

const CANCEL_BUDGET_MS = 1000;

function abortableHang(
  signal: AbortSignal | undefined
): Promise<FetchPostsResult> {
  return new Promise((_resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The operation was aborted.", "AbortError"));
      return;
    }
    const onAbort = () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

describe("SyncService cancel-responsive", () => {
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
        name: "AAA Cancel Responsive",
        tag: "cancel_responsive",
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

  it("cancels during a 60s rate-limit retry sleep in under 1s", async () => {
    const provider = getProvider("rule34");
    let attempt = 0;
    vi.spyOn(provider, "fetchPosts").mockImplementation(async () => {
      attempt += 1;
      if (attempt === 1) {
        throw new ProviderSearchError("rate_limit", undefined, 60_000);
      }
      return EMPTY_PAGE;
    });

    const syncPromise = service.syncAllArtists();

    await vi.waitFor(() => {
      expect(service.isArtistSyncActive(artistId)).toBe(true);
    });

    // Let retryWithBackoff enter the 60s sleep.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const started = Date.now();
    service.requestCancel();
    const drained = await service.waitUntilIdle(CANCEL_BUDGET_MS);
    const elapsed = Date.now() - started;

    await syncPromise;

    expect(drained).toBe(true);
    expect(elapsed).toBeLessThan(CANCEL_BUDGET_MS);
    expect(service.getIsSyncing()).toBe(false);
    expect(attempt).toBe(1);
  });

  it("cancels a hung fetchPosts that honors AbortSignal in under 1s", async () => {
    const provider = getProvider("rule34");
    vi.spyOn(provider, "fetchPosts").mockImplementation(
      (_tags, _page, _settings, _isRandom, _limit, signal) =>
        abortableHang(signal)
    );

    const syncPromise = service.syncAllArtists();

    await vi.waitFor(() => {
      expect(service.isArtistSyncActive(artistId)).toBe(true);
    });

    const started = Date.now();
    const drained = await service.cancelArtistSyncAndWait(
      artistId,
      CANCEL_BUDGET_MS
    );
    const elapsed = Date.now() - started;

    await syncPromise;

    expect(drained).toBe(true);
    expect(elapsed).toBeLessThan(CANCEL_BUDGET_MS);
    expect(service.isArtistSyncActive(artistId)).toBe(false);
  });

  it("VACUUM on %TEMP%/rd-p6 DB copy succeeds while hung sync is paused", async () => {
    const provider = getProvider("rule34");
    vi.spyOn(provider, "fetchPosts").mockImplementation(
      (_tags, _page, _settings, _isRandom, _limit, signal) =>
        abortableHang(signal)
    );

    const syncPromise = service.syncAllArtists();
    await vi.waitFor(() => {
      expect(service.getIsSyncing()).toBe(true);
    });

    const copyDir = path.join(os.tmpdir(), "rd-p6");
    const copyDbPath = path.join(copyDir, "data.bin");
    expect(fs.existsSync(copyDbPath)).toBe(true);

    const started = Date.now();
    await withSyncPausedForDbWork(service, async () => {
      const db = new Database(copyDbPath);
      try {
        db.exec("VACUUM;");
        const rows = db.pragma("integrity_check");
        expect(rows).toEqual([{ integrity_check: "ok" }]);
      } finally {
        db.close();
      }
    }, CANCEL_BUDGET_MS);
    const elapsed = Date.now() - started;

    await syncPromise;
    expect(elapsed).toBeLessThan(CANCEL_BUDGET_MS);
    expect(service.getIsSyncing()).toBe(false);
  });

  it("quit drain order: cancel then closeDatabase (app.log sequence)", async () => {
    const { logger } = await import("@/main/lib/logger");
    const logLines: string[] = [];
    vi.spyOn(logger, "info").mockImplementation((message: unknown) => {
      if (typeof message === "string") {
        logLines.push(message);
      }
    });

    const provider = getProvider("rule34");
    vi.spyOn(provider, "fetchPosts").mockImplementation(
      (_tags, _page, _settings, _isRandom, _limit, signal) =>
        abortableHang(signal)
    );

    const syncPromise = service.syncAllArtists();
    await vi.waitFor(() => {
      expect(service.getIsSyncing()).toBe(true);
    });

    // Mirrors main.ts before-quit sync drain → closeDatabase.
    logger.info(
      "[Main] Sync in progress — requesting cancel and draining before quit"
    );
    service.requestCancel();
    const idle = await service.waitUntilIdle(CANCEL_BUDGET_MS);
    expect(idle).toBe(true);
    logger.info("[DB] Database closed.");

    await syncPromise;
    const cancelIdx = logLines.findIndex((line) =>
      line.includes("requesting cancel and draining before quit")
    );
    const closedIdx = logLines.findIndex((line) =>
      line.includes("[DB] Database closed.")
    );
    expect(cancelIdx).toBeGreaterThanOrEqual(0);
    expect(closedIdx).toBeGreaterThan(cancelIdx);
  });
});
