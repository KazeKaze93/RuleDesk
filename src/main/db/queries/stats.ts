import type Database from "better-sqlite3";

type SqliteDatabase = InstanceType<typeof Database>;

export type PostsTimelineRow = { month: string; count: number };

/**
 * Monthly post buckets from posts.created_at.
 * Column unit: seconds (Drizzle mode "timestamp"). Cutoff/strftime must match.
 */
export function queryPostsCreatedAtTimeline(
  sqlite: SqliteDatabase
): PostsTimelineRow[] {
  return sqlite
    .prepare<[], PostsTimelineRow>(
      `
        SELECT
          strftime('%Y-%m', datetime(created_at, 'unixepoch')) as month,
          COUNT(*) as count
        FROM posts
        WHERE created_at >= CAST(strftime('%s', 'now', 'start of month', '-11 months') AS INTEGER)
        GROUP BY month
        ORDER BY month ASC
      `
    )
    .all();
}

/** Pad query rows to a fixed 12-month window ending at the current month. */
export function fillPostsTimelineMonths(
  rows: PostsTimelineRow[],
  now: Date = new Date()
): PostsTimelineRow[] {
  const timelineMap = new Map<string, number>();
  for (const row of rows) {
    timelineMap.set(row.month, row.count);
  }

  const months: PostsTimelineRow[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;
    months.push({ month: monthKey, count: timelineMap.get(monthKey) ?? 0 });
  }
  return months;
}

export function buildPostsTimeline(
  sqlite: SqliteDatabase,
  now: Date = new Date()
): PostsTimelineRow[] {
  return fillPostsTimelineMonths(queryPostsCreatedAtTimeline(sqlite), now);
}
