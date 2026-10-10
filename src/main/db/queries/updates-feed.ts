import {
  and,
  count,
  eq,
  gte,
  inArray,
  max,
  not,
  notLike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../schema";
import { artists, posts } from "../schema";
import {
  EXTERNAL_ARTIST_ID,
  EXTERNAL_ARTIST_TAG_PREFIX,
} from "../../../shared/constants";
import type { PostFilterRequest } from "../../../shared/schemas/post";
import {
  asMillis,
  asSeconds,
  dateToMillis,
  secondsToMillis,
  type Millis,
} from "../../../shared/types/time";
import { buildPostsTagsFilterCondition } from "./post-tag-filter";

/** Heuristic: values below this are unix Seconds; at/above are already Millis. */
const UNIX_MS_THRESHOLD = 1_000_000_000_000;

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * Join ON for Updates feed: sinceTracking + real tracked artists only.
 * Single source of truth for feed list, badge, header count, and mark-all-read.
 */
export function buildUpdatesFeedJoinOn(): SQL {
  const joinOn = and(
    eq(posts.artistId, artists.id),
    gte(posts.publishedAt, artists.createdAt),
    not(eq(posts.artistId, EXTERNAL_ARTIST_ID)),
    notLike(artists.tag, `${EXTERNAL_ARTIST_TAG_PREFIX}%`)
  );
  if (!joinOn) {
    throw new Error("[updates-feed] Failed to build feed join condition");
  }
  return joinOn;
}

/** Extra WHERE on posts when using the feed join (exclude external scope). */
export function buildUpdatesFeedPostScopeCondition(): SQL {
  return not(eq(posts.artistId, EXTERNAL_ARTIST_ID));
}

/** Tracked artists only (excludes placeholder external_* / id=0). */
export function buildTrackedArtistsWhere(): SQL {
  const where = and(
    not(eq(artists.id, EXTERNAL_ARTIST_ID)),
    notLike(artists.tag, `${EXTERNAL_ARTIST_TAG_PREFIX}%`)
  );
  if (!where) {
    throw new Error("[updates-feed] Failed to build tracked-artists where");
  }
  return where;
}

function buildOptionalFeedFilterConditions(
  filters: PostFilterRequest | undefined
): SQL[] {
  const conditions: SQL[] = [];

  if (filters?.tags && filters.tags.trim().length > 0) {
    conditions.push(buildPostsTagsFilterCondition(filters.tags));
  }

  if (filters?.isFavorited !== undefined) {
    conditions.push(eq(posts.isFavorited, filters.isFavorited));
  }

  if (filters?.isViewed !== undefined) {
    conditions.push(eq(posts.isViewed, filters.isViewed));
  }

  if (filters?.mediaType === "videos") {
    conditions.push(eq(posts.mediaType, "video"));
  } else if (filters?.mediaType === "images") {
    const imageOrNull = or(
      eq(posts.mediaType, "image"),
      sql`${posts.mediaType} IS NULL`
    );
    if (imageOrNull) {
      conditions.push(imageOrNull);
    }
  }

  if (filters?.aiFilter === "hide" || filters?.aiFilter === "only") {
    const aiTags = [
      "ai_generated",
      "ai-generated",
      "ai_generation",
      "ai-generated_content",
    ] as const;
    const aiOr = or(
      ...aiTags.map(
        (tag) =>
          sql`instr(' ' || lower(${posts.tags}) || ' ', ' ' || ${tag} || ' ') > 0`
      )
    );
    if (aiOr) {
      conditions.push(filters.aiFilter === "hide" ? not(aiOr) : aiOr);
    }
  }

  return conditions;
}

function buildFeedWhereClause(
  filters: PostFilterRequest | undefined,
  unreadOnly: boolean
): SQL {
  const parts: SQL[] = [buildUpdatesFeedPostScopeCondition()];
  if (unreadOnly) {
    parts.push(eq(posts.isViewed, false));
  }
  parts.push(...buildOptionalFeedFilterConditions(filters));
  const where = and(...parts);
  if (!where) {
    throw new Error("[updates-feed] Failed to build feed where clause");
  }
  return where;
}

export function countUpdatesFeedPosts(
  db: AppDatabase,
  options: {
    filters?: PostFilterRequest;
    unreadOnly?: boolean;
  } = {}
): number {
  const unreadOnly = options.unreadOnly === true;
  const row = db
    .select({ value: count() })
    .from(posts)
    .innerJoin(artists, buildUpdatesFeedJoinOn())
    .where(buildFeedWhereClause(options.filters, unreadOnly))
    .get();
  return row?.value ?? 0;
}

function buildUnreadOrNullCondition(): SQL {
  const unread = or(eq(posts.isViewed, false), sql`${posts.isViewed} IS NULL`);
  if (!unread) {
    throw new Error("[updates-feed] Failed to build unread-or-null condition");
  }
  return unread;
}

/**
 * Match condition for mark-all-read: feed scope + optional filters + unread.
 * Same builder as feed list/badge so tag filters stay aligned.
 */
function buildMarkAllReadWhere(filters: PostFilterRequest | undefined): SQL {
  const where = and(
    buildFeedWhereClause(filters, false),
    buildUnreadOrNullCondition()
  );
  if (!where) {
    throw new Error("[updates-feed] Failed to build mark-all-read where");
  }
  return where;
}

/**
 * Correlated posts match for one outer `artists` row (sinceTracking + unread + filters).
 * Used inside set-based newPostsCount decrement — no id arrays in JS.
 */
function buildCorrelatedMarkAllReadMatch(
  filters: PostFilterRequest | undefined
): SQL {
  const where = and(
    eq(posts.artistId, artists.id),
    gte(posts.publishedAt, artists.createdAt),
    buildUpdatesFeedPostScopeCondition(),
    buildUnreadOrNullCondition(),
    ...buildOptionalFeedFilterConditions(filters)
  );
  if (!where) {
    throw new Error(
      "[updates-feed] Failed to build correlated mark-all-read match"
    );
  }
  return where;
}

/**
 * Mark all posts in the Updates feed scope (optional tag/media/ai filters).
 * Set-based: UPDATE … WHERE id IN (SELECT …) and artist counter via correlated
 * COUNT subquery. Synchronous transaction; no await; no id arrays in JS.
 */
export function markUpdatesFeedPostsViewed(
  db: AppDatabase,
  filters?: PostFilterRequest
): number {
  return db.transaction((tx) => {
    const matchWhere = buildMarkAllReadWhere(filters);
    const correlatedMatch = buildCorrelatedMarkAllReadMatch(filters);

    // Decrement while posts are still unread (correlated COUNT uses isViewed).
    tx.update(artists)
      .set({
        newPostsCount: sql`MAX(0, ${artists.newPostsCount} - (
          SELECT COUNT(*) FROM ${posts} WHERE ${correlatedMatch}
        ))`,
      })
      .where(
        and(
          buildTrackedArtistsWhere(),
          sql`EXISTS (SELECT 1 FROM ${posts} WHERE ${correlatedMatch})`
        )
      )
      .run();

    const matchingIds = tx
      .select({ id: posts.id })
      .from(posts)
      .innerJoin(artists, buildUpdatesFeedJoinOn())
      .where(matchWhere);

    const updateResult = tx
      .update(posts)
      .set({ isViewed: true })
      .where(inArray(posts.id, matchingIds))
      .run();

    return updateResult.changes;
  });
}

/**
 * Mark specific post ids viewed (Updates auto-seen for loaded pages only).
 */
export function markPostsViewedByIds(
  db: AppDatabase,
  postIds: readonly number[]
): number {
  if (postIds.length === 0) {
    return 0;
  }

  return db.transaction((tx) => {
    const matching = tx
      .select({ id: posts.id, artistId: posts.artistId })
      .from(posts)
      .where(
        and(
          inArray(posts.id, [...postIds]),
          or(eq(posts.isViewed, false), sql`${posts.isViewed} IS NULL`)
        )
      )
      .all();

    if (matching.length === 0) {
      return 0;
    }

    const ids = matching.map((row) => row.id);
    tx.update(posts)
      .set({ isViewed: true })
      .where(inArray(posts.id, ids))
      .run();

    const decrements = new Map<number, number>();
    for (const row of matching) {
      decrements.set(row.artistId, (decrements.get(row.artistId) ?? 0) + 1);
    }
    for (const [artistId, n] of decrements) {
      tx.update(artists)
        .set({
          newPostsCount: sql`MAX(0, ${artists.newPostsCount} - ${n})`,
        })
        .where(eq(artists.id, artistId))
        .run();
    }

    return matching.length;
  });
}

/**
 * MAX(artists.last_checked) for tracked artists, as Unix Millis (or null).
 * Drizzle timestamp columns are Seconds on disk; Date → Millis for UI.
 */
export function getLastTrackedArtistSyncAtMs(db: AppDatabase): Millis | null {
  const row = db
    .select({ value: max(artists.lastChecked) })
    .from(artists)
    .where(buildTrackedArtistsWhere())
    .get();

  const value = row?.value;
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return dateToMillis(value);
  }
  if (typeof value === "number") {
    return value < UNIX_MS_THRESHOLD
      ? secondsToMillis(asSeconds(value))
      : asMillis(value);
  }
  return null;
}
