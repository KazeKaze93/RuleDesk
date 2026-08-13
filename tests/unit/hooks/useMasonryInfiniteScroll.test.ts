// @vitest-environment jsdom
import { createElement, act, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MASONRY_LOAD_MORE_THRESHOLD_PX,
  MASONRY_SCROLL_DEBOUNCE_MS,
  useMasonryInfiniteScroll,
  type MasonryScrollEvent,
} from "@/renderer/hooks/useMasonryInfiniteScroll";

type HookProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

function scrollEvent(distanceFromBottom: number): MasonryScrollEvent {
  const scrollTop = 600;
  const clientHeight = 400;
  return {
    currentTarget: {
      scrollTop,
      clientHeight,
      scrollHeight: distanceFromBottom + scrollTop + clientHeight,
    },
  };
}

const NEAR_BOTTOM = scrollEvent(100);
const AT_THRESHOLD = scrollEvent(MASONRY_LOAD_MORE_THRESHOLD_PX);
const JUST_OUTSIDE = scrollEvent(MASONRY_LOAD_MORE_THRESHOLD_PX + 1);
const FAR_FROM_BOTTOM = scrollEvent(800);

type MountedHook = {
  result: { current: ((event: MasonryScrollEvent) => void) | null };
  rerender: (next: Partial<HookProps>) => void;
  unmount: () => void;
};

function mountHook(initial: HookProps): MountedHook {
  const propsBox = { current: initial };
  const result: { current: ((event: MasonryScrollEvent) => void) | null } = {
    current: null,
  };
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  function Harness(): ReactNode {
    const handler = useMasonryInfiniteScroll(propsBox.current);
    useEffect(() => {
      result.current = handler;
    });
    return null;
  }

  function renderHarness(): void {
    act(() => {
      root.render(createElement(Harness));
    });
  }

  renderHarness();

  return {
    result,
    rerender: (next: Partial<HookProps>) => {
      propsBox.current = { ...propsBox.current, ...next };
      renderHarness();
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("useMasonryInfiniteScroll", () => {
  beforeEach(() => {
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not load until the 150ms debounce elapses", () => {
    const onLoadMore = vi.fn();
    const { result, unmount } = mountHook({
      hasNextPage: true,
      isFetchingNextPage: false,
      onLoadMore,
    });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS - 1);
    });
    expect(onLoadMore).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("loads at the 300px threshold, not one pixel outside", () => {
    const onLoadMore = vi.fn();
    const { result, unmount } = mountHook({
      hasNextPage: true,
      isFetchingNextPage: false,
      onLoadMore,
    });

    act(() => {
      result.current?.(JUST_OUTSIDE);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).not.toHaveBeenCalled();

    act(() => {
      result.current?.(AT_THRESHOLD);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("coalesces rapid near-bottom scroll events into one load", () => {
    const onLoadMore = vi.fn();
    const { result, unmount } = mountHook({
      hasNextPage: true,
      isFetchingNextPage: false,
      onLoadMore,
    });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current?.(NEAR_BOTTOM);
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS - 1);
    });
    expect(onLoadMore).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("does not cascade after a load while still near bottom (layout/list growth)", () => {
    const onLoadMore = vi.fn();
    const { result, rerender, unmount } = mountHook({
      hasNextPage: true,
      isFetchingNextPage: false,
      onLoadMore,
    });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender({ isFetchingNextPage: true });
    rerender({ isFetchingNextPage: false });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("re-arms only after the user leaves the threshold, then loads on the next approach", () => {
    const onLoadMore = vi.fn();
    const { result, rerender, unmount } = mountHook({
      hasNextPage: true,
      isFetchingNextPage: false,
      onLoadMore,
    });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender({ isFetchingNextPage: true });
    rerender({ isFetchingNextPage: false });

    act(() => {
      result.current?.(FAR_FROM_BOTTOM);
    });
    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(2);

    unmount();
  });

  it("cancels a pending load when the user scrolls away before debounce elapses", () => {
    const onLoadMore = vi.fn();
    const { result, unmount } = mountHook({
      hasNextPage: true,
      isFetchingNextPage: false,
      onLoadMore,
    });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current?.(FAR_FROM_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).not.toHaveBeenCalled();

    unmount();
  });

  it("does not load when hasNextPage is false", () => {
    const onLoadMore = vi.fn();
    const { result, unmount } = mountHook({
      hasNextPage: false,
      isFetchingNextPage: false,
      onLoadMore,
    });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).not.toHaveBeenCalled();

    unmount();
  });

  it("does not load while a page fetch is already in flight", () => {
    const onLoadMore = vi.fn();
    const { result, unmount } = mountHook({
      hasNextPage: true,
      isFetchingNextPage: true,
      onLoadMore,
    });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS);
    });
    expect(onLoadMore).not.toHaveBeenCalled();

    unmount();
  });

  it("clears the pending debounce timer on unmount", () => {
    const onLoadMore = vi.fn();
    const { result, unmount } = mountHook({
      hasNextPage: true,
      isFetchingNextPage: false,
      onLoadMore,
    });

    act(() => {
      result.current?.(NEAR_BOTTOM);
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(MASONRY_SCROLL_DEBOUNCE_MS + 50);
    });
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
