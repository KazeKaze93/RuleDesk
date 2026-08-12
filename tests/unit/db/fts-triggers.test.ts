import { describe, it, expect, afterEach } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import {
  POSTS_FTS_INSERT_TRIGGER_NAME,
  dropFtsTriggersForBulkInsert,
  ensureFtsTriggers,
} from "../../../src/main/db/fts-triggers";

const EXPECTED_TRIGGERS = [
  "posts_fts_delete",
  "posts_fts_insert",
  "posts_fts_update",
] as const;

function listTriggers(
  sqlite: ReturnType<typeof createMockDb>["sqlite"]
): string[] {
  const rows = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name"
    )
    .all() as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

describe("FTS triggers (posts content table)", () => {
  let mockDb: ReturnType<typeof createMockDb> | null = null;

  afterEach(() => {
    try {
      mockDb?.sqlite.close();
    } catch {
      // ignore
    }
    mockDb = null;
  });

  it("applies migrations with posts_fts_* triggers only (no dead count/stamp triggers)", () => {
    mockDb = createMockDb();
    expect(listTriggers(mockDb.sqlite)).toEqual([...EXPECTED_TRIGGERS]);
  });

  it("drop + ensure restores posts_fts_insert idempotently", () => {
    mockDb = createMockDb();
    const { sqlite } = mockDb;

    dropFtsTriggersForBulkInsert(sqlite);
    const afterDrop = listTriggers(sqlite);
    expect(afterDrop).not.toContain(POSTS_FTS_INSERT_TRIGGER_NAME);
    expect(afterDrop).toContain("posts_fts_update");
    expect(afterDrop).toContain("posts_fts_delete");

    const first = ensureFtsTriggers(sqlite);
    expect(first.recreated).toEqual([POSTS_FTS_INSERT_TRIGGER_NAME]);
    expect(listTriggers(sqlite)).toEqual([...EXPECTED_TRIGGERS]);

    const second = ensureFtsTriggers(sqlite);
    expect(second.recreated).toEqual([]);
  });
});
