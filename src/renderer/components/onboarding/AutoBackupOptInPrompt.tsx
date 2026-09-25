import React, { useEffect, useRef, useState } from "react";
import log from "electron-log/renderer";
import { HardDriveDownload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ENABLE_LABEL = "Enable daily backups";
const DISMISS_LABEL = "Not now";

/**
 * One-shot, dismissible opt-in for auto-backup on existing installs that still
 * have `autoBackupInterval === "never"`. Unlike AgeGate, this does not block
 * the rest of the app (`modal={false}`).
 */
export const AutoBackupOptInPrompt: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkedThisSessionRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (checkedThisSessionRef.current) {
      return;
    }
    checkedThisSessionRef.current = true;

    let cancelled = false;
    void window.api
      .shouldShowBackupPrompt()
      .then((shouldShow) => {
        if (!cancelled && shouldShow) {
          setOpen(true);
        }
      })
      .catch((error: unknown) => {
        log.error("[AutoBackupOptInPrompt] Failed to check prompt:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const finishPrompt = async (enableDaily: boolean): Promise<void> => {
    if (finishedRef.current || isSubmitting) {
      return;
    }
    finishedRef.current = true;
    setIsSubmitting(true);
    setOpen(false);
    try {
      if (enableDaily) {
        await window.api.setBackupSchedule("daily");
      }
      await window.api.markBackupPromptSeen();
    } catch (error) {
      log.error("[AutoBackupOptInPrompt] Failed to persist prompt choice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      modal={false}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void finishPrompt(false);
        }
      }}
    >
      <DialogContent className="max-w-md" aria-describedby="auto-backup-opt-in-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDriveDownload className="h-5 w-5" aria-hidden />
            Enable automatic backups?
          </DialogTitle>
          <DialogDescription id="auto-backup-opt-in-desc">
            RuleDesk can create a consistent daily snapshot of your database so a
            cache wipe or disk glitch does not erase your library. You can change
            this later in Settings → Backup.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              void finishPrompt(false);
            }}
            aria-label={DISMISS_LABEL}
          >
            {DISMISS_LABEL}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void finishPrompt(true);
            }}
            aria-label={ENABLE_LABEL}
          >
            {ENABLE_LABEL}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
