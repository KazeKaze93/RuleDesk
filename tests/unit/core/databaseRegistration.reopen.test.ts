import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock("@/main/db/client", () => ({
  getDb: () => getDbMock(),
}));

import {
  onDatabaseReopened,
  registerDatabaseInContainerAfterReinit,
  resetDatabaseReopenedListenersForTests,
} from "@/main/core/di/databaseRegistration";
import { container, DI_TOKENS } from "@/main/core/di/Container";

describe("databaseRegistration reopen notify", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    resetDatabaseReopenedListenersForTests();
    mockDb = createMockDb();
    getDbMock.mockImplementation(() => mockDb.db);
  });

  afterEach(() => {
    resetDatabaseReopenedListenersForTests();
    try {
      mockDb.sqlite.close();
    } catch {
      // Ignore close errors in tests.
    }
  });

  it("rebinds DI DB and notifies subscribers after reinit", () => {
    const listener = vi.fn();
    onDatabaseReopened(listener);

    registerDatabaseInContainerAfterReinit();

    expect(container.resolve(DI_TOKENS.DB)).toBe(mockDb.db);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe stops further notifies", () => {
    const listener = vi.fn();
    const unsubscribe = onDatabaseReopened(listener);
    unsubscribe();

    registerDatabaseInContainerAfterReinit();

    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps notifying other listeners when one throws", () => {
    const failing = vi.fn(() => {
      throw new Error("listener boom");
    });
    const ok = vi.fn();
    onDatabaseReopened(failing);
    onDatabaseReopened(ok);

    registerDatabaseInContainerAfterReinit();

    expect(failing).toHaveBeenCalledTimes(1);
    expect(ok).toHaveBeenCalledTimes(1);
  });
});
