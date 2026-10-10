// @vitest-environment happy-dom
import { createElement, act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARTISTS_SYNC_INVALIDATION_DEBOUNCE_MS,
  useArtistsSyncInvalidation,
} from "@/renderer/hooks/useArtistsSyncInvalidation";

type SyncListener = () => void;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

type ApiHarness = {
  emitSyncArtist: () => void;
  emitSyncEnd: () => void;
  emitRepairStart: () => void;
  emitRepairEnd: () => void;
};

function installWindowApi(): ApiHarness {
  const syncArtistListeners = new Set<SyncListener>();
  const syncEndListeners = new Set<SyncListener>();
  const repairStartListeners = new Set<SyncListener>();
  const repairEndListeners = new Set<SyncListener>();

  const api = {
    onSyncArtist: (callback: SyncListener) => {
      syncArtistListeners.add(callback);
      return () => {
        syncArtistListeners.delete(callback);
      };
    },
    onSyncEnd: (callback: SyncListener) => {
      syncEndListeners.add(callback);
      return () => {
        syncEndListeners.delete(callback);
      };
    },
    onRepairStart: (callback: SyncListener) => {
      repairStartListeners.add(callback);
      return () => {
        repairStartListeners.delete(callback);
      };
    },
    onRepairEnd: (callback: SyncListener) => {
      repairEndListeners.add(callback);
      return () => {
        repairEndListeners.delete(callback);
      };
    },
  };

  window.api = api as Window["api"];

  return {
    emitSyncArtist: () => {
      for (const listener of syncArtistListeners) {
        listener();
      }
    },
    emitSyncEnd: () => {
      for (const listener of syncEndListeners) {
        listener();
      }
    },
    emitRepairStart: () => {
      for (const listener of repairStartListeners) {
        listener();
      }
    },
    emitRepairEnd: () => {
      for (const listener of repairEndListeners) {
        listener();
      }
    },
  };
}

type MountedHook = {
  unmount: () => void;
};

function mountHook(queryClient: QueryClient): MountedHook {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  function Harness(): ReactNode {
    useArtistsSyncInvalidation(queryClient);
    return null;
  }

  act(() => {
    root.render(
      createElement(QueryClientProvider, { client: queryClient }, createElement(Harness))
    );
  });

  return {
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("useArtistsSyncInvalidation", () => {
  let api: ApiHarness;
  let queryClient: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
    api = installWindowApi();
    queryClient = createQueryClient();
    invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  });

  afterEach(() => {
    vi.useRealTimers();
    invalidateSpy.mockRestore();
    queryClient.clear();
  });

  function artistsInvalidationCount(): number {
    return invalidateSpy.mock.calls.filter((call) => {
      const arg = call[0];
      if (typeof arg !== "object" || arg === null || !("queryKey" in arg)) {
        return false;
      }
      const queryKey = Reflect.get(arg, "queryKey");
      return (
        Array.isArray(queryKey) &&
        queryKey.length === 1 &&
        queryKey[0] === "artists"
      );
    }).length;
  }

  it("coalesces Sync All sync:artist bursts to far fewer than 2N aggregate invalidations", () => {
    const artistCount = 20;
    const syncArtistEvents = artistCount * 2;
    const { unmount } = mountHook(queryClient);

    act(() => {
      for (let i = 0; i < syncArtistEvents; i += 1) {
        api.emitSyncArtist();
      }
    });

    expect(artistsInvalidationCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(ARTISTS_SYNC_INVALIDATION_DEBOUNCE_MS - 1);
    });
    expect(artistsInvalidationCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(artistsInvalidationCount()).toBe(1);

    act(() => {
      api.emitSyncEnd();
    });
    // Final flush on sync:end (may clear a pending timer; here timer already fired).
    expect(artistsInvalidationCount()).toBe(2);

    expect(artistsInvalidationCount()).toBeLessThan(syncArtistEvents);
    expect(artistsInvalidationCount()).toBeLessThan(artistCount);

    unmount();
  });

  it("guarantees a final artists invalidation on sync:end even if debounce never elapsed", () => {
    const { unmount } = mountHook(queryClient);

    act(() => {
      api.emitSyncArtist();
      api.emitSyncArtist();
    });
    expect(artistsInvalidationCount()).toBe(0);

    act(() => {
      api.emitSyncEnd();
    });
    expect(artistsInvalidationCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(ARTISTS_SYNC_INVALIDATION_DEBOUNCE_MS);
    });
    // Pending timer was flushed — no second fire.
    expect(artistsInvalidationCount()).toBe(1);

    unmount();
  });

  it("flushes artists immediately on repair start/end", () => {
    const { unmount } = mountHook(queryClient);

    act(() => {
      api.emitRepairStart();
    });
    expect(artistsInvalidationCount()).toBe(1);

    act(() => {
      api.emitRepairEnd();
    });
    expect(artistsInvalidationCount()).toBe(2);

    unmount();
  });

  it("resets the debounce window on each sync:artist", () => {
    const { unmount } = mountHook(queryClient);

    act(() => {
      api.emitSyncArtist();
    });
    act(() => {
      vi.advanceTimersByTime(ARTISTS_SYNC_INVALIDATION_DEBOUNCE_MS - 50);
    });
    act(() => {
      api.emitSyncArtist();
    });
    act(() => {
      vi.advanceTimersByTime(ARTISTS_SYNC_INVALIDATION_DEBOUNCE_MS - 1);
    });
    expect(artistsInvalidationCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(artistsInvalidationCount()).toBe(1);

    unmount();
  });

  it("clears the pending debounce timer on unmount", () => {
    const { unmount } = mountHook(queryClient);

    act(() => {
      api.emitSyncArtist();
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(ARTISTS_SYNC_INVALIDATION_DEBOUNCE_MS);
    });
    expect(artistsInvalidationCount()).toBe(0);
  });
});
