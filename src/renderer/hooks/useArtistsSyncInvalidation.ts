import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";

/** Trailing debounce for `sync:artist` → `["artists"]` aggregate refetch. */
export const ARTISTS_SYNC_INVALIDATION_DEBOUNCE_MS = 300;

const ARTISTS_QUERY_KEY = ["artists"] as const;

/**
 * Subscribes to sync/repair IPC and invalidates the tracked-artists aggregate.
 *
 * `sync:artist` fires twice per artist (start + end). Trailing-debounce those
 * bursts; `sync:end` always flushes so the list is fresh when Sync All finishes.
 *
 * Callbacks / QueryClient live in refs — must not appear in the subscription
 * effect deps (inline callbacks in deps re-subscribe every render).
 */
export function useArtistsSyncInvalidation(queryClient: QueryClient): void {
  const queryClientRef = useRef(queryClient);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    const invalidateArtists = (): void => {
      void queryClientRef.current.invalidateQueries({
        queryKey: ARTISTS_QUERY_KEY,
      });
    };

    const clearDebounceTimer = (): void => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };

    const scheduleArtistsInvalidation = (): void => {
      clearDebounceTimer();
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        invalidateArtists();
      }, ARTISTS_SYNC_INVALIDATION_DEBOUNCE_MS);
    };

    const flushArtistsInvalidation = (): void => {
      clearDebounceTimer();
      invalidateArtists();
    };

    const unsubscribeSyncEnd = window.api.onSyncEnd(() => {
      // Sync writes new posts into DB, so all post-based feeds must refresh.
      // Smart playlists are dynamic queries over posts, so they must be invalidated too.
      void queryClientRef.current.invalidateQueries({ queryKey: ["posts"] });
      void queryClientRef.current.invalidateQueries({
        queryKey: ["playlist-posts"],
      });
      void queryClientRef.current.invalidateQueries({ queryKey: ["playlists"] });
      flushArtistsInvalidation();
      void queryClientRef.current.invalidateQueries({
        queryKey: ["posts-count"],
      });
    });

    const unsubscribeSyncArtist = window.api.onSyncArtist(
      scheduleArtistsInvalidation
    );
    // Repair is a single-artist path — flush immediately for a live badge.
    const unsubscribeRepairStart = window.api.onRepairStart(
      flushArtistsInvalidation
    );
    const unsubscribeRepairEnd = window.api.onRepairEnd(
      flushArtistsInvalidation
    );

    return () => {
      clearDebounceTimer();
      unsubscribeSyncEnd();
      unsubscribeSyncArtist();
      unsubscribeRepairStart();
      unsubscribeRepairEnd();
    };
    // Subscription is mount-scoped; latest QueryClient via queryClientRef.
  }, []);
}
