import { useQuery } from "@tanstack/react-query";
import type { PlaylistWithStats } from "@shared/types/bridge";

/**
 * Custom hook for fetching playlists with optimized caching
 * 
 * Caching strategy:
 * - staleTime: 60000ms (1 minute) - data is considered fresh for 1 minute
 * - cacheTime: 300000ms (5 minutes) - cached data is kept for 5 minutes after component unmount
 * 
 * This prevents redundant IPC calls while ensuring data freshness.
 * 
 * @param options - Query options (enabled flag for lazy loading)
 * @returns Query result with playlists array, loading state, and error
 */
export function usePlaylists(options?: { enabled?: boolean }) {
  return useQuery<PlaylistWithStats[]>({
    queryKey: ["playlists"],
    queryFn: async () => {
      return await window.api.getPlaylists();
    },
    staleTime: 60000, // 1 minute - data is fresh for 1 minute
    gcTime: 300000, // 5 minutes - keep cached data for 5 minutes (renamed from cacheTime in React Query v5)
    enabled: options?.enabled !== false, // Default to true, can be disabled for lazy loading
  });
}
