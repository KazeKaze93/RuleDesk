// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostCard } from "@/features/artists/components/PostCard";
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

vi.mock("@/components/playlists/QuickAddToPlaylistMenu", () => ({
  QuickAddToPlaylistMenu: ({ trigger }: { trigger?: ReactNode }) =>
    trigger ?? null,
}));

const originalIntersectionObserver = globalThis.IntersectionObserver;
const OriginalImage = globalThis.Image;

afterEach(() => {
  cleanup();
  globalThis.IntersectionObserver = originalIntersectionObserver;
  globalThis.Image = OriginalImage;
});

beforeEach(() => {
  useSearchStore.setState({ viewType: "grid" });
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element): void {
      this.callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target,
            time: 0,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
          },
        ],
        this
      );
    }

    disconnect(): void {}
    unobserve(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };

  globalThis.Image = class {
    onload: ((this: GlobalEventHandlers, ev: Event) => unknown) | null = null;
    onerror: ((this: GlobalEventHandlers, ev: Event) => unknown) | null = null;
    decode = (): Promise<void> => Promise.resolve();
    set src(_value: string) {
      queueMicrotask(() => {
        this.onload?.call(this, new Event("load"));
      });
    }
  } as unknown as typeof Image;
});

describe("PostCard preview onError", () => {
  it("shows MediaLoadPlaceholder when preview image fails", () => {
    const post = makePost({
      previewUrl: "https://example.com/broken-preview.jpg",
      sampleUrl: "",
    });

    render(<PostCard post={post} onClick={vi.fn()} />);

    const image = screen.getByAltText("Post 1");
    act(() => {
      fireEvent.error(image);
    });

    expect(screen.queryByAltText("Post 1")).toBeNull();
    expect(
      screen.getByRole("img", {
        name: "Failed to load preview for post 1",
      })
    ).toBeTruthy();
  });

  it("advances sampleSrc → previewUrl before showing placeholder", async () => {
    const post = makePost({
      previewUrl: "https://example.com/preview.jpg",
      sampleUrl: "https://example.com/sample.jpg",
    });

    render(<PostCard post={post} onClick={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByAltText("Post 1").getAttribute("src")).toBe(
        post.sampleUrl
      );
    });

    const sampleImage = screen.getByAltText("Post 1");
    act(() => {
      fireEvent.error(sampleImage);
    });

    const previewImage = screen.getByAltText("Post 1");
    expect(previewImage.getAttribute("src")).toBe(post.previewUrl);

    act(() => {
      fireEvent.error(previewImage);
    });

    expect(screen.queryByAltText("Post 1")).toBeNull();
    expect(
      screen.getByRole("img", {
        name: "Failed to load preview for post 1",
      })
    ).toBeTruthy();
  });
});
