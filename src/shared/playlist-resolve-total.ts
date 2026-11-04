import type { PlaylistResolveTotal } from "./schemas/playlist";

/** Outcome of one hybrid remote feed walk for total kind. */
export type RemoteWalkCompleteness = "exact" | "lowerBound" | "failed";

/**
 * Build the smart-collection header total from a completed (or failed) hybrid walk.
 * Manual playlists always return null (UI uses getPlaylists postCount).
 * `aiCount` is counted once on the unfiltered (by AI) merged window.
 */
export function buildPlaylistResolveTotal(args: {
  isSmart: boolean;
  remoteCompleteness: RemoteWalkCompleteness | null;
  mergedWindowCount: number;
  aiCount: number;
  localHitMaterializeCap: boolean;
}): PlaylistResolveTotal {
  if (!args.isSmart) {
    return null;
  }
  if (
    args.remoteCompleteness === null ||
    args.remoteCompleteness === "failed"
  ) {
    return null;
  }
  const kind: "exact" | "lowerBound" =
    args.remoteCompleteness === "lowerBound" || args.localHitMaterializeCap
      ? "lowerBound"
      : "exact";
  return {
    count: args.mergedWindowCount,
    aiCount: args.aiCount,
    kind,
  };
}
