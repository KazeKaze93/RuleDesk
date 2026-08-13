// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostCard } from "@/renderer/features/artists/components/PostCard";
import { makePost } from "./PostCard/makePost";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/renderer/lib/hooks/useVideoProxyUrl", () => ({
  useVideoProxyUrl: () => null,
}));

vi.mock("@/renderer/components/playlists/QuickAddToPlaylistMenu", () => ({
  QuickAddToPlaylistMenu: ({ trigger }: { trigger?: ReactNode }) =>
    trigger ?? null,
}));

const VIDEO_VIEWPORT_ROOT_MARGIN = "100px";
const VIDEO_VIEWPORT_THRESHOLD = 0.01;

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

let observers: ObserverRecord[];
const originalIntersectionObserver = globalThis.IntersectionObserver;

function installMockIntersectionObserver(): void {
  observers = [];
  class MockIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    private readonly record: ObserverRecord;

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit
    ) {
      this.record = {
        callback,
        options,
        observe: vi.fn(),
        disconnect: vi.fn(),
      };
      observers.push(this.record);
    }

    observe(target: Element): void {
      this.record.observe(target);
    }

    disconnect(): void {
      this.record.disconnect();
    }

    unobserve(): void {}

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

function toObserver(record: ObserverRecord): IntersectionObserver {
  return {
    root: null,
    rootMargin: "",
    thresholds: [],
    observe: record.observe,
    disconnect: record.disconnect,
    unobserve: () => {},
    takeRecords: () => [],
  };
}

function intersectingEntry(
  target: Element,
  isIntersecting: boolean
): IntersectionObserverEntry {
  return {
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: target.getBoundingClientRect(),
    intersectionRect: target.getBoundingClientRect(),
    rootBounds: null,
    target,
    time: 0,
  };
}

beforeEach(() => {
  installMockIntersectionObserver();
});

afterEach(() => {
  cleanup();
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

describe("PostCard video viewport IntersectionObserver", () => {
  it("observes the card with production rootMargin and threshold", () => {
    render(<PostCard post={makePost()} onClick={vi.fn()} />);

    expect(observers).toHaveLength(1);
    expect(observers[0]?.options).toEqual({
      rootMargin: VIDEO_VIEWPORT_ROOT_MARGIN,
      threshold: VIDEO_VIEWPORT_THRESHOLD,
    });
    expect(observers[0]?.observe).toHaveBeenCalledTimes(1);
    const observed = observers[0]?.observe.mock.calls[0]?.[0];
    expect(observed).toBeInstanceOf(HTMLElement);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(
      <PostCard post={makePost()} onClick={vi.fn()} />
    );

    unmount();

    expect(observers[0]?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("mounts a video element after the card intersects the viewport", () => {
    const post = makePost({
      fileUrl: "https://example.com/clip.mp4",
      previewUrl: "https://example.com/clip-preview.jpg",
      mediaType: "video",
    });
    const { container } = render(<PostCard post={post} onClick={vi.fn()} />);

    expect(container.querySelector("video")).toBeNull();

    const observer = observers[0];
    const target = observer?.observe.mock.calls[0]?.[0];
    if (!observer || !(target instanceof HTMLElement)) {
      throw new Error("expected PostCard to register an IntersectionObserver target");
    }

    act(() => {
      observer.callback(
        [intersectingEntry(target, true)],
        toObserver(observer)
      );
    });

    expect(container.querySelector("video")).not.toBeNull();
  });
});
