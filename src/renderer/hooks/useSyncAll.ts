import { useCallback, useEffect, useRef, useState } from "react";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { resolveErrorMessage } from "../utils/error-message";

const SYNC_GENERIC_LABEL = "Syncing...";
const SYNC_START_FAILED_MESSAGE = "Failed to start sync";
/** Mirrors the main-process PROGRESS payload: `Checking ${artist.name}...`. */
const SYNC_PROGRESS_ARTIST_PATTERN = /^Checking (.+)\.\.\.$/;

/**
 * Formats the raw SYNC.PROGRESS string for UI. The payload carries only an
 * artist name (no current/total), so the label is either `Syncing <artist>...`
 * or the generic `Syncing...`.
 */
export const formatSyncProgressLabel = (message: string | null): string => {
  const artistName = message?.match(SYNC_PROGRESS_ARTIST_PATTERN)?.[1]?.trim();
  return artistName ? `Syncing ${artistName}...` : SYNC_GENERIC_LABEL;
};

type UseSyncAllOptions = {
  /** Called on every SYNC.END (e.g. to invalidate queries). Latest callback wins. */
  onSyncEnd?: () => void;
};

type UseSyncAllResult = {
  isSyncing: boolean;
  /** Label for the active sync; empty string while idle. */
  progress: string;
  /** No-op while a sync is already running. */
  startSync: () => Promise<void>;
};

export const useSyncAll = (options: UseSyncAllOptions = {}): UseSyncAllResult => {
  const { onSyncEnd } = options;
  const [isSyncing, setIsSyncing] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  // Guards against double-invocation before React commits isSyncing.
  const isSyncingRef = useRef(false);
  const onSyncEndRef = useRef(onSyncEnd);

  useEffect(() => {
    onSyncEndRef.current = onSyncEnd;
  }, [onSyncEnd]);

  const updateSyncing = useCallback((value: boolean) => {
    isSyncingRef.current = value;
    setIsSyncing(value);
  }, []);

  useEffect(() => {
    const unsubscribeStart = window.api.onSyncStart(() => {
      setProgressMessage(null);
      updateSyncing(true);
    });
    const unsubscribeProgress = window.api.onSyncProgress((message) => {
      setProgressMessage(message);
      updateSyncing(true);
    });
    const unsubscribeEnd = window.api.onSyncEnd(() => {
      setProgressMessage(null);
      updateSyncing(false);
      onSyncEndRef.current?.();
    });

    return () => {
      unsubscribeStart();
      unsubscribeProgress();
      unsubscribeEnd();
    };
  }, [updateSyncing]);

  const startSync = useCallback(async () => {
    if (isSyncingRef.current) return;

    updateSyncing(true);
    try {
      log.info("[useSyncAll] Triggering Sync...");
      await window.api.syncAll();
    } catch (error: unknown) {
      log.error("[useSyncAll] Sync failed:", error);
      updateSyncing(false);
      toast.error(resolveErrorMessage(error, SYNC_START_FAILED_MESSAGE));
    }
  }, [updateSyncing]);

  return {
    isSyncing,
    progress: isSyncing ? formatSyncProgressLabel(progressMessage) : "",
    startSync,
  };
};
