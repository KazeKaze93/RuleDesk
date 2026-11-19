import { log } from "../log";

/**
 * The one event the parts of the script share: thumbs were put on the page
 * after it loaded (the endless list, the merged feed, the script's grid of
 * favorites). It is a module of its own, with no imports but the log: it was
 * part of features/runtime, which imports every feature, and each feature that
 * listened imported it back, a ring of 19 files that also drew them all into
 * the code run before the first paint (the audit of 19.11.2026).
 */

/**
 * Where a listener looks for the thumbs it was told of: all it may do with it
 * is ask for the elements that match a selector. A part of the page is one;
 * so is the list of the nodes that were added, which answers with those of
 * them, and of what is inside them, that match.
 */
export type ThumbRoot = {
  querySelectorAll(selectors: string): Iterable<Element> & ArrayLike<Element>;
};

export type ThumbsAddedListener = (root: ThumbRoot) => void;

function scopeOf(added: readonly Element[]): ThumbRoot {
  return {
    querySelectorAll: (selectors: string): Element[] => {
      const found: Element[] = [];
      for (const node of added) {
        if (node.matches(selectors)) {
          found.push(node);
        }
        found.push(...node.querySelectorAll(selectors));
      }
      return found;
    },
  };
}

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
 *
 * With `added`, the nodes that were put in, the listeners are shown those
 * only. Without it each of them went over every thumb of the list again at
 * every page the endless list brought: the work of a page grew with the pages
 * before it (the audit of 19.11.2026).
 */
export function notifyThumbsAdded(root: ParentNode, added?: readonly Element[]): void {
  const scope: ThumbRoot = added === undefined ? root : scopeOf(added);
  for (const listener of listeners) {
    try {
      listener(scope);
    } catch (error) {
      log.error("thumbs-bus: a listener failed", error);
    }
  }
}

/** Drops every subscriber (tests). */
export function resetThumbsBus(): void {
  listeners.clear();
}
