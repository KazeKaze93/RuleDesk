import { useState, useEffect } from "react";
import log from "electron-log/renderer";
import type { Post } from "@shared/types/db";
import type { DownloadFailure } from "@shared/types/download";
import type { GetPostsRequest } from "@shared/schemas/post";
import { BATCH_DOWNLOAD_MAX_FILES } from "@shared/constants";
import { useDownloadStore } from "../store/downloadStore";
import { ErrorCode } from "@shared/types/error-codes";
import { getErrorCode } from "../../shared/utils/type-guards";
import {
  presentDownloadAllResult,
  warnIfDownloadTruncated,
} from "../lib/download-result-ui";

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

/** Download from loaded posts (Favorites, Updates, Browse, Playlists) */
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
    warnIfDownloadTruncated(items.length);
    setIsDownloading(true);
    setGlobalDownloading(true);
    setIsPaused(false);
    setLastFailures([]);
    setProgress({ done: 0, total: items.length });
    try {
      const result = await window.api.downloadAll(items);
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
    window.api.cancelDownloadAll();
  };

  const pause = () => {
    window.api.pauseDownloadAll();
    setIsPaused(true);
  };

  const resume = () => {
    window.api.resumeDownloadAll();
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
  };
}

/** Download from backend with filters (Updates, Favorites - fetches count + items from DB) */
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
        if (getErrorCode(e) !== ErrorCode.RATE_LIMIT) {
          setTotalCount(0);
        }
      });
  }, [fetchParams]);

  const backendResult = useDownloadAllFromBackend(
    fetchParams ? { ...fetchParams, page: 1, limit: 50, isRandom: false } : null,
    effectiveTotalCount
  );

  return { ...backendResult, totalCount: effectiveTotalCount };
}

/** Download from backend (ArtistGallery - fetches all from DB, uses totalCount for display) */
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
    if (!fetchParams) return;
    setIsDownloading(true);
    setGlobalDownloading(true);
    setIsPaused(false);
    setLastFailures([]);
    setProgress({ done: 0, total: 0 });
    try {
      const { items } = await window.api.getDownloadItems({
        ...fetchParams,
        limit: BATCH_DOWNLOAD_MAX_FILES,
      });
      if (items.length === 0) return;
      if (totalCount > items.length) {
        warnIfDownloadTruncated(totalCount);
      } else {
        warnIfDownloadTruncated(items.length);
      }
      setProgress({ done: 0, total: items.length });
      const result = await window.api.downloadAll(items);
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

  const cancel = () => window.api.cancelDownloadAll();
  const pause = () => {
    window.api.pauseDownloadAll();
    setIsPaused(true);
  };
  const resume = () => {
    window.api.resumeDownloadAll();
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
