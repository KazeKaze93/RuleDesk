import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { settings, SETTINGS_ID, TAG_TYPES } from "../../../src/main/db/schema";
import { createAbortError } from "../../../src/main/providers/provider-throttle";
import { ProviderSearchError } from "../../../src/main/providers/provider-search-errors";
import type Database from "better-sqlite3";
import log from "electron-log";

let activeSqlite: Database.Database | null = null;
let activeDb: ReturnType<typeof createMockDb>["db"] | null = null;

vi.mock("../../../src/main/db/client", () => ({
  getSqliteInstance: () => {
    if (!activeSqlite) {
      throw new Error("Test sqlite instance is not initialized");
    }
    return activeSqlite;
  },
  getDb: () => {
    if (!activeDb) {
      throw new Error("Test db is not initialized");
    }
    return activeDb;
  },
}));

vi.mock("electron", () => ({
  app: { getPath: () => "/tmp" },
  safeStorage: {
    isEncryptionAvailable: () => true,
    decryptString: vi.fn((buffer: Buffer) => buffer.toString()),
  },
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
      renderer: { level: false },
      console: { level: false, format: "" },
      file: { level: "info", resolvePathFn: vi.fn() },
      ipc: {},
    },
    errorHandler: {
      startCatching: vi.fn(),
    },
  },
}));

const resolveTagMetadataWaveMock = vi.fn();
const loadTagMetadataCacheMock = vi.fn(() => ({
  foundTypes: new Map<string, number>([["cached_artist", TAG_TYPES.ARTIST]]),
  activeNotFound: new Set<string>(),
}));

vi.mock("../../../src/main/services/tag-resolve-coordinator", () => ({
  loadTagMetadataCache: (...args: unknown[]) =>
    loadTagMetadataCacheMock(...args),
  resolveTagMetadataWave: (...args: unknown[]) =>
    resolveTagMetadataWaveMock(...args),
}));

vi.mock("../../../src/main/core/di/Container", () => ({
  container: {
    resolve: vi.fn(),
    register: vi.fn(),
    clear: vi.fn(),
  },
  DI_TOKENS: { SYNC_SERVICE: "SYNC_SERVICE" },
}));

import { ArtistsController } from "../../../src/main/ipc/controllers/ArtistsController";

type ArtistsControllerInternals = {
  getDecryptedProviderSettings: () => {
    userId: string;
    apiKey: string;
  } | null;
  resolveArtistTagNames: (
    tags: string[],
    signal: AbortSignal
  ) => Promise<string[]>;
};

describe("ArtistsController.getDecryptedProviderSettings error split", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: ArtistsControllerInternals;

  beforeEach(() => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    controller = new ArtistsController() as unknown as ArtistsControllerInternals;
  });

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // Ignore close errors in tests.
      }
    }
    activeSqlite = null;
    activeDb = null;
  });

  it("returns null when settings row is missing", () => {
    expect(controller.getDecryptedProviderSettings()).toBeNull();
  });

  it("returns null when decrypt fails (credentials null)", async () => {
    const { safeStorage } = await import("electron");
    vi.mocked(safeStorage.decryptString).mockImplementationOnce(() => {
      throw new Error("OS decrypt failed");
    });

    await mockDb.db.insert(settings).values({
      id: SETTINGS_ID,
      userId: "12345",
      encryptedApiKey: Buffer.from("test-api-key").toString("base64"),
      provider: "rule34",
      isSafeMode: false,
      isAdultConfirmed: true,
      isAdultVerified: true,
    });

    expect(controller.getDecryptedProviderSettings()).toBeNull();
  });

  it("throws when settings DB read fails", () => {
    activeDb = null;

    expect(() => controller.getDecryptedProviderSettings()).toThrow(
      "Test db is not initialized"
    );
    expect(log.error).toHaveBeenCalled();
  });
});

function emptyWaveStats(
  overrides: {
    unresolvedNames?: string[];
    rateLimitedCount?: number;
  } = {}
) {
  return {
    requested: 1,
    tagMetadataHits: 0,
    inFlightHits: 0,
    apiCalls: 1,
    rateLimitedCount: overrides.rateLimitedCount ?? 0,
    unresolvedNames: overrides.unresolvedNames ?? [],
  };
}

describe("ArtistsController.resolveArtistTagNames error surfacing", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: ArtistsControllerInternals;

  beforeEach(async () => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    await mockDb.db.insert(settings).values({
      id: SETTINGS_ID,
      userId: "12345",
      encryptedApiKey: Buffer.from("test-api-key").toString("base64"),
      provider: "rule34",
      isSafeMode: false,
      isAdultConfirmed: true,
      isAdultVerified: true,
    });
    controller = new ArtistsController() as unknown as ArtistsControllerInternals;
    resolveTagMetadataWaveMock.mockReset();
    loadTagMetadataCacheMock.mockClear();
    loadTagMetadataCacheMock.mockReturnValue({
      foundTypes: new Map<string, number>([
        ["cached_artist", TAG_TYPES.ARTIST],
      ]),
      activeNotFound: new Set<string>(),
    });
  });

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // Ignore close errors in tests.
      }
    }
    activeSqlite = null;
    activeDb = null;
  });

  it("throws when resolveTagMetadataWave fails (does not return cache subset)", async () => {
    resolveTagMetadataWaveMock.mockRejectedValueOnce(
      new Error("wave DB write failed")
    );
    const signal = new AbortController().signal;

    await expect(
      controller.resolveArtistTagNames(["wlop", "cached_artist"], signal)
    ).rejects.toThrow("wave DB write failed");
    expect(log.error).toHaveBeenCalled();
  });

  it("rethrows ProviderSearchError from resolve wave as-is", async () => {
    const rateLimit = new ProviderSearchError("rate_limit", undefined, 1200);
    resolveTagMetadataWaveMock.mockRejectedValueOnce(rateLimit);
    const signal = new AbortController().signal;

    await expect(
      controller.resolveArtistTagNames(["wlop"], signal)
    ).rejects.toBe(rateLimit);
  });

  it("throws rate_limit when wave leaves tags unresolved due to 429", async () => {
    resolveTagMetadataWaveMock.mockResolvedValueOnce(
      emptyWaveStats({
        unresolvedNames: ["wlop"],
        rateLimitedCount: 1,
      })
    );
    const signal = new AbortController().signal;

    await expect(
      controller.resolveArtistTagNames(["wlop", "cached_artist"], signal)
    ).rejects.toMatchObject({
      name: "ProviderSearchError",
      kind: "rate_limit",
    });
  });

  it("throws network when wave leaves tags unresolved without 429", async () => {
    resolveTagMetadataWaveMock.mockResolvedValueOnce(
      emptyWaveStats({
        unresolvedNames: ["wlop"],
        rateLimitedCount: 0,
      })
    );
    const signal = new AbortController().signal;

    await expect(
      controller.resolveArtistTagNames(["wlop"], signal)
    ).rejects.toMatchObject({
      name: "ProviderSearchError",
      kind: "network",
    });
  });

  it("returns ARTIST-only tags when wave resolves found/not_found without unresolved", async () => {
    loadTagMetadataCacheMock.mockReturnValue({
      foundTypes: new Map<string, number>([
        ["wlop", TAG_TYPES.ARTIST],
        ["general_tag", TAG_TYPES.GENERAL],
      ]),
      activeNotFound: new Set<string>(["ghost_tag"]),
    });
    resolveTagMetadataWaveMock.mockResolvedValueOnce(emptyWaveStats());
    const signal = new AbortController().signal;

    await expect(
      controller.resolveArtistTagNames(
        ["wlop", "general_tag", "ghost_tag"],
        signal
      )
    ).resolves.toEqual(["wlop"]);
  });

  it("returns [] on abort error from resolve wave", async () => {
    resolveTagMetadataWaveMock.mockRejectedValueOnce(createAbortError());
    const signal = new AbortController().signal;

    await expect(
      controller.resolveArtistTagNames(["wlop"], signal)
    ).resolves.toEqual([]);
  });

  it("returns [] when signal aborts after a successful wave with unresolved", async () => {
    const abortController = new AbortController();
    resolveTagMetadataWaveMock.mockImplementationOnce(async () => {
      abortController.abort();
      return emptyWaveStats({
        unresolvedNames: ["wlop"],
        rateLimitedCount: 1,
      });
    });

    await expect(
      controller.resolveArtistTagNames(["wlop"], abortController.signal)
    ).resolves.toEqual([]);
  });

  it("returns [] when signal is already aborted", async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      controller.resolveArtistTagNames(["wlop"], abortController.signal)
    ).resolves.toEqual([]);
    expect(resolveTagMetadataWaveMock).not.toHaveBeenCalled();
  });
});
