// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refetch = vi.fn();
const fetchNextPage = vi.fn();

type InfiniteQueryMockResult = {
  data:
    | {
        pages: Array<
          Array<{
            id: number;
            tags: string;
            fileUrl: string;
            publishedAt: number;
            isViewed: boolean;
            isFavorited: boolean;
          }>
        >;
        pageParams: number[];
      }
    | undefined;
  fetchNextPage: typeof fetchNextPage;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: typeof refetch;
};

const useInfiniteQueryMock = vi.fn((): InfiniteQueryMockResult => ({
  data: undefined,
  fetchNextPage,
  hasNextPage: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  isLoading: false,
  isError: true,
  error: new Error("favorites IPC rejected"),
  refetch,
}));

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
    useInfiniteQuery: () => useInfiniteQueryMock(),
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
  VirtuosoGrid: ({ totalCount }: { totalCount: number }) =>
    totalCount > 0 ? (
      <div data-testid="favorites-grid">{`grid:${totalCount}`}</div>
    ) : null,
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
  fetchNextPage.mockClear();
});

beforeEach(() => {
  useInfiniteQueryMock.mockReset();
  useInfiniteQueryMock.mockReturnValue({
    data: undefined,
    fetchNextPage,
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isLoading: false,
    isError: true,
    error: new Error("favorites IPC rejected"),
    refetch,
  });
});

describe("Favorites error vs empty UI", () => {
  it("shows fullscreen GalleryLoadError and not the empty favorites copy when the query errors with no posts", () => {
    render(<Favorites />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Could not load favorites")).toBeTruthy();
    expect(screen.getByText("favorites IPC rejected")).toBeTruthy();
    expect(screen.queryByText("No favorites yet")).toBeNull();
    expect(screen.queryByTestId("favorites-grid")).toBeNull();
    expect(screen.queryByText("Could not load more favorites")).toBeNull();
  });

  it("keeps the grid and shows inline next-page error when posts are already loaded", () => {
    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [
          [
            {
              id: 42,
              tags: "example",
              fileUrl: "https://example.com/42.jpg",
              publishedAt: 1_700_000_000,
              isViewed: false,
              isFavorited: true,
            },
          ],
        ],
        pageParams: [1],
      },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      isFetchNextPageError: true,
      isLoading: false,
      isError: true,
      error: new Error("next page rejected"),
      refetch,
    });

    render(<Favorites />);

    expect(screen.getByTestId("favorites-grid")).toBeTruthy();
    expect(screen.getByText("Could not load more favorites")).toBeTruthy();
    expect(
      screen.getByText("next page rejected. Showing previously loaded posts.")
    ).toBeTruthy();
    expect(screen.queryByText("Could not load favorites")).toBeNull();
    expect(screen.queryByText("No favorites yet")).toBeNull();
  });
});
