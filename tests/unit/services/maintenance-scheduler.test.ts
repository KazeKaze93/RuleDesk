import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../src/main/db/client", () => ({
  getSqliteInstance: vi.fn(),
}));

vi.mock("../../../src/main/db/maintenance-queue", () => ({
  maintenanceQueue: {
    execute: vi.fn(async (fn: () => unknown) => fn()),
  },
}));

vi.mock("../../../src/main/db/queries/tag-metadata", () => ({
  deleteExpiredTagMetadata: vi.fn(() => 0),
  enforceTagMetadataRowCap: vi.fn(() => 0),
}));

vi.mock("../../../src/main/db/queries/search-results-cache", () => ({
  deleteExpiredSearchResultsCache: vi.fn(() => 0),
  enforceSearchResultsCachePayloadByteCap: vi.fn(() => 0),
  enforceSearchResultsCacheRowCap: vi.fn(() => 0),
}));

vi.mock("../../../src/main/db/queries/post-lookup-cache", () => ({
  deleteExpiredPostLookupCache: vi.fn(() => 0),
  enforcePostLookupCacheRowCap: vi.fn(() => 0),
}));

import log from "electron-log";
import { MaintenanceScheduler } from "../../../src/main/services/maintenance-scheduler";

describe("MaintenanceScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(log.debug).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("double start() creates timers once; stop() after double start() leaves no active timers", () => {
    const scheduler = new MaintenanceScheduler();

    scheduler.start();
    expect(vi.getTimerCount()).toBe(1);

    scheduler.start();
    expect(vi.getTimerCount()).toBe(1);
    expect(log.debug).toHaveBeenCalledWith(
      "[MaintenanceScheduler] start() ignored — timers already active"
    );

    scheduler.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
