import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import log from "electron-log/renderer";
import { toast } from "sonner";
import type { ProviderId } from "../../shared/constants";
import type { DownloadFailure } from "@shared/types/download";
import { useDownloadStore } from "../store/downloadStore";
import { presentDownloadAllResult } from "../lib/download-result-ui";
import { resolveErrorMessage } from "../utils/error-message";
import {
  ensureArtistTrackedAndSynced,
  getTrackAndDownloadCandidateTag,
  isResolvedArtistIncludeTag,
} from "../lib/browse-track-download";

export type TrackAndDownloadPhase = "idle" | "syncing" | "downloading";

/**
 * Browse bridge: gate Track & download on a single artist include tag, then
 * addArtist (if needed) → repairArtist → downloadAll { kind: "artist" }.
 */
export function useTrackAndDownloadArtist(
  includeTags: readonly string[],
  provider: ProviderId
) {
  const queryClient = useQueryClient();
  const startDownload = useDownloadStore((s) => s.startDownload);
  const resetDownload = useDownloadStore((s) => s.resetDownload);
  const pauseDownload = useDownloadStore((s) => s.pauseDownload);
  const resumeDownload = useDownloadStore((s) => s.resumeDownload);
  const cancelDownload = useDownloadStore((s) => s.cancelDownload);
  const isAnyDownloadActive = useDownloadStore((s) => s.isDownloading);
  const isPaused = useDownloadStore((s) => s.isPaused);
  const progress = useDownloadStore((s) => s.progress);

  const [phase, setPhase] = useState<TrackAndDownloadPhase>("idle");
  const [lastFailures, setLastFailures] = useState<DownloadFailure[]>([]);

  const candidateTag = getTrackAndDownloadCandidateTag(includeTags);

  const {
    data: resolvedArtistTags = [],
    isFetching: isResolvingArtistTag,
    isError: isResolveError,
  } = useQuery({
    queryKey: ["browse-track-download-artist-tag", candidateTag, provider],
    enabled: candidateTag !== null,
    queryFn: () => {
      if (candidateTag === null) {
        return Promise.resolve<string[]>([]);
      }
      return window.api.resolveTags([candidateTag]);
    },
    staleTime: 5 * 60 * 1000,
  });

  const isArtistTag =
    candidateTag !== null &&
    !isResolveError &&
    isResolvedArtistIncludeTag(candidateTag, resolvedArtistTags);

  const canShowAction =
    candidateTag !== null && isArtistTag && !isResolvingArtistTag;

  const isRunning = phase !== "idle";

  const trackAndDownload = useCallback(async () => {
    if (candidateTag === null || !isArtistTag || isRunning) {
      return;
    }
    if (isAnyDownloadActive) {
      toast.error("A download is already in progress");
      return;
    }

    setPhase("syncing");
    setLastFailures([]);

    try {
      const ensured = await ensureArtistTrackedAndSynced({
        tag: candidateTag,
        provider,
        deps: {
          getTrackedArtists: () => window.api.getTrackedArtists(),
          addArtist: (artist) => window.api.addArtist(artist),
          repairArtist: (artistId) => window.api.repairArtist(artistId),
        },
      });

      void queryClient
        .invalidateQueries({ queryKey: ["artists"] })
        .catch((error: unknown) => {
          log.error(
            "[useTrackAndDownloadArtist] Failed to invalidate artists:",
            error
          );
        });

      if (!ensured.ok) {
        toast.error(ensured.reason);
        setPhase("idle");
        return;
      }

      setPhase("downloading");
      startDownload();

      try {
        const result = await window.api.downloadAll({
          kind: "artist",
          artistId: ensured.artistId,
        });
        setLastFailures(result.failed);
        log.info(
          `[useTrackAndDownloadArtist] Done: ${result.downloaded} ok, ${result.failed.length} failed, canceled=${result.canceled}`
        );
        presentDownloadAllResult(result);
      } catch (error: unknown) {
        log.error("[useTrackAndDownloadArtist] downloadAll failed:", error);
        presentDownloadAllResult({
          success: false,
          downloaded: 0,
          failed: [],
          canceled: false,
          error: resolveErrorMessage(error, "Download failed"),
        });
      } finally {
        resetDownload();
        setPhase("idle");
      }
    } catch (error: unknown) {
      log.error("[useTrackAndDownloadArtist] Failed:", error);
      toast.error(
        resolveErrorMessage(error, "Failed to track and download artist")
      );
      resetDownload();
      setPhase("idle");
    }
  }, [
    candidateTag,
    isArtistTag,
    isRunning,
    isAnyDownloadActive,
    provider,
    queryClient,
    startDownload,
    resetDownload,
  ]);

  const cancel = useCallback(() => {
    cancelDownload();
  }, [cancelDownload]);

  const pause = useCallback(() => {
    pauseDownload();
  }, [pauseDownload]);

  const resume = useCallback(() => {
    resumeDownload();
  }, [resumeDownload]);

  return {
    canShowAction,
    candidateTag,
    isResolvingArtistTag,
    phase,
    isRunning,
    isPaused,
    progress,
    lastFailures,
    trackAndDownload,
    cancel,
    pause,
    resume,
  };
}
