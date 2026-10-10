/** Pinned Vitest floors — raise when suites grow; never lower without an intentional cull. */

/** Main suite (excludes isolated paths in vitest.config.ts). */
export const MIN_MAIN_TESTS = 449;

/** Isolated suite (vitest.isolated.config.ts): happy-dom + video-proxy. */
export const MIN_ISOLATED_TESTS = 116;

/** Combined floor across main + isolated runs. */
export const MIN_TESTS = MIN_MAIN_TESTS + MIN_ISOLATED_TESTS;
