import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { postsFtsTableExists } from "../../../src/main/db/fts-table-check";

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

describe("postsFtsTableExists", () => {
  let mockDb: ReturnType<typeof createMockDb> | null = null;

  afterEach(() => {
    try {
      mockDb?.sqlite.close();
    } catch {
      // ignore
    }
    mockDb = null;
  });

  it("returns true when posts_fts exists after migrations", () => {
    mockDb = createMockDb();
    expect(postsFtsTableExists(mockDb.sqlite)).toBe(true);
  });

  it("returns false after posts_fts is dropped", () => {
    mockDb = createMockDb();
    mockDb.sqlite.exec("DROP TABLE posts_fts;");
    expect(postsFtsTableExists(mockDb.sqlite)).toBe(false);
  });

  it("returns false when sqlite_master query throws", () => {
    mockDb = createMockDb();
    mockDb.sqlite.close();
    expect(postsFtsTableExists(mockDb.sqlite)).toBe(false);
  });
});
