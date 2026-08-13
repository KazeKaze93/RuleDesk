import { useState, useEffect, useRef, useLayoutEffect } from "react";
import log from "electron-log/renderer";
import { useDebounce } from "./useDebounce";
import type { SearchResults } from "@shared/types/providers";
import type { ProviderId } from "../../../shared/constants";

interface UseRemoteTagsOptions {
  query: string;
  minQueryLength?: number;
  debounceMs?: number;
  provider?: ProviderId;
  /** Add Artist modal: artist tags only. Browse/blacklist stay unfiltered. */
  artistOnly?: boolean;
}

interface UseRemoteTagsReturn {
  results: SearchResults[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Remote tag search with debounce + local AbortController.
 * Renderer abort does **not** cancel `ipcRenderer.invoke`. Add Artist
 * (`artistOnly`) cancellation runs in Main: a new search aborts the previous
 * wave (throttle waiters + axios).
 */
export function useRemoteTags({
  query,
  minQueryLength = 2,
  debounceMs = 300,
  provider = "rule34",
  artistOnly = false,
}: UseRemoteTagsOptions): UseRemoteTagsReturn {
  const [results, setResults] = useState<SearchResults[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchronize UI state with query validation using useLayoutEffect
  // This prevents flickering when query becomes invalid
  useLayoutEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    // Don't search if query is empty or too short
    if (!trimmedQuery || trimmedQuery.length < minQueryLength) {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Clear state synchronously (useLayoutEffect is designed for DOM synchronization)
      // setState: avoid stale search UI when the debounced query becomes too short; must be sync before paint.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setIsLoading(false);
      setError(null);
    }
  }, [debouncedQuery, minQueryLength]);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    // Skip if query is invalid (handled by useLayoutEffect above)
    if (!trimmedQuery || trimmedQuery.length < minQueryLength) {
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // setState: show loading immediately for the in-flight `searchRemoteTags` request
    // (effect body is the right place; rule would allow only external subscription callbacks).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    window.api
      .searchRemoteTags(trimmedQuery, provider, artistOnly)
      .then((tags) => {
        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setResults(tags);
        }
      })
      .catch((err) => {
        // Ignore abort errors
        if (err.name !== "AbortError" && !abortController.signal.aborted) {
          log.error("[useRemoteTags] Search error:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        // Only update loading state if this is still the active request
        if (!abortController.signal.aborted && abortControllerRef.current === abortController) {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      });

    return () => {
      // Abort request on cleanup
      abortController.abort();
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    };
  }, [debouncedQuery, minQueryLength, provider, artistOnly]);

  return { results, isLoading, error };
}

