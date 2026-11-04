// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MASONRY_COLUMN_COUNT_BASE,
  MASONRY_COLUMN_COUNT_LG,
  MASONRY_COLUMN_COUNT_MD,
  MASONRY_COLUMN_COUNT_XL,
  MASONRY_COLUMN_MEDIA_LG,
  MASONRY_COLUMN_MEDIA_MD,
  MASONRY_COLUMN_MEDIA_XL,
  resolveMasonryColumnCount,
  TAILWIND_BREAKPOINT_LG_PX,
  TAILWIND_BREAKPOINT_MD_PX,
  TAILWIND_BREAKPOINT_XL_PX,
  useMasonryColumnCount,
} from "@/hooks/useMasonryColumnCount";

type MediaListener = () => void;

type FakeMediaQueryList = {
  matches: boolean;
  media: string;
  addEventListener: (type: string, listener: MediaListener) => void;
  removeEventListener: (type: string, listener: MediaListener) => void;
  dispatch: () => void;
};

function createFakeMediaQuery(
  media: string,
  matches: boolean
): FakeMediaQueryList {
  const listeners = new Set<MediaListener>();
  return {
    matches,
    media,
    addEventListener: (_type, listener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type, listener) => {
      listeners.delete(listener);
    },
    dispatch: () => {
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

describe("resolveMasonryColumnCount", () => {
  it("maps Tailwind breakpoint matches to 2/3/4/5", () => {
    expect(
      resolveMasonryColumnCount({
        matchesMd: false,
        matchesLg: false,
        matchesXl: false,
      })
    ).toBe(MASONRY_COLUMN_COUNT_BASE);
    expect(
      resolveMasonryColumnCount({
        matchesMd: true,
        matchesLg: false,
        matchesXl: false,
      })
    ).toBe(MASONRY_COLUMN_COUNT_MD);
    expect(
      resolveMasonryColumnCount({
        matchesMd: true,
        matchesLg: true,
        matchesXl: false,
      })
    ).toBe(MASONRY_COLUMN_COUNT_LG);
    expect(
      resolveMasonryColumnCount({
        matchesMd: true,
        matchesLg: true,
        matchesXl: true,
      })
    ).toBe(MASONRY_COLUMN_COUNT_XL);
  });

  it("uses default Tailwind md/lg/xl pixel thresholds", () => {
    expect(TAILWIND_BREAKPOINT_MD_PX).toBe(768);
    expect(TAILWIND_BREAKPOINT_LG_PX).toBe(1024);
    expect(TAILWIND_BREAKPOINT_XL_PX).toBe(1280);
    expect(MASONRY_COLUMN_MEDIA_MD).toBe(`(min-width: ${TAILWIND_BREAKPOINT_MD_PX}px)`);
    expect(MASONRY_COLUMN_MEDIA_LG).toBe(`(min-width: ${TAILWIND_BREAKPOINT_LG_PX}px)`);
    expect(MASONRY_COLUMN_MEDIA_XL).toBe(`(min-width: ${TAILWIND_BREAKPOINT_XL_PX}px)`);
  });
});

describe("useMasonryColumnCount", () => {
  let mdQuery: FakeMediaQueryList;
  let lgQuery: FakeMediaQueryList;
  let xlQuery: FakeMediaQueryList;

  beforeEach(() => {
    mdQuery = createFakeMediaQuery(MASONRY_COLUMN_MEDIA_MD, false);
    lgQuery = createFakeMediaQuery(MASONRY_COLUMN_MEDIA_LG, false);
    xlQuery = createFakeMediaQuery(MASONRY_COLUMN_MEDIA_XL, false);

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string): FakeMediaQueryList => {
        if (query === MASONRY_COLUMN_MEDIA_XL) {
          return xlQuery;
        }
        if (query === MASONRY_COLUMN_MEDIA_LG) {
          return lgQuery;
        }
        if (query === MASONRY_COLUMN_MEDIA_MD) {
          return mdQuery;
        }
        return createFakeMediaQuery(query, false);
      },
    });
  });

  afterEach(() => {
    cleanup();
  });


  it("defaults to the base column count below md", () => {
    const { result } = renderHook(() => useMasonryColumnCount());
    expect(result.current).toBe(MASONRY_COLUMN_COUNT_BASE);
  });

  it("updates when breakpoint media queries change", () => {
    const { result } = renderHook(() => useMasonryColumnCount());
    expect(result.current).toBe(MASONRY_COLUMN_COUNT_BASE);

    act(() => {
      mdQuery.matches = true;
      mdQuery.dispatch();
    });
    expect(result.current).toBe(MASONRY_COLUMN_COUNT_MD);

    act(() => {
      lgQuery.matches = true;
      lgQuery.dispatch();
    });
    expect(result.current).toBe(MASONRY_COLUMN_COUNT_LG);

    act(() => {
      xlQuery.matches = true;
      xlQuery.dispatch();
    });
    expect(result.current).toBe(MASONRY_COLUMN_COUNT_XL);
  });
});
