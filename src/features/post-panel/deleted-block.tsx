import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import { log } from "../../log";
import { Button, IconCheck, IconCopy, IconImageOff } from "../../ui/kit";

export const POST_DELETED_ID = "rdw-post-deleted";
export const CLASS_DELETED_ICON = "rdw-post-deleted-icon";
export const CLASS_DELETED_TITLE = "rdw-post-deleted-title";
export const CLASS_DELETED_REASON = "rdw-post-deleted-reason";
export const CLASS_DELETED_RELATED = "rdw-post-deleted-related";
export const CLASS_DELETED_MD5_ROW = "rdw-post-deleted-md5-row";
export const CLASS_DELETED_MD5 = "rdw-post-deleted-md5";
export const CLASS_DELETED_COPY = "rdw-post-deleted-copy";

/**
 * Sent on the document by "Show related posts": the panel opens its tab of
 * related posts. The block stands outside the panel, in the place of the
 * picture, so the two speak through the page.
 */
export const OPEN_RELATED_EVENT = "rdw-post-panel-open-related";

export const TEXT_DELETED = "This post was deleted";
export const TEXT_SHOW_RELATED = "Show related posts";
const TEXT_REASON_PREFIX = "Reason: ";
const TEXT_MD5_PREFIX = "MD5 ";
const TEXT_COPY = "Copy";
const TEXT_COPIED = "Copied";
const ARIA_COPY = "Copy the MD5 of the file";

const ICON_SIZE = 40;
const COPY_ICON_SIZE = 12;
/** How long "Copied" stands on the button. */
const COPIED_MS = 1500;

/**
 * The site's codes of the reason, in words (the designer, 19.11.2026). Only
 * "tos" was seen on the site (from Kaze, 19.11.2026); a code not listed here
 * is shown as the site gives it.
 */
const REASON_TEXT: ReadonlyMap<string, string> = new Map([
  ["tos", "Breaks the site’s terms of service"],
]);

export function deletedReasonText(reason: string): string {
  const code = reason.trim();
  if (code.length === 0) {
    return "";
  }
  return REASON_TEXT.get(code.toLowerCase()) ?? `${TEXT_REASON_PREFIX}${code}`;
}

export type DeletedBlockProps = {
  /** What the site gives as the reason; empty when it gives none. */
  readonly reason: string;
  /** The hash of the file that was there; empty when the notice has none. */
  readonly md5: string;
  /** Whether the panel has the tab of related posts to open. */
  readonly showRelated: boolean;
};

/**
 * What stands in the place of the picture of a deleted post (the designer,
 * 19.11.2026): that it was deleted, why in plain words, the way to posts like
 * it, and the hash of the file, small, for one who looks for a repost.
 */
export function DeletedBlock(props: DeletedBlockProps): JSX.Element {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopied(false);
    }, COPIED_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const reason = deletedReasonText(props.reason);

  const onCopy = (): void => {
    try {
      void navigator.clipboard.writeText(props.md5).then(
        () => {
          setCopied(true);
        },
        (error: unknown) => {
          log.warn("post-actions: MD5 not copied", error);
        },
      );
    } catch (error) {
      log.warn("post-actions: no clipboard", error);
    }
  };

  return (
    <>
      <IconImageOff size={ICON_SIZE} className={CLASS_DELETED_ICON} />
      <p className={CLASS_DELETED_TITLE}>{TEXT_DELETED}</p>
      {reason.length > 0 ? <p className={CLASS_DELETED_REASON}>{reason}</p> : null}
      {props.showRelated ? (
        <Button
          variant="primary"
          size="m"
          className={CLASS_DELETED_RELATED}
          onClick={() => {
            document.dispatchEvent(new CustomEvent(OPEN_RELATED_EVENT));
          }}
        >
          {TEXT_SHOW_RELATED}
        </Button>
      ) : null}
      {props.md5.length > 0 ? (
        <div className={CLASS_DELETED_MD5_ROW}>
          <span className={CLASS_DELETED_MD5}>{`${TEXT_MD5_PREFIX}${props.md5}`}</span>
          <Button
            variant="ghost"
            size="s"
            className={CLASS_DELETED_COPY}
            aria-label={ARIA_COPY}
            onClick={onCopy}
          >
            {copied ? <IconCheck size={COPY_ICON_SIZE} /> : <IconCopy size={COPY_ICON_SIZE} />}
            {copied ? TEXT_COPIED : TEXT_COPY}
          </Button>
        </div>
      ) : null}
    </>
  );
}
