import { useState, useEffect } from "react";
import log from "electron-log/renderer";
import type { Post } from "../../main/db/schema";
import type { GetPostsRequest } from "../../main/types/ipc";
import { useDownloadStore } from "../store/downloadStore";

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
    setIsDownloading(true);
    setGlobalDownloading(true);
    setIsPaused(false);
    setProgress({ done: 0, total: items.length });
    try {
      const result = await window.api.downloadAll(items);
      log.info(
        `[useDownloadAll] Done: ${result.downloaded} ok, ${result.failed} failed, canceled=${result.canceled}`
      );
    } catch (e) {
      log.error("[useDownloadAll] Failed:", e);
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
    canDownload: posts.length > 0,
  };
}

/** Download from backend with filters (Updates, Favorites - fetches count + items from DB) */
export function useDownloadAllWithFilters(
  fetchParams: Pick<GetPostsRequest, "artistId" | "filters"> | null
) {
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!fetchParams) {
      setTotalCount(0);
      return;
    }
    window.api
      .getPostsCountWithFilters(fetchParams)
      .then(setTotalCount)
      .catch((e) => {
        if ((e as { code?: string })?.code !== "RATE_LIMIT") {
          setTotalCount(0);
        }
      });
  }, [fetchParams?.artistId, JSON.stringify(fetchParams?.filters)]);

  const backendResult = useDownloadAllFromBackend(
    fetchParams ? { ...fetchParams, page: 1, limit: 50 } : null,
    totalCount
  );

  return { ...backendResult, totalCount };
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
    setProgress({ done: 0, total: 0 });
    try {
      const { items } = await window.api.getDownloadItems({
        ...fetchParams,
        limit: 500,
      });
      if (items.length === 0) return;
      setProgress({ done: 0, total: items.length });
      const result = await window.api.downloadAll(items);
      log.info(
        `[useDownloadAllFromBackend] Done: ${result.downloaded} ok, ${result.failed} failed, canceled=${result.canceled}`
      );
    } catch (e) {
      log.error("[useDownloadAllFromBackend] Failed:", e);
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
    canDownload: totalCount > 0,
  };
}
