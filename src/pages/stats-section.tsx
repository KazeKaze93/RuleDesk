import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import { COLLECTION_KIND_POSTS } from "../config/constants";
import { topFavoriteTags, type TagCount } from "../features/favorites-search";
import { readFavoriteIndex } from "../storage/favorites-index";
import { loadFavSet } from "../storage/favs";
import { resolveCollectionKind, type StorageData } from "../storage/schema";
import { getFeatureState, load, setFeatureState } from "../storage/store";
import {
  readStoredProfileStats,
  refreshProfileStats,
  type ProfileStats,
} from "../site/profile";
import { formatDayTime, formatMonth } from "../ui/format-date";
import { Button, Card } from "../ui/kit";
import { PANEL_UI_CLASS } from "./constants";

/**
 * Numbers about what the script stores, computed from local data when the
 * page opens. Nothing is requested from the site, so these are counts of your
 * own library, not totals of the site.
 *
 * Tiles for single numbers, a plain list of the largest collections, bars
 * for the tags of the favorites.
 */

const SECTION_CLASS = "rdw-stats";
const TILES_CLASS = "rdw-stats-tiles";
const TILE_CLASS = "rdw-stats-tile";
const TILE_VALUE_CLASS = "rdw-stats-value";
const TILE_LABEL_CLASS = "rdw-stats-label";
const CHART_CLASS = "rdw-stats-chart";
const HEADING_CLASS = "rdw-stats-heading";
const TOP_CLASS = "rdw-stats-top";
const TOP_ROW_CLASS = "rdw-stats-top-row";
const TOP_BAR_CLASS = "rdw-stats-top-bar";
const TOP_FILL_CLASS = "rdw-stats-top-fill";
const HINT_CLASS = "rdw-stats-hint";
const TOP_PLAIN_CLASS = "rdw-stats-top--plain";
const SKELETON_CLASS = "rdw-stats-skeleton";
const SKELETON_BAR_CLASS = "rdw-stats-skeleton-bar";
const PROFILE_CLASS = "rdw-stats-profile";
const PROFILE_HEAD_CLASS = "rdw-stats-profile-head";
const PROFILE_SIDE_CLASS = "rdw-stats-profile-side";

const LOCALE = "en-US";
const TOP_COLLECTIONS_LIMIT = 10;
const BYTES_PER_KB = 1024;
const PERCENT = 100;
const MIN_BAR_PERCENT = 2;
/** Wide enough for "Since Aug 2019" in the large type to stay on one line. */
const TILE_MIN_PX = 160;
const COLUMN_CLASS = "rdw-stats-column";
const FOOT_CLASS = "rdw-stats-foot";
const COLUMN_GAP_PX = 20;
/** Narrower than this the two columns would be too tight for the bars. */
const TWO_COLUMNS_FROM_PX = 1100;
/** One row of a list. Set, not left to the font, so that the grey rows shown
    while the tags are counted take exactly the room of the real ones. */
const TOP_ROW_HEIGHT_PX = 18;
const SKELETON_PULSE_NAME = "rdw-stats-skeleton-pulse";
const SKELETON_PULSE_MS = 1200;
const SKELETON_DIM_OPACITY = 0.5;

const KIND_CUSTOM_WORD = "custom";
const KIND_DYNAMIC_WORD = "dynamic";
const KINDS_SEPARATOR = " · ";
const COLLECTIONS_LABEL = "Collections";
const TOP_HEADING = "Collections by posts";
const TOP_EMPTY = "Collections show here once they hold posts or their count is known.";
const TOP_TAGS_HEADING = "Top tags in favorites";
const TOP_TAGS_EMPTY =
  "Run Full resync in RuleDesk → Favorites to fill this: it reads the tags of your favorites.";
const TOP_TAGS_LIMIT = 20;
const TOP_TAGS_BUSY_LABEL = "Counting the tags of your favorites";
const PROFILE_HEADING = "Site profile";
const PROFILE_REFRESH_LABEL = "Refresh profile";
const PROFILE_REFRESH_TITLE =
  "Reads your profile page on the site: two requests, a moment apart";
const PROFILE_BUSY_LABEL = "Reading…";
const PROFILE_EMPTY = "These numbers are read from your profile page when this page is opened.";
/** How long the numbers read from the profile are good for before the page reads them again. */
export const PROFILE_AUTO_INTERVAL_MS = 15 * 60 * 1000;

/** True when the page should read the profile by itself: never read, or read long enough ago. */
export function profileIsStale(profile: ProfileStats | null, now: number): boolean {
  return profile === null || now - profile.readAt >= PROFILE_AUTO_INTERVAL_MS;
}
const PROFILE_READ_PREFIX = "Read on ";
const PROFILE_FAILED_PREFIX = "Could not read the profile: ";
const SINCE_PREFIX = "Since ";
const LEVEL_LABEL = "Level";
const MS_PER_YEAR = 31_557_600_000;
const MONTHS_PER_YEAR = 12;
const HINT =
  "Counted from the script's own data in this browser, except the site profile. Seen posts keep only the newest marks.";

/* The page uses the width of the window: the numbers on the left, the long
   list of tags on the right, so that all of it is seen without scrolling.
   In a narrow window the two stand one under the other. */
export const STATS_SECTION_CSS = `
.${SECTION_CLASS} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px ${String(COLUMN_GAP_PX)}px;
  align-items: start;
}
@media (min-width: ${String(TWO_COLUMNS_FROM_PX)}px) {
  .${SECTION_CLASS} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
.${COLUMN_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.${FOOT_CLASS} {
  grid-column: 1 / -1;
}
.${TILES_CLASS} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${String(TILE_MIN_PX)}px, 1fr));
  gap: 8px;
}
.${TILE_CLASS},
.${CHART_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: var(--rdw-surface-2);
  border-radius: var(--rdw-radius-m);
}
.${CHART_CLASS} {
  gap: 8px;
  padding: 10px 12px;
}
.${TILE_VALUE_CLASS} {
  font-size: 18px;
  font-weight: 600;
  color: var(--rdw-text);
  white-space: nowrap;
}
.${HEADING_CLASS} {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rdw-text);
}
.${TILE_LABEL_CLASS},
.${HINT_CLASS} {
  margin: 0;
  font-size: 12px;
  color: var(--rdw-muted);
}
.${PROFILE_HEAD_CLASS},
.${PROFILE_SIDE_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
.${PROFILE_HEAD_CLASS} {
  justify-content: space-between;
}
/* The block is a card of the same colour as a tile, so its own tiles take
   the colour under the card to stay seen. */
.${PROFILE_CLASS} .${TILE_CLASS} {
  background: var(--rdw-surface);
}
.${TOP_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${TOP_ROW_CLASS} {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  align-items: center;
  gap: 8px;
  min-height: ${String(TOP_ROW_HEIGHT_PX)}px;
  font-size: 12px;
  line-height: ${String(TOP_ROW_HEIGHT_PX)}px;
}
.${TOP_PLAIN_CLASS} > .${TOP_ROW_CLASS} {
  grid-template-columns: minmax(0, 1fr) auto;
}
.${TOP_PLAIN_CLASS} > .${TOP_ROW_CLASS} > span:last-child {
  font-variant-numeric: tabular-nums;
}
.${TOP_ROW_CLASS} > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${TOP_BAR_CLASS} {
  height: 6px;
  border-radius: 3px;
  background: var(--rdw-surface);
  overflow: hidden;
}
.${TOP_FILL_CLASS} {
  display: block;
  height: 100%;
  background: var(--rdw-accent);
}
.${SKELETON_CLASS} > div {
  display: flex;
  align-items: center;
  height: ${String(TOP_ROW_HEIGHT_PX)}px;
}
.${SKELETON_BAR_CLASS} {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--rdw-surface);
}
/* The grey rows breathe only for someone who has not asked for less motion. */
@media (prefers-reduced-motion: no-preference) {
  .${SKELETON_BAR_CLASS} {
    animation: ${SKELETON_PULSE_NAME} ${String(SKELETON_PULSE_MS)}ms ease-in-out infinite alternate;
  }
}
@keyframes ${SKELETON_PULSE_NAME} {
  to {
    opacity: ${String(SKELETON_DIM_OPACITY)};
  }
}
`.trim();

export type StatsTile = {
  readonly label: string;
  readonly value: number;
  /** Shown after the number, e.g. "KB". */
  readonly unit?: string;
  /** A second small line under the label, e.g. "3 custom · 8 dynamic". */
  readonly detail?: string;
};

export type TopCollection = {
  readonly id: string;
  readonly name: string;
  readonly posts: number;
};

export type Stats = {
  readonly tiles: readonly StatsTile[];
  readonly customCollections: number;
  readonly dynamicCollections: number;
  /** Largest first; a dynamic collection counts once its size is known. */
  readonly topCollections: readonly TopCollection[];
};

/** "3 custom · 8 dynamic": the two kinds of collections in one line of a tile. */
export function collectionKindsLine(custom: number, dynamic: number): string {
  return `${formatNumber(custom)} ${KIND_CUSTOM_WORD}${KINDS_SEPARATOR}${formatNumber(dynamic)} ${KIND_DYNAMIC_WORD}`;
}

/** Pure: the numbers for a stored state. */
export function computeStats(data: StorageData, favoriteCount: number): Stats {
  let custom = 0;
  let dynamic = 0;
  const collected = new Set<number>();
  const top: TopCollection[] = [];
  for (const collection of data.collections) {
    let posts: number | undefined;
    if (resolveCollectionKind(collection) === COLLECTION_KIND_POSTS) {
      custom += 1;
      const ids = collection.postIds ?? [];
      for (const id of ids) {
        collected.add(id);
      }
      posts = ids.length;
    } else {
      dynamic += 1;
      posts = collection.postCount?.value;
    }
    if (posts !== undefined && posts > 0) {
      top.push({ id: collection.id, name: collection.name, posts });
    }
  }
  top.sort((a, b) => b.posts - a.posts || a.name.localeCompare(b.name));

  let seenPosts = 0;
  for (const flags of Object.values(data.marks)) {
    if (flags.seen === true) {
      seenPosts += 1;
    }
  }

  const sizeKb = Math.ceil(JSON.stringify(data).length / BYTES_PER_KB);

  return {
    tiles: [
      { label: "Followed artists", value: data.artists.length },
      // With no collections the line would be two zeroes under a zero.
      custom + dynamic === 0
        ? { label: COLLECTIONS_LABEL, value: 0 }
        : {
            label: COLLECTIONS_LABEL,
            value: custom + dynamic,
            detail: collectionKindsLine(custom, dynamic),
          },
      { label: "Posts in custom collections", value: collected.size },
      { label: "Favorites", value: favoriteCount },
      { label: "Seen posts", value: seenPosts },
      { label: "Stored data", value: sizeKb, unit: "KB" },
    ],
    customCollections: custom,
    dynamicCollections: dynamic,
    topCollections: top.slice(0, TOP_COLLECTIONS_LIMIT),
  };
}

function formatNumber(value: number): string {
  return value.toLocaleString(LOCALE);
}

/**
 * The largest collections as names and numbers, largest first. No bars: one
 * collection of millions of posts beside ones of a few left every other bar
 * a dot (the designer, 17.11.2026).
 */
function CollectionList(props: {
  readonly collections: readonly TopCollection[];
}): JSX.Element {
  if (props.collections.length === 0) {
    return <p className={HINT_CLASS}>{TOP_EMPTY}</p>;
  }
  return (
    <ol className={`${TOP_CLASS} ${TOP_PLAIN_CLASS}`}>
      {props.collections.map((collection) => (
        <li key={collection.id} className={TOP_ROW_CLASS}>
          <span title={collection.name}>{collection.name}</span>
          <span>{formatNumber(collection.posts)}</span>
        </li>
      ))}
    </ol>
  );
}

/** "7 years 2 months", "5 months", "under a month" since the day the account was made. */
export function accountAge(joinDate: string, now: number): string | null {
  const joined = Date.parse(`${joinDate}T00:00:00Z`);
  if (Number.isNaN(joined) || joined > now) {
    return null;
  }
  const months = Math.floor(((now - joined) / MS_PER_YEAR) * MONTHS_PER_YEAR);
  const years = Math.floor(months / MONTHS_PER_YEAR);
  const rest = months % MONTHS_PER_YEAR;
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${String(years)} ${years === 1 ? "year" : "years"}`);
  }
  if (rest > 0) {
    parts.push(`${String(rest)} ${rest === 1 ? "month" : "months"}`);
  }
  return parts.length > 0 ? parts.join(" ") : "under a month";
}

type ProfileTile = { readonly label: string; readonly text: string };

/** The tiles of the profile block; a number the page did not give is left out. */
export function profileTiles(profile: ProfileStats, now: number): ProfileTile[] {
  const tiles: ProfileTile[] = [];
  const age = profile.joinDate === undefined ? null : accountAge(profile.joinDate, now);
  if (age !== null && profile.joinDate !== undefined) {
    // Read as a day of the local calendar: read as UTC, the first day of a
    // month would show as the month before it west of Greenwich.
    const joined = Date.parse(`${profile.joinDate}T00:00:00`);
    tiles.push({ label: age, text: `${SINCE_PREFIX}${formatMonth(joined)}` });
  }
  // The site gives the level only as its name ("Members"), there is no
  // number behind it, so the name is the large value of the tile.
  if (profile.level !== undefined) {
    tiles.push({ label: LEVEL_LABEL, text: profile.level });
  }
  const counts: readonly (readonly [string, number | undefined])[] = [
    ["Posts uploaded", profile.posts],
    ["Deleted posts", profile.deletedPosts],
    ["Comments", profile.comments],
    ["Tag edits", profile.tagEdits],
    ["Note edits", profile.noteEdits],
    ["Forum posts", profile.forumPosts],
  ];
  for (const [label, value] of counts) {
    if (value !== undefined) {
      tiles.push({ label, text: formatNumber(value) });
    }
  }
  return tiles;
}

/** Under featureState: the top tags as they were counted the last time. */
const TOP_TAGS_STATE_ID = "stats-top-tags";

/** The top tags kept from the last count, or null when none were kept. */
export function readKeptTopTags(): TagCount[] | null {
  const kept = getFeatureState(TOP_TAGS_STATE_ID);
  if (!Array.isArray(kept)) {
    return null;
  }
  const tags: TagCount[] = [];
  for (const item of kept) {
    if (!Array.isArray(item)) {
      return null;
    }
    const [tag, count]: readonly unknown[] = item;
    if (typeof tag !== "string" || typeof count !== "number") {
      return null;
    }
    tags.push({ tag, count });
  }
  return tags;
}

/** Keeps the count for the next opening of the page; nothing is written when it is the same. */
export function keepTopTags(tags: readonly TagCount[]): void {
  const next = tags.map((entry) => [entry.tag, entry.count]);
  if (JSON.stringify(getFeatureState(TOP_TAGS_STATE_ID)) !== JSON.stringify(next)) {
    setFeatureState(TOP_TAGS_STATE_ID, next);
  }
}

/** Grey rows in place of the tags while they are counted, as many as the list is long. */
function TagsSkeleton(): JSX.Element {
  return (
    <div
      className={`${TOP_CLASS} ${SKELETON_CLASS}`}
      role="status"
      aria-label={TOP_TAGS_BUSY_LABEL}
    >
      {Array.from({ length: TOP_TAGS_LIMIT }, (_, index) => (
        <div key={index}>
          <span className={SKELETON_BAR_CLASS} />
        </div>
      ))}
    </div>
  );
}

/**
 * Bars of the most frequent tags among the favorites, from the local index.
 * The block stands on the page from the first paint with grey rows in it:
 * drawn only once the tags were counted, it moved the page under the eyes.
 */
function FavoriteTagsBlock(): JSX.Element {
  // What was counted the last time is shown at once, and put right when the
  // count of now is ready: reading the whole index takes a moment every time.
  const [tags, setTags] = useState<readonly TagCount[] | null>(() => readKeptTopTags());
  useEffect(() => {
    let alive = true;
    readFavoriteIndex()
      .then((entries) => {
        const counted = topFavoriteTags(entries, loadFavSet(), TOP_TAGS_LIMIT);
        keepTopTags(counted);
        if (alive) {
          setTags(counted);
        }
      })
      .catch(() => {
        if (alive) {
          setTags([]);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const largest = tags?.[0]?.count ?? 0;
  return (
    <div className={CHART_CLASS}>
      <p className={HEADING_CLASS}>{TOP_TAGS_HEADING}</p>
      {tags === null ? (
        <TagsSkeleton />
      ) : largest === 0 ? (
        <p className={HINT_CLASS}>{TOP_TAGS_EMPTY}</p>
      ) : (
        <ol className={TOP_CLASS}>
          {tags.map((entry) => (
            <li key={entry.tag} className={TOP_ROW_CLASS}>
              <span title={entry.tag}>{entry.tag.replaceAll("_", " ")}</span>
              <span className={TOP_BAR_CLASS} aria-hidden="true">
                <span
                  className={TOP_FILL_CLASS}
                  style={{
                    width: `${String(Math.max(MIN_BAR_PERCENT, Math.round((entry.count / largest) * PERCENT)))}%`,
                  }}
                />
              </span>
              <span>{formatNumber(entry.count)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ProfileBlock(): JSX.Element {
  const [profile, setProfile] = useState<ProfileStats | null>(() => readStoredProfileStats());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = (): void => {
    setBusy(true);
    setError("");
    refreshProfileStats()
      .then((next) => {
        setProfile(next);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : String(reason));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  // The numbers are read when the page is opened (Kaze, 17.11.2026), unless
  // they were read a short while ago: opening the page twice in a row does
  // not ask the site twice. The button reads them at once.
  useEffect(() => {
    if (profileIsStale(readStoredProfileStats(), Date.now())) {
      refresh();
    }
  }, []);

  return (
    <div className={`${CHART_CLASS} ${PROFILE_CLASS}`}>
      <div className={PROFILE_HEAD_CLASS}>
        <p className={HEADING_CLASS}>{PROFILE_HEADING}</p>
        <div className={PROFILE_SIDE_CLASS}>
          {profile === null ? null : (
            <span className={HINT_CLASS}>
              {`${PROFILE_READ_PREFIX}${formatDayTime(profile.readAt)}`}
            </span>
          )}
          <Button
            variant="secondary"
            size="s"
            title={PROFILE_REFRESH_TITLE}
            disabled={busy}
            onClick={refresh}
          >
            {busy ? PROFILE_BUSY_LABEL : PROFILE_REFRESH_LABEL}
          </Button>
        </div>
      </div>
      {error.length > 0 ? (
        <p className={HINT_CLASS} role="status">{`${PROFILE_FAILED_PREFIX}${error}`}</p>
      ) : null}
      {profile === null ? (
        <p className={HINT_CLASS}>{PROFILE_EMPTY}</p>
      ) : (
        <div className={TILES_CLASS}>
          {profileTiles(profile, Date.now()).map((tile) => (
            <div key={tile.label} className={TILE_CLASS}>
              <span className={TILE_VALUE_CLASS}>{tile.text}</span>
              <span className={TILE_LABEL_CLASS}>{tile.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatsSection(): JSX.Element {
  const stats = computeStats(load(), loadFavSet().size);

  return (
    <section className={`rdw-section ${SECTION_CLASS}`}>
      <style>{STATS_SECTION_CSS}</style>
      <div className={COLUMN_CLASS}>
      <div className={TILES_CLASS}>
        {stats.tiles.map((tile) => (
          <div key={tile.label} className={TILE_CLASS}>
            <span className={TILE_VALUE_CLASS}>
              {tile.unit === undefined
                ? formatNumber(tile.value)
                : `${formatNumber(tile.value)} ${tile.unit}`}
            </span>
            <span className={TILE_LABEL_CLASS}>{tile.label}</span>
            {tile.detail === undefined ? null : (
              <span className={TILE_LABEL_CLASS}>{tile.detail}</span>
            )}
          </div>
        ))}
      </div>

      <div className={CHART_CLASS}>
        <p className={HEADING_CLASS}>{TOP_HEADING}</p>
        <CollectionList collections={stats.topCollections} />
      </div>
        <ProfileBlock />
      </div>
      <div className={COLUMN_CLASS}>
        <FavoriteTagsBlock />
      </div>
      <p className={`${HINT_CLASS} ${FOOT_CLASS}`}>{HINT}</p>
    </section>
  );
}

/** The Statistics page of the site menu. */
export function StatsPage(): JSX.Element {
  return (
    <Card className={PANEL_UI_CLASS.pageCard}>
      <StatsSection />
    </Card>
  );
}
