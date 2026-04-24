import { eq, sql, type SQL } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../schema";
import { playlistEntries, playlists, posts } from "../schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;
type PlaylistRow = typeof playlists.$inferSelect;

export type PlaylistWithStats = PlaylistRow & {
  postCount: number;
};

export function getManualPlaylistsWithStats(db: AppDatabase): PlaylistWithStats[] {
  return db
    .select({
      id: playlists.id,
      name: playlists.name,
      isSmart: playlists.isSmart,
      queryJson: playlists.queryJson,
      querySchemaVersion: playlists.querySchemaVersion,
      iconName: playlists.iconName,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
      postCount: sql<number>`COALESCE(COUNT(${playlistEntries.postId}), 0)`.as("postCount"),
    })
    .from(playlists)
    .leftJoin(playlistEntries, eq(playlists.id, playlistEntries.playlistId))
    .where(eq(playlists.isSmart, false))
    .groupBy(playlists.id)
    .all();
}

export function getSmartPlaylists(db: AppDatabase): PlaylistRow[] {
  return db
    .select()
    .from(playlists)
    .where(eq(playlists.isSmart, true))
    .all();
}

export function getSmartPlaylistPostCount(db: AppDatabase, whereClause: SQL | undefined): number {
  if (!whereClause) {
    return 0;
  }

  const result = db
    .select({
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(posts)
    .where(whereClause)
    .all();

  return result[0]?.count ?? 0;
}
