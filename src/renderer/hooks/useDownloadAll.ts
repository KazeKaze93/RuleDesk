import { useState, useEffect } from "react";
import log from "electron-log/renderer";
import { toast } from "sonner";
import type { Post } from "@shared/types/db";
import type { DownloadFailure } from "@shared/types/download";
import type { GetPostsRequest } from "@shared/schemas/post";
import type { PostFilterRequest } from "@shared/schemas/post";
import {
  BATCH_DOWNLOAD_LIST_MAX_FILES,
  POSTS_PAGE_SIZE,
} from "@shared/constants";
import { useDownloadStore } from "../store/downloadStore";
import { ErrorCode } from "@shared/types/error-codes";
import { getErrorCode } from "../../shared/utils/type-guards";
import {
  presentDownloadAllResult,
  warnIfDownloadListOverLimit,
} from "../lib/download-result-ui";
import { resolveErrorMessage } from "../utils/error-message";

function postToDownloadItem(p: Post): { url: string; filename: string } | null {
  if (!p.fileUrl?.trim()) return null;
  const pathMatch = p.fileUrl.match(/^[^?#]+/);
  const pathname = pathMatch ? pathMatch[0] : p.fileUrl;
  const ext = pathname.split(".").pop()?.toLowerCase() || "jpg";
  return {
    url: p.fileUrl,
    filename: `${p.artistId}_${p.postId}.${ext}`,
  };
}

/** Download from loaded posts (Favorites, Updates, Browse, Playlists) — list, not full remote crawl. */
export function useDownloadAll(posts: Post[]) {
  const [isDownloading, setIsDownloading] = useState(false);
  const startDownload = useDownloadStore((s) => s.startDownload);
  const resetDownload = useDownloadStore((s) => s.resetDownload);
  const pauseDownload = useDownloadStore((s) => s.pauseDownload);
  const resumeDownload = useDownloadStore((s) => s.resumeDownload);
  const cancelDownload = useDownloadStore((s) => s.cancelDownload);
  const isPaused = useDownloadStore((s) => s.isPaused);
  const progress = useDownloadStore((s) => s.progress);
  const [lastFailures, setLastFailures] = useState<DownloadFailure[]>([]);

  const downloadAll = async () => {
    const items = posts
      .map(postToDownloadItem)
      .filter((x): x is { url: string; filename: string } => x !== null);
    if (items.length === 0) return;
    if (warnIfDownloadListOverLimit(items.length)) {
      return;
    }
    setIsDownloading(true);
    startDownload({ total: items.length });
    setLastFailures([]);
    try {
      const result = await window.api.downloadAll({ kind: "list", items });
      setLastFailures(result.failed);
      log.info(
        `[useDownloadAll] Done: ${result.downloaded} ok, ${result.failed.length} failed, canceled=${result.canceled}`
      );
      presentDownloadAllResult(result);
    } catch (e) {
      log.error("[useDownloadAll] Failed:", e);
      presentDownloadAllResult({
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsDownloading(false);
      resetDownload();
    }
  };

  const cancel = () => {
    cancelDownload();
  };

  const pause = () => {
    pauseDownload();
  };

  const resume = () => {
    resumeDownload();
  };

  return {
    downloadAll,
    cancel,
    pause,
    resume,
    isDownloading,
    isPaused,
    progress,
    lastFailures,
    canDownload: posts.length > 0,
    loadedCount: posts.length,
    listMaxFiles: BATCH_DOWNLOAD_LIST_MAX_FILES,
  };
}

/** Uncapped cursor download target: artist library or all favorites. */
export type DownloadAllBackendTarget =
  | { kind: "artist"; artistId: number; filters?: PostFilterRequest }
  | { kind: "favorites"; filters?: PostFilterRequest };

/**
 * Accepts an explicit target, or a GetPostsRequest-like artist scope
 * (ArtistGallery / useDownloadAllWithFilters compatibility).
 */
export type DownloadAllFromBackendInput =
  | DownloadAllBackendTarget
  | Pick<GetPostsRequest, "artistId" | "filters">
  | (GetPostsRequest & { artistId?: number })
  | null;

function resolveDownloadAllBackendTarget(
  input: DownloadAllFromBackendInput
): DownloadAllBackendTarget | null {
  if (!input) {
    return null;
  }
  if ("kind" in input) {
    return input;
  }
  if (input.artistId == null) {
    return null;
  }
  return {
    kind: "artist",
    artistId: input.artistId,
    filters: input.filters,
  };
}

/** Artist Library / Favorites: uncapped cursor download by posts.id (filter + snapshot). */
export function useDownloadAllFromBackend(
  targetInput: DownloadAllFromBackendInput,
  totalCount: number
) {
  const [isDownloading, setIsDownloading] = useState(false);
  const startDownload = useDownloadStore((s) => s.startDownload);
  const resetDownload = useDownloadStore((s) => s.resetDownload);
  const pauseDownload = useDownloadStore((s) => s.pauseDownload);
  const resumeDownload = useDownloadStore((s) => s.resumeDownload);
  const cancelDownload = useDownloadStore((s) => s.cancelDownload);
  const isPaused = useDownloadStore((s) => s.isPaused);
  const progress = useDownloadStore((s) => s.progress);
  const [lastFailures, setLastFailures] = useState<DownloadFailure[]>([]);

  const downloadAll = async () => {
    const target = resolveDownloadAllBackendTarget(targetInput);
    if (!target) return;
    setIsDownloading(true);
    startDownload({ total: totalCount });
    setLastFailures([]);
    try {
      const result =
        target.kind === "artist"
          ? await window.api.downloadAll({
              kind: "artist",
              artistId: target.artistId,
              filters: target.filters,
            })
          : await window.api.downloadAll({
              kind: "favorites",
              filters: target.filters,
            });
      setLastFailures(result.failed);
      log.info(
        `[useDownloadAllFromBackend] Done: ${result.downloaded} ok, ${result.failed.length} failed, canceled=${result.canceled}`
      );
      presentDownloadAllResult(result);
    } catch (e) {
      log.error("[useDownloadAllFromBackend] Failed:", e);
      presentDownloadAllResult({
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsDownloading(false);
      resetDownload();
    }
  };

  const cancel = () => {
    cancelDownload();
  };
  const pause = () => {
    pauseDownload();
  };
  const resume = () => {
    resumeDownload();
  };

  return {
    downloadAll,
    cancel,
    pause,
    resume,
    isDownloading,
    isPaused,
    progress,
    lastFailures,
    canDownload: totalCount > 0,
  };
}

/** Download with filters count (Updates/Favorites helpers) — still artist/DB scoped via backend. */
export function useDownloadAllWithFilters(
  fetchParams: Pick<GetPostsRequest, "artistId" | "filters"> | null
) {
  const [totalCount, setTotalCount] = useState(0);
  const effectiveTotalCount = fetchParams ? totalCount : 0;

  useEffect(() => {
    if (!fetchParams) return;
    window.api
      .getPostsCountWithFilters(fetchParams)
      .then(setTotalCount)
      .catch((e) => {
        if (getErrorCode(e) === ErrorCode.RATE_LIMIT) {
          return;
        }
        log.error("[useDownloadAllWithFilters] getPostsCountWithFilters failed:", e);
        toast.error(
          resolveErrorMessage(e, "Failed to load downloadable post count")
        );
      });
  }, [fetchParams]);

  const backendResult = useDownloadAllFromBackend(
    fetchParams
      ? { ...fetchParams, page: 1, limit: POSTS_PAGE_SIZE, isRandom: false }
      : null,
    effectiveTotalCount
  );

  return { ...backendResult, totalCount: effectiveTotalCount };
}
