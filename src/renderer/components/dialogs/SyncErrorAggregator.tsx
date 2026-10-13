import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SYNC_ERROR_CREDENTIALS_KEYWORD } from "./syncErrorKeywords";

/**
 * Accumulates non-credentials sync errors during a sync run and shows one
 * summary toast on sync end (events own the lifecycle).
 */
export const SyncErrorAggregator = () => {
  const bufferRef = useRef<string[]>([]);

  useEffect(() => {
    const unsubscribeStart = window.api.onSyncStart(() => {
      bufferRef.current = [];
    });

    const unsubscribeError = window.api.onSyncError((syncErrorMessage) => {
      if (
        syncErrorMessage.toLowerCase().includes(SYNC_ERROR_CREDENTIALS_KEYWORD)
      ) {
        return;
      }
      bufferRef.current.push(syncErrorMessage);
    });

    const unsubscribeEnd = window.api.onSyncEnd(() => {
      const errors = bufferRef.current;
      bufferRef.current = [];
      if (errors.length === 0) {
        return;
      }
      const firstMessage = errors[0];
      toast.error(`${errors.length} artists failed to sync`, {
        description: firstMessage,
      });
    });

    return () => {
      unsubscribeStart();
      unsubscribeError();
      unsubscribeEnd();
    };
  }, []);

  return null;
};
