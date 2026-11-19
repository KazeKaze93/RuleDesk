import type { JSX } from "preact";
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { readPostIdFromSearch } from "../site/pages";
import {
  RelatedError,
  favoriteCandidates,
  fetchCandidates,
  rankCandidates,
  readPostTags,
  relatedPostUrl,
  relatedSearchUrl,
  relatedSources,
  type PostTag,
  type RankedPost,
  type RelatedFailure,
  type RelatedSource,
  type RelatedSourceKind,
} from "../site/related";
import { favoritesIndexAvailable, readFavoriteIndex } from "../storage/favorites-index";
import { findFlexi, findMediaWrapper, IMAGE_ID } from "./post-panel/site-reads";
import { POST_ACTIONS_ID, featureBodyClass, type Feature, type FeatureContext } from "./types";

/**
 * "More like this" under the picture of a post (the designer, 19.11.2026; the
 * place, the words and the states are hers). A row of sources, the artists
 * and the characters of the post by name and "In your favorites"; nothing is
 * loaded until one is picked, and a picked one is one page of a search, put
 * in order by the tags shared with the post. What was loaded stays until the
 * page is left. The count of the favorites is read from the browser and asks
 * the site for nothing.
 */

const FEATURE_ID = "more-like-this";
const FEATURE_LABEL = "More like this";
const FEATURE_CAPTION =
  "Under the picture. Loads posts only when you pick a source: one request per source.";

export const MORE_LIKE_THIS_ID = "rdw-more-like-this";
/** Under featureState: the kind of the source picked last. */
export const MORE_LIKE_THIS_STATE_ID = "more-like-this-source";

const TITLE = "More like this";
const IDLE_HINT = "Pick a source to load up to 42 posts, most similar first.";
const NONE_IN_FAVORITES = "None of your favorites share tags with this post.";
const OFFLINE_TEXT = "Couldn't load: no connection.";
const LIMITED_TEXT = "The site asked to slow down. Try again in a minute.";
const FAILED_TEXT = "Couldn't load: the site did not answer as expected.";
const RETRY_LABEL = "Try again";
const MORE_LABEL = "More";
const SOURCES_LABEL = "Sources of posts like this one";
const KIND_HINT: Readonly<Record<RelatedSourceKind, string>> = {
  artist: "Artist",
  character: "Character",
  shared: "Posts with the rarest tags of this post",
  favorites: "Your favorites that share tags with this post",
};
const VIDEO_MARK = "▶";
const ARROW = "→";
const ELLIPSIS = "…";

/** How many are shown before "Show all". */
export const FIRST_SHOWN = 8;
/** How many sources stand in the row by name; the rest are behind "More". */
const NAMED_SOURCES = 3;
/** A post with fewer tags than this cannot be matched well, and the block says so. */
const FEW_TAGS = 10;
/** How long "Try again" waits after the site asked to slow down. */
export const LIMITED_WAIT_S = 60;
const SECOND_MS = 1000;
const CELL_MIN_PX = 180;
const CELL_HEIGHT_PX = 150;
const SKELETON_CELLS = FIRST_SHOWN;
const KEY_PREVIOUS = "ArrowLeft";
const KEY_NEXT = "ArrowRight";
const TAB_SELECTOR = '[role="tab"]:not(:disabled)';

const BODY_SELECTOR = `body.${featureBodyClass(FEATURE_ID)}`;
const BLOCK = `${BODY_SELECTOR} #${MORE_LIKE_THIS_ID}`;

const FEATURE_CSS = `
${BLOCK} {
  box-sizing: border-box;
  width: 0;
  min-width: 100%;
  margin: 12px 0 8px;
  padding: 14px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 13px/1.35 var(--rdw-font);
  text-align: left;
}
${BLOCK} .rdw-mlt-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 18px;
}
${BLOCK} .rdw-mlt-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
${BLOCK} .rdw-mlt-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 18px;
}
${BLOCK} .rdw-mlt-tab {
  padding: 2px 0 3px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  cursor: pointer;
}
${BLOCK} .rdw-mlt-tab[data-kind="artist"] {
  color: var(--rdw-tag-artist);
}
${BLOCK} .rdw-mlt-tab[data-kind="character"] {
  color: var(--rdw-tag-character);
}
${BLOCK} .rdw-mlt-tab:hover:not(:disabled) {
  text-decoration: underline;
}
${BLOCK} .rdw-mlt-tab[aria-selected="true"] {
  border-bottom-color: var(--rdw-accent);
  font-weight: 600;
}
${BLOCK} .rdw-mlt-tab[data-last]:not([aria-selected="true"]) {
  border-bottom-color: var(--rdw-border);
}
${BLOCK} .rdw-mlt-tab:disabled {
  opacity: 0.55;
  cursor: default;
}
${BLOCK} .rdw-mlt-count {
  margin-left: 5px;
  color: var(--rdw-muted);
  font-size: 12px;
  font-weight: 400;
}
${BLOCK} .rdw-mlt-line {
  margin: 8px 0 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
${BLOCK} .rdw-mlt-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--rdw-accent);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
}
${BLOCK} .rdw-mlt-link:hover:not(:disabled) {
  text-decoration: underline;
}
${BLOCK} .rdw-mlt-link:disabled {
  color: var(--rdw-muted);
  cursor: default;
}
${BLOCK} .rdw-mlt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${String(CELL_MIN_PX)}px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
${BLOCK} .rdw-mlt-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${String(CELL_HEIGHT_PX)}px;
  overflow: hidden;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface-2);
}
${BLOCK} .rdw-mlt-cell img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
${BLOCK} .rdw-mlt-video {
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
${BLOCK} .rdw-mlt-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}
@media (prefers-reduced-motion: no-preference) {
  ${BLOCK} .rdw-mlt-cell[data-waiting] {
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

function isSourceKind(value: unknown): value is RelatedSourceKind {
  return value === "artist" || value === "character" || value === "shared" || value === "favorites";
}

function loadingText(source: RelatedSource): string {
  if (source.kind === "artist") {
    return `Loading posts by ${source.name}${ELLIPSIS}`;
  }
  if (source.kind === "favorites") {
    return `Looking through your favorites${ELLIPSIS}`;
  }
  return `Loading posts with ${source.tags.join(", ").replaceAll("_", " ")}${ELLIPSIS}`;
}

function emptyText(source: RelatedSource): string {
  if (source.kind === "favorites") {
    return NONE_IN_FAVORITES;
  }
  if (source.kind === "artist") {
    return `No other posts by ${source.name}.`;
  }
  return `No other posts with ${source.tags.join(", ").replaceAll("_", " ")}.`;
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

export type MoreLikeThisProps = {
  readonly postId: number;
  readonly tags: readonly PostTag[];
  /** The kind of the source picked on an earlier post; it is marked, not loaded. */
  readonly lastKind: RelatedSourceKind | null;
  readonly onPick: (kind: RelatedSourceKind) => void;
  /** The favorites like this post, from the browser; null where there is no index. */
  readonly readFavorites: (() => Promise<RankedPost[]>) | null;
  readonly load: (query: string) => Promise<RankedPost[]>;
  /** The clock, for the wait after "slow down". */
  readonly now?: () => number;
};

export function MoreLikeThis(props: MoreLikeThisProps): JSX.Element {
  const sources = relatedSources(props.tags);
  const [picked, setPicked] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Readonly<Record<string, Loaded>>>({});
  const [favorites, setFavorites] = useState<readonly RankedPost[] | null>(null);
  const [showAll, setShowAll] = useState<readonly string[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [, tick] = useState(0);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const now = props.now ?? Date.now;
  const { readFavorites } = props;

  // How many of the favorites are like the post is known without a request.
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

  const current = picked === null ? undefined : loaded[picked];
  const waitLeft =
    current?.state === "error" && current.failure === "limited"
      ? Math.max(0, LIMITED_WAIT_S - Math.floor((now() - current.at) / SECOND_MS))
      : 0;
  // The seconds left are counted down in the button.
  useEffect(() => {
    if (waitLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      tick((value) => value + 1);
    }, SECOND_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [waitLeft > 0]);

  const busy = Object.values(loaded).some((entry) => entry.state === "loading");

  const open = (source: RelatedSource): void => {
    setPicked(source.key);
    props.onPick(source.kind);
    const have = loaded[source.key];
    if (have !== undefined && have.state !== "error") {
      return;
    }
    if (source.kind === "favorites") {
      setLoaded((all) => ({ ...all, [source.key]: { state: "ready", posts: favorites ?? [] } }));
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

  const stepTabs = (event: KeyboardEvent): void => {
    const step = event.key === KEY_NEXT ? 1 : event.key === KEY_PREVIOUS ? -1 : 0;
    const from = event.target;
    const row = event.currentTarget;
    if (step === 0 || !(from instanceof HTMLElement) || !(row instanceof HTMLElement)) {
      return;
    }
    const tabs = [...row.querySelectorAll(TAB_SELECTOR)];
    const next = tabs[tabs.indexOf(from) + step];
    if (next instanceof HTMLElement) {
      event.preventDefault();
      next.focus();
    }
  };

  const tagSources = sources.filter((source) => source.kind !== "favorites");
  const favoritesSource = sources.find((source) => source.kind === "favorites");
  // The picked source is always in the row, as the open group of a row of tabs is.
  const named = tagSources.slice(0, NAMED_SOURCES);
  const hidden = tagSources.slice(NAMED_SOURCES);
  const shownSources = moreOpen
    ? tagSources
    : [...named, ...hidden.filter((source) => source.key === picked)];
  const stillHidden = tagSources.length - shownSources.length;

  const tab = (source: RelatedSource): JSX.Element => {
    const state = loaded[source.key];
    const isFavorites = source.kind === "favorites";
    const count = isFavorites
      ? favorites?.length
      : state?.state === "ready"
        ? state.posts.length
        : undefined;
    const none = isFavorites && favorites !== null && favorites.length === 0;
    return (
      <button
        key={source.key}
        type="button"
        role="tab"
        className="rdw-mlt-tab"
        data-kind={source.kind}
        aria-selected={picked === source.key}
        {...(props.lastKind === source.kind ? { "data-last": "" } : {})}
        title={
          none
            ? NONE_IN_FAVORITES
            : source.kind === "shared"
              ? `${KIND_HINT.shared}: ${source.tags.join(", ").replaceAll("_", " ")}`
              : KIND_HINT[source.kind]
        }
        // One request at a time; and nothing to open where there is nothing.
        disabled={none || (busy && picked !== source.key) || (isFavorites && favorites === null)}
        onClick={() => {
          open(source);
        }}
      >
        {source.name}
        {count === undefined ? null : <span className="rdw-mlt-count">{String(count)}</span>}
      </button>
    );
  };

  const pickedSource = sources.find((source) => source.key === picked);
  const all = picked !== null && showAll.includes(picked);
  const posts = current?.state === "ready" ? current.posts : [];
  const visible = all ? posts : posts.slice(0, FIRST_SHOWN);

  return (
    <>
      <div className="rdw-mlt-head">
        <h2 className="rdw-mlt-title">{TITLE}</h2>
        <div className="rdw-mlt-tabs" role="tablist" aria-label={SOURCES_LABEL} onKeyDown={stepTabs}>
          {shownSources.map(tab)}
          {stillHidden > 0 ? (
            <button
              type="button"
              className="rdw-mlt-link"
              aria-expanded="false"
              onClick={() => {
                setMoreOpen(true);
              }}
            >
              {`${MORE_LABEL} (${String(stillHidden)})`}
            </button>
          ) : null}
          {favoritesSource === undefined ? null : tab(favoritesSource)}
        </div>
      </div>
      {pickedSource === undefined || current === undefined ? (
        <p className="rdw-mlt-line">{IDLE_HINT}</p>
      ) : current.state === "loading" ? (
        <>
          <p className="rdw-mlt-line" role="status">
            {loadingText(pickedSource)}
          </p>
          <div className="rdw-mlt-grid" aria-hidden="true">
            {Array.from({ length: SKELETON_CELLS }, (_unused, index) => (
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
            disabled={waitLeft > 0}
            onClick={() => {
              open(pickedSource);
            }}
          >
            {waitLeft > 0 ? `${RETRY_LABEL} (${String(waitLeft)})` : RETRY_LABEL}
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
                    const cells = gridRef.current?.querySelectorAll("a");
                    const first = cells?.[FIRST_SHOWN];
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
    </>
  );
}

/** The child of the media block that holds the picture or the player: the block goes after it. */
function mediaChild(wrapper: HTMLElement): Element | null {
  for (const child of wrapper.children) {
    if (
      child.id === IMAGE_ID ||
      child.tagName === "VIDEO" ||
      child.querySelector(`#${IMAGE_ID}, video`) !== null
    ) {
      return child;
    }
  }
  return null;
}

function mountMoreLikeThis(ctx: FeatureContext): void {
  const flexi = findFlexi();
  const postId = Number(readPostIdFromSearch(ctx.search) ?? Number.NaN);
  if (flexi === null || !Number.isFinite(postId) || document.getElementById(MORE_LIKE_THIS_ID) !== null) {
    return;
  }
  const wrapper = findMediaWrapper(flexi, POST_ACTIONS_ID);
  const tags = readPostTags(document);
  if (wrapper === null || tags.length === 0) {
    return;
  }
  const host = document.createElement("section");
  host.id = MORE_LIKE_THIS_ID;
  host.setAttribute("aria-label", TITLE);
  const after = mediaChild(wrapper);
  if (after === null) {
    wrapper.append(host);
  } else {
    after.after(host);
  }
  const last = ctx.getState((raw): RelatedSourceKind | null => (isSourceKind(raw) ? raw : null));
  render(
    <MoreLikeThis
      postId={postId}
      tags={tags}
      lastKind={last}
      onPick={(kind) => {
        ctx.setState(kind);
      }}
      readFavorites={
        favoritesIndexAvailable()
          ? async () => favoriteCandidates(await readFavoriteIndex(), tags, postId)
          : null
      }
      load={async (query) => rankCandidates(tags, await fetchCandidates(query), postId)}
    />,
    host,
  );
}

export const moreLikeThisFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: ["post"],
  defaultEnabled: true,
  settingsCaption: FEATURE_CAPTION,
  css: FEATURE_CSS,
  mount: mountMoreLikeThis,
};
