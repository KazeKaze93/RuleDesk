import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelRelease,
  RELEASE_DEFER_MS,
  scheduleRelease,
} from "@/lib/deferred-release";

describe("deferred-release", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mount → unmount → mount same playlistId: release not called after RELEASE_DEFER_MS", () => {
    const release = vi.fn();
    // StrictMode: cleanup schedules, remount cancels before the timer fires.
    scheduleRelease(3, release);
    cancelRelease(3);
    vi.advanceTimersByTime(RELEASE_DEFER_MS);
    expect(release).not.toHaveBeenCalled();
  });

  it("mount → unmount: release called exactly once after defer", () => {
    const release = vi.fn();
    scheduleRelease(3, release);
    vi.advanceTimersByTime(RELEASE_DEFER_MS - 1);
    expect(release).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("switch A → B: release(A) fires, release(B) does not while B stays mounted", () => {
    const releaseA = vi.fn();
    const releaseB = vi.fn();
    scheduleRelease(1, releaseA);
    // Leave A, enter B: cancel B (noop), schedule A stays; B mounts → cancel B.
    cancelRelease(2);
    scheduleRelease(2, releaseB);
    cancelRelease(2);
    vi.advanceTimersByTime(RELEASE_DEFER_MS);
    expect(releaseA).toHaveBeenCalledTimes(1);
    expect(releaseB).not.toHaveBeenCalled();
  });

  it("reschedule same playlistId replaces the previous timer", () => {
    const first = vi.fn();
    const second = vi.fn();
    scheduleRelease(9, first);
    vi.advanceTimersByTime(RELEASE_DEFER_MS - 1);
    scheduleRelease(9, second);
    vi.advanceTimersByTime(RELEASE_DEFER_MS - 1);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
