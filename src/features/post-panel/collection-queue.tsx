import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import {
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PAGE,
  SEARCH_PATH,
  SEARCH_SECTION_VIEW,
} from "../../config/constants";
import { RDW_HASH_COLLECTIONS } from "../../pages/constants";
import { SITE_SELECTORS } from "../../site/selectors";
import { getCollectionOrder, listPlaylists } from "../../storage/store";
import { KIT_FOCUS_CSS, KIT_MIN_TARGET_PX } from "../../ui/kit/shared";

/** Queue context on a post page: `#rdw-c=<collectionId>`. */
export const COLLECTION_QUEUE_HASH_PREFIX = "#rdw-c=";

export const CLASS_STRIP = "rdw-post-panel-collection-queue";
export const CLASS_NAME = "rdw-post-panel-collection-queue-name";
export const CLASS_POSITION = "rdw-post-panel-collection-queue-position";
export const CLASS_NAV = "rdw-post-panel-collection-queue-nav";

const CLASS_FOCUSABLE = "rdw-kit-focusable";

const GLYPH_PREVIOUS = "‹";
const GLYPH_NEXT = "›";
const LABEL_PREVIOUS = "Previous post in collection";
const LABEL_NEXT = "Next post in collection";
const ARIA_QUEUE = "Collection queue";

const POSITION_SEPARATOR = " / ";
const INDEX_NOT_FOUND = -1;
const POSITION_BASE = 1;

const EVENT_HASHCHANGE = "hashchange";
const EVENT_CLICK = "click";
const MOUSE_BUTTON_PRIMARY = 0;

const QUEUE_GAP_PX = 8;
const NAME_FONT_WEIGHT = 600;
const NAV_DISABLED_OPACITY = 0.55;

const POST_VIEW_QUERY = `${SEARCH_PARAM_PAGE}=${SEARCH_PAGE}&${SEARCH_PARAM_SECTION}=${SEARCH_SECTION_VIEW}`;

const QUEUE_CSS = `
${KIT_FOCUS_CSS}
.${CLASS_STRIP} {
  display: flex;
  align-items: center;
  gap: ${String(QUEUE_GAP_PX)}px;
  min-width: 0;
}
.${CLASS_NAME} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-accent);
  font-weight: ${String(NAME_FONT_WEIGHT)};
  text-decoration: none;
}
.${CLASS_POSITION} {
  flex: 0 0 auto;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
a.${CLASS_NAV},
button.${CLASS_NAV} {
  box-sizing: border-box;
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: ${String(KIT_MIN_TARGET_PX)}px;
  height: ${String(KIT_MIN_TARGET_PX)}px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
}
button.${CLASS_NAV}:disabled {
  opacity: ${String(NAV_DISABLED_OPACITY)};
  cursor: not-allowed;
}
`;

export type CollectionQueueProps = {
  readonly postId: number | null;
};

type QueueView = {
  readonly name: string;
  readonly collectionHref: string;
  readonly positionLabel: string;
  readonly previousHref: string | null;
  readonly nextHref: string | null;
};

export function readCollectionQueueId(hash: string): string | null {
  if (!hash.startsWith(COLLECTION_QUEUE_HASH_PREFIX)) {
    return null;
  }
  const id = hash.slice(COLLECTION_QUEUE_HASH_PREFIX.length).trim();
  if (id.length === 0) {
    return null;
  }
  return id;
}

function readLocationHash(): string {
  return window.location.hash;
}

function collectionName(collectionId: string): string | null {
  for (const playlist of listPlaylists()) {
    if (playlist.id === collectionId) {
      return playlist.name;
    }
  }
  return null;
}

function indexOfPost(order: readonly number[], postId: number): number {
  for (let index = 0; index < order.length; index += 1) {
    if (order[index] === postId) {
      return index;
    }
  }
  return INDEX_NOT_FOUND;
}

function neighborPostHref(postId: number, queueHash: string): string {
  return `${SEARCH_PATH}?${POST_VIEW_QUERY}&${SEARCH_PARAM_ID}=${String(postId)}${queueHash}`;
}

function hrefAt(
  order: readonly number[],
  index: number,
  queueHash: string,
): string | null {
  if (index < 0 || index >= order.length) {
    return null;
  }
  const postId = order[index];
  if (postId === undefined) {
    return null;
  }
  return neighborPostHref(postId, queueHash);
}

function readQueue(postId: number | null, hash: string): QueueView | null {
  if (postId === null) {
    return null;
  }
  const collectionId = readCollectionQueueId(hash);
  if (collectionId === null) {
    return null;
  }
  const order = getCollectionOrder(collectionId);
  if (order === null) {
    return null;
  }
  const index = indexOfPost(order, postId);
  if (index === INDEX_NOT_FOUND) {
    return null;
  }
  const name = collectionName(collectionId);
  if (name === null) {
    return null;
  }
  const position = index + POSITION_BASE;
  return {
    name,
    collectionHref: `${RDW_HASH_COLLECTIONS}/${collectionId}`,
    positionLabel: `${String(position)}${POSITION_SEPARATOR}${String(order.length)}`,
    previousHref: hrefAt(order, index - 1, hash),
    nextHref: hrefAt(order, index + 1, hash),
  };
}

function QueueStep(props: {
  readonly label: string;
  readonly glyph: string;
  readonly href: string | null;
}): JSX.Element {
  const className = `${CLASS_NAV} ${CLASS_FOCUSABLE}`;
  if (props.href === null) {
    return (
      <button type="button" className={className} disabled aria-label={props.label}>
        {props.glyph}
      </button>
    );
  }
  return (
    <a className={className} href={props.href} aria-label={props.label}>
      {props.glyph}
    </a>
  );
}

function isPlainPrimaryClick(event: MouseEvent): boolean {
  return (
    event.button === MOUSE_BUTTON_PRIMARY &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

type SiteStep = {
  readonly selector: string;
  readonly href: string | null;
};

function clickedSiteStep(
  event: MouseEvent,
  steps: readonly SiteStep[],
): SiteStep | null {
  const target = event.target;
  if (!(target instanceof Element)) {
    return null;
  }
  for (const step of steps) {
    if (target.closest(step.selector) !== null) {
      return step;
    }
  }
  return null;
}

/**
 * While a post is open from a collection, the site's own "< previous / next >"
 * links step through the collection instead of the last search. The click is
 * taken in the capture phase so the site handler never runs; at either end of
 * the collection the click does nothing. The links themselves are not changed.
 */
function useSiteStepLinks(
  previousHref: string | null,
  nextHref: string | null,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const steps: readonly SiteStep[] = [
      { selector: SITE_SELECTORS.postPrevSearchLink, href: previousHref },
      { selector: SITE_SELECTORS.postNextSearchLink, href: nextHref },
    ];
    const onClick = (event: MouseEvent): void => {
      if (!isPlainPrimaryClick(event)) {
        return;
      }
      const step = clickedSiteStep(event, steps);
      if (step === null) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (step.href !== null) {
        window.location.assign(step.href);
      }
    };
    document.addEventListener(EVENT_CLICK, onClick, true);
    return (): void => {
      document.removeEventListener(EVENT_CLICK, onClick, true);
    };
  }, [previousHref, nextHref, active]);
}

export function CollectionQueue(props: CollectionQueueProps): JSX.Element | null {
  const [hash, setHash] = useState(readLocationHash);

  useEffect(() => {
    const onHashChange = (): void => {
      setHash(readLocationHash());
    };
    window.addEventListener(EVENT_HASHCHANGE, onHashChange);
    return (): void => {
      window.removeEventListener(EVENT_HASHCHANGE, onHashChange);
    };
  }, []);

  const queue = readQueue(props.postId, hash);
  useSiteStepLinks(
    queue === null ? null : queue.previousHref,
    queue === null ? null : queue.nextHref,
    queue !== null,
  );
  if (queue === null) {
    return null;
  }

  return (
    <nav className={CLASS_STRIP} aria-label={ARIA_QUEUE}>
      <style>{QUEUE_CSS}</style>
      <a className={`${CLASS_NAME} ${CLASS_FOCUSABLE}`} href={queue.collectionHref}>
        {queue.name}
      </a>
      <span className={CLASS_POSITION}>{queue.positionLabel}</span>
      <QueueStep label={LABEL_PREVIOUS} glyph={GLYPH_PREVIOUS} href={queue.previousHref} />
      <QueueStep label={LABEL_NEXT} glyph={GLYPH_NEXT} href={queue.nextHref} />
    </nav>
  );
}
