import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  onDatabaseReopened,
  registerDatabaseInContainerAfterReinit,
  resetDatabaseReopenedListenersForTests,
} from "../../../src/main/core/di/databaseRegistration";

describe("databaseRegistration reopen notify", () => {
  beforeEach(() => {
    resetDatabaseReopenedListenersForTests();
  });

  afterEach(() => {
    resetDatabaseReopenedListenersForTests();
  });

  it("notifies subscribers after reinit (no DI DB rebind)", () => {
    const listener = vi.fn();
    onDatabaseReopened(listener);

    registerDatabaseInContainerAfterReinit();

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
