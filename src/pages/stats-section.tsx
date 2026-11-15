import type { JSX } from "preact";

import { COLLECTION_KIND_POSTS } from "../config/constants";
import { loadFavSet } from "../storage/favs";
import { resolveCollectionKind, type StorageData } from "../storage/schema";
import { getSeenPostId, load } from "../storage/store";
import { Card } from "../ui/kit";
import { PANEL_UI_CLASS } from "./constants";

/**
 * Numbers about what the script stores, computed from local data when the
 * settings page opens. Nothing is requested from the site, so these are counts
 * of your own library, not totals of the site.
 */

const SECTION_CLASS = "rdw-stats";
const TILES_CLASS = "rdw-stats-tiles";
const TILE_CLASS = "rdw-stats-tile";
const TILE_VALUE_CLASS = "rdw-stats-value";
const TILE_LABEL_CLASS = "rdw-stats-label";
const TOP_CLASS = "rdw-stats-top";
const TOP_ROW_CLASS = "rdw-stats-top-row";
const TOP_BAR_CLASS = "rdw-stats-top-bar";
const TOP_FILL_CLASS = "rdw-stats-top-fill";
const HINT_CLASS = "rdw-stats-hint";

const LOCALE = "en-US";
const TOP_ARTISTS_LIMIT = 10;
const BYTES_PER_KB = 1024;
const PERCENT = 100;
const MIN_BAR_PERCENT = 2;
const TILE_MIN_PX = 130;

const TOP_HEADING = "Top followed artists by posts";
const TOP_EMPTY = "Open an artist's page or press Refresh on Following to fill this list.";
const HINT =
  "Counted from the script's own data in this browser. Seen posts keep only the newest marks.";

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
.${TILE_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: var(--rdw-surface-2);
  border-radius: var(--rdw-radius-m);
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
  background: var(--rdw-surface-2);
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

export type TopArtist = {
  readonly tag: string;
  readonly posts: number;
};

export type Stats = {
  readonly tiles: readonly StatsTile[];
  readonly topArtists: readonly TopArtist[];
};

/** Pure: the numbers for a stored state. */
export function computeStats(
  data: StorageData,
  favoriteCount: number,
  seenPostId: number,
): Stats {
  let custom = 0;
  let dynamic = 0;
  const collected = new Set<number>();
  for (const collection of data.collections) {
    if (resolveCollectionKind(collection) === COLLECTION_KIND_POSTS) {
      custom += 1;
      for (const id of collection.postIds ?? []) {
        collected.add(id);
      }
    } else {
      dynamic += 1;
    }
  }

  let seenPosts = 0;
  for (const flags of Object.values(data.marks)) {
    if (flags.seen === true) {
      seenPosts += 1;
    }
  }

  let withNew = 0;
  const top: TopArtist[] = [];
  for (const artist of data.artists) {
    if (seenPostId > 0 && (artist.lastPostId ?? 0) > seenPostId) {
      withNew += 1;
    }
    if (artist.postCount !== undefined) {
      top.push({ tag: artist.tag, posts: artist.postCount.value });
    }
  }
  top.sort((a, b) => b.posts - a.posts || a.tag.localeCompare(b.tag));

  const sizeKb = Math.ceil(JSON.stringify(data).length / BYTES_PER_KB);

  return {
    tiles: [
      { label: "Followed artists", value: data.artists.length },
      { label: "Artists with new posts", value: withNew },
      { label: "Custom collections", value: custom },
      { label: "Dynamic collections", value: dynamic },
      { label: "Posts in custom collections", value: collected.size },
      { label: "Favorites", value: favoriteCount },
      { label: "Seen posts", value: seenPosts },
      { label: "Stored data", value: sizeKb, unit: "KB" },
    ],
    topArtists: top.slice(0, TOP_ARTISTS_LIMIT),
  };
}

function formatNumber(value: number): string {
  return value.toLocaleString(LOCALE);
}

export function StatsSection(): JSX.Element {
  const stats = computeStats(load(), loadFavSet().size, getSeenPostId());
  const largest = stats.topArtists[0]?.posts ?? 0;

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

      <p className={TILE_LABEL_CLASS}>{TOP_HEADING}</p>
      {stats.topArtists.length === 0 ? (
        <p className={HINT_CLASS}>{TOP_EMPTY}</p>
      ) : (
        <ol className={TOP_CLASS}>
          {stats.topArtists.map((artist) => {
            const share =
              largest > 0
                ? Math.max(MIN_BAR_PERCENT, Math.round((artist.posts / largest) * PERCENT))
                : 0;
            return (
              <li key={artist.tag} className={TOP_ROW_CLASS}>
                <span title={artist.tag}>{artist.tag.replaceAll("_", " ")}</span>
                <span className={TOP_BAR_CLASS} aria-hidden="true">
                  <span className={TOP_FILL_CLASS} style={{ width: `${String(share)}%` }} />
                </span>
                <span>{formatNumber(artist.posts)}</span>
              </li>
            );
          })}
        </ol>
      )}
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
