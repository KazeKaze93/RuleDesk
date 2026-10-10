import type { ProviderId } from "../../shared/constants";
import type { AddArtistRequest } from "../../shared/schemas/artist";
import type { Artist } from "@shared/types/db";
import { normalizeTag } from "./tag-utils";

/** Idle label for Browse → Track & download all. */
export const TRACK_AND_DOWNLOAD_LABEL = "Track & download all";

/** Accessible name for the Track & download control. */
export const TRACK_AND_DOWNLOAD_ARIA_LABEL =
  "Track artist and download all posts";

const ADD_ARTIST_FAILED_MESSAGE = "Failed to add artist for tracking.";
const SYNC_FAILED_FALLBACK_MESSAGE = "Artist sync failed.";

export type TrackedArtistMatch = {
  id: number;
  tag: string;
  provider: string;
};

export type EnsureArtistSyncedDeps = {
  getTrackedArtists: () => Promise<TrackedArtistMatch[]>;
  addArtist: (artist: AddArtistRequest) => Promise<Artist | undefined>;
  repairArtist: (
    artistId: number
  ) => Promise<{ success: boolean; error?: string }>;
};

export type EnsureArtistSyncedResult =
  | { ok: true; artistId: number; alreadyTracked: boolean }
  | { ok: false; reason: string };

/**
 * Exactly one non-empty include tag → candidate for Track & download; otherwise null.
 */
export function getTrackAndDownloadCandidateTag(
  includeTags: readonly string[]
): string | null {
  if (includeTags.length !== 1) {
    return null;
  }
  const raw = includeTags[0];
  if (typeof raw !== "string") {
    return null;
  }
  const tag = raw.trim();
  return tag.length > 0 ? tag : null;
}

/**
 * True when resolveTags (artist type) returned the candidate tag.
 */
export function isResolvedArtistIncludeTag(
  candidateTag: string,
  resolvedArtistTags: readonly string[]
): boolean {
  const normalized = normalizeTag(candidateTag);
  if (normalized.length === 0) {
    return false;
  }
  return resolvedArtistTags.some((tag) => normalizeTag(tag) === normalized);
}

/**
 * Add artist for provider if missing (no duplicate row), then run repair sync.
 * Does not start download — caller starts downloadAll { kind: "artist" } only on ok.
 */
export async function ensureArtistTrackedAndSynced(params: {
  tag: string;
  provider: ProviderId;
  deps: EnsureArtistSyncedDeps;
}): Promise<EnsureArtistSyncedResult> {
  const normalizedTag = normalizeTag(params.tag);
  if (normalizedTag.length === 0) {
    return { ok: false, reason: ADD_ARTIST_FAILED_MESSAGE };
  }

  const tracked = await params.deps.getTrackedArtists();
  const existing = tracked.find(
    (artist) =>
      normalizeTag(artist.tag) === normalizedTag &&
      artist.provider === params.provider
  );

  let artistId: number;
  let alreadyTracked = false;

  if (existing) {
    artistId = existing.id;
    alreadyTracked = true;
  } else {
    const added = await params.deps.addArtist({
      name: normalizedTag,
      tag: normalizedTag,
      type: "tag",
      provider: params.provider,
    });
    if (added === undefined || typeof added.id !== "number") {
      return { ok: false, reason: ADD_ARTIST_FAILED_MESSAGE };
    }
    artistId = added.id;
  }

  const syncResult = await params.deps.repairArtist(artistId);
  if (!syncResult.success) {
    const reason =
      typeof syncResult.error === "string" && syncResult.error.trim().length > 0
        ? syncResult.error.trim()
        : SYNC_FAILED_FALLBACK_MESSAGE;
    return { ok: false, reason };
  }

  return { ok: true, artistId, alreadyTracked };
}
