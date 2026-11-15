import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { COLLECTION_KIND_POSTS } from "../config/constants";
import { loadFavSet } from "../storage/favs";
import { resolveCollectionKind, type StorageData } from "../storage/schema";
import { load } from "../storage/store";
import {
  readStoredProfileStats,
  refreshProfileStats,
  type ProfileStats,
} from "../site/profile";
import { Button, Card } from "../ui/kit";
import { PANEL_UI_CLASS } from "./constants";

/**
 * Numbers about what the script stores, computed from local data when the
 * page opens. Nothing is requested from the site, so these are counts of your
 * own library, not totals of the site.
 *
 * Tiles for single numbers, a ring for the two kinds of collections, bars for
 * the collections compared by size.
 */

const SECTION_CLASS = "rdw-stats";
const TILES_CLASS = "rdw-stats-tiles";
const TILE_CLASS = "rdw-stats-tile";
const TILE_VALUE_CLASS = "rdw-stats-value";
const TILE_LABEL_CLASS = "rdw-stats-label";
const CHARTS_CLASS = "rdw-stats-charts";
const CHART_CLASS = "rdw-stats-chart";
const RING_ROW_CLASS = "rdw-stats-ring-row";
const RING_CLASS = "rdw-stats-ring";
const RING_TRACK_CLASS = "rdw-stats-ring-track";
const RING_ARC_CLASS = "rdw-stats-ring-arc";
const RING_TOTAL_CLASS = "rdw-stats-ring-total";
const LEGEND_CLASS = "rdw-stats-legend";
const SWATCH_CLASS = "rdw-stats-swatch";
const SWATCH_SECOND_CLASS = "rdw-stats-swatch--second";
const TOP_CLASS = "rdw-stats-top";
const TOP_ROW_CLASS = "rdw-stats-top-row";
const TOP_BAR_CLASS = "rdw-stats-top-bar";
const TOP_FILL_CLASS = "rdw-stats-top-fill";
const HINT_CLASS = "rdw-stats-hint";
const PROFILE_HEAD_CLASS = "rdw-stats-profile-head";

const LOCALE = "en-US";
const TOP_COLLECTIONS_LIMIT = 10;
const BYTES_PER_KB = 1024;
const PERCENT = 100;
const MIN_BAR_PERCENT = 2;
const TILE_MIN_PX = 130;
const CHART_MIN_PX = 260;
const RING_SIZE_PX = 96;
/** A circle of this radius has a circumference of 100, so a dash is a percentage. */
const RING_RADIUS = 15.915;
const RING_CENTRE = 21;
const RING_VIEW_BOX = "0 0 42 42";
const RING_STROKE = 5;
const RING_TOTAL_Y = 24;

const KINDS_HEADING = "Collections by type";
const KINDS_EMPTY = "No collections yet.";
const KIND_CUSTOM_LABEL = "Custom";
const KIND_DYNAMIC_LABEL = "Dynamic";
const TOP_HEADING = "Collections by posts";
const TOP_EMPTY = "Collections show here once they hold posts or their count is known.";
const PROFILE_HEADING = "Site profile";
const PROFILE_REFRESH_LABEL = "Refresh profile";
const PROFILE_REFRESH_TITLE =
  "Reads your profile page on the site: two requests, a moment apart";
const PROFILE_BUSY_LABEL = "Reading…";
const PROFILE_EMPTY = "Press Refresh profile to read these numbers from your profile page.";
const PROFILE_READ_PREFIX = "Read on ";
const PROFILE_FAILED_PREFIX = "Could not read the profile: ";
const DATE_LOCALE = "en-GB";
const MS_PER_YEAR = 31_557_600_000;
const MONTHS_PER_YEAR = 12;
const HINT =
  "Counted from the script's own data in this browser, except the site profile. Seen posts keep only the newest marks.";

export const STATS_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
.${CHARTS_CLASS} {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${String(CHART_MIN_PX)}px, 1fr));
  gap: 8px;
  align-items: start;
}
.${CHART_CLASS} {
  gap: 8px;
  padding: 10px 12px;
}
.${TILE_VALUE_CLASS} {
  font-size: 18px;
  font-weight: 600;
  color: var(--rdw-text);
}
.${TILE_LABEL_CLASS},
.${HINT_CLASS} {
  margin: 0;
  font-size: 12px;
  color: var(--rdw-muted);
}
.${PROFILE_HEAD_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
.${RING_ROW_CLASS} {
  display: flex;
  align-items: center;
  gap: 16px;
}
.${RING_CLASS} {
  flex: none;
  width: ${String(RING_SIZE_PX)}px;
  height: ${String(RING_SIZE_PX)}px;
}
.${RING_TRACK_CLASS},
.${RING_ARC_CLASS} {
  fill: none;
  stroke-width: ${String(RING_STROKE)};
}
.${RING_TRACK_CLASS} {
  stroke: var(--rdw-muted);
}
.${RING_ARC_CLASS} {
  stroke: var(--rdw-accent);
}
.${RING_TOTAL_CLASS} {
  fill: var(--rdw-text);
  font: 600 9px var(--rdw-font);
  text-anchor: middle;
}
.${LEGEND_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
}
.${LEGEND_CLASS} > li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.${SWATCH_CLASS} {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: var(--rdw-accent);
}
.${SWATCH_SECOND_CLASS} {
  background: var(--rdw-muted);
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
  font-size: 12px;
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
`.trim();

export type StatsTile = {
  readonly label: string;
  readonly value: number;
  /** Shown after the number, e.g. "KB". */
  readonly unit?: string;
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
      { label: "Collections", value: custom + dynamic },
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

/** Share of the first part in the whole, as a whole percentage. */
export function ringPercent(first: number, second: number): number {
  const total = first + second;
  return total === 0 ? 0 : Math.round((first / total) * PERCENT);
}

function KindsRing(props: {
  readonly custom: number;
  readonly dynamic: number;
}): JSX.Element {
  const total = props.custom + props.dynamic;
  if (total === 0) {
    return <p className={HINT_CLASS}>{KINDS_EMPTY}</p>;
  }
  const percent = ringPercent(props.custom, props.dynamic);
  const summary = `${KIND_CUSTOM_LABEL} ${String(props.custom)}, ${KIND_DYNAMIC_LABEL} ${String(props.dynamic)}`;
  return (
    <div className={RING_ROW_CLASS}>
      <svg className={RING_CLASS} viewBox={RING_VIEW_BOX} role="img" aria-label={summary}>
        <circle
          className={RING_TRACK_CLASS}
          cx={RING_CENTRE}
          cy={RING_CENTRE}
          r={RING_RADIUS}
        />
        <circle
          className={RING_ARC_CLASS}
          cx={RING_CENTRE}
          cy={RING_CENTRE}
          r={RING_RADIUS}
          stroke-dasharray={`${String(percent)} ${String(PERCENT - percent)}`}
          transform={`rotate(-90 ${String(RING_CENTRE)} ${String(RING_CENTRE)})`}
        />
        <text className={RING_TOTAL_CLASS} x={RING_CENTRE} y={RING_TOTAL_Y}>
          {formatNumber(total)}
        </text>
      </svg>
      <ul className={LEGEND_CLASS}>
        <li>
          <span className={SWATCH_CLASS} aria-hidden="true" />
          {`${KIND_CUSTOM_LABEL}: ${formatNumber(props.custom)}`}
        </li>
        <li>
          <span className={`${SWATCH_CLASS} ${SWATCH_SECOND_CLASS}`} aria-hidden="true" />
          {`${KIND_DYNAMIC_LABEL}: ${formatNumber(props.dynamic)}`}
        </li>
      </ul>
    </div>
  );
}

function CollectionBars(props: {
  readonly collections: readonly TopCollection[];
}): JSX.Element {
  const largest = props.collections[0]?.posts ?? 0;
  if (largest === 0) {
    return <p className={HINT_CLASS}>{TOP_EMPTY}</p>;
  }
  return (
    <ol className={TOP_CLASS}>
      {props.collections.map((collection) => {
        const share = Math.max(
          MIN_BAR_PERCENT,
          Math.round((collection.posts / largest) * PERCENT),
        );
        return (
          <li key={collection.id} className={TOP_ROW_CLASS}>
            <span title={collection.name}>{collection.name}</span>
            <span className={TOP_BAR_CLASS} aria-hidden="true">
              <span className={TOP_FILL_CLASS} style={{ width: `${String(share)}%` }} />
            </span>
            <span>{formatNumber(collection.posts)}</span>
          </li>
        );
      })}
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
    tiles.push({ label: `Account age (since ${profile.joinDate})`, text: age });
  }
  if (profile.level !== undefined) {
    tiles.push({ label: "Level", text: profile.level });
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

function formatDay(time: number): string {
  return new Date(time).toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  return (
    <>
      <div className={PROFILE_HEAD_CLASS}>
        <p className={TILE_LABEL_CLASS}>{PROFILE_HEADING}</p>
        <Button
          variant="secondary"
          size="s"
          title={PROFILE_REFRESH_TITLE}
          disabled={busy}
          onClick={refresh}
        >
          {busy ? PROFILE_BUSY_LABEL : PROFILE_REFRESH_LABEL}
        </Button>
        {profile === null ? null : (
          <span className={HINT_CLASS}>{`${PROFILE_READ_PREFIX}${formatDay(profile.readAt)}`}</span>
        )}
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
    </>
  );
}

export function StatsSection(): JSX.Element {
  const stats = computeStats(load(), loadFavSet().size);

  return (
    <section className={`rdw-section ${SECTION_CLASS}`}>
      <style>{STATS_SECTION_CSS}</style>
      <div className={TILES_CLASS}>
        {stats.tiles.map((tile) => (
          <div key={tile.label} className={TILE_CLASS}>
            <span className={TILE_VALUE_CLASS}>
              {tile.unit === undefined
                ? formatNumber(tile.value)
                : `${formatNumber(tile.value)} ${tile.unit}`}
            </span>
            <span className={TILE_LABEL_CLASS}>{tile.label}</span>
          </div>
        ))}
      </div>

      <div className={CHARTS_CLASS}>
        <div className={CHART_CLASS}>
          <p className={TILE_LABEL_CLASS}>{KINDS_HEADING}</p>
          <KindsRing custom={stats.customCollections} dynamic={stats.dynamicCollections} />
        </div>
        <div className={CHART_CLASS}>
          <p className={TILE_LABEL_CLASS}>{TOP_HEADING}</p>
          <CollectionBars collections={stats.topCollections} />
        </div>
      </div>
      <ProfileBlock />
      <p className={HINT_CLASS}>{HINT}</p>
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
