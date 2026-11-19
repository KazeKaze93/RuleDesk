import { log } from "../log";

/**
 * The one event the parts of the script share: thumbs were put on the page
 * after it loaded (the endless list, the merged feed, the script's grid of
 * favorites). It is a module of its own, with no imports but the log: it was
 * part of features/runtime, which imports every feature, and each feature that
 * listened imported it back, a ring of 19 files that also drew them all into
 * the code run before the first paint (the audit of 19.11.2026).
 */

export type ThumbsAddedListener = (root: ParentNode) => void;

const listeners = new Set<ThumbsAddedListener>();

/** Subscribe to thumbs inserted after the initial page load (e.g. infinite scroll). */
export function onThumbsAdded(cb: ThumbsAddedListener): () => void {
  listeners.add(cb);
  return (): void => {
    listeners.delete(cb);
  };
}

/**
 * Notify subscribers that new thumb nodes exist under `root`. A listener that
 * throws does not keep the others from hearing, nor the caller from going on.
 */
export function notifyThumbsAdded(root: ParentNode): void {
  for (const listener of listeners) {
    try {
      listener(root);
    } catch (error) {
      log.error("thumbs-bus: a listener failed", error);
    }
  }
}

/** Drops every subscriber (tests). */
export function resetThumbsBus(): void {
  listeners.clear();
}
