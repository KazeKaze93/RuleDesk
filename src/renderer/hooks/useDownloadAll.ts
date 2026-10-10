import { useState, useEffect } from "react";
import log from "electron-log/renderer";
import { toast } from "sonner";
import type { Post } from "@shared/types/db";
import type { DownloadFailure } from "@shared/types/download";
import type { GetPostsRequest } from "@shared/schemas/post";
import type { PostFilterRequest } from "@shared/schemas/post";
import { BATCH_DOWNLOAD_LIST_MAX_FILES } from "@shared/constants";
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
  const setGlobalDownloading = useDownloadStore((s) => s.setDownloading);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [lastFailures, setLastFailures] = useState<DownloadFailure[]>([]);

  useEffect(() => {
    if (!isDownloading) return;
    const unsub = window.api.onDownloadAllProgress((data) => {
      setProgress({ done: data.done, total: data.total });
    });
    return () => unsub();
  }, [isDownloading]);

  const downloadAll = async () => {
    const items = posts
      .map(postToDownloadItem)
      .filter((x): x is { url: string; filename: string } => x !== null);
    if (items.length === 0) return;
    if (warnIfDownloadListOverLimit(items.length)) {
      return;
    }
    setIsDownloading(true);
    setGlobalDownloading(true);
    setIsPaused(false);
    setLastFailures([]);
    setProgress({ done: 0, total: items.length });
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
      setGlobalDownloading(false);
      setIsPaused(false);
      setProgress({ done: 0, total: 0 });
    }
  };

  const cancel = () => {
    void window.api.cancelDownloadAll().catch((error: unknown) => {
      log.error("[useDownloadAll] cancelDownloadAll failed:", error);
    });
  };

  const pause = () => {
    void window.api.pauseDownloadAll().catch((error: unknown) => {
      log.error("[useDownloadAll] pauseDownloadAll failed:", error);
    });
    setIsPaused(true);
  };

  const resume = () => {
    void window.api.resumeDownloadAll().catch((error: unknown) => {
      log.error("[useDownloadAll] resumeDownloadAll failed:", error);
    });
    setIsPaused(false);
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

/** Artist Library: uncapped cursor download by posts.id (filter + snapshot). */
export function useDownloadAllFromBackend(
  fetchParams: GetPostsRequest | null,
  totalCount: number
) {
  const [isDownloading, setIsDownloading] = useState(false);
  const setGlobalDownloading = useDownloadStore((s) => s.setDownloading);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [lastFailures, setLastFailures] = useState<DownloadFailure[]>([]);

  useEffect(() => {
    if (!isDownloading) return;
    const unsub = window.api.onDownloadAllProgress((data) => {
      setProgress({ done: data.done, total: data.total });
    });
    return () => unsub();
  }, [isDownloading]);

  const downloadAll = async () => {
    if (!fetchParams?.artistId) return;
    setIsDownloading(true);
    setGlobalDownloading(true);
    setIsPaused(false);
    setLastFailures([]);
    setProgress({ done: 0, total: totalCount });
    try {
      const filters: PostFilterRequest | undefined = fetchParams.filters;
      const result = await window.api.downloadAll({
        kind: "artist",
        artistId: fetchParams.artistId,
        filters,
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
      setGlobalDownloading(false);
      setIsPaused(false);
      setProgress({ done: 0, total: 0 });
    }
  };

  const cancel = () => {
    void window.api.cancelDownloadAll().catch((error: unknown) => {
      log.error("[useDownloadAllFromBackend] cancelDownloadAll failed:", error);
    });
  };
  const pause = () => {
    void window.api.pauseDownloadAll().catch((error: unknown) => {
      log.error("[useDownloadAllFromBackend] pauseDownloadAll failed:", error);
    });
    setIsPaused(true);
  };
  const resume = () => {
    void window.api.resumeDownloadAll().catch((error: unknown) => {
      log.error("[useDownloadAllFromBackend] resumeDownloadAll failed:", error);
    });
    setIsPaused(false);
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
      ? { ...fetchParams, page: 1, limit: 50, isRandom: false }
      : null,
    effectiveTotalCount
  );

  return { ...backendResult, totalCount: effectiveTotalCount };
}
