import { describe, expect, it, vi } from "vitest";
import { DownloadRateLimitGate } from "@/main/workers/download-rate-limit-gate";

describe("DownloadRateLimitGate", () => {
  it("blocks until scheduled pause elapses", async () => {
    const gate = new DownloadRateLimitGate();
    let now = 1_000_000;
    gate.schedulePause({ baseDelayMs: 1000, nowMs: now });
    expect(gate.isPaused(now)).toBe(true);

    const sleep = vi.fn(async (ms: number) => {
      now += ms;
    });
    await gate.waitUntilOpen(() => false, sleep, () => now);
    expect(gate.isPaused(now)).toBe(false);
    expect(sleep).toHaveBeenCalled();
  });

  it("extends openAt when a later 429 requests a longer pause", () => {
    const gate = new DownloadRateLimitGate();
    const t0 = 5_000_000;
    gate.schedulePause({ baseDelayMs: 1000, retryAfterMs: 500, nowMs: t0 });
    const firstOpen = gate.blockedUntilMs;
    gate.schedulePause({ baseDelayMs: 1000, retryAfterMs: 5000, nowMs: t0 + 10 });
    expect(gate.blockedUntilMs).toBeGreaterThan(firstOpen);
  });

  it("waitUntilOpen returns immediately when aborted", async () => {
    const gate = new DownloadRateLimitGate();
    gate.schedulePause({ baseDelayMs: 60_000, nowMs: Date.now() });
    const sleep = vi.fn(async () => undefined);
    await gate.waitUntilOpen(() => true, sleep);
    expect(sleep).not.toHaveBeenCalled();
  });
});
