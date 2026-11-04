import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { SYNC_ERROR_CREDENTIALS_KEYWORD } from "./syncErrorKeywords";

export const MAX_LISTED_SYNC_ERRORS = 3;
const SYNC_COMPLETE_MESSAGE = "Sync complete";
const OPEN_TRACKED_LABEL = "Open Tracked";
const TRACKED_ROUTE = "/tracked";
/** Sonner collapses newlines by default; each error is its own line. */
const DESCRIPTION_LINES_CLASS = "whitespace-pre-line";

/**
 * Main already emits per-artist failures as `${artist.name}: ${reason}` and
 * artist-less ones (FTS) as a bare reason, so each payload is one line as-is.
 */
const formatSyncErrorDescription = (errors: readonly string[]): string => {
  const lines = errors
    .slice(0, MAX_LISTED_SYNC_ERRORS)
    .map((message) => message.trim());
  const hiddenCount = errors.length - lines.length;
  if (hiddenCount > 0) {
    lines.push(`and ${hiddenCount} more`);
  }
  return lines.join("\n");
};

const formatFailureTitle = (count: number): string =>
  `${count} ${count === 1 ? "artist" : "artists"} failed to sync`;

/**
 * Accumulates non-credentials sync errors during a sync run and shows one
 * toast on sync end: success when clean, an aggregate error otherwise.
 * Credentials errors are owned by CredentialsErrorToast, so a run that hit one
 * shows neither toast here.
 */
export const SyncErrorAggregator = () => {
  const navigate = useNavigate();
  const bufferRef = useRef<string[]>([]);
  const hadCredentialsErrorRef = useRef(false);

  useEffect(() => {
    const unsubscribeStart = window.api.onSyncStart(() => {
      bufferRef.current = [];
      hadCredentialsErrorRef.current = false;
    });

    const unsubscribeError = window.api.onSyncError((syncErrorMessage) => {
      if (
        syncErrorMessage.toLowerCase().includes(SYNC_ERROR_CREDENTIALS_KEYWORD)
      ) {
        hadCredentialsErrorRef.current = true;
        return;
      }
      bufferRef.current.push(syncErrorMessage);
    });

    const unsubscribeEnd = window.api.onSyncEnd(() => {
      const errors = bufferRef.current;
      const hadCredentialsError = hadCredentialsErrorRef.current;
      bufferRef.current = [];
      hadCredentialsErrorRef.current = false;

      if (hadCredentialsError) {
        return;
      }
      if (errors.length === 0) {
        toast.success(SYNC_COMPLETE_MESSAGE);
        return;
      }
      toast.error(formatFailureTitle(errors.length), {
        description: formatSyncErrorDescription(errors),
        classNames: { description: DESCRIPTION_LINES_CLASS },
        action: {
          label: OPEN_TRACKED_LABEL,
          onClick: () => {
            void Promise.resolve(navigate(TRACKED_ROUTE)).catch(
              (error: unknown) => {
                log.error(
                  "[SyncErrorAggregator] Navigation to tracked failed:",
                  error
                );
              }
            );
          },
        },
      });
    });

    return () => {
      unsubscribeStart();
      unsubscribeError();
      unsubscribeEnd();
    };
  }, [navigate]);

  return null;
};
