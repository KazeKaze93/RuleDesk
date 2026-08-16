export type MediaCacheFileEntry = {
  fullPath: string;
  size: number;
  lastAccessedMs: number;
};

/**
 * Oldest last-accessed first until remaining total size is within `maxBytes`.
 * Paths in `skipPaths` (open readers) are never selected; they still count
 * toward the total so other files continue to be evicted.
 *
 * Disk files are the source of truth — this helper does not touch SQLite.
 */
export function selectMediaCacheFilesToEvict(
  files: readonly MediaCacheFileEntry[],
  maxBytes: number,
  skipPaths: ReadonlySet<string>,
): MediaCacheFileEntry[] {
  if (files.length === 0) {
    return [];
  }

  let totalBytes = 0;
  for (const file of files) {
    totalBytes += file.size;
  }
  if (totalBytes <= maxBytes) {
    return [];
  }

  const sorted = files.slice().sort((a, b) => {
    if (a.lastAccessedMs !== b.lastAccessedMs) {
      return a.lastAccessedMs - b.lastAccessedMs;
    }
    return a.fullPath.localeCompare(b.fullPath);
  });

  const toEvict: MediaCacheFileEntry[] = [];
  for (const file of sorted) {
    if (totalBytes <= maxBytes) {
      break;
    }
    if (skipPaths.has(file.fullPath)) {
      continue;
    }
    toEvict.push(file);
    totalBytes -= file.size;
  }
  return toEvict;
}
