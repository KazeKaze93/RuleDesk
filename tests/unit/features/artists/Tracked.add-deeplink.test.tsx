// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRACKED_ADD_ARTIST_DEEPLINK, TRACKED_PATH } from "@/lib/tracked-route";

type QueryState = {
  data: Array<{ id: number; name: string }> | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
};

const READY_STATE: QueryState = {
  data: [{ id: 1, name: "Artist One" }],
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  isFetching: false,
};

let queryState: QueryState = READY_STATE;
let lastReturnFocusRef: MutableRefObject<HTMLElement | null> | null = null;

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
    useQuery: () => queryState,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@/components/dialogs/AddArtistModal", () => ({
  AddArtistModal: ({
    isOpen,
    returnFocusToRef,
  }: {
    isOpen: boolean;
    returnFocusToRef: MutableRefObject<HTMLElement | null>;
  }) => {
    lastReturnFocusRef = returnFocusToRef;
    return <div data-testid="add-artist-modal" data-open={String(isOpen)} />;
  },
}));

vi.mock("@/features/artists/components/ArtistListRow", () => ({
  ArtistListRow: () => null,
}));

import { Tracked } from "@/features/artists/Tracked";

const LocationProbe = () => {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
};

const renderTracked = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Tracked />
      <LocationProbe />
    </MemoryRouter>
  );

beforeEach(() => {
  queryState = READY_STATE;
  lastReturnFocusRef = null;
});

afterEach(() => {
  cleanup();
});

describe("Tracked add-artist deeplink", () => {
  it("keeps the modal closed without the add param", () => {
    renderTracked(TRACKED_PATH);

    expect(screen.getByTestId("add-artist-modal").getAttribute("data-open")).toBe(
      "false"
    );
    expect(screen.getByTestId("location").textContent).toBe(TRACKED_PATH);
  });

  it("opens the modal for ?add=1, returns focus to the Add button, and clears the param", () => {
    renderTracked(TRACKED_ADD_ARTIST_DEEPLINK);

    expect(screen.getByTestId("add-artist-modal").getAttribute("data-open")).toBe(
      "true"
    );
    expect(lastReturnFocusRef?.current).toBe(
      screen.getByRole("button", { name: "Add a tracked artist" })
    );
    expect(screen.getByTestId("location").textContent).toBe(TRACKED_PATH);
  });

  it("ignores other values of the add param", () => {
    renderTracked(`${TRACKED_PATH}?add=0`);

    expect(screen.getByTestId("add-artist-modal").getAttribute("data-open")).toBe(
      "false"
    );
  });

  it("preserves unrelated query params when clearing add", () => {
    renderTracked(`${TRACKED_PATH}?add=1&foo=bar`);

    expect(screen.getByTestId("location").textContent).toBe(
      `${TRACKED_PATH}?foo=bar`
    );
  });

  it("waits for the page to load before consuming the deeplink", () => {
    queryState = { ...READY_STATE, data: undefined, isLoading: true };
    renderTracked(TRACKED_ADD_ARTIST_DEEPLINK);

    expect(screen.queryByTestId("add-artist-modal")).toBeNull();
    expect(screen.getByTestId("location").textContent).toBe(
      TRACKED_ADD_ARTIST_DEEPLINK
    );
  });
});
