import type { DownloadQueueFileV3Artist } from "../../shared/types/download";

export type ArtistChunkRow = {
  id: number;
  url: string;
  filename: string;
};

export type ArtistChunkPlan =
  | {
      type: "advance";
      state: DownloadQueueFileV3Artist;
      lastId: number;
    }
  | {
      type: "download";
      remaining: Array<{ url: string; filename: string }>;
      state: DownloadQueueFileV3Artist;
    };

/**
 * Resume / mid-chunk plan: if every row is already in chunkCompletedIds
 * (crash after last item, before cursor write), advance without re-running the worker.
 * Otherwise run worker on rows not yet recorded — includes "file on disk but queue
 * not updated" (duplicate skip on retry).
 */
export function planArtistChunk(
  state: DownloadQueueFileV3Artist,
  chunk: readonly ArtistChunkRow[]
): ArtistChunkPlan | null {
  if (chunk.length === 0) {
    return null;
  }
  const completed = new Set(state.chunkCompletedIds);
  const remaining = chunk
    .filter((row) => !completed.has(row.filename))
    .map(({ url, filename }) => ({ url, filename }));
  const last = chunk[chunk.length - 1];
  if (!last) {
    return null;
  }
  if (remaining.length === 0) {
    return {
      type: "advance",
      lastId: last.id,
      state: advanceArtistCursor(state, last.id),
    };
  }
  return { type: "download", remaining, state };
}

/** Record a successful download/skip in the current chunk (after file is on disk). */
export function applyArtistItemCompleted(
  state: DownloadQueueFileV3Artist,
  filename: string
): DownloadQueueFileV3Artist {
  if (state.chunkCompletedIds.includes(filename)) {
    return state;
  }
  return {
    ...state,
    chunkCompletedIds: [...state.chunkCompletedIds, filename],
    doneCount: state.doneCount + 1,
    timestamp: Date.now(),
  };
}

/**
 * Advance past a fully processed chunk. Call after every row was handled
 * (success, skip, or permanent failure) and the worker batch finished.
 * Failed filenames are intentionally NOT in chunkCompletedIds so a future
 * full run (new queue, cursor 0) retries them.
 */
export function advanceArtistCursor(
  state: DownloadQueueFileV3Artist,
  lastChunkId: number
): DownloadQueueFileV3Artist {
  return {
    ...state,
    cursorId: lastChunkId,
    chunkCompletedIds: [],
    timestamp: Date.now(),
  };
}

/** Cursor moves after the chunk worker settles unless the batch was canceled. */
export function shouldAdvanceArtistCursorAfterChunk(canceled: boolean): boolean {
  return !canceled;
}
