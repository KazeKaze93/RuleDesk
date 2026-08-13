import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAbortError,
  ProviderRateLimitGateError,
  ProviderThrottle,
} from "@/main/providers/provider-throttle";

const FAKE_NOW_MS = Date.UTC(2026, 0, 1);

beforeEach(() => {
  vi.useFakeTimers({ now: FAKE_NOW_MS });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ProviderThrottle priority and 429 gate", () => {
  it("runs a later user waiter before an earlier background waiter", async () => {
    const throttle = new ProviderThrottle(80, 0);
    await throttle.wait("user");

    const order: string[] = [];
    const startedAt = Date.now();

    const background = throttle.wait("background").then(() => {
      order.push("background");
      return Date.now() - startedAt;
    });

    await vi.advanceTimersByTimeAsync(10);

    const user = throttle.wait("user").then(() => {
      order.push("user");
      return Date.now() - startedAt;
    });

    await vi.advanceTimersByTimeAsync(200);
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
    expect(Date.now() - startedAt).toBe(0);
  });

  it("blocks a user waiter after tag-resolve notifies the shared gate", async () => {
    const throttle = new ProviderThrottle(10, 0, {
      userGateWaitCeilingMs: 80,
      defaultRateLimitGateMs: 5_000,
    });

    throttle.notifyRateLimited(5_000);

    const startedAt = Date.now();
    const waitPromise = throttle.wait("user");
    const assertion = expect(waitPromise).rejects.toBeInstanceOf(
      ProviderRateLimitGateError
    );
    await vi.advanceTimersByTimeAsync(80);
    await assertion;
    expect(Date.now() - startedAt).toBe(80);
  });

  it("exposes a sync-notified gate to subsequent background waiters", async () => {
    const throttle = new ProviderThrottle(10, 0);
    throttle.notifyRateLimited(3_000);

    await expect(throttle.wait("background")).rejects.toMatchObject({
      name: "ProviderRateLimitGateError",
      retryAfterMs: expect.any(Number),
    });
    expect(throttle.isRateLimited()).toBe(true);
  });

  it("keeps single-caller spacing at the configured min interval", async () => {
    const throttle = new ProviderThrottle(50, 0);
    await throttle.wait("user");
    const startedAt = Date.now();
    const second = throttle.wait("user");
    await vi.advanceTimersByTimeAsync(50);
    await second;
    expect(Date.now() - startedAt).toBe(50);
  });

  it("rejects wait immediately when the signal is already aborted", async () => {
    const throttle = new ProviderThrottle(80, 0);
    const abortController = new AbortController();
    abortController.abort();
    await expect(
      throttle.wait("user", abortController.signal)
    ).rejects.toSatisfy(isAbortError);
  });

  it("removes queued waiters on abort so a later wait is not delayed by them", async () => {
    const throttle = new ProviderThrottle(50, 0);
    await throttle.wait("user");

    const abortController = new AbortController();
    const stale = [0, 1, 2, 3, 4].map(() =>
      throttle.wait("user", abortController.signal).then(
        () => "resolved",
        (error: unknown) => (isAbortError(error) ? "aborted" : "other")
      )
    );
    await vi.advanceTimersByTimeAsync(10);
    abortController.abort();
    await expect(Promise.all(stale)).resolves.toEqual([
      "aborted",
      "aborted",
      "aborted",
      "aborted",
      "aborted",
    ]);

    const startedAt = Date.now();
    const next = throttle.wait("user");
    await vi.advanceTimersByTimeAsync(40);
    await next;
    expect(Date.now() - startedAt).toBe(40);
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
    const next = throttle.wait("user");
    await vi.advanceTimersByTimeAsync(80);
    await next;
    expect(Date.now() - startedAt).toBe(80);
  });
});
