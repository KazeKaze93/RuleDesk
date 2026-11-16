import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { log } from "../../log";
import { canDownload, downloadFile, downloadFileName } from "../../site/download";
import { IconCheck, IconDownload } from "../../ui/kit";

/**
 * Saves the original file of the open post. The file's address is the site's
 * own "Original image" link, already in the page, so this needs neither the
 * API nor a key, and asks the site for nothing but the file itself.
 */

export const DOWNLOAD_ONE_CLASS = "rdw-post-panel-download";
const LABEL_IDLE = "Download the original file";
const LABEL_BUSY = "Downloading…";
const LABEL_DONE = "Saved to your downloads folder";
const LABEL_FAILED = "Could not download. Press to try again";
const ICON_SIZE = 16;

type Phase = "idle" | "busy" | "done" | "failed";

const LABELS: Readonly<Record<Phase, string>> = {
  idle: LABEL_IDLE,
  busy: LABEL_BUSY,
  done: LABEL_DONE,
  failed: LABEL_FAILED,
};

export type DownloadOneProps = {
  readonly url: string;
  readonly postId: number;
  /** The class of the "Original" link beside it, for the same look. */
  readonly className: string;
};

export function DownloadOne(props: DownloadOneProps): JSX.Element | null {
  const [phase, setPhase] = useState<Phase>("idle");
  if (!canDownload()) {
    return null;
  }
  const label = LABELS[phase];
  return (
    <button
      type="button"
      className={`${props.className} ${DOWNLOAD_ONE_CLASS} rdw-kit-focusable`}
      aria-label={label}
      title={label}
      aria-busy={phase === "busy" ? true : undefined}
      disabled={phase === "busy"}
      data-phase={phase}
      onClick={() => {
        setPhase("busy");
        downloadFile(props.url, downloadFileName(props.url, props.postId))
          .then(() => {
            setPhase("done");
          })
          .catch((error: unknown) => {
            log.warn("post-panel: download failed", props.postId, error);
            setPhase("failed");
          });
      }}
    >
      {phase === "done" ? <IconCheck size={ICON_SIZE} /> : <IconDownload size={ICON_SIZE} />}
    </button>
  );
}
