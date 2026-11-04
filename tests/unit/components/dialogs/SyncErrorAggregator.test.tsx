// @vitest-environment happy-dom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_LISTED_SYNC_ERRORS,
  SyncErrorAggregator,
} from "@/components/dialogs/SyncErrorAggregator";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: toastMocks }));

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

type Listeners = {
  start: (() => void) | null;
  error: ((message: string) => void) | null;
  end: (() => void) | null;
};

type ToastErrorOptions = {
  description: string;
  action: { label: string; onClick: () => void };
};

function installApi(): { listeners: Listeners; unsubscribes: ReturnType<typeof vi.fn>[] } {
  const listeners: Listeners = { start: null, error: null, end: null };
  const unsubscribes: ReturnType<typeof vi.fn>[] = [];
  const track = () => {
    const unsubscribe = vi.fn();
    unsubscribes.push(unsubscribe);
    return unsubscribe;
  };
  window.api = {
    onSyncStart: (cb: () => void) => {
      listeners.start = cb;
      return track();
    },
    onSyncError: (cb: (message: string) => void) => {
      listeners.error = cb;
      return track();
    },
    onSyncEnd: (cb: () => void) => {
      listeners.end = cb;
      return track();
    },
  } as unknown as Window["api"];
  return { listeners, unsubscribes };
}

function runSync(listeners: Listeners, errors: string[]): void {
  act(() => {
    listeners.start?.();
    for (const message of errors) {
      listeners.error?.(message);
    }
    listeners.end?.();
  });
}

describe("SyncErrorAggregator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a success toast when the run had no errors", () => {
    const { listeners } = installApi();
    render(<SyncErrorAggregator />);

    runSync(listeners, []);

    expect(toastMocks.success).toHaveBeenCalledWith("Sync complete");
    expect(toastMocks.error).not.toHaveBeenCalled();
  });

  it("lists up to the cap and summarizes the rest", () => {
    const { listeners } = installApi();
    render(<SyncErrorAggregator />);
    const errors = ["a: timeout", "b: 500", "c: bad tag", "d: x", "e: y"];

    runSync(listeners, errors);

    expect(toastMocks.success).not.toHaveBeenCalled();
    expect(toastMocks.error).toHaveBeenCalledTimes(1);
    const [title, options] = toastMocks.error.mock.calls[0] as [
      string,
      ToastErrorOptions,
    ];
    expect(title).toBe("5 artists failed to sync");
    expect(options.description.split("\n")).toEqual([
      "a: timeout",
      "b: 500",
      "c: bad tag",
      "and 2 more",
    ]);
    expect(MAX_LISTED_SYNC_ERRORS).toBe(3);
  });

  it("uses the singular title and no 'more' line for a single error", () => {
    const { listeners } = installApi();
    render(<SyncErrorAggregator />);

    runSync(listeners, ["wlop: timeout"]);

    const [title, options] = toastMocks.error.mock.calls[0] as [
      string,
      ToastErrorOptions,
    ];
    expect(title).toBe("1 artist failed to sync");
    expect(options.description).toBe("wlop: timeout");
  });

  it("Open Tracked action navigates to /tracked", () => {
    const { listeners } = installApi();
    render(<SyncErrorAggregator />);

    runSync(listeners, ["wlop: timeout"]);

    const [, options] = toastMocks.error.mock.calls[0] as [
      string,
      ToastErrorOptions,
    ];
    expect(options.action.label).toBe("Open Tracked");
    options.action.onClick();
    expect(navigateMock).toHaveBeenCalledWith("/tracked");
  });

  it("shows neither toast when a credentials error occurred", () => {
    const { listeners } = installApi();
    render(<SyncErrorAggregator />);

    runSync(listeners, ["Invalid Credentials for provider"]);
    runSync(listeners, ["wlop: timeout", "Invalid credentials"]);

    expect(toastMocks.success).not.toHaveBeenCalled();
    expect(toastMocks.error).not.toHaveBeenCalled();
  });

  it("resets the credentials flag on the next run", () => {
    const { listeners } = installApi();
    render(<SyncErrorAggregator />);

    runSync(listeners, ["Invalid credentials"]);
    runSync(listeners, []);

    expect(toastMocks.success).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes on unmount", () => {
    const { unsubscribes } = installApi();
    const { unmount } = render(<SyncErrorAggregator />);

    unmount();

    expect(unsubscribes).toHaveLength(3);
    for (const unsubscribe of unsubscribes) {
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    }
  });
});
