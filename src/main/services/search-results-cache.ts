import log from "electron-log";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../db/schema";
import { searchResultsCache } from "../db/schema";
import { BooruPostSchema, type BooruPost } from "../../shared/schemas/booru";
import {
  SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION,
  SEARCH_RESULTS_CACHE_TTL_MS,
} from "../config/search-results-cache-constants";

type AppDatabase = BetterSQLite3Database<typeof schema>;

const inFlightSearches = new Map<string, Promise<BooruPost[]>>();

const CachedBooruPostSchema = BooruPostSchema.extend({
  createdAt: z.coerce.date(),
});

/** Versioned JSON DSL for search_results_cache.response_payload (v1). */
const SearchResultsCachePayloadV1Schema = z.object({
  posts: z.array(CachedBooruPostSchema).min(1),
});

export type CachedSearchPageLookup =
  | { status: "found"; posts: BooruPost[] }
  | { status: "not_found" }
  | { status: "miss" };

function isActiveCacheEntry(resolvedAt: Date, nowMs: number): boolean {
  return nowMs - resolvedAt.getTime() < SEARCH_RESULTS_CACHE_TTL_MS;
}

function serializeFoundPayload(posts: BooruPost[]): string {
  const payload = {
    posts: posts.map((post) => ({
      id: post.id,
      fileUrl: post.fileUrl,
      previewUrl: post.previewUrl,
      sampleUrl: post.sampleUrl,
      tags: post.tags,
      rating: post.rating,
      score: post.score,
      source: post.source,
      width: post.width,
      height: post.height,
      createdAt: post.createdAt.toISOString(),
    })),
  };
  return JSON.stringify(payload);
}

/**
 * Parse JSON payload only through the versioned resolver.
 * Unknown version / corrupt JSON / empty found payload → miss (never not_found).
 */
export function parseSearchResultsCachePayload(
  schemaVersion: number,
  raw: string | null
): BooruPost[] | null {
  if (schemaVersion !== SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION) {
    return null;
  }
  if (raw === null || raw.length === 0) {
    return null;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  const parsed = SearchResultsCachePayloadV1Schema.safeParse(json);
  if (!parsed.success) {
    return null;
  }
  return parsed.data.posts;
}

/**
 * Single read of search_results_cache for one canonical key.
 * found within TTL → posts; not_found within TTL → confirmed empty; else miss.
 */
export function loadSearchResultsCache(
  db: AppDatabase,
  cacheKey: string,
  nowMs: number = Date.now()
): CachedSearchPageLookup {
  const rows = db
    .select()
    .from(searchResultsCache)
    .where(eq(searchResultsCache.cacheKey, cacheKey))
    .all();
  const row = rows[0];
  if (!row) {
    return { status: "miss" };
  }
  if (!isActiveCacheEntry(row.resolvedAt, nowMs)) {
    return { status: "miss" };
  }
  if (row.status === "not_found") {
    return { status: "not_found" };
  }

  const posts = parseSearchResultsCachePayload(
    row.payloadSchemaVersion,
    row.responsePayload
  );
  if (posts === null) {
    return { status: "miss" };
  }
  return { status: "found", posts };
}

function upsertFoundEntry(db: AppDatabase, cacheKey: string, posts: BooruPost[]): void {
  const resolvedAt = new Date();
  const values = {
    cacheKey,
    status: "found" as const,
    payloadSchemaVersion: SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION,
    responsePayload: serializeFoundPayload(posts),
    resolvedAt,
  };

  db.transaction((tx) => {
    tx.insert(searchResultsCache)
      .values(values)
      .onConflictDoUpdate({
        target: searchResultsCache.cacheKey,
        set: {
          status: sql`excluded.status`,
          payloadSchemaVersion: sql`excluded.payload_schema_version`,
          responsePayload: sql`excluded.response_payload`,
          resolvedAt: sql`excluded.resolved_at`,
        },
      })
      .run();
  });
}

function upsertNotFoundEntry(db: AppDatabase, cacheKey: string): void {
  const resolvedAt = new Date();
  const values = {
    cacheKey,
    status: "not_found" as const,
    payloadSchemaVersion: SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION,
    responsePayload: null,
    resolvedAt,
  };

  db.transaction((tx) => {
    tx.insert(searchResultsCache)
      .values(values)
      .onConflictDoUpdate({
        target: searchResultsCache.cacheKey,
        set: {
          status: sql`excluded.status`,
          payloadSchemaVersion: sql`excluded.payload_schema_version`,
          responsePayload: sql`excluded.response_payload`,
          resolvedAt: sql`excluded.resolved_at`,
        },
      })
      .run();
  });
}

function persistSearchResultsOutcome(
  db: AppDatabase,
  cacheKey: string,
  posts: BooruPost[],
  persistEmpty: boolean
): void {
  if (posts.length > 0) {
    upsertFoundEntry(db, cacheKey, posts);
    return;
  }
  if (persistEmpty) {
    upsertNotFoundEntry(db, cacheKey);
    return;
  }
  log.debug(
    "[SearchCache] empty page not persisted (unresolved-style; not a confirmed not_found)"
  );
}

export type ResolveCachedSearchPageOptions = {
  persistEmpty: boolean;
  nowMs?: number;
};

/**
 * Cache-first search page: hit within TTL skips fetch; miss fetches then persists
 * found / not_found. Fetch failures (429/network) are unresolved — not written.
 */
export async function resolveCachedSearchPage(
  db: AppDatabase,
  cacheKey: string,
  fetchFromProvider: () => Promise<BooruPost[]>,
  options: ResolveCachedSearchPageOptions
): Promise<BooruPost[]> {
  const nowMs = options.nowMs ?? Date.now();
  const cached = loadSearchResultsCache(db, cacheKey, nowMs);

  if (cached.status === "found") {
    log.info(
      `[SearchCache] hit found posts=${cached.posts.length}`
    );
    return cached.posts;
  }
  if (cached.status === "not_found") {
    log.info("[SearchCache] hit not_found");
    return [];
  }

  log.info("[SearchCache] miss, fetching");

  const existing = inFlightSearches.get(cacheKey);
  if (existing) {
    return existing;
  }

  const lookupPromise = (async (): Promise<BooruPost[]> => {
    const posts = await fetchFromProvider();
    persistSearchResultsOutcome(db, cacheKey, posts, options.persistEmpty);
    return posts;
  })();

  inFlightSearches.set(cacheKey, lookupPromise);
  try {
    return await lookupPromise;
  } catch (error) {
    log.debug(
      "[SearchCache] unresolved fetch (not persisted as not_found)",
      error
    );
    throw error;
  } finally {
    inFlightSearches.delete(cacheKey);
  }
}

/** Test-only reset of module-level coordination state. */
export function resetSearchResultsCacheForTests(): void {
  inFlightSearches.clear();
}
