import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { log } from "../../log";
import {
  buildFileName,
  canDownload,
  downloadFile,
  isMediaFileUrl,
  type FileNameInfo,
} from "../../site/download";
import { isSiteUrl } from "../../site/urls";
import { readFileMask } from "../../storage/download-name";
import { IconCheck, IconDownload } from "../../ui/kit";
import { IMAGE_ID } from "./site-reads";

/**
 * Saves the original file of the open post. Its address is already in the
 * page (the player's source, the site's "Original image" link, the picture
 * itself), so this needs neither the API nor a key, and asks the site for
 * nothing but the file.
 */

export const DOWNLOAD_ONE_CLASS = "rdw-post-panel-download";
const VIDEO_SELECTOR = "video#gelcomVideoPlayer";
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

function videoSource(root: ParentNode): string {
  const video = root.querySelector(VIDEO_SELECTOR);
  if (!(video instanceof HTMLVideoElement)) {
    return "";
  }
  const source = video.querySelector("source");
  return video.currentSrc || video.src || (source instanceof HTMLSourceElement ? source.src : "");
}

/**
 * The address of the post's file: the first of the candidates that ends like
 * a picture or a video. A video post is taken from its player; the "Original
 * image" link is next; the picture on the page is the last resort. An address
 * that is a page, not a file, is never downloaded: it would save as HTML.
 */
export function resolvePostFileUrl(
  originalHref: string | null,
  root: ParentNode = document,
): string | null {
  const image = root.querySelector(`img#${IMAGE_ID}`);
  const candidates = [
    videoSource(root),
    originalHref ?? "",
    image instanceof HTMLImageElement ? image.currentSrc || image.src : "",
  ];
  // Only from the site: the page is not trusted to name another server to
  // save a file from (the audit of 19.11.2026).
  return (
    candidates.find((url) => url.length > 0 && isMediaFileUrl(url) && isSiteUrl(url)) ?? null
  );
}

export type DownloadOneProps = {
  readonly originalHref: string | null;
  /** What the page says about the post, for the file name mask. */
  readonly info: Omit<FileNameInfo, "url">;
  /** The class of the "Original" link beside it, for the same look. */
  readonly className: string;
};

export function DownloadOne(props: DownloadOneProps): JSX.Element | null {
  const [phase, setPhase] = useState<Phase>("idle");
  if (!canDownload() || resolvePostFileUrl(props.originalHref) === null) {
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
        // Read at the click: the player may have set its source after the panel was drawn.
        const url = resolvePostFileUrl(props.originalHref);
        if (url === null) {
          setPhase("failed");
          return;
        }
        setPhase("busy");
        downloadFile(url, buildFileName(readFileMask(), { ...props.info, url }))
          .then(() => {
            setPhase("done");
          })
          .catch((error: unknown) => {
            log.warn("post-panel: download failed", props.info.postId, error);
            setPhase("failed");
          });
      }}
    >
      {phase === "done" ? <IconCheck size={ICON_SIZE} /> : <IconDownload size={ICON_SIZE} />}
    </button>
  );
}
