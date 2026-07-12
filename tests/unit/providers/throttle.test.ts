import { describe, expect, it } from "vitest";
import {
  ProviderRateLimitGateError,
  ProviderThrottle,
} from "@/main/providers/provider-throttle";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("ProviderThrottle priority and 429 gate", () => {
  it("runs a later user waiter before an earlier background waiter", async () => {
    const throttle = new ProviderThrottle(80, 0);
    // Prime lastRequestAt so the next acquire must sleep (priority can cut in).
    await throttle.wait("user");

    const order: string[] = [];
    const startedAt = Date.now();

    const background = throttle.wait("background").then(() => {
      order.push("background");
      return Date.now() - startedAt;
    });

    // Ensure background has entered interval sleep before user joins.
    await sleep(10);

    const user = throttle.wait("user").then(() => {
      order.push("user");
      return Date.now() - startedAt;
    });

    const [backgroundElapsedMs, userElapsedMs] = await Promise.all([
      background,
      user,
    ]);

    expect(order).toEqual(["user", "background"]);
    expect(userElapsedMs).toBeLessThan(backgroundElapsedMs);
  });

  it("rejects background waiters immediately when the shared gate is closed", async () => {
    const throttle = new ProviderThrottle(10, 0);
    throttle.notifyRateLimited(5_000);

    const startedAt = Date.now();
    await expect(throttle.wait("background")).rejects.toBeInstanceOf(
      ProviderRateLimitGateError
    );
    expect(Date.now() - startedAt).toBeLessThan(100);
  });

  it("blocks a user waiter after tag-resolve notifies the shared gate", async () => {
    const throttle = new ProviderThrottle(10, 0, {
      userGateWaitCeilingMs: 80,
      defaultRateLimitGateMs: 5_000,
    });

    // Simulate tag-resolve 429 writing the shared host gate.
    throttle.notifyRateLimited(5_000);

    const startedAt = Date.now();
    await expect(throttle.wait("user")).rejects.toBeInstanceOf(
      ProviderRateLimitGateError
    );
    const elapsedMs = Date.now() - startedAt;
    expect(elapsedMs).toBeGreaterThanOrEqual(70);
    expect(elapsedMs).toBeLessThan(500);
  });

  it("exposes a sync-notified gate to subsequent background waiters", async () => {
    const throttle = new ProviderThrottle(10, 0);
    // Simulate Sync/Browse receiving HTTP 429.
    throttle.notifyRateLimited(3_000);

    await expect(throttle.wait("background")).rejects.toMatchObject({
      name: "ProviderRateLimitGateError",
      retryAfterMs: expect.any(Number),
    });
    expect(throttle.isRateLimited()).toBe(true);
  });

  it("keeps single-caller spacing near the configured min interval", async () => {
    const throttle = new ProviderThrottle(50, 0);
    const startedAt = Date.now();
    await throttle.wait("user");
    await throttle.wait("user");
    const elapsedMs = Date.now() - startedAt;
    expect(elapsedMs).toBeGreaterThanOrEqual(45);
    expect(elapsedMs).toBeLessThan(200);
  });

  it("does not consume a paced slot when background is rejected by the gate", async () => {
    const throttle = new ProviderThrottle(80, 0);
    await throttle.wait("user");
    throttle.notifyRateLimited(10_000);

    await expect(throttle.wait("background")).rejects.toBeInstanceOf(
      ProviderRateLimitGateError
    );

    throttle.resetRateLimitGateForTests();
    const startedAt = Date.now();
    await throttle.wait("user");
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(70);
  });
});
