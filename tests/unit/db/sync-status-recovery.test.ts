import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createMockDb } from "../../helpers/mock-db";
import { artists } from "../../../src/main/db/schema";

const { rebuildFtsIndexMock } = vi.hoisted(() => ({
  rebuildFtsIndexMock: vi.fn(),
}));

vi.mock("electron", () => ({
  app: {
    getPath: () => "/tmp",
    isPackaged: false,
  },
  dialog: { showErrorBox: vi.fn() },
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
      file: { level: "info", resolvePathFn: vi.fn() },
      ipc: {},
    },
    errorHandler: { startCatching: vi.fn() },
  },
}));

vi.mock("../../../src/main/db/fts-triggers", () => ({
  ensureFtsTriggers: vi.fn(() => ({ recreated: [] })),
  rebuildFtsIndex: rebuildFtsIndexMock,
}));

import {
  recoverAfterRecreatedFtsTriggers,
  resetStaleSyncingArtists,
} from "../../../src/main/db/client";

describe("resetStaleSyncingArtists (hard-kill recovery)", () => {
  let mockDb: ReturnType<typeof createMockDb> | null = null;

  afterEach(() => {
    try {
      mockDb?.sqlite.close();
    } catch {
      // ignore
    }
    mockDb = null;
  });

  it("resets only syncing rows to idle and leaves error / incomplete / lastError alone", () => {
    mockDb = createMockDb();

    mockDb.db
      .insert(artists)
      .values([
        {
          name: "Stuck Syncing",
          tag: "stuck_syncing",
          provider: "rule34",
          type: "tag",
          apiEndpoint: "https://api.rule34.xxx/index.php",
          syncStatus: "syncing",
          lastError: null,
          lastSyncIncomplete: true,
        },
        {
          name: "Real Error",
          tag: "real_error",
          provider: "rule34",
          type: "tag",
          apiEndpoint: "https://api.rule34.xxx/index.php",
          syncStatus: "error",
          lastError: "Provider page 3 failure",
          lastSyncIncomplete: true,
        },
        {
          name: "Already Idle",
          tag: "already_idle",
          provider: "rule34",
          type: "tag",
          apiEndpoint: "https://api.rule34.xxx/index.php",
          syncStatus: "idle",
          lastError: null,
          lastSyncIncomplete: false,
        },
      ])
      .run();

    const before = mockDb.db
      .select({
        tag: artists.tag,
        syncStatus: artists.syncStatus,
        lastError: artists.lastError,
        lastSyncIncomplete: artists.lastSyncIncomplete,
      })
      .from(artists)
      .all();

    const beforeByTag = Object.fromEntries(
      before.map((row) => [row.tag, row])
    );
    expect(beforeByTag.stuck_syncing?.syncStatus).toBe("syncing");
    expect(beforeByTag.real_error?.syncStatus).toBe("error");

    const changed = resetStaleSyncingArtists(mockDb.sqlite);
    expect(changed).toBe(1);

    const stuck = mockDb.db
      .select()
      .from(artists)
      .where(eq(artists.tag, "stuck_syncing"))
      .all()[0];
    const errored = mockDb.db
      .select()
      .from(artists)
      .where(eq(artists.tag, "real_error"))
      .all()[0];
    const idle = mockDb.db
      .select()
      .from(artists)
      .where(eq(artists.tag, "already_idle"))
      .all()[0];

    expect(stuck?.syncStatus).toBe("idle");
    expect(stuck?.lastError).toBeNull();
    expect(stuck?.lastSyncIncomplete).toBe(true);

    expect(errored?.syncStatus).toBe("error");
    expect(errored?.lastError).toBe("Provider page 3 failure");
    expect(errored?.lastSyncIncomplete).toBe(true);

    expect(idle?.syncStatus).toBe("idle");
    expect(idle?.lastError).toBeNull();
    expect(idle?.lastSyncIncomplete).toBe(false);
  });
});

describe("recoverAfterRecreatedFtsTriggers (FTS rebuild retry)", () => {
  const RECREATED_TRIGGERS = ["posts_ai_fts_insert"] as const;
  let mockDb: ReturnType<typeof createMockDb> | null = null;

  beforeEach(() => {
    rebuildFtsIndexMock.mockReset();
  });

  afterEach(() => {
    try {
      mockDb?.sqlite.close();
    } catch {
      // ignore
    }
    mockDb = null;
  });

  it("throws when rebuildFtsIndex fails twice (no silent swallow)", () => {
    mockDb = createMockDb();
    const sqlite = mockDb.sqlite;
    const firstError = new Error("rebuild attempt 1 failed");
    const secondError = new Error("rebuild attempt 2 failed");
    rebuildFtsIndexMock
      .mockImplementationOnce(() => {
        throw firstError;
      })
      .mockImplementationOnce(() => {
        throw secondError;
      });

    expect(() =>
      recoverAfterRecreatedFtsTriggers(sqlite, [...RECREATED_TRIGGERS])
    ).toThrow(secondError);

    expect(rebuildFtsIndexMock).toHaveBeenCalledTimes(2);
    expect(rebuildFtsIndexMock).toHaveBeenNthCalledWith(1, sqlite);
    expect(rebuildFtsIndexMock).toHaveBeenNthCalledWith(2, sqlite);
  });

  it("succeeds when first rebuild fails and retry succeeds", () => {
    mockDb = createMockDb();
    const sqlite = mockDb.sqlite;
    rebuildFtsIndexMock
      .mockImplementationOnce(() => {
        throw new Error("transient rebuild failure");
      })
      .mockImplementationOnce(() => {
        // success
      });

    expect(() =>
      recoverAfterRecreatedFtsTriggers(sqlite, [...RECREATED_TRIGGERS])
    ).not.toThrow();

    expect(rebuildFtsIndexMock).toHaveBeenCalledTimes(2);
  });

  it("succeeds on first rebuild without a second call", () => {
    mockDb = createMockDb();
    const sqlite = mockDb.sqlite;
    rebuildFtsIndexMock.mockImplementation(() => {
      // success
    });

    expect(() =>
      recoverAfterRecreatedFtsTriggers(sqlite, [...RECREATED_TRIGGERS])
    ).not.toThrow();

    expect(rebuildFtsIndexMock).toHaveBeenCalledTimes(1);
  });
});
