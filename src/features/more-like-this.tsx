import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import {
  RelatedError,
  SOURCE_KEY_FAVORITES,
  relatedPostUrl,
  relatedSearchUrl,
  relatedSources,
  type PostTag,
  type RankedPost,
  type RelatedFailure,
  type RelatedSource,
  type RelatedSourceKind,
} from "../site/related";
import { Segmented } from "../ui/kit";
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
const FEATURE_LABEL = "More like this tab";
const FEATURE_CAPTION = "Loads posts when you open the tab: one request per source.";
/** Under featureState: the kind of the source picked last. */
export const MORE_LIKE_THIS_STATE_ID = "more-like-this-source";

export const MORE_LIKE_THIS_TAB_LABEL = "More like this";
const NONE_IN_FAVORITES = "None of your favorites share tags with this post.";
const OFFLINE_TEXT = "Couldn't load: no connection.";
const LIMITED_TEXT = "The site asked to slow down. Try again in a minute.";
const FAILED_TEXT = "Couldn't load: the site did not answer as expected.";
const RETRY_LABEL = "Try again";
const SOURCES_LABEL = "Where the posts come from";
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

const BODY_SELECTOR = `body.${featureBodyClass(MORE_LIKE_THIS_FEATURE_ID)}`;
const ROOT_CLASS = "rdw-mlt";
const ROOT = `${BODY_SELECTOR} #${POST_ACTIONS_ID} .${ROOT_CLASS}`;

const FEATURE_CSS = `
${ROOT} {
  display: grid;
  gap: 10px;
  min-width: 0;
}
${ROOT} .rdw-mlt-sources {
  display: flex;
  flex-wrap: wrap;
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
  text-overflow: ellipsis;
  white-space: nowrap;
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
  | { readonly state: "ready"; readonly posts: readonly RankedPost[] }
  | { readonly state: "error"; readonly failure: RelatedFailure; readonly at: number };

export function isRelatedSourceKind(value: unknown): value is RelatedSourceKind {
  return value === "artist" || value === "character" || value === "shared" || value === "favorites";
}

function tagsText(source: RelatedSource): string {
  return source.tags.join(", ").replaceAll("_", " ");
}

function loadingText(source: RelatedSource): string {
  if (source.kind === "artist") {
    return `Loading posts by ${source.name}${ELLIPSIS}`;
  }
  if (source.kind === "favorites") {
    return `Looking through your favorites${ELLIPSIS}`;
  }
  return `Loading posts with ${tagsText(source)}${ELLIPSIS}`;
}

function emptyText(source: RelatedSource): string {
  if (source.kind === "favorites") {
    return NONE_IN_FAVORITES;
  }
  if (source.kind === "artist") {
    return `No other posts by ${source.name}.`;
  }
  return `No other posts with ${tagsText(source)}.`;
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
  return `Few shared tags — this post has only ${String(count)} ${count === 1 ? "tag" : "tags"}.`;
}

/**
 * The source the tab opens on: the one of the kind picked last, where the
 * post has such; else the first, which is an artist, a character, or the
 * shared tags.
 */
export function firstSource(
  sources: readonly RelatedSource[],
  lastKind: RelatedSourceKind | null,
): RelatedSource | null {
  return sources.find((source) => source.kind === lastKind) ?? sources[0] ?? null;
}

export type MoreLikeThisProps = {
  readonly tags: readonly PostTag[];
  /** The kind of the source picked on an earlier post. */
  readonly lastKind: RelatedSourceKind | null;
  readonly onPick: (kind: RelatedSourceKind) => void;
  /** The favorites like this post, from the browser; null where there is no index. */
  readonly readFavorites: (() => Promise<RankedPost[]>) | null;
  readonly load: (query: string) => Promise<RankedPost[]>;
  /** The clock, for the wait after "slow down". */
  readonly now?: () => number;
};

/** What is in the tab. It is mounted when the tab is first opened, and that opening loads the first source. */
export function MoreLikeThis(props: MoreLikeThisProps): JSX.Element {
  const sources = relatedSources(props.tags);
  const [picked, setPicked] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Readonly<Record<string, Loaded>>>({});
  const [favorites, setFavorites] = useState<readonly RankedPost[] | null>(null);
  const [showAll, setShowAll] = useState<readonly string[]>([]);
  const [, tick] = useState(0);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const now = props.now ?? Date.now;
  const { readFavorites } = props;

  const open = (source: RelatedSource, remember: boolean): void => {
    setPicked(source.key);
    if (remember) {
      props.onPick(source.kind);
    }
    const have = loaded[source.key];
    if (source.kind === "favorites" || (have !== undefined && have.state !== "error")) {
      return;
    }
    setLoaded((all) => ({ ...all, [source.key]: { state: "loading" } }));
    props
      .load(source.query)
      .then((posts) => {
        setLoaded((all) => ({ ...all, [source.key]: { state: "ready", posts } }));
      })
      .catch((error: unknown) => {
        const failure = error instanceof RelatedError ? error.failure : "failed";
        setLoaded((all) => ({ ...all, [source.key]: { state: "error", failure, at: now() } }));
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
          : { state: "ready", posts: favorites }
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
  const countOf = (source: RelatedSource): number | null => {
    if (source.kind === "favorites") {
      return favorites === null ? null : favorites.length;
    }
    const state = loaded[source.key];
    return state?.state === "ready" ? state.posts.length : null;
  };
  const options = sources.map((source) => {
    const count = countOf(source);
    const name = source.kind === "favorites" ? FAVORITES_SHORT : source.name;
    return { value: source.key, label: count === null ? name : `${name} ${String(count)}` };
  });

  const all = pickedSource !== undefined && showAll.includes(pickedSource.key);
  const posts = current?.state === "ready" ? current.posts : [];
  const visible = all ? posts : posts.slice(0, FIRST_SHOWN);

  return (
    <div className={ROOT_CLASS}>
      <Segmented
        className="rdw-mlt-sources"
        label={SOURCES_LABEL}
        options={options}
        value={picked ?? ""}
        // One request at a time.
        disabled={busy}
        onChange={(key) => {
          const source = sources.find((entry) => entry.key === key);
          if (source !== undefined) {
            open(source, true);
          }
        }}
      />
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
              <a className="rdw-mlt-link" href={relatedSearchUrl(pickedSource.query)}>
                {`Search ${pickedSource.kind === "shared" ? pickedSource.tags.join(" ") : pickedSource.name} ${ARROW}`}
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
