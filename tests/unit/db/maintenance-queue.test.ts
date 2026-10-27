import { describe, expect, it, vi } from "vitest";
import {
  MAINTENANCE_JOB_KIND,
  MaintenanceQueue,
} from "../../../src/main/db/maintenance-queue";
import { ErrorCode } from "../../../src/shared/types/error-codes";

describe("MaintenanceQueue", () => {
  it("close() is idempotent; execute after close rejects without calling the operation", async () => {
    const queue = new MaintenanceQueue();
    const operation = vi.fn(async () => "should-not-run");

    queue.close();
    queue.close();

    await expect(queue.execute(operation)).rejects.toMatchObject({
      message: "maintenance queue closed: quit in progress",
      code: ErrorCode.CANCELLED,
    });
    expect(operation).not.toHaveBeenCalled();
  });

  it("queued-but-not-started jobs reject on close without calling the operation", async () => {
    const queue = new MaintenanceQueue();
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const firstOp = vi.fn(async () => {
      await firstGate;
      return "first";
    });
    const secondOp = vi.fn(async () => "second");

    const firstPromise = queue.execute(firstOp);
    const secondPromise = queue.execute(secondOp);

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(firstOp).toHaveBeenCalledTimes(1);
    expect(secondOp).not.toHaveBeenCalled();

    queue.close();
    releaseFirst?.();

    await expect(firstPromise).resolves.toBe("first");
    await expect(secondPromise).rejects.toMatchObject({
      message: "maintenance queue closed: quit in progress",
      code: ErrorCode.CANCELLED,
    });
    expect(secondOp).not.toHaveBeenCalled();

    const { timedOut } = await queue.waitForCompletion();
    expect(timedOut).toBe(false);
  });

  it("in-flight operation completes after close()", async () => {
    const queue = new MaintenanceQueue();
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const operation = vi.fn(async () => {
      await gate;
      return "done";
    });

    const running = queue.execute(operation);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(queue.isProcessing()).toBe(true);

    queue.close();
    release?.();

    await expect(running).resolves.toBe("done");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(queue.isProcessing()).toBe(false);
  });

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
    const { timedOut } = await queue.waitForCompletion();
    expect(timedOut).toBe(false);
    expect(queue.isProcessing()).toBe(false);
  });

  it("exposes current job kind while an operation runs", async () => {
    const queue = new MaintenanceQueue();
    let kindDuringRun: ReturnType<MaintenanceQueue["getCurrentJobKind"]> =
      null;

    const running = queue.execute(
      async () => {
        kindDuringRun = queue.getCurrentJobKind();
        await new Promise((resolve) => setTimeout(resolve, 20));
        return "done";
      },
      { kind: MAINTENANCE_JOB_KIND.RESTORE }
    );

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(queue.getCurrentJobKind()).toBe(MAINTENANCE_JOB_KIND.RESTORE);
    await running;
    expect(kindDuringRun).toBe(MAINTENANCE_JOB_KIND.RESTORE);
    expect(queue.getCurrentJobKind()).toBeNull();
  });

  it("waitForCompletion with timeout returns control while the job keeps running", async () => {
    const queue = new MaintenanceQueue();
    let finished = false;

    void queue.execute(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      finished = true;
    });

    const startedAt = Date.now();
    const { timedOut } = await queue.waitForCompletion(30);
    const elapsedMs = Date.now() - startedAt;

    expect(timedOut).toBe(true);
    expect(elapsedMs).toBeLessThan(150);
    expect(finished).toBe(false);
    expect(queue.isProcessing()).toBe(true);

    await queue.waitForCompletion();
    expect(finished).toBe(true);
  });
});

