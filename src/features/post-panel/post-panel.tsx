import {
  MORE_LIKE_THIS_FEATURE_ID,
  MORE_LIKE_THIS_STATE_ID,
  MORE_LIKE_THIS_TAB_LABEL,
  MoreLikeThis,
  isRelatedSourceKind,
} from "../more-like-this";
import {
  favoriteCandidates,
  fetchCandidates,
  rankCandidates,
  readPostTags,
  type PostTag,
  type RankedPost,
  type RelatedSourceKind,
} from "../../site/related";
import { getFeatureEnabled, getFeatureState, setFeatureState } from "../../storage/store";
import { favoritesIndexAvailable, readFavoriteIndex } from "../../storage/favorites-index";
import { indexFavoriteFromPostPage } from "../favorites-index-live";
import type { JSX } from "preact";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

import { UI_TEXT } from "../../config/constants";
import { log } from "../../log";
import { addFavorite, removeFavorite, voteUp } from "../../site/favorites";
import { addFav, isFav, removeFav } from "../../storage/favs";
import {
  Button,
  Card,
  IconArrowUp,
  IconDroplet,
  IconExternalLink,
  IconStar,
  IconStarFilled,
  Tabs,
  kitTabId,
  kitTabPanelId,
} from "../../ui/kit";
import { useHotkey } from "../../ui/use-hotkey";
import { CollectionQueue } from "./collection-queue";
import { CollectionsMenu } from "./collections-menu";
import { OPEN_RELATED_EVENT, TITLE_DELETED } from "./deleted-block";
import { DownloadOne } from "./download-one";
import { PostActionsList } from "./post-actions-list";
import {
  SOURCE_LINK_REL,
  collectMoreLinks,
  findDeletedNotice,
  findICameTarget,
  findOriginalAnchor,
  findPostComments,
  observeScoreSpan,
  parsePostSize,
  readCommentCount,
  readScoreText,
  readStatRows,
  writeScoreText,
  type ICameTarget,
  type MoreLink,
  type StatRow,
} from "./site-reads";

/** Retired `settings.featureChoice` key. The tab is not persisted. */
export const POST_PANEL_TAB_CHOICE_ID = "post-actions";
export const POST_PANEL_TAB_INFO = "info";
export const POST_PANEL_TAB_COMMENTS = "comments";
export const POST_PANEL_TAB_RELATED = "related";

const TEXT_FAVORITE = "Favorite";
const TEXT_IN_FAVORITES = "In favorites";
const TEXT_ORIGINAL = "Original";
const TEXT_VOTE_PREFIX = "Vote";
const TEXT_SCORE_UNKNOWN = "—";
const TEXT_ICAME = "I came";
const TEXT_COMMENTS = "Comments";
const TEXT_INFO = "Info";
const TEXT_COMMENTS_COUNTED_SEP = " · ";
const LABEL_ORIGINAL = "Original";
const LABEL_VOTE = "Vote";
const LABEL_ICAME = "I came";
/**
 * The key of the Favorite button (the designer, 18.11.2026): the place of the
 * letter F. The site's own keys on a post are the left and right arrows only
 * (docs/site.md), and the script had none on F.
 */
const FAVORITE_KEY_CODE = "KeyF";
const TITLE_FAVORITE = "Add to favorites (F)";
const TITLE_UNFAVORITE = "Remove from favorites (F)";
const TITLE_VOTE = "Vote up";
const TITLE_VOTED = "Voted up";
const ARIA_PANEL_TABS = "Post details";

const ICON_SIZE = 14;
const ORIGINAL_ICON_SIZE = 14;

const CLASS_ROOT = "rdw-post-panel";
const CLASS_CARD = "rdw-post-panel-card";
const CLASS_ACTIONS = "rdw-post-panel-actions";
const CLASS_ACTIONS_ROW = "rdw-post-panel-actions-row";
const CLASS_FAV = "rdw-post-panel-fav";
const CLASS_ORIGINAL = "rdw-post-panel-original";
const CLASS_VOTE = "rdw-post-panel-vote";
const CLASS_STATS = "rdw-post-panel-stats";
const CLASS_STAT_LABEL = "rdw-post-panel-stat-label";
const CLASS_STAT_VALUE = "rdw-post-panel-stat-value";
const CLASS_SOURCE = "rdw-post-panel-source";
const CLASS_ICAME = "rdw-post-panel-icame";
const CLASS_COMMENTS = "rdw-post-panel-comments";
const CLASS_COMMENTS_HOST = "rdw-post-panel-comments-host";
const CLASS_INFO = "rdw-post-panel-info";
const CLASS_TABS = "rdw-post-panel-tabs";
const CLASS_TAB_PANEL = "rdw-post-panel-tabpanel";

export type PostPanelProps = {
  readonly postId: string | null;
};

function parseNumericPostId(postId: string | null): number | null {
  if (postId === null || postId.length === 0) {
    return null;
  }
  const parsed = Number(postId);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const truncated = Math.trunc(parsed);
  return truncated < 0 ? null : truncated;
}

function statValue(stats: readonly StatRow[], label: StatRow["label"]): string {
  return stats.find((row) => row.label === label)?.value.trim() ?? "";
}

/** What the panel knows about the post that a file name mask may use. */
export function fileNameInfo(
  postId: number,
  stats: readonly StatRow[],
  scoreText: string,
): { postId: number; rating?: string; score?: number; width?: number; height?: number; owner?: string } {
  const size = parsePostSize(statValue(stats, "Size"));
  const score = Number(scoreText);
  const rating = statValue(stats, "Rating").toLowerCase();
  const owner = statValue(stats, "By");
  return {
    postId,
    ...(rating.length > 0 ? { rating } : {}),
    ...(scoreText.trim().length > 0 && Number.isFinite(score) ? { score } : {}),
    ...(size === null ? {} : { width: size.width, height: size.height }),
    ...(owner.length > 0 ? { owner } : {}),
  };
}

function voteLabel(scoreText: string): string {
  return `${TEXT_VOTE_PREFIX} ${scoreText}`;
}

function commentsTabLabel(count: number | null): string {
  if (count === null) {
    return TEXT_COMMENTS;
  }
  return `${TEXT_COMMENTS}${TEXT_COMMENTS_COUNTED_SEP}${String(count)}`;
}

export function PostPanel(props: PostPanelProps): JSX.Element {
  const numericId = parseNumericPostId(props.postId);
  const [favorited, setFavorited] = useState(
    () => (props.postId !== null ? isFav(props.postId) : false),
  );
  const [favPending, setFavPending] = useState(false);
  const [scoreText, setScoreText] = useState(() => {
    if (props.postId === null) {
      return TEXT_SCORE_UNKNOWN;
    }
    return readScoreText(props.postId) ?? TEXT_SCORE_UNKNOWN;
  });
  const [votePending, setVotePending] = useState(false);
  // Pressed after a vote and after "I came" made on this page. The site does
  // not say on the page whether either was done before, so a page opened
  // again shows them unpressed.
  const [voted, setVoted] = useState(false);
  const [cameDone, setCameDone] = useState(false);
  const [stats] = useState<readonly StatRow[]>(() => readStatRows());
  const [moreLinks] = useState<readonly MoreLink[]>(() => collectMoreLinks());
  // A deleted post has no file: the page may still carry the link to it, but
  // there is nothing to open or to save (Kaze, 19.11.2026).
  const [originalHref] = useState<string | null>(() => {
    if (findDeletedNotice() !== null) {
      return null;
    }
    const anchor = findOriginalAnchor();
    return anchor?.href ?? null;
  });
  const [deleted] = useState(() => findDeletedNotice() !== null);
  const [iCame] = useState<ICameTarget | null>(() => findICameTarget());
  const [hasComments] = useState(() => findPostComments() !== null);
  const [commentCount] = useState<number | null>(() =>
    hasComments ? readCommentCount() : null,
  );
  // The panel opens on Info, except right after "Change" of the comments'
  // order: the site reloads the page for it, and the user was reading comments.
  const [activeTab, setActiveTab] = useState(() =>
    hasComments && takeCommentsReturn() ? POST_PANEL_TAB_COMMENTS : POST_PANEL_TAB_INFO,
  );
  // "More like this": the tags of the post, read once. With the setting off,
  // or on a post whose tags the page does not list, there is no such tab.
  const [relatedTags] = useState<readonly PostTag[]>(() =>
    props.postId !== null && getFeatureEnabled(MORE_LIKE_THIS_FEATURE_ID, true)
      ? readPostTags(document)
      : [],
  );
  const hasRelated = relatedTags.length > 0;
  // What is in that tab is drawn once the tab was opened, and kept after: the
  // opening is what asks the site, and what came stays until the page is left.
  const [relatedOpened, setRelatedOpened] = useState(false);
  const [relatedLast] = useState<RelatedSourceKind | null>(() => {
    const kept = getFeatureState(MORE_LIKE_THIS_STATE_ID);
    return isRelatedSourceKind(kept) ? kept : null;
  });
  const selfId = props.postId === null ? Number.NaN : Number(props.postId);
  const [readRelatedFavorites] = useState(() =>
    favoritesIndexAvailable()
      ? async (): Promise<RankedPost[]> =>
          favoriteCandidates(await readFavoriteIndex(), relatedTags, selfId)
      : null,
  );
  const loadRelated = useCallback(
    async (query: string, offset: number): Promise<RankedPost[]> =>
      rankCandidates(relatedTags, await fetchCandidates(query, offset), selfId),
    [relatedTags, selfId],
  );
  const hasTabs = hasComments || hasRelated;

  useEffect(() => {
    if (props.postId === null) {
      return;
    }
    return observeScoreSpan(props.postId, (text) => {
      setScoreText(text.length > 0 ? text : TEXT_SCORE_UNKNOWN);
    });
  }, [props.postId]);

  // The button of the block that stands for a deleted picture opens this tab.
  useEffect(() => {
    if (!hasRelated) {
      return;
    }
    const open = (): void => {
      setActiveTab(POST_PANEL_TAB_RELATED);
      setRelatedOpened(true);
      document.getElementById(kitTabId(POST_PANEL_TAB_RELATED))?.focus();
    };
    document.addEventListener(OPEN_RELATED_EVENT, open);
    return () => {
      document.removeEventListener(OPEN_RELATED_EVENT, open);
    };
  }, [hasRelated]);

  // A deleted post is not added to favorites: there is nothing to keep. One
  // that is there already can be taken out (the designer, 19.11.2026).
  const favBlocked = deleted && !favorited;

  const onFavClick = useCallback(async (): Promise<void> => {
    if (props.postId === null || favPending || favBlocked) {
      return;
    }
    setFavPending(true);
    try {
      if (favorited) {
        const result = await removeFavorite(props.postId);
        if (result.status === "removed") {
          removeFav(props.postId);
          setFavorited(false);
          return;
        }
        log.warn("post-actions: remove favorite failed", props.postId, result);
        return;
      }
      const result = await addFavorite(props.postId);
      if (result.status === "added" || result.status === "already") {
        addFav(props.postId);
        indexFavoriteFromPostPage(props.postId);
        setFavorited(true);
        if (result.status === "added" && result.score !== undefined) {
          writeScoreText(props.postId, result.score);
          setScoreText(String(result.score));
        }
        return;
      }
      if (result.status === "not_logged_in") {
        log.warn("post-actions: favorite requires login", props.postId);
        return;
      }
      log.warn("post-actions: favorite failed", props.postId, result);
    } finally {
      setFavPending(false);
    }
  }, [favBlocked, favPending, favorited, props.postId]);

  useHotkey(FAVORITE_KEY_CODE, props.postId !== null && !favBlocked, () => {
    void onFavClick();
  });

  const onVoteClick = useCallback(async (): Promise<void> => {
    if (props.postId === null || votePending || deleted) {
      return;
    }
    setVotePending(true);
    try {
      const score = await voteUp(props.postId);
      if (score !== null) {
        writeScoreText(props.postId, score);
        setScoreText(String(score));
        setVoted(true);
      }
    } finally {
      setVotePending(false);
    }
  }, [deleted, props.postId, votePending]);

  const onICameClick = useCallback((): void => {
    iCame?.anchor.click();
    setCameDone(true);
  }, [iCame]);

  const onTabChange = useCallback((id: string): void => {
    setActiveTab(id);
    if (id === POST_PANEL_TAB_RELATED) {
      setRelatedOpened(true);
    }
  }, []);

  const tabItems = useMemo(() => {
    const items = [{ id: POST_PANEL_TAB_INFO, label: TEXT_INFO }];
    if (hasComments) {
      items.push({
        id: POST_PANEL_TAB_COMMENTS,
        label: commentsTabLabel(commentCount),
      });
    }
    if (hasRelated) {
      items.push({ id: POST_PANEL_TAB_RELATED, label: MORE_LIKE_THIS_TAB_LABEL });
    }
    return items;
  }, [commentCount, hasComments, hasRelated]);

  const showInfoCard =
    stats.length > 0 || moreLinks.length > 0 || hasTabs;
  const showActionsRow2 = props.postId !== null || iCame !== null || originalHref !== null;

  return (
    <div className={CLASS_ROOT}>
      <CollectionQueue postId={numericId} />
      <div className={CLASS_ACTIONS}>
        {props.postId !== null || numericId !== null ? (
          <div className={CLASS_ACTIONS_ROW}>
            {props.postId !== null ? (
              // A post already in favorites is not the page's main action any
              // more: the button is drawn pressed, and says what a click does.
              <Button
                variant={favorited ? "secondary" : "primary"}
                size="m"
                className={CLASS_FAV}
                loading={favPending}
                disabled={favBlocked}
                pressed={favorited}
                title={favBlocked ? TITLE_DELETED : favorited ? TITLE_UNFAVORITE : TITLE_FAVORITE}
                aria-label={
                  favorited
                    ? `${UI_TEXT.cardFavRemoveLabel} ${props.postId}`
                    : `${UI_TEXT.cardFavAddLabel} ${props.postId}`
                }
                onClick={() => {
                  void onFavClick();
                }}
              >
                {favorited ? (
                  <IconStarFilled size={ICON_SIZE} />
                ) : (
                  <IconStar size={ICON_SIZE} />
                )}
                {favorited ? TEXT_IN_FAVORITES : TEXT_FAVORITE}
              </Button>
            ) : null}
            {numericId !== null ? (
              <CollectionsMenu postId={numericId} deleted={deleted} />
            ) : null}
          </div>
        ) : null}

        {showActionsRow2 ? (
          <div className={CLASS_ACTIONS_ROW}>
            {props.postId !== null ? (
              <Button
                variant="secondary"
                size="m"
                className={CLASS_VOTE}
                loading={votePending}
                disabled={deleted}
                pressed={voted}
                title={deleted ? TITLE_DELETED : voted ? TITLE_VOTED : TITLE_VOTE}
                aria-label={LABEL_VOTE}
                onClick={() => {
                  void onVoteClick();
                }}
              >
                <IconArrowUp size={ICON_SIZE} />
                {voteLabel(scoreText)}
              </Button>
            ) : null}

            {iCame !== null ? (
              <Button
                variant="secondary"
                size="m"
                className={CLASS_ICAME}
                disabled={deleted}
                {...(deleted ? { title: TITLE_DELETED } : {})}
                pressed={cameDone}
                aria-label={LABEL_ICAME}
                onClick={onICameClick}
              >
                <IconDroplet size={ICON_SIZE} />
                {TEXT_ICAME}
              </Button>
            ) : null}

            {originalHref !== null ? (
              <a
                className={CLASS_ORIGINAL}
                href={originalHref}
                target="_blank"
                rel="noopener"
                aria-label={LABEL_ORIGINAL}
                title={LABEL_ORIGINAL}
              >
                <IconExternalLink size={ORIGINAL_ICON_SIZE} />
              </a>
            ) : null}
            {numericId !== null && !deleted ? (
              <DownloadOne
                originalHref={originalHref}
                info={fileNameInfo(numericId, stats, scoreText)}
                className={CLASS_ORIGINAL}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {showInfoCard ? (
        <Card className={CLASS_CARD} as="section">
          {hasTabs ? (
            <Tabs
              className={CLASS_TABS}
              aria-label={ARIA_PANEL_TABS}
              items={tabItems}
              value={activeTab}
              onChange={onTabChange}
            />
          ) : null}

          <div
            className={CLASS_TAB_PANEL}
            role="tabpanel"
            id={kitTabPanelId(POST_PANEL_TAB_INFO)}
            aria-labelledby={kitTabId(POST_PANEL_TAB_INFO)}
            hidden={hasTabs && activeTab !== POST_PANEL_TAB_INFO}
          >
            <InfoPanel stats={stats} moreLinks={moreLinks} />
          </div>

          {hasComments ? (
            <div
              className={`${CLASS_TAB_PANEL} ${CLASS_COMMENTS}`}
              role="tabpanel"
              id={kitTabPanelId(POST_PANEL_TAB_COMMENTS)}
              aria-labelledby={kitTabId(POST_PANEL_TAB_COMMENTS)}
              hidden={activeTab !== POST_PANEL_TAB_COMMENTS}
            >
              <CommentsHost />
            </div>
          ) : null}

          {hasRelated ? (
            <div
              className={CLASS_TAB_PANEL}
              role="tabpanel"
              id={kitTabPanelId(POST_PANEL_TAB_RELATED)}
              aria-labelledby={kitTabId(POST_PANEL_TAB_RELATED)}
              hidden={activeTab !== POST_PANEL_TAB_RELATED}
            >
              {relatedOpened ? (
                <MoreLikeThis
                  tags={relatedTags}
                  lastKind={relatedLast}
                  onPick={(kind) => {
                    setFeatureState(MORE_LIKE_THIS_STATE_ID, kind);
                  }}
                  readFavorites={readRelatedFavorites}
                  load={loadRelated}
                />
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function InfoPanel(props: {
  readonly stats: readonly StatRow[];
  readonly moreLinks: readonly MoreLink[];
}): JSX.Element {
  return (
    <div className={CLASS_INFO}>
      {props.stats.length > 0 ? (
        <div className={CLASS_STATS}>
          {props.stats.map((row) => (
            <StatRowView key={row.label} row={row} />
          ))}
        </div>
      ) : null}

      {/* No heading over them: "Post" on the page of a post said nothing. */}
      {props.moreLinks.length > 0 ? <PostActionsList links={props.moreLinks} /> : null}
    </div>
  );
}

/** A comment in the site's list: `div#c{id}` (docs/site.md). */
const COMMENT_SELECTOR = 'div#comment-list > div[id^="c"]';
/** The site's link that shows the hidden comments; "(0 hidden)" when there are none. */
const HIDDEN_LINK_SELECTOR = "div#comment-list > a#ci";
const NO_HIDDEN_TEXT = "(0 hidden)";
const RESPOND_TEXT = "Respond";
const TEXT_NO_COMMENTS = "No comments yet";
const TEXT_WRITE_COMMENT = "Write a comment";
const CLASS_COMMENTS_EMPTY = "rdw-post-panel-comments-empty";
/** On the site's "Edit | Respond" line under the picture. */
export const CLASS_REPLY_LINKS = "rdw-post-reply-links";

/** The site's link that changes the order of the comments; the page is loaded again for it. */
const SORT_LINK_SELECTOR = "div#comment-list > div:not([id]) > a";
/** Holds the address the Comments tab is to be opened on after that reload. */
const COMMENTS_RETURN_KEY = "ruledesk-web.comments-return";

function rememberCommentsReturn(): void {
  try {
    window.sessionStorage.setItem(COMMENTS_RETURN_KEY, window.location.search);
  } catch {
    // Without session storage the panel opens on Info, as on any load.
  }
}

/** True once, on the load that follows "Change" on this very post. */
function takeCommentsReturn(): boolean {
  try {
    const kept = window.sessionStorage.getItem(COMMENTS_RETURN_KEY);
    window.sessionStorage.removeItem(COMMENTS_RETURN_KEY);
    return kept !== null && kept === window.location.search;
  } catch {
    return false;
  }
}

/** The site's "Respond" link, which opens its form for a comment; it stands under the picture. */
function findRespondLink(): HTMLAnchorElement | null {
  for (const link of document.querySelectorAll("a")) {
    if (link.textContent.trim() === RESPOND_TEXT) {
      return link;
    }
  }
  return null;
}

/** The site's form for a comment: `form#comment_form` in `div#right-col` (docs/site.md). */
const COMMENT_FORM_ID = "comment_form";

function CommentsHost(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  // Where the form stood before it was brought into the panel, to put it back.
  const formOriginRef = useRef<{ parent: Node | null; next: Node | null } | null>(null);
  useEffect(
    () => (): void => {
      const origin = formOriginRef.current;
      const form = document.getElementById(COMMENT_FORM_ID);
      if (origin !== null && origin.parent !== null && form !== null) {
        origin.parent.insertBefore(form, origin.next);
      }
    },
    [],
  );
  // With no comment the tab held only the site's line about the order: it is
  // said that there are none, with the way to write the first.
  const [empty] = useState(() => {
    const comments = findPostComments();
    return comments !== null && comments.querySelector(COMMENT_SELECTOR) === null;
  });
  const [respond] = useState<HTMLAnchorElement | null>(() => findRespondLink());

  useLayoutEffect(() => {
    // "(0 hidden)" is a link to nothing.
    const comments = findPostComments();
    const hidden = comments?.querySelector(HIDDEN_LINK_SELECTOR);
    if (hidden instanceof HTMLElement && hidden.textContent.trim() === NO_HIDDEN_TEXT) {
      hidden.hidden = true;
    }
    // "Edit | Respond" under the picture is the site's line of two links, drawn
    // as a heading. Its element is not known by name, so it is found through
    // the link and marked only when it holds nothing but links.
    const line = respond?.parentElement ?? null;
    if (line !== null && Array.from(line.children).every((child) => child.tagName === "A")) {
      line.classList.add(CLASS_REPLY_LINKS);
    }
    // "Change" reloads the page: the tab to come back to is remembered for that load.
    const change = comments?.querySelector(SORT_LINK_SELECTOR);
    change?.addEventListener("click", rememberCommentsReturn);
    return () => {
      change?.removeEventListener("click", rememberCommentsReturn);
    };
  }, [respond]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const comments = findPostComments();
    if (host === null || comments === null) {
      return;
    }
    if (comments.parentElement === host) {
      return;
    }
    const originParent = comments.parentNode;
    const originNext = comments.nextSibling;
    host.append(comments);
    return (): void => {
      if (originParent === null) {
        return;
      }
      if (comments.parentElement === host || comments.parentNode === null) {
        originParent.insertBefore(comments, originNext);
      }
    };
  }, []);

  // The site's form for a comment opens under the picture, far from the
  // comments. "Write a comment" brings it here, under the list: the form is
  // the site's own, with its fields and its address, only standing elsewhere.
  const writeComment = (): void => {
    const host = hostRef.current;
    const form = document.getElementById(COMMENT_FORM_ID);
    if (host === null || respond === null) {
      return;
    }
    if (!(form instanceof HTMLFormElement)) {
      // No such form on this page: the site's link does what it does.
      respond.click();
      respond.scrollIntoView({ block: "center" });
      return;
    }
    if (window.getComputedStyle(form).display === "none") {
      // The site shows and hides the form by this link.
      respond.click();
    }
    if (form.parentElement !== host) {
      formOriginRef.current = { parent: form.parentNode, next: form.nextSibling };
      host.append(form);
    }
    form.querySelector("textarea")?.focus();
  };

  return (
    <>
      {empty || respond !== null ? (
        <div className={CLASS_COMMENTS_EMPTY}>
          <span>{empty ? TEXT_NO_COMMENTS : ""}</span>
          {respond !== null ? (
            <Button variant="secondary" size="s" onClick={writeComment}>
              {TEXT_WRITE_COMMENT}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className={CLASS_COMMENTS_HOST} ref={hostRef} />
    </>
  );
}

function StatRowView(props: { readonly row: StatRow }): JSX.Element {
  const { row } = props;
  return (
    <>
      <span className={CLASS_STAT_LABEL}>{row.label}</span>
      {row.label === "Source" && row.href !== null ? (
        <a
          className={`${CLASS_STAT_VALUE} ${CLASS_SOURCE}`}
          href={row.href}
          title={row.href}
          rel={SOURCE_LINK_REL}
        >
          {row.value}
        </a>
      ) : row.href !== null ? (
        <a className={CLASS_STAT_VALUE} href={row.href}>
          {row.value}
        </a>
      ) : (
        <div className={CLASS_STAT_VALUE}>{row.value}</div>
      )}
    </>
  );
}

export {
  CLASS_ROOT,
  CLASS_CARD,
  CLASS_ACTIONS,
  CLASS_ACTIONS_ROW,
  CLASS_FAV,
  CLASS_ORIGINAL,
  CLASS_VOTE,
  CLASS_STATS,
  CLASS_ICAME,
  CLASS_SOURCE,
  CLASS_COMMENTS,
  CLASS_COMMENTS_HOST,
  CLASS_INFO,
  CLASS_TABS,
  CLASS_TAB_PANEL,
  TEXT_FAVORITE,
  TEXT_IN_FAVORITES,
  TEXT_ORIGINAL,
  TEXT_VOTE_PREFIX,
  TEXT_ICAME,
  TEXT_COMMENTS,
  TEXT_INFO,
  TEXT_SCORE_UNKNOWN,
};
