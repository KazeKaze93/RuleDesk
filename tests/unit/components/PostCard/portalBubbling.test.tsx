// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostCard } from "@/features/artists/components/PostCard";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import { useSearchStore } from "@/store/searchStore";
import { makePost } from "./makePost";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/hooks/useVideoProxyUrl", () => ({
  useVideoProxyUrl: () => null,
}));

const originalIntersectionObserver = globalThis.IntersectionObserver;
const originalResizeObserver = globalThis.ResizeObserver;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: ReactElement): ReturnType<typeof render> {
  const queryClient = createQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper: Wrapper });
}

function installPlaylistApi(): void {
  Reflect.set(window, "api", {
    getPlaylists: vi.fn().mockResolvedValue([]),
    getPlaylistsContainingPost: vi.fn().mockResolvedValue([]),
    getManualPlaylistMembershipForPosts: vi.fn().mockResolvedValue([]),
    shadowInsertPost: vi.fn(),
    createPlaylist: vi.fn(),
    syncManualPlaylistMembership: vi.fn(),
  });
}

afterEach(() => {
  cleanup();
  useBulkSelect.getState().deactivate();
  vi.useRealTimers();
  globalThis.IntersectionObserver = originalIntersectionObserver;
  globalThis.ResizeObserver = originalResizeObserver;
});

beforeEach(() => {
  useBulkSelect.getState().deactivate();
  useSearchStore.setState({ viewType: "grid" });
  installPlaylistApi();
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe(): void {}
    disconnect(): void {}
    unobserve(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

describe("PostCard portal event bubbling", () => {
  it("does not activate bulk mode when dismissing Add to playlist via overlay", async () => {
    renderWithProviders(
      <PostCard
        post={makePost({ provider: "rule34" })}
        onClick={vi.fn()}
      />
    );

    const card = screen.getByRole("button", { name: /view post 1/i });
    fireEvent.contextMenu(card);

    const dialog = await screen.findByRole("dialog");
    const overlay = dialog.previousElementSibling;
    expect(overlay).toBeInstanceOf(HTMLElement);
    if (!(overlay instanceof HTMLElement)) {
      throw new Error("expected dialog overlay element");
    }

    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    // Overlay lives in a portal: DOM-outside the card, but React still bubbles
    // synthetics up to PostCard. No pointerup on the card → long-press would fire.
    fireEvent.pointerDown(overlay, { button: 0, clientX: 8, clientY: 8 });
    fireEvent.click(overlay);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(useBulkSelect.getState().isBulkMode).toBe(false);
    expect(useBulkSelect.getState().selectedIds.size).toBe(0);
  });

  it("still activates bulk mode on long-press on the card itself", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    renderWithProviders(
      <PostCard
        post={makePost({ provider: "rule34" })}
        onClick={vi.fn()}
      />
    );

    const card = screen.getByRole("button", { name: /view post 1/i });
    fireEvent.pointerDown(card, { button: 0, clientX: 12, clientY: 12 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(useBulkSelect.getState().isBulkMode).toBe(true);
    expect(useBulkSelect.getState().selectedIds.has(1)).toBe(true);
  });
});
