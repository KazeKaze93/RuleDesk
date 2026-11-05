import { useEffect } from "react";
import { useDownloadStore } from "../store/downloadStore";

/**
 * Single app-wide subscription for mass-download progress → downloadStore.
 * Mount once from AppLayout; hooks must not subscribe separately.
 */
export function useSubscribeDownloadAllProgress(): void {
  useEffect(() => {
    const unsubscribe = window.api.onDownloadAllProgress((data) => {
      useDownloadStore.getState().setProgress(data.done, data.total);
    });
    return () => {
      unsubscribe();
    };
  }, []);
}
