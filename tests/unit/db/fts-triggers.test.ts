import { describe, it, expect, afterEach } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import {
  FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME,
  POSTS_FTS_INSERT_TRIGGER_NAME,
  RUNTIME_DROPPABLE_FTS_TRIGGERS,
  dropFtsTriggersForBulkInsert,
  ensureFtsTriggers,
} from "../../../src/main/db/fts-triggers";

function triggerExists(
  sqlite: ReturnType<typeof createMockDb>["sqlite"],
  name: string
): boolean {
  const row = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = ?"
    )
    .get(name);
  return row !== undefined;
}

describe("ensureFtsTriggers", () => {
  let sqlite: ReturnType<typeof createMockDb>["sqlite"] | null = null;

  afterEach(() => {
    sqlite?.close();
    sqlite = null;
  });

  it("recreates dropped runtime FTS triggers and is idempotent on second call", () => {
    const mockDb = createMockDb();
    sqlite = mockDb.sqlite;

    expect(RUNTIME_DROPPABLE_FTS_TRIGGERS.map((t) => t.name)).toEqual([
      POSTS_FTS_INSERT_TRIGGER_NAME,
      FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME,
    ]);

    // Baseline: posts_fts_insert comes from migration 0006. The invalidate
    // trigger may be absent on Node SQLite builds that reject FTS5 triggers.
    expect(triggerExists(sqlite, POSTS_FTS_INSERT_TRIGGER_NAME)).toBe(true);

    const canCreateInvalidateTrigger = (() => {
      try {
        const invalidate = RUNTIME_DROPPABLE_FTS_TRIGGERS.find(
          (t) => t.name === FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME
        );
        if (!invalidate) {
          return false;
        }
        sqlite.exec(`DROP TRIGGER IF EXISTS ${invalidate.name};`);
        sqlite.exec(invalidate.ddl);
        return true;
      } catch {
        return false;
      }
    })();

    if (canCreateInvalidateTrigger) {
      expect(
        triggerExists(sqlite, FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME)
      ).toBe(true);
    }

    dropFtsTriggersForBulkInsert(sqlite);
    expect(triggerExists(sqlite, POSTS_FTS_INSERT_TRIGGER_NAME)).toBe(false);
    expect(
      triggerExists(sqlite, FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME)
    ).toBe(false);

    const first = ensureFtsTriggers(sqlite);
    expect(triggerExists(sqlite, POSTS_FTS_INSERT_TRIGGER_NAME)).toBe(true);
    expect(first.recreated).toContain(POSTS_FTS_INSERT_TRIGGER_NAME);

    if (canCreateInvalidateTrigger) {
      expect(
        triggerExists(sqlite, FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME)
      ).toBe(true);
      expect(first.recreated).toEqual([
        POSTS_FTS_INSERT_TRIGGER_NAME,
        FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME,
      ]);
    }

    const second = ensureFtsTriggers(sqlite);
    expect(second.recreated).toEqual([]);
  });
});
