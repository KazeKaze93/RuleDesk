import log from "electron-log";
import { and, eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../db/schema";
import { postLookupCache } from "../db/schema";
import { POST_LOOKUP_NOT_FOUND_TTL_MS } from "../config/post-lookup-constants";
import type { ProviderId } from "../../shared/constants";
import type { BooruPost } from "../../shared/schemas/booru";

type AppDatabase = BetterSQLite3Database<typeof schema>;

export type PostLookupCacheState =
  | { status: "found" }
  | { status: "not_found" }
  | { status: "miss" };

export type ResolvedPostLookup =
  | { status: "found"; post: BooruPost }
  | { status: "not_found" };

const inFlightLookups = new Map<string, Promise<ResolvedPostLookup>>();

function lookupKey(provider: ProviderId, postId: number): string {
  return `${provider}:${postId}`;
}

function isActiveNotFound(resolvedAt: Date, nowMs: number): boolean {
  return nowMs - resolvedAt.getTime() < POST_LOOKUP_NOT_FOUND_TTL_MS;
}

/**
 * Single read of post_lookup_cache for one provider+postId.
 * not_found within TTL → skip HTTP; found does not skip (body lives in `posts`);
 * expired / missing → miss.
 */
export function loadPostLookupCache(
  db: AppDatabase,
  provider: ProviderId,
  postId: number,
  nowMs: number = Date.now()
): PostLookupCacheState {
  const rows = db
    .select()
    .from(postLookupCache)
    .where(
      and(
        eq(postLookupCache.provider, provider),
        eq(postLookupCache.postId, postId)
      )
    )
    .all();
  const row = rows[0];
  if (!row) {
    return { status: "miss" };
  }
  if (row.status === "not_found" && isActiveNotFound(row.resolvedAt, nowMs)) {
    return { status: "not_found" };
  }
  if (row.status === "found") {
    return { status: "found" };
  }
  return { status: "miss" };
}

function upsertLookupStatus(
  db: AppDatabase,
  provider: ProviderId,
  postId: number,
  status: "found" | "not_found"
): void {
  const resolvedAt = new Date();
  db.transaction((tx) => {
    tx.insert(postLookupCache)
      .values({
        provider,
        postId,
        status,
        resolvedAt,
      })
      .onConflictDoUpdate({
        target: [postLookupCache.provider, postLookupCache.postId],
        set: {
          status: sql`excluded.status`,
          resolvedAt: sql`excluded.resolved_at`,
        },
      })
      .run();
  });
}

/**
 * Cache-first single-post lookup (`id:${postId}`).
 * Confirmed empty API → persist not_found.
 * Matching post → persist found (clears a prior not_found) and return the body.
 * Fetch throws (429/network/parse) → unresolved, not written.
 */
export async function resolvePostLookup(
  db: AppDatabase,
  provider: ProviderId,
  postId: number,
  fetchFromProvider: () => Promise<BooruPost[]>,
  nowMs: number = Date.now()
): Promise<ResolvedPostLookup> {
  const cached = loadPostLookupCache(db, provider, postId, nowMs);
  if (cached.status === "not_found") {
    log.info(
      `[PostLookup] hit not_found provider=${provider} postId=${postId}`
    );
    return { status: "not_found" };
  }

  const key = lookupKey(provider, postId);
  const existing = inFlightLookups.get(key);
  if (existing) {
    return existing;
  }

  const lookupPromise = (async (): Promise<ResolvedPostLookup> => {
    const posts = await fetchFromProvider();
    const match = posts.find((post) => post.id === postId);
    if (match === undefined) {
      upsertLookupStatus(db, provider, postId, "not_found");
      return { status: "not_found" };
    }
    upsertLookupStatus(db, provider, postId, "found");
    return { status: "found", post: match };
  })();

  inFlightLookups.set(key, lookupPromise);
  try {
    return await lookupPromise;
  } catch (error) {
    log.debug(
      `[PostLookup] unresolved fetch (not persisted as not_found) provider=${provider} postId=${postId}`,
      error
    );
    throw error;
  } finally {
    inFlightLookups.delete(key);
  }
}

/** Test-only reset of module-level coordination state. */
export function resetPostLookupCacheForTests(): void {
  inFlightLookups.clear();
}
