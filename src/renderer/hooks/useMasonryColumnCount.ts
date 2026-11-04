import { useEffect, useState } from "react";

/**
 * Default Tailwind `screens` (theme.screens not overridden in tailwind.config.js
 * for md/lg/xl — only container.screens.2xl is customized there).
 * Breakpoints map to column counts: base 2, md 3, lg 4, xl 5.
 */
export const TAILWIND_BREAKPOINT_MD_PX = 768;
export const TAILWIND_BREAKPOINT_LG_PX = 1024;
export const TAILWIND_BREAKPOINT_XL_PX = 1280;

export const MASONRY_COLUMN_COUNT_BASE = 2;
export const MASONRY_COLUMN_COUNT_MD = 3;
export const MASONRY_COLUMN_COUNT_LG = 4;
export const MASONRY_COLUMN_COUNT_XL = 5;

export const MASONRY_COLUMN_MEDIA_MD = `(min-width: ${TAILWIND_BREAKPOINT_MD_PX}px)`;
export const MASONRY_COLUMN_MEDIA_LG = `(min-width: ${TAILWIND_BREAKPOINT_LG_PX}px)`;
export const MASONRY_COLUMN_MEDIA_XL = `(min-width: ${TAILWIND_BREAKPOINT_XL_PX}px)`;

export type MasonryBreakpointMatches = {
  matchesMd: boolean;
  matchesLg: boolean;
  matchesXl: boolean;
};

export const resolveMasonryColumnCount = (
  matches: MasonryBreakpointMatches
): number => {
  if (matches.matchesXl) {
    return MASONRY_COLUMN_COUNT_XL;
  }
  if (matches.matchesLg) {
    return MASONRY_COLUMN_COUNT_LG;
  }
  if (matches.matchesMd) {
    return MASONRY_COLUMN_COUNT_MD;
  }
  return MASONRY_COLUMN_COUNT_BASE;
};

const readMasonryColumnCount = (): number => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return MASONRY_COLUMN_COUNT_BASE;
  }
  return resolveMasonryColumnCount({
    matchesMd: window.matchMedia(MASONRY_COLUMN_MEDIA_MD).matches,
    matchesLg: window.matchMedia(MASONRY_COLUMN_MEDIA_LG).matches,
    matchesXl: window.matchMedia(MASONRY_COLUMN_MEDIA_XL).matches,
  });
};

/**
 * Column count for masonry round-robin layout.
 * Default Tailwind md/lg/xl breakpoints → 2/3/4/5 columns.
 * SSR / missing matchMedia → base count (2).
 */
export const useMasonryColumnCount = (): number => {
  const [columnCount, setColumnCount] = useState(readMasonryColumnCount);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mdQuery = window.matchMedia(MASONRY_COLUMN_MEDIA_MD);
    const lgQuery = window.matchMedia(MASONRY_COLUMN_MEDIA_LG);
    const xlQuery = window.matchMedia(MASONRY_COLUMN_MEDIA_XL);

    const update = () => {
      setColumnCount(
        resolveMasonryColumnCount({
          matchesMd: mdQuery.matches,
          matchesLg: lgQuery.matches,
          matchesXl: xlQuery.matches,
        })
      );
    };

    update();
    mdQuery.addEventListener("change", update);
    lgQuery.addEventListener("change", update);
    xlQuery.addEventListener("change", update);

    return () => {
      mdQuery.removeEventListener("change", update);
      lgQuery.removeEventListener("change", update);
      xlQuery.removeEventListener("change", update);
    };
  }, []);

  return columnCount;
};
