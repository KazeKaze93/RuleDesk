// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ViewerContent } from "@/features/viewer/ViewerContent";
import { makePost } from "../../components/PostCard/makePost";

const VIEWER_ANNOUNCE_CLEAR_MS = 3000;

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/features/viewer/ViewerMedia", () => ({
  ViewerMedia: () => <div data-testid="viewer-media" />,
}));

vi.mock("@/features/viewer/TagsDrawer", () => ({
  TagsDrawer: () => null,
}));

vi.mock("@/components/playlists/AddToPlaylistModal", () => ({
  AddToPlaylistModal: () => null,
}));

vi.mock("@/store/viewerStore", () => ({
  useViewerStore: (
    selector: (state: { setQueueIsRandom: (value: boolean) => void }) => unknown
  ) => selector({ setQueueIsRandom: vi.fn() }),
}));

vi.mock("@/features/viewer/hooks/useViewerController", () => ({
  useViewerController: () => ({
    isFavorited: false,
    isDownloading: false,
    downloadProgress: 0,
    isCurrentlyDownloading: false,
    postPageUrl: "https://example.com/post/1",
    tagQuery: "",
    toggleFavorite: vi.fn().mockResolvedValue(undefined),
    downloadImage: vi.fn().mockResolvedValue(undefined),
    handleCopyText: vi.fn().mockResolvedValue(undefined),
    handleOpenExternal: vi.fn(),
    openFolder: vi.fn().mockResolvedValue(undefined),
    resetLocalCache: vi.fn(),
    handleCopyMetadata: vi.fn().mockResolvedValue(undefined),
    handleCopyDebugInfo: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("ViewerContent aria-live announce timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.api = {
      markPostAsViewed: vi.fn().mockResolvedValue(undefined),
    } as unknown as Window["api"];
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not clear the second announce when the first timer would fire", () => {
    const post = makePost({ isFavorited: false, isViewed: false });

    render(
      <ViewerContent
        post={post}
        queue={null}
        close={vi.fn()}
        next={vi.fn()}
        prev={vi.fn()}
        controlsVisible
        toggleTagsDrawer={vi.fn()}
        isTagsDrawerOpen={false}
      />
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "v" }));
    });
    expect(screen.getByRole("status").textContent).toBe("Marked as viewed");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" }));
    });
    expect(screen.getByRole("status").textContent).toBe("Added to favorites");

    // First announce was scheduled at t=0; at t=3000 it would clear if not cancelled.
    // Second announce was scheduled at t=1000, so at t=3000 it must still be visible.
    act(() => {
      vi.advanceTimersByTime(VIEWER_ANNOUNCE_CLEAR_MS - 1000);
    });
    expect(screen.getByRole("status").textContent).toBe("Added to favorites");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
