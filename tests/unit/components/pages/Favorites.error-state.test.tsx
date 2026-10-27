// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const refetch = vi.fn();

vi.mock("electron-log/renderer", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query"
  );
  return {
    ...actual,
    useInfiniteQuery: () => ({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: true,
      error: new Error("favorites IPC rejected"),
      refetch,
    }),
    useMutation: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useQueryClient: () => ({
      setQueriesData: vi.fn(),
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock("@/store/viewerStore", () => ({
  useViewerStore: (selector: (state: { open: unknown; appendQueueIds: unknown }) => unknown) =>
    selector({ open: vi.fn(), appendQueueIds: vi.fn() }),
}));

vi.mock("@/store/searchStore", () => ({
  buildBooruTagListForIpc: () => [],
  useSearchStore: (selector: (state: {
    includeTags: unknown[];
    excludeTags: unknown[];
    sortOrder: string;
    viewType: string;
    filters: { aiFilter: string; mediaType: string };
  }) => unknown) =>
    selector({
      includeTags: [],
      excludeTags: [],
      sortOrder: "desc",
      viewType: "grid",
      filters: { aiFilter: "all", mediaType: "all" },
    }),
}));

vi.mock("@/hooks/useBulkSelect", () => ({
  useBulkSelect: (selector: (state: {
    isBulkMode: boolean;
    activateBulkMode: unknown;
    deactivate: unknown;
    selectedIds: Set<string>;
    selectAll: unknown;
    clearSelection: unknown;
  }) => unknown) =>
    selector({
      isBulkMode: false,
      activateBulkMode: vi.fn(),
      deactivate: vi.fn(),
      selectedIds: new Set(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
    }),
}));

vi.mock("@/hooks/useMasonryInfiniteScroll", () => ({
  useMasonryInfiniteScroll: () => vi.fn(),
}));

vi.mock("react-virtuoso", () => ({
  VirtuosoGrid: () => null,
}));

vi.mock("@/features/artists/components/PostCard", () => ({
  PostCard: () => null,
}));

vi.mock("@/components/BulkActionBar/BulkActionBar", () => ({
  BulkActionBar: () => null,
}));

import { Favorites } from "@/components/pages/Favorites";

afterEach(() => {
  cleanup();
  refetch.mockClear();
});

describe("Favorites error vs empty UI", () => {
  it("shows GalleryLoadError and not the empty favorites copy when the query errors", () => {
    render(<Favorites />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Could not load favorites")).toBeTruthy();
    expect(screen.getByText("favorites IPC rejected")).toBeTruthy();
    expect(screen.queryByText("No favorites yet")).toBeNull();
  });
});
