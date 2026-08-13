import { describe, expect, it } from "vitest";
import { createMockDb } from "../../helpers/mock-db";

describe("createMockDb (helpers)", () => {
  it("should create an in-memory database", () => {
    const { db, sqlite } = createMockDb();

    expect(db).toBeDefined();
    expect(sqlite).toBeDefined();

    sqlite.close();
  });

  it("should apply migrations successfully", () => {
    const { db, sqlite } = createMockDb();

    expect(db).toBeDefined();

    sqlite.close();
  });

  it("should create isolated database instances", () => {
    const { db: db1, sqlite: sqlite1 } = createMockDb();
    const { db: db2, sqlite: sqlite2 } = createMockDb();

    expect(db1).not.toBe(db2);
    expect(sqlite1).not.toBe(sqlite2);

    sqlite1.close();
    sqlite2.close();
  });
});
