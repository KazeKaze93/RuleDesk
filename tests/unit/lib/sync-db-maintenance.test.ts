import { describe, it, expect, vi, beforeEach } from "vitest";
import { withSyncPausedForDbWork } from "@/main/lib/sync-db-maintenance";
import type { SyncService } from "@/main/services/sync-service";

describe("withSyncPausedForDbWork", () => {
  let pauseForDbMaintenance: ReturnType<typeof vi.fn>;
  let resumeAfterDbMaintenance: ReturnType<typeof vi.fn>;
  let syncService: SyncService;

  beforeEach(() => {
    pauseForDbMaintenance = vi.fn();
    resumeAfterDbMaintenance = vi.fn();
    syncService = {
      pauseForDbMaintenance,
      resumeAfterDbMaintenance,
    } as unknown as SyncService;
  });

  it("waits for sync idle before work and resumes even when work throws", async () => {
    let workStarted = false;
    pauseForDbMaintenance.mockImplementation(async () => {
      expect(workStarted).toBe(false);
      return true;
    });

    await expect(
      withSyncPausedForDbWork(syncService, async () => {
        workStarted = true;
        expect(pauseForDbMaintenance).toHaveBeenCalled();
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    expect(resumeAfterDbMaintenance).toHaveBeenCalledTimes(1);
  });

  it("refuses work and resumes hold when sync does not idle", async () => {
    pauseForDbMaintenance.mockResolvedValue(false);
    const work = vi.fn();

    await expect(
      withSyncPausedForDbWork(syncService, work, 100)
    ).rejects.toThrow(/Sync did not idle/);

    expect(work).not.toHaveBeenCalled();
    expect(resumeAfterDbMaintenance).toHaveBeenCalledTimes(1);
  });
});
