import { useCallback, useEffect, useState } from "react";
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
  const setGlobalDownloading = useDownloadStore((s) => s.setDownloading);
  const isAnyDownloadActive = useDownloadStore((s) => s.isDownloading);

  const [phase, setPhase] = useState<TrackAndDownloadPhase>("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
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

  useEffect(() => {
    if (phase !== "downloading") {
      return;
    }
    const unsub = window.api.onDownloadAllProgress((data) => {
      setProgress({ done: data.done, total: data.total });
    });
    return () => unsub();
  }, [phase]);

  const trackAndDownload = useCallback(async () => {
    if (candidateTag === null || !isArtistTag || isRunning) {
      return;
    }
    if (isAnyDownloadActive) {
      toast.error("A download is already in progress");
      return;
    }

    setPhase("syncing");
    setIsPaused(false);
    setLastFailures([]);
    setProgress({ done: 0, total: 0 });

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
      setGlobalDownloading(true);
      setProgress({ done: 0, total: 0 });

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
        setGlobalDownloading(false);
        setIsPaused(false);
        setProgress({ done: 0, total: 0 });
        setPhase("idle");
      }
    } catch (error: unknown) {
      log.error("[useTrackAndDownloadArtist] Failed:", error);
      toast.error(
        resolveErrorMessage(error, "Failed to track and download artist")
      );
      setGlobalDownloading(false);
      setPhase("idle");
    }
  }, [
    candidateTag,
    isArtistTag,
    isRunning,
    isAnyDownloadActive,
    provider,
    queryClient,
    setGlobalDownloading,
  ]);

  const cancel = useCallback(() => {
    void window.api.cancelDownloadAll().catch((error: unknown) => {
      log.error(
        "[useTrackAndDownloadArtist] cancelDownloadAll failed:",
        error
      );
    });
  }, []);

  const pause = useCallback(() => {
    void window.api.pauseDownloadAll().catch((error: unknown) => {
      log.error("[useTrackAndDownloadArtist] pauseDownloadAll failed:", error);
    });
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    void window.api.resumeDownloadAll().catch((error: unknown) => {
      log.error("[useTrackAndDownloadArtist] resumeDownloadAll failed:", error);
    });
    setIsPaused(false);
  }, []);

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
