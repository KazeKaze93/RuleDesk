// @vitest-environment happy-dom
import { act, cleanup, render } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderId } from "@shared/constants";

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
let lastOnAdd:
  | ((
      name: string,
      tag: string,
      type: "tag" | "uploader" | "query",
      provider: ProviderId
    ) => void)
  | null = null;

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const navigateMock = vi.hoisted(() => vi.fn());
const addArtistMock = vi.hoisted(() =>
  vi.fn(async () => ({ id: 42, name: "wlop", tag: "wlop" }))
);

vi.mock("electron-log/renderer", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("sonner", () => ({ toast: toastMocks }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query"
  );
  return {
    ...actual,
    useQuery: () => queryState,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(async () => undefined),
    }),
  };
});

vi.mock("@/components/dialogs/AddArtistModal", () => ({
  AddArtistModal: ({
    onAdd,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (
      name: string,
      tag: string,
      type: "tag" | "uploader" | "query",
      provider: ProviderId
    ) => void;
    returnFocusToRef: MutableRefObject<HTMLElement | null>;
  }) => {
    lastOnAdd = onAdd;
    return <div data-testid="add-artist-modal" />;
  },
}));

vi.mock("@/features/artists/components/ArtistListRow", () => ({
  ArtistListRow: () => null,
}));

import { Tracked } from "@/features/artists/Tracked";

type ToastSuccessOptions = {
  action: { label: string; onClick: () => void };
};

function isToastSuccessOptions(value: unknown): value is ToastSuccessOptions {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("action" in value)) {
    return false;
  }
  const actionValue = value.action;
  if (typeof actionValue !== "object" || actionValue === null) {
    return false;
  }
  if (!("label" in actionValue) || !("onClick" in actionValue)) {
    return false;
  }
  return (
    typeof actionValue.label === "string" &&
    typeof actionValue.onClick === "function"
  );
}

function installApi(): void {
  const api = {
    getTrackedArtists: vi.fn(async () => READY_STATE.data),
    addArtist: addArtistMock,
  };
  // Partial Window.api stub for add-artist toast wiring only.
  // @ts-expect-error test harness supplies only the IPC methods this suite exercises
  window.api = api;
}

beforeEach(() => {
  queryState = READY_STATE;
  lastOnAdd = null;
  toastMocks.success.mockClear();
  toastMocks.error.mockClear();
  navigateMock.mockClear();
  addArtistMock.mockClear();
  addArtistMock.mockResolvedValue({ id: 42, name: "wlop", tag: "wlop" });
  installApi();
});

afterEach(() => {
  cleanup();
});

describe("Tracked add-artist success toast", () => {
  it("shows success toast with Open gallery action navigating to /artist/:id", async () => {
    render(
      <MemoryRouter initialEntries={["/tracked"]}>
        <Tracked />
      </MemoryRouter>
    );

    expect(lastOnAdd).not.toBeNull();

    await act(async () => {
      lastOnAdd?.("wlop", "wlop", "tag", "rule34");
    });

    expect(addArtistMock).toHaveBeenCalledWith({
      name: "wlop",
      tag: "wlop",
      type: "tag",
      provider: "rule34",
    });
    expect(toastMocks.success).toHaveBeenCalledTimes(1);

    const successCall = toastMocks.success.mock.calls[0];
    expect(successCall?.[0]).toBe("Artist added");
    expect(isToastSuccessOptions(successCall?.[1])).toBe(true);

    if (!isToastSuccessOptions(successCall?.[1])) {
      throw new Error("Expected toast.success options with an action");
    }

    expect(successCall[1].action.label).toBe("Open gallery");

    act(() => {
      successCall[1].action.onClick();
    });

    expect(navigateMock).toHaveBeenCalledWith("/artist/42");
  });

  it("keeps the success message when addArtist returns no id", async () => {
    addArtistMock.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/tracked"]}>
        <Tracked />
      </MemoryRouter>
    );

    await act(async () => {
      lastOnAdd?.("wlop", "wlop", "tag", "rule34");
    });

    expect(toastMocks.success).toHaveBeenCalledWith("Artist added");
    expect(toastMocks.success.mock.calls[0]?.[1]).toBeUndefined();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
