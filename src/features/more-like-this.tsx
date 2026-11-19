import type { JSX } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

import {
  RelatedError,
  MIX_RETRY_PAUSE_MS,
  SOURCE_KEY_FAVORITES,
  mixOrder,
  mixPageOffset,
  mixQuery,
  mixSize,
  mixTags,
  relatedPostUrl,
  relatedQuery,
  relatedSearchUrl,
  relatedSources,
  type PostTag,
  type RankedPost,
  type RelatedFailure,
  type RelatedSource,
  type RelatedSourceKind,
} from "../site/related";
import { Popover, Segmented } from "../ui/kit";
import { POST_ACTIONS_ID, featureBodyClass, type Feature } from "./types";

/**
 * "More like this", the third tab of the post panel (the designer,
 * 19.11.2026; the place, the words and the states are hers). It was first a
 * block under the picture with a row of names to pick from: Kaze found what
 * to press only by pressing, and saw no reason for it to be under the
 * picture. Opening the tab is the action that asks the site: the first
 * source is loaded at once, one page of a search, put in order by the tags
 * shared with the post. The sources are a switch over the grid. What was
 * loaded stays until the page is left; the favorites ask the site for nothing.
 *
 * The tab is drawn by the panel (post-panel.tsx); this is what is in it, its
 * styles and its switch in the settings.
 */

export const MORE_LIKE_THIS_FEATURE_ID = "more-like-this";
const FEATURE_LABEL = "Related posts tab";
const FEATURE_CAPTION = "Loads posts when you open the tab: one request per source.";
/** Under featureState: the kind of the source picked last. */
export const MORE_LIKE_THIS_STATE_ID = "more-like-this-source";

/** Kaze's name for it (19.11.2026); the designer's was "More like this". */
export const MORE_LIKE_THIS_TAB_LABEL = "Related posts";
const NONE_IN_FAVORITES = "None of your favorites share tags with this post.";
const OFFLINE_TEXT = "Couldn't load: no connection.";
const LIMITED_TEXT = "The site asked to slow down. Try again in a minute.";
const FAILED_TEXT = "Couldn't load: the site did not answer as expected.";
const RETRY_LABEL = "Try again";
const SOURCES_LABEL = "Where the posts come from";
const MIXED_FROM = "Mixed from: ";
const ANOTHER_MIX_LABEL = "\u21bb Another mix";
const ANOTHER_MIX_TITLE = "Other posts by these or other rare tags of this post";
const SEARCH_TAGS_LABEL = "Search these tags";
const FAVORITES_SHORT = "Favorites";
const VIDEO_MARK = "▶";
const ARROW = "→";
const ELLIPSIS = "…";

/** How many are shown before "Show all": three rows of two. */
export const FIRST_SHOWN = 6;
/** A post with fewer tags than this cannot be matched well, and the tab says so. */
const FEW_TAGS = 10;
/** How long "Try again" waits after the site asked to slow down. */
export const LIMITED_WAIT_S = 60;
const SECOND_MS = 1000;
const CELL_HEIGHT_PX = 150;
/**
 * A source in the switch. The kit's switch is one row as tall as a field;
 * with long names of tags it takes a second row, which stood behind the
 * grid (Kaze, 19.11.2026): here the switch is as tall as its rows.
 */
const SOURCE_BUTTON_HEIGHT_PX = 24;
/**
 * The switch is one row, or two with the sources shared evenly between them;
 * only what does not fit two rows is behind "N more" (the designer,
 * 19.11.2026). Every row is as wide as the frame.
 */
const SWITCH_GAP_PX = 2;
const SWITCH_PADDING_PX = 2;
/** The longest first row the styles know how to break after. */
const ROW_ONE_MAX = 8;
const SWITCH_CLASS = "rdw-mlt-switch";
const MEASURE_CLASS = "rdw-mlt-measure";
const ROW_ONE_ATTR = "data-row-one";
/** The value of the "+N" option: it opens the list of the rest, it is not a source. */
const MORE_VALUE = "\u0000more";
const MORE_MENU_LABEL = "More sources";
const MORE_MENU_WIDTH_PX = 240;
const CHEVRON = "\u25be";

const BODY_SELECTOR = `body.${featureBodyClass(MORE_LIKE_THIS_FEATURE_ID)}`;
const ROOT_CLASS = "rdw-mlt";
const ROOT = `${BODY_SELECTOR} #${POST_ACTIONS_ID} .${ROOT_CLASS}`;

/*
 * The first row of a switch of two rows: its buttons keep their place, the
 * rest go after an unseen line as wide as the frame, which breaks the row.
 */
const ROW_ONE_RULES = Array.from(
  { length: ROW_ONE_MAX },
  (_unused, index) =>
    `${ROOT} .${SWITCH_CLASS}[${ROW_ONE_ATTR}="${String(index + 1)}"] .rdw-mlt-sources .rdw-seg__btn:nth-child(-n+${String(index + 1)}) {
  order: 0;
}`,
).join("\n");

const FEATURE_CSS = `
${ROOT} {
  display: grid;
  gap: 10px;
  min-width: 0;
}
${ROOT} .${SWITCH_CLASS} {
  position: relative;
}
${ROOT} .rdw-mlt-sources {
  display: flex;
  flex-wrap: wrap;
  gap: ${String(SWITCH_GAP_PX)}px;
  width: 100%;
  height: auto;
}
${ROOT} .rdw-mlt-sources .rdw-seg__btn {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  height: ${String(SOURCE_BUTTON_HEIGHT_PX)}px;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${ROOT} .${SWITCH_CLASS}[${ROW_ONE_ATTR}] .rdw-mlt-sources::after {
  content: "";
  order: 1;
  flex: 0 0 100%;
  height: 0;
  margin-top: -${String(SWITCH_GAP_PX)}px;
}
${ROOT} .${SWITCH_CLASS}[${ROW_ONE_ATTR}] .rdw-mlt-sources .rdw-seg__btn {
  order: 2;
}
${ROW_ONE_RULES}
${ROOT} .${MEASURE_CLASS} {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
  white-space: nowrap;
}
${ROOT} .${MEASURE_CLASS} .rdw-seg__btn {
  display: block;
  flex: none;
  height: auto;
  font-weight: 600;
}
${BODY_SELECTOR} .rdw-mlt-menu {
  padding: 4px;
  gap: 0;
}
${BODY_SELECTOR} .rdw-mlt-menu button {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 28px;
  padding: 0 8px;
  overflow: hidden;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
${BODY_SELECTOR} .rdw-mlt-menu button:hover {
  background: var(--rdw-surface-2);
}
${ROOT} .rdw-mlt-mix {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
${ROOT} .rdw-mlt-mix .rdw-mlt-link {
  flex: none;
}
${ROOT} .rdw-mlt-line {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
${ROOT} .rdw-mlt-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--rdw-accent);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
}
${ROOT} .rdw-mlt-link:hover:not(:disabled) {
  text-decoration: underline;
}
${ROOT} .rdw-mlt-link:disabled {
  color: var(--rdw-muted);
  cursor: default;
}
${ROOT} .rdw-mlt-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
${ROOT} .rdw-mlt-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${String(CELL_HEIGHT_PX)}px;
  overflow: hidden;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface-2);
}
${ROOT} .rdw-mlt-cell img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
${ROOT} .rdw-mlt-video {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font-size: 10px;
  line-height: 1.4;
}
${ROOT} .rdw-mlt-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
@media (prefers-reduced-motion: no-preference) {
  ${ROOT} .rdw-mlt-cell[data-waiting] {
    animation: rdw-mlt-wait 1.2s ease-in-out infinite alternate;
  }
}
@keyframes rdw-mlt-wait {
  from { opacity: 0.45; }
  to { opacity: 1; }
}
`.trim();

type Loaded =
  | { readonly state: "loading" }
  | {
      readonly state: "ready";
      readonly posts: readonly RankedPost[];
      /** The search that gave them: where "Search … →" leads. */
      readonly query: string;
      /** The tags the mix was made from; empty for a source that is no mix. */
      readonly mixed: readonly string[];
    }
  | { readonly state: "error"; readonly failure: RelatedFailure; readonly at: number };

export function isRelatedSourceKind(value: unknown): value is RelatedSourceKind {
  return (
    value === "similar" || value === "character" || value === "copyright" || value === "favorites"
  );
}

function loadingText(source: RelatedSource): string {
  if (source.kind === "similar") {
    return `Mixing similar posts${ELLIPSIS}`;
  }
  if (source.kind === "favorites") {
    return `Looking through your favorites${ELLIPSIS}`;
  }
  return `Loading posts with ${source.name}${ELLIPSIS}`;
}

function emptyText(source: RelatedSource): string {
  if (source.kind === "favorites") {
    return NONE_IN_FAVORITES;
  }
  if (source.kind === "similar") {
    return "No posts by other artists with these tags.";
  }
  return `No posts with ${source.name} by other artists.`;
}

function errorText(failure: RelatedFailure): string {
  return failure === "offline" ? OFFLINE_TEXT : failure === "limited" ? LIMITED_TEXT : FAILED_TEXT;
}

/** "12 shared tags", "1 shared tag". */
export function sharedTagsText(shared: number): string {
  return `${String(shared)} shared ${shared === 1 ? "tag" : "tags"}`;
}

/** "Few shared tags — this post has only 6 tags." */
export function fewTagsText(count: number): string {
  return `Few shared tags \u2014 this post has only ${String(count)} ${count === 1 ? "tag" : "tags"}.`;
}

/** "Mixed from: fairy, interspecies, size difference" */
export function mixedFromText(tags: readonly string[]): string {
  return `${MIXED_FROM}${tags.map((tag) => tag.replaceAll("_", " ")).join(", ")}`;
}

export type SwitchLayout = {
  /** How many of the sources by tag have a button; the rest are behind "N more". */
  readonly shown: number;
  /** How many buttons stand in the first row; all of them when there is one row. */
  readonly rowOne: number;
};

function fitsRow(widths: readonly number[], room: number, gap: number): boolean {
  return widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1) <= room;
}

/**
 * How the switch is laid out in a frame with this much room. One row when
 * all fit. Else two rows with the buttons shared evenly, three and two of
 * five, never one alone in the second. Only when that does not fit either
 * do sources go behind "N more", from the last, until it does.
 */
export function layoutSwitch(
  tagWidths: readonly number[],
  moreWidth: number,
  favoritesWidth: number | null,
  room: number,
  gap: number,
): SwitchLayout {
  const total = tagWidths.length;
  const tail = favoritesWidth === null ? [] : [favoritesWidth];
  const buttons = (shown: number): number[] => [
    ...tagWidths.slice(0, shown),
    ...(shown < total ? [moreWidth] : []),
    ...tail,
  ];
  if (room <= 0) {
    // Not laid out yet: nothing to count by.
    return { shown: total, rowOne: total + tail.length };
  }
  for (let shown = total; shown >= 1; shown -= 1) {
    const widths = buttons(shown);
    if (fitsRow(widths, room, gap)) {
      return { shown, rowOne: widths.length };
    }
    const half = Math.ceil(widths.length / 2);
    if (
      widths.length > 1 &&
      fitsRow(widths.slice(0, half), room, gap) &&
      fitsRow(widths.slice(half), room, gap)
    ) {
      return { shown, rowOne: half };
    }
  }
  const least = buttons(Math.min(1, total));
  return { shown: Math.min(1, total), rowOne: Math.ceil(least.length / 2) };
}

/** "2 more ▾": the sources that have no button of their own. */
function moreLabel(count: number): string {
  return `${String(count)} more ${CHEVRON}`;
}

/**
 * The sources by tag that have a place in the switch when only `fit` of them
 * do: the first ones, and the picked one always among them, in the last place.
 */
export function shownTagSources(
  tagSources: readonly RelatedSource[],
  fit: number | null,
  picked: string | null,
): RelatedSource[] {
  if (fit === null || fit >= tagSources.length) {
    return [...tagSources];
  }
  const shown = tagSources.slice(0, Math.max(1, fit));
  const chosen = tagSources.find((source) => source.key === picked);
  if (chosen !== undefined && !shown.includes(chosen)) {
    shown[shown.length - 1] = chosen;
  }
  return shown;
}

/**
 * The source the tab opens on: the one of the kind picked last, where the
 * post has such; else the first, which is "Similar" where the post has tags
 * to mix from. Never the favorites: whether any of them is like the post is
 * not known yet when the tab opens, and with none there is no such source.
 */
export function firstSource(
  sources: readonly RelatedSource[],
  lastKind: RelatedSourceKind | null,
): RelatedSource | null {
  const byTag = sources.filter((source) => source.kind !== "favorites");
  return byTag.find((source) => source.kind === lastKind) ?? byTag[0] ?? null;
}

export type MoreLikeThisProps = {
  readonly tags: readonly PostTag[];
  /** The kind of the source picked on an earlier post. */
  readonly lastKind: RelatedSourceKind | null;
  readonly onPick: (kind: RelatedSourceKind) => void;
  /** The favorites like this post, from the browser; null where there is no index. */
  readonly readFavorites: (() => Promise<RankedPost[]>) | null;
  /** One page of a search, from this offset, ranked by the tags shared with the post. */
  readonly load: (query: string, offset: number) => Promise<RankedPost[]>;
  /** The clock, for the wait after "slow down". */
  readonly now?: () => number;
  /** Chance, for the page and the order of a mix; the tests pass their own. */
  readonly random?: () => number;
  /** The pause before the first page is asked for; the tests pass one that does not wait. */
  readonly pause?: () => Promise<void>;
};

function waitBeforeRetry(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MIX_RETRY_PAUSE_MS);
  });
}

/** What is in the tab. It is mounted when the tab is first opened, and that opening loads the first source. */
export function MoreLikeThis(props: MoreLikeThisProps): JSX.Element {
  const sources = relatedSources(props.tags);
  const [picked, setPicked] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Readonly<Record<string, Loaded>>>({});
  const [favorites, setFavorites] = useState<readonly RankedPost[] | null>(null);
  const [showAll, setShowAll] = useState<readonly string[]>([]);
  const [, tick] = useState(0);
  // How the switch is laid out; null until it was measured.
  const [layout, setLayout] = useState<SwitchLayout | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const switchRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const now = props.now ?? Date.now;
  const random = props.random ?? Math.random;
  const { readFavorites } = props;

  const fail = (key: string, error: unknown): void => {
    const failure = error instanceof RelatedError ? error.failure : "failed";
    setLoaded((all) => ({ ...all, [key]: { state: "error", failure, at: now() } }));
  };

  /**
   * A mix of "Similar": one search for any of some rare tags of the post,
   * from a page taken by chance. When that page has nothing (the search is
   * shorter than its most common tag promised), the first page is asked for.
   */
  const mix = (source: RelatedSource, first: boolean): void => {
    const tags = mixTags(source.tags, first, random);
    const query = mixQuery(tags, source.without);
    const offset = mixPageOffset(mixSize(props.tags, tags), random);
    setLoaded((all) => ({ ...all, [source.key]: { state: "loading" } }));
    setShowAll((keys) => keys.filter((key) => key !== source.key));
    const ask = async (): Promise<RankedPost[]> => {
      const posts = await props.load(query, offset);
      if (posts.length > 0 || offset === 0) {
        return posts;
      }
      await (props.pause ?? waitBeforeRetry)();
      return props.load(query, 0);
    };
    ask()
      .then((posts) => {
        setLoaded((all) => ({
          ...all,
          [source.key]: { state: "ready", posts: mixOrder(posts, tags, random), query, mixed: tags },
        }));
      })
      .catch((error: unknown) => {
        fail(source.key, error);
      });
  };

  const open = (source: RelatedSource, remember: boolean): void => {
    setPicked(source.key);
    if (remember) {
      props.onPick(source.kind);
    }
    const have = loaded[source.key];
    if (source.kind === "favorites" || (have !== undefined && have.state !== "error")) {
      return;
    }
    if (source.kind === "similar") {
      mix(source, true);
      return;
    }
    const query = relatedQuery(source.tags, source.without);
    setLoaded((all) => ({ ...all, [source.key]: { state: "loading" } }));
    props
      .load(query, 0)
      .then((posts) => {
        setLoaded((all) => ({
          ...all,
          [source.key]: { state: "ready", posts, query, mixed: [] },
        }));
      })
      .catch((error: unknown) => {
        fail(source.key, error);
      });
  };

  // Opening the tab is the user's action: the first source is asked for at once.
  useEffect(() => {
    const first = firstSource(sources, props.lastKind);
    if (first !== null) {
      open(first, false);
    }
    // Once, when the tab is opened.
  }, []);

  // The favorites like the post are read from the browser, with no request.
  useEffect(() => {
    if (readFavorites === null) {
      setFavorites([]);
      return;
    }
    let alive = true;
    readFavorites()
      .then((posts) => {
        if (alive) {
          setFavorites(posts);
        }
      })
      .catch(() => {
        if (alive) {
          setFavorites([]);
        }
      });
    return () => {
      alive = false;
    };
  }, [readFavorites]);

  const pickedSource = sources.find((source) => source.key === picked);
  const current: Loaded | undefined =
    pickedSource === undefined
      ? undefined
      : pickedSource.kind === "favorites"
        ? favorites === null
          ? { state: "loading" }
          : { state: "ready", posts: favorites, query: "", mixed: [] }
        : loaded[pickedSource.key];

  const waitLeft =
    current?.state === "error" && current.failure === "limited"
      ? Math.max(0, LIMITED_WAIT_S - Math.floor((now() - current.at) / SECOND_MS))
      : 0;
  const waiting = waitLeft > 0;
  // The seconds left are counted down in the button.
  useEffect(() => {
    if (!waiting) {
      return;
    }
    const timer = window.setInterval(() => {
      tick((value) => value + 1);
    }, SECOND_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [waiting]);

  const busy = Object.values(loaded).some((entry) => entry.state === "loading");

  // The names of the tags stand as they are, with no number; the favorites
  // are counted, and stand last.
  const tagSources = sources.filter((source) => source.kind !== "favorites");
  const favoritesSource = sources.find((source) => source.kind === "favorites");
  const shownTags = shownTagSources(tagSources, layout?.shown ?? null, picked);
  const hiddenTags = tagSources.filter((source) => !shownTags.includes(source));
  const options = [
    ...shownTags.map((source) => ({ value: source.key, label: source.name })),
    ...(hiddenTags.length > 0
      ? [{ value: MORE_VALUE, label: moreLabel(hiddenTags.length) }]
      : []),
    // The favorites are a source only when some of them are like the post
    // (Kaze, 19.11.2026): "Favorites 0" was a button that led to nothing.
    ...(favoritesSource === undefined || favorites === null || favorites.length === 0
      ? []
      : [
          {
            value: favoritesSource.key,
            label: `${FAVORITES_SHORT} ${String(favorites.length)}`,
          },
        ]),
  ];
  const favoritesLabel =
    favoritesSource === undefined || favorites === null || favorites.length === 0
      ? null
      : `${FAVORITES_SHORT} ${String(favorites.length)}`;
  // After each drawing the switch is laid out by the widths its buttons have
  // in an unseen copy, so that what is measured does not depend on how it
  // stands now.
  useLayoutEffect(() => {
    const frame = switchRef.current?.querySelector(".rdw-mlt-sources");
    const measure = measureRef.current;
    if (!(frame instanceof HTMLElement) || measure === null) {
      return;
    }
    const widthOf = (selector: string): number[] =>
      [...measure.querySelectorAll(selector)].map((node) =>
        node instanceof HTMLElement ? node.offsetWidth : 0,
      );
    const next = layoutSwitch(
      widthOf("[data-measure-tag]"),
      widthOf("[data-measure-more]")[0] ?? 0,
      widthOf("[data-measure-favorites]")[0] ?? null,
      frame.clientWidth - SWITCH_PADDING_PX * 2,
      SWITCH_GAP_PX,
    );
    setLayout((current) =>
      current !== null && current.shown === next.shown && current.rowOne === next.rowOne
        ? current
        : next,
    );
  });
  const twoRows = layout !== null && layout.rowOne < options.length;

  const all = pickedSource !== undefined && showAll.includes(pickedSource.key);
  const posts = current?.state === "ready" ? current.posts : [];
  const visible = all ? posts : posts.slice(0, FIRST_SHOWN);

  return (
    <div className={ROOT_CLASS}>
      <div
        ref={switchRef}
        className={SWITCH_CLASS}
        {...(twoRows ? { [ROW_ONE_ATTR]: String(layout.rowOne) } : {})}
      >
        <div className={MEASURE_CLASS} ref={measureRef} aria-hidden="true">
          {tagSources.map((source) => (
            <span key={source.key} className="rdw-seg__btn" data-measure-tag="">
              {source.name}
            </span>
          ))}
          <span className="rdw-seg__btn" data-measure-more="">
            {moreLabel(tagSources.length)}
          </span>
          {favoritesLabel === null ? null : (
            <span className="rdw-seg__btn" data-measure-favorites="">
              {favoritesLabel}
            </span>
          )}
        </div>
        <Segmented
          className="rdw-mlt-sources"
          label={SOURCES_LABEL}
          options={options}
          value={picked ?? ""}
          // One request at a time.
          disabled={busy}
          onChange={(key) => {
            if (key === MORE_VALUE) {
              setMoreOpen((value) => !value);
              return;
            }
            const source = sources.find((entry) => entry.key === key);
            if (source !== undefined) {
              open(source, true);
            }
          }}
        />
        <Popover
          open={moreOpen}
          onClose={() => {
            setMoreOpen(false);
          }}
          anchorRef={switchRef}
          widthPx={MORE_MENU_WIDTH_PX}
          role="menu"
          aria-label={MORE_MENU_LABEL}
          className="rdw-mlt-menu"
        >
          {hiddenTags.map((source) => (
            <button
              key={source.key}
              type="button"
              role="menuitem"
              className="rdw-kit-focusable"
              onClick={() => {
                setMoreOpen(false);
                open(source, true);
              }}
            >
              {source.name}
            </button>
          ))}
        </Popover>
      </div>
      {pickedSource?.kind === "similar" && current?.state === "ready" ? (
        // What the mix is made from, said and not to be pressed; and a way to another.
        <div className="rdw-mlt-mix">
          <p className="rdw-mlt-line">{mixedFromText(current.mixed)}</p>
          <button
            type="button"
            className="rdw-mlt-link"
            title={ANOTHER_MIX_TITLE}
            disabled={busy}
            onClick={() => {
              mix(pickedSource, false);
            }}
          >
            {ANOTHER_MIX_LABEL}
          </button>
        </div>
      ) : null}
      {pickedSource === undefined || current === undefined ? null : current.state === "loading" ? (
        <>
          <p className="rdw-mlt-line" role="status">
            {loadingText(pickedSource)}
          </p>
          <div className="rdw-mlt-grid" aria-hidden="true">
            {Array.from({ length: FIRST_SHOWN }, (_unused, index) => (
              <span key={index} className="rdw-mlt-cell" data-waiting="" />
            ))}
          </div>
        </>
      ) : current.state === "error" ? (
        <p className="rdw-mlt-line" role="alert">
          {errorText(current.failure)}{" "}
          <button
            type="button"
            className="rdw-mlt-link"
            disabled={waiting}
            onClick={() => {
              open(pickedSource, false);
            }}
          >
            {waiting ? `${RETRY_LABEL} (${String(waitLeft)})` : RETRY_LABEL}
          </button>
        </p>
      ) : posts.length === 0 ? (
        <p className="rdw-mlt-line" role="status">
          {emptyText(pickedSource)}
        </p>
      ) : (
        <>
          {props.tags.length < FEW_TAGS ? (
            <p className="rdw-mlt-line">{fewTagsText(props.tags.length)}</p>
          ) : null}
          <div className="rdw-mlt-grid" ref={gridRef}>
            {visible.map((post) => (
              <a
                key={post.id}
                className="rdw-mlt-cell"
                href={relatedPostUrl(post.id)}
                title={sharedTagsText(post.shared)}
              >
                <img
                  src={post.thumb}
                  alt={`${pickedSource.name} #${String(post.id)}`}
                  loading="lazy"
                />
                {post.video ? (
                  <span className="rdw-mlt-video" aria-hidden="true">
                    {VIDEO_MARK}
                  </span>
                ) : null}
              </a>
            ))}
          </div>
          <div className="rdw-mlt-foot">
            {!all && posts.length > FIRST_SHOWN ? (
              <button
                type="button"
                className="rdw-mlt-link"
                onClick={() => {
                  setShowAll((keys) => [...keys, pickedSource.key]);
                  // The focus goes to the first of those that came into view.
                  window.setTimeout(() => {
                    const first = gridRef.current?.querySelectorAll("a")[FIRST_SHOWN];
                    if (first instanceof HTMLElement) {
                      first.focus();
                    }
                  }, 0);
                }}
              >
                {`Show all ${String(posts.length)}`}
              </button>
            ) : (
              <span />
            )}
            {pickedSource.kind === "favorites" ? null : (
              // The same search as gave the list, in the usual place for a search.
              <a className="rdw-mlt-link" href={relatedSearchUrl(current.query)}>
                {`${pickedSource.kind === "similar" ? SEARCH_TAGS_LABEL : `Search ${pickedSource.name}`} ${ARROW}`}
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export const moreLikeThisFeature: Feature = {
  id: MORE_LIKE_THIS_FEATURE_ID,
  label: FEATURE_LABEL,
  pages: ["post"],
  defaultEnabled: true,
  settingsCaption: FEATURE_CAPTION,
  css: FEATURE_CSS,
  // The tab is a part of the post panel, which draws it; nothing to mount here.
  mount: () => undefined,
};

export { SOURCE_KEY_FAVORITES };
