import { describe, expect, it } from "vitest";
import { MaintenanceQueue } from "@/main/db/maintenance-queue";

describe("MaintenanceQueue", () => {
  it("runs the next operation after a prior failure; caller still gets the error", async () => {
    const queue = new MaintenanceQueue();
    const failure = new Error("first op failed");

    await expect(
      queue.execute(async () => {
        throw failure;
      })
    ).rejects.toThrow("first op failed");

    expect(queue.isProcessing()).toBe(false);

    const result = await queue.execute(async () => "ok-after-fail");
    expect(result).toBe("ok-after-fail");
    expect(queue.isProcessing()).toBe(false);
  });

  it("recovers after two consecutive failures", async () => {
    const queue = new MaintenanceQueue();

    await expect(
      queue.execute(async () => {
        throw new Error("fail-1");
      })
    ).rejects.toThrow("fail-1");

    await expect(
      queue.execute(async () => {
        throw new Error("fail-2");
      })
    ).rejects.toThrow("fail-2");

    const result = await queue.execute(async () => 42);
    expect(result).toBe(42);
  });

  it("clears isLocked in finally even when the operation throws", async () => {
    const queue = new MaintenanceQueue();

    await expect(
      queue.execute(async () => {
        expect(queue.isProcessing()).toBe(true);
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    expect(queue.isProcessing()).toBe(false);
    await queue.waitForCompletion();
    expect(queue.isProcessing()).toBe(false);
  });
});
