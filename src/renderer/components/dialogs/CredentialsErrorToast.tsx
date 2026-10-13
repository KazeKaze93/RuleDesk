import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { RENDERER_WINDOW_EVENTS } from "@shared/constants";
import { SYNC_ERROR_CREDENTIALS_KEYWORD } from "./syncErrorKeywords";

const CREDENTIALS_TOAST_ID = "sync-credentials-error";

export const CredentialsErrorToast = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = window.api.onSyncError((syncErrorMessage) => {
      if (!syncErrorMessage.toLowerCase().includes(SYNC_ERROR_CREDENTIALS_KEYWORD)) {
        return;
      }

      toast.error("Credentials issue detected", {
        id: CREDENTIALS_TOAST_ID,
        description: syncErrorMessage,
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: "Re-enter credentials",
          onClick: () => {
            window.dispatchEvent(
              new Event(RENDERER_WINDOW_EVENTS.OPEN_ONBOARDING)
            );
          },
        },
        cancel: {
          label: "Open settings",
          onClick: () => {
            void Promise.resolve(navigate("/settings")).catch(
              (error: unknown) => {
                log.error(
                  "[CredentialsErrorToast] Navigation to settings failed:",
                  error
                );
              }
            );
          },
        },
      });
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  return null;
};
