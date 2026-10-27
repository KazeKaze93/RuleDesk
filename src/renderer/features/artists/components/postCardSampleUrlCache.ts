/** Sample URLs already promoted for visible preview-image use (shared across cards). */
export const loadedSampleUrls = new Set<string>();

/**
 * Sample URLs that failed in a visible preview image — hard stop for promote/effect
 * so onError cannot re-enter the same sampleSrc (shared across cards).
 */
export const failedSampleUrls = new Set<string>();

/** Test-only: clear module-level sample CDN caches between cases. */
export function resetPostCardSampleCachesForTests(): void {
  loadedSampleUrls.clear();
  failedSampleUrls.clear();
}
