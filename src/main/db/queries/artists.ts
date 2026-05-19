import { and, desc, eq, not, notLike, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../schema";
import { artists, posts } from "../schema";
import {
  EXTERNAL_ARTIST_ID,
  EXTERNAL_ARTIST_TAG_PREFIX,
  MAX_TRACKED_ARTISTS,
} from "../../../shared/constants";
import log from "electron-log";

type AppDatabase = BetterSQLite3Database<typeof schema>;
type ArtistRow = typeof artists.$inferSelect;

export type TrackedArtistWithStats = ArtistRow & {
  postsCount: number;
  lastPostAt: number | null;
};

export function getTrackedArtistsWithStats(db: AppDatabase): TrackedArtistWithStats[] {
  const rows = db
    .select({
      id: artists.id,
      name: artists.name,
      tag: artists.tag,
      provider: artists.provider,
      type: artists.type,
      apiEndpoint: artists.apiEndpoint,
      lastPostId: artists.lastPostId,
      newPostsCount: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${posts.isViewed} = 0 OR ${posts.isViewed} IS NULL THEN 1
              ELSE 0
            END
          ),
          0
        )
      `.as("newPostsCount"),
      syncStatus: artists.syncStatus,
      lastError: artists.lastError,
      lastChecked: artists.lastChecked,
      createdAt: artists.createdAt,
      postsCount: sql<number>`COALESCE(COUNT(${posts.id}), 0)`.as("postsCount"),
      lastPostAt: sql<number | null>`MAX(${posts.createdAt})`.as("lastPostAt"),
    })
    .from(artists)
    .leftJoin(posts, eq(artists.id, posts.artistId))
    .where(
      and(
        notLike(artists.tag, `${EXTERNAL_ARTIST_TAG_PREFIX}%`),
        not(eq(artists.id, EXTERNAL_ARTIST_ID))
      )
    )
    .groupBy(artists.id)
    .orderBy(desc(sql`COALESCE(${artists.lastChecked}, ${artists.createdAt})`))
    .limit(MAX_TRACKED_ARTISTS)
    .all();

  if (rows.length >= MAX_TRACKED_ARTISTS) {
    log.warn(
      `[artists] getTrackedArtistsWithStats hit limit (${MAX_TRACKED_ARTISTS}); results may be truncated`
    );
  }

  return rows;
}
