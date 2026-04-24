import { useEffect, useState } from "react";
import log from "electron-log/renderer";

type ProxyEntry = { fileUrl: string; proxy: string };

/**
 * Resolves a localhost video proxy URL for Range-aware playback and disk cache.
 * Returns null while the URL does not match a resolved entry (use `result ?? fileUrl` for src).
 */
export function useVideoProxyUrl(
  fileUrl: string | null | undefined,
): string | null {
  const [entry, setEntry] = useState<ProxyEntry | null>(null);

  useEffect(() => {
    if (fileUrl === null || fileUrl === undefined || fileUrl === "") {
      return;
    }

    let cancelled = false;
    void window.api
      .getVideoProxyUrl(fileUrl)
      .then((proxy) => {
        if (!cancelled) {
          setEntry({ fileUrl, proxy });
        }
      })
      .catch((err: unknown) => {
        log.error("[useVideoProxyUrl] getVideoProxyUrl failed", err);
        if (!cancelled) {
          setEntry(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (fileUrl === null || fileUrl === undefined || fileUrl === "") {
    return null;
  }

  if (entry !== null && entry.fileUrl === fileUrl) {
    return entry.proxy;
  }

  return null;
}
