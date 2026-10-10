// @vitest-environment happy-dom
import { createElement, act, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrackAndDownloadArtist } from "@/renderer/hooks/useTrackAndDownloadArtist";
import type { ProviderId } from "@/shared/constants";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

type HookApi = ReturnType<typeof useTrackAndDownloadArtist>;

type Mounted = {
  result: { current: HookApi | null };
  unmount: () => void;
};

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
}

function installApi(overrides?: {
  resolveTags?: () => Promise<string[]>;
  getTrackedArtists?: () => Promise<Array<{ id: number; tag: string; provider: string }>>;
  addArtist?: () => Promise<{ id: number } | undefined>;
  repairArtist?: () => Promise<{ success: boolean; error?: string }>;
  downloadAll?: () => Promise<{
    success: boolean;
    downloaded: number;
    failed: [];
    canceled: boolean;
  }>;
}) {
  const api = {
    resolveTags: vi.fn(overrides?.resolveTags ?? (async () => ["wlop"])),
    getTrackedArtists: vi.fn(
      overrides?.getTrackedArtists ?? (async () => [])
    ),
    addArtist: vi.fn(
      overrides?.addArtist ??
        (async () => ({
          id: 11,
          name: "wlop",
          tag: "wlop",
          type: "tag" as const,
          provider: "rule34" as const,
        }))
    ),
    repairArtist: vi.fn(
      overrides?.repairArtist ?? (async () => ({ success: true }))
    ),
    downloadAll: vi.fn(
      overrides?.downloadAll ??
        (async () => ({
          success: true,
          downloaded: 2,
          failed: [],
          canceled: false,
        }))
    ),
    onDownloadAllProgress: vi.fn(() => () => undefined),
    cancelDownloadAll: vi.fn(async () => true),
    pauseDownloadAll: vi.fn(async () => undefined),
    resumeDownloadAll: vi.fn(async () => undefined),
  };
  window.api = api as Window["api"];
  return api;
}

function mountHook(
  includeTags: string[],
  provider: ProviderId = "rule34"
): Mounted {
  const result: { current: HookApi | null } = { current: null };
  const queryClient = createQueryClient();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  function Harness(): ReactNode {
    const api = useTrackAndDownloadArtist(includeTags, provider);
    useEffect(() => {
      result.current = api;
    });
    return null;
  }

  act(() => {
    root.render(
      createElement(QueryClientProvider, { client: queryClient }, createElement(Harness))
    );
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
      queryClient.clear();
    },
  };
}

describe("useTrackAndDownloadArtist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("shows action only for a single resolved artist include tag", async () => {
    installApi({ resolveTags: async () => ["wlop"] });
    const mounted = mountHook(["wlop"]);

    await waitFor(() => {
      expect(mounted.result.current?.canShowAction).toBe(true);
    });
    mounted.unmount();
  });

  it("hides action for multiple include tags without resolving", async () => {
    const api = installApi();
    const mounted = mountHook(["wlop", "1girl"]);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mounted.result.current?.canShowAction).toBe(false);
    expect(api.resolveTags).not.toHaveBeenCalled();
    mounted.unmount();
  });

  it("hides action when the sole tag is not an artist", async () => {
    installApi({ resolveTags: async () => [] });
    const mounted = mountHook(["1girl"]);

    await waitFor(() => {
      expect(mounted.result.current?.isResolvingArtistTag).toBe(false);
    });
    expect(mounted.result.current?.canShowAction).toBe(false);
    mounted.unmount();
  });

  it("orchestrates add → sync → downloadAll artist without duplicate add when tracked", async () => {
    const api = installApi({
      getTrackedArtists: async () => [
        { id: 42, tag: "wlop", provider: "rule34" },
      ],
    });
    const mounted = mountHook(["wlop"]);

    await waitFor(() => {
      expect(mounted.result.current?.canShowAction).toBe(true);
    });

    await act(async () => {
      await mounted.result.current?.trackAndDownload();
    });

    expect(api.addArtist).not.toHaveBeenCalled();
    expect(api.repairArtist).toHaveBeenCalledWith(42);
    expect(api.downloadAll).toHaveBeenCalledWith({
      kind: "artist",
      artistId: 42,
    });
    mounted.unmount();
  });

  it("does not start download when sync fails", async () => {
    const api = installApi({
      getTrackedArtists: async () => [
        { id: 42, tag: "wlop", provider: "rule34" },
      ],
      repairArtist: async () => ({
        success: false,
        error: "HTTP 429: rate limited",
      }),
    });
    const mounted = mountHook(["wlop"]);

    await waitFor(() => {
      expect(mounted.result.current?.canShowAction).toBe(true);
    });

    await act(async () => {
      await mounted.result.current?.trackAndDownload();
    });

    expect(api.repairArtist).toHaveBeenCalled();
    expect(api.downloadAll).not.toHaveBeenCalled();
    expect(mounted.result.current?.phase).toBe("idle");
    mounted.unmount();
  });

  it("does not start download when sync is cancelled", async () => {
    const api = installApi({
      getTrackedArtists: async () => [
        { id: 42, tag: "wlop", provider: "rule34" },
      ],
      repairArtist: async () => ({
        success: false,
        error: "Sync cancelled",
      }),
    });
    const mounted = mountHook(["wlop"]);

    await waitFor(() => {
      expect(mounted.result.current?.canShowAction).toBe(true);
    });

    await act(async () => {
      await mounted.result.current?.trackAndDownload();
    });

    expect(api.downloadAll).not.toHaveBeenCalled();
    mounted.unmount();
  });
});
