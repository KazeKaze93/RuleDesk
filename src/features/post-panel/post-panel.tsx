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
  SectionLabel,
  Tabs,
  kitTabId,
  kitTabPanelId,
} from "../../ui/kit";
import { CollectionQueue } from "./collection-queue";
import { CollectionsMenu } from "./collections-menu";
import { PostActionsList } from "./post-actions-list";
import {
  SOURCE_LINK_REL,
  collectMoreLinks,
  findICameTarget,
  findOriginalAnchor,
  findPostComments,
  observeScoreSpan,
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

const TEXT_FAVORITE = "Favorite";
const TEXT_IN_FAVORITES = "In favorites";
const TEXT_ORIGINAL = "Original";
const TEXT_VOTE_PREFIX = "Vote";
const TEXT_SCORE_UNKNOWN = "—";
const TEXT_ICAME = "I came";
const TEXT_COMMENTS = "Comments";
const TEXT_INFO = "Info";
const TEXT_POST = "Post";
const TEXT_COMMENTS_COUNTED_SEP = " · ";
const LABEL_ORIGINAL = "Original";
const LABEL_VOTE = "Vote";
const LABEL_ICAME = "I came";
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
  const [stats] = useState<readonly StatRow[]>(() => readStatRows());
  const [moreLinks] = useState<readonly MoreLink[]>(() => collectMoreLinks());
  const [originalHref] = useState<string | null>(() => {
    const anchor = findOriginalAnchor();
    return anchor?.href ?? null;
  });
  const [iCame] = useState<ICameTarget | null>(() => findICameTarget());
  const [hasComments] = useState(() => findPostComments() !== null);
  const [commentCount] = useState<number | null>(() =>
    hasComments ? readCommentCount() : null,
  );
  const [activeTab, setActiveTab] = useState(POST_PANEL_TAB_INFO);

  useEffect(() => {
    if (props.postId === null) {
      return;
    }
    return observeScoreSpan(props.postId, (text) => {
      setScoreText(text.length > 0 ? text : TEXT_SCORE_UNKNOWN);
    });
  }, [props.postId]);

  const onFavClick = useCallback(async (): Promise<void> => {
    if (props.postId === null || favPending) {
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
  }, [favPending, favorited, props.postId]);

  const onVoteClick = useCallback(async (): Promise<void> => {
    if (props.postId === null || votePending) {
      return;
    }
    setVotePending(true);
    try {
      const score = await voteUp(props.postId);
      if (score !== null) {
        writeScoreText(props.postId, score);
        setScoreText(String(score));
      }
    } finally {
      setVotePending(false);
    }
  }, [props.postId, votePending]);

  const onICameClick = useCallback((): void => {
    iCame?.anchor.click();
  }, [iCame]);

  const onTabChange = useCallback((id: string): void => {
    setActiveTab(id);
  }, []);

  const tabItems = useMemo(() => {
    const items = [{ id: POST_PANEL_TAB_INFO, label: TEXT_INFO }];
    if (hasComments) {
      items.push({
        id: POST_PANEL_TAB_COMMENTS,
        label: commentsTabLabel(commentCount),
      });
    }
    return items;
  }, [commentCount, hasComments]);

  const showInfoCard =
    stats.length > 0 || moreLinks.length > 0 || hasComments;
  const showActionsRow2 =
    props.postId !== null || iCame !== null || originalHref !== null;

  return (
    <div className={CLASS_ROOT}>
      <CollectionQueue postId={numericId} />
      <div className={CLASS_ACTIONS}>
        {props.postId !== null || numericId !== null ? (
          <div className={CLASS_ACTIONS_ROW}>
            {props.postId !== null ? (
              <Button
                variant="primary"
                size="m"
                className={CLASS_FAV}
                loading={favPending}
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
              <CollectionsMenu postId={numericId} />
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
          </div>
        ) : null}
      </div>

      {showInfoCard ? (
        <Card className={CLASS_CARD} as="section">
          {hasComments ? (
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
            hidden={hasComments && activeTab !== POST_PANEL_TAB_INFO}
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

      {props.moreLinks.length > 0 ? (
        <>
          <SectionLabel>{TEXT_POST}</SectionLabel>
          <PostActionsList links={props.moreLinks} />
        </>
      ) : null}
    </div>
  );
}

function CommentsHost(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);

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

  return <div className={CLASS_COMMENTS_HOST} ref={hostRef} />;
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
  TEXT_POST,
  TEXT_SCORE_UNKNOWN,
};
