// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatSyncProgressLabel, useSyncAll } from "@/hooks/useSyncAll";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
}));

type Listener<T extends unknown[] = []> = (...args: T) => void;

type SyncApiHarness = {
  syncAll: ReturnType<typeof vi.fn>;
  unsubscribes: ReturnType<typeof vi.fn>[];
  emitStart: () => void;
  emitProgress: (message: string) => void;
  emitEnd: () => void;
};

function installSyncApi(
  syncAll: () => Promise<boolean> = async () => true
): SyncApiHarness {
  let start: Listener | null = null;
  let progress: Listener<[string]> | null = null;
  let end: Listener | null = null;
  const unsubscribes: ReturnType<typeof vi.fn>[] = [];
  const subscribe = <T extends unknown[]>(assign: (cb: Listener<T>) => void) => {
    return (callback: Listener<T>) => {
      assign(callback);
      const unsubscribe = vi.fn();
      unsubscribes.push(unsubscribe);
      return unsubscribe;
    };
  };
  const syncAllMock = vi.fn(syncAll);

  window.api = {
    syncAll: syncAllMock,
    onSyncStart: subscribe<[]>((cb) => {
      start = cb;
    }),
    onSyncProgress: subscribe<[string]>((cb) => {
      progress = cb;
    }),
    onSyncEnd: subscribe<[]>((cb) => {
      end = cb;
    }),
  } as unknown as Window["api"];

  return {
    syncAll: syncAllMock,
    unsubscribes,
    emitStart: () => start?.(),
    emitProgress: (message) => progress?.(message),
    emitEnd: () => end?.(),
  };
}

describe("formatSyncProgressLabel", () => {
  it("extracts the artist name from the Checking payload", () => {
    expect(formatSyncProgressLabel("Checking wlop...")).toBe("Syncing wlop...");
    expect(formatSyncProgressLabel("Checking John Doe (2)...")).toBe(
      "Syncing John Doe (2)..."
    );
  });

  it("falls back to the generic label for null or unknown payloads", () => {
    expect(formatSyncProgressLabel(null)).toBe("Syncing...");
    expect(formatSyncProgressLabel("something else")).toBe("Syncing...");
    expect(formatSyncProgressLabel("Checking ...")).toBe("Syncing...");
  });
});

describe("useSyncAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("tracks start, progress label and end", () => {
    const api = installSyncApi();
    const onSyncEnd = vi.fn();
    const { result } = renderHook(() => useSyncAll({ onSyncEnd }));

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.progress).toBe("");

    act(() => api.emitStart());
    expect(result.current.isSyncing).toBe(true);
    expect(result.current.progress).toBe("Syncing...");

    act(() => api.emitProgress("Checking wlop..."));
    expect(result.current.progress).toBe("Syncing wlop...");

    act(() => api.emitEnd());
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.progress).toBe("");
    expect(onSyncEnd).toHaveBeenCalledTimes(1);
  });

  it("treats progress alone as syncing", () => {
    const api = installSyncApi();
    const { result } = renderHook(() => useSyncAll());

    act(() => api.emitProgress("Checking wlop..."));
    expect(result.current.isSyncing).toBe(true);
  });

  it("startSync is a no-op while syncing", async () => {
    const api = installSyncApi();
    const { result } = renderHook(() => useSyncAll());

    act(() => api.emitStart());
    await act(async () => {
      await result.current.startSync();
    });
    expect(api.syncAll).not.toHaveBeenCalled();
  });

  it("startSync ignores a second call before the first resolves", async () => {
    let resolveSync: (value: boolean) => void = () => undefined;
    const api = installSyncApi(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSync = resolve;
        })
    );
    const { result } = renderHook(() => useSyncAll());

    let first: Promise<void> = Promise.resolve();
    await act(async () => {
      first = result.current.startSync();
      void result.current.startSync();
    });
    expect(api.syncAll).toHaveBeenCalledTimes(1);
    expect(result.current.isSyncing).toBe(true);

    await act(async () => {
      resolveSync(true);
      await first;
    });
  });

  it("startSync clears syncing and toasts when syncAll rejects", async () => {
    const api = installSyncApi(async () => {
      throw new Error("boom");
    });
    const { result } = renderHook(() => useSyncAll());

    await act(async () => {
      await result.current.startSync();
    });

    expect(api.syncAll).toHaveBeenCalledTimes(1);
    expect(result.current.isSyncing).toBe(false);
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes all listeners on unmount", () => {
    const api = installSyncApi();
    const { unmount } = renderHook(() => useSyncAll());

    expect(api.unsubscribes).toHaveLength(3);
    unmount();
    for (const unsubscribe of api.unsubscribes) {
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    }
  });
});
