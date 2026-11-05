// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OPEN_IN_BROWSER_ARIA_LABEL,
  ViewerContent,
} from "@/features/viewer/ViewerContent";
import { makePost } from "../../components/PostCard/makePost";

const MORE_OPTIONS_ARIA_LABEL = "More options";
const OPEN_POST_PAGE_MENU_LABEL = "Open post page";
const REVEAL_IN_FOLDER_MENU_LABEL = "Reveal in folder";

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

function renderViewerContent(): void {
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
}

describe("ViewerContent open-in-browser toolbar button", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows Open in browser on the toolbar and not in More options", () => {
    renderViewerContent();

    expect(
      screen.getByRole("button", { name: OPEN_IN_BROWSER_ARIA_LABEL })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: MORE_OPTIONS_ARIA_LABEL })
    );

    expect(screen.getByText(REVEAL_IN_FOLDER_MENU_LABEL)).toBeTruthy();
    expect(screen.queryByText(OPEN_IN_BROWSER_ARIA_LABEL)).toBeNull();
    expect(screen.queryByText(OPEN_POST_PAGE_MENU_LABEL)).toBeNull();
  });
});
