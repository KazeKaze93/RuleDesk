import log from "electron-log";
import { inArray, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../db/schema";
import { TAG_TYPES, tagMetadata } from "../db/schema";
import { getProvider } from "../providers";
import type { IBooruProvider, ProviderSettings } from "../providers/types";
import type { ProviderThrottle } from "../providers/provider-throttle";
import {
  fetchRule34TagMetadata,
  Rule34TagRateLimitError,
  type Rule34TagMetadataEntry,
  type Rule34TagMetadataLookupResult,
} from "../providers/rule34-tag-metadata";
import {
  TAG_RESOLVE_429_BURST_LOG_WINDOW_MS,
  TAG_RESOLVE_DEFAULT_RETRY_AFTER_MS,
  TAG_RESOLVE_MAX_RATE_LIMIT_RETRIES,
  TAG_RESOLVE_MAX_RETRY_AFTER_MS,
  TAG_RESOLVE_NOT_FOUND_TTL_MS,
} from "../config/tag-resolve-constants";

type AppDatabase = BetterSQLite3Database<typeof schema>;

type TagLookupResult = Rule34TagMetadataLookupResult;

type TagResolveWaveStats = {
  requested: number;
  tagMetadataHits: number;
  inFlightHits: number;
  apiCalls: number;
  rateLimitedCount: number;
};

/** Session view of tag_metadata for one resolve wave (single SQLite source of truth). */
export type TagMetadataCacheState = {
  foundTypes: Map<string, number>;
  /** Confirmed not_found within TTL — skip API; drawer leaves tag uncategorized. */
  activeNotFound: Set<string>;
};

const inFlightLookups = new Map<string, Promise<TagLookupResult>>();
let last429BurstLogAtMs = 0;

/** Placeholder type for not_found rows; status is the authority. */
const NOT_FOUND_TYPE_PLACEHOLDER = TAG_TYPES.GENERAL;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function hasTagMetadataAccess(
  provider: IBooruProvider
): provider is IBooruProvider & {
  getRequestThrottle: () => ProviderThrottle;
  getRequestHeaders: () => Record<string, string>;
} {
  return (
    provider.id === "rule34" &&
    "getRequestThrottle" in provider &&
    "getRequestHeaders" in provider &&
    typeof provider.getRequestThrottle === "function" &&
    typeof provider.getRequestHeaders === "function"
  );
}

function getRule34TagProvider(): {
  getRequestThrottle: () => ProviderThrottle;
  getRequestHeaders: () => Record<string, string>;
} {
  const provider = getProvider("rule34");
  if (!hasTagMetadataAccess(provider)) {
    throw new Error("Rule34 provider does not support tag metadata lookup");
  }
  return provider;
}

function resolveRetryAfterMs(retryAfterMs: number, attempt: number): number {
  if (retryAfterMs > 0) {
    return Math.min(retryAfterMs, TAG_RESOLVE_MAX_RETRY_AFTER_MS);
  }
  const exponentialBackoff =
    TAG_RESOLVE_DEFAULT_RETRY_AFTER_MS * 2 ** attempt;
  return Math.min(exponentialBackoff, TAG_RESOLVE_MAX_RETRY_AFTER_MS);
}

function recordRateLimitBurst(retryAfterMs: number, attempt: number): void {
  const delayMs = resolveRetryAfterMs(retryAfterMs, attempt);
  // Shared host gate — never keep a parallel local copy of rate-limit state.
  getRule34TagProvider().getRequestThrottle().notifyRateLimited(delayMs);

  const now = Date.now();
  if (now - last429BurstLogAtMs >= TAG_RESOLVE_429_BURST_LOG_WINDOW_MS) {
    last429BurstLogAtMs = now;
    log.warn(
      `[TagResolve] Rule34 tag API rate limited; backing off for ${delayMs}ms`
    );
  }
}

function isActiveNotFound(resolvedAt: Date, nowMs: number): boolean {
  return nowMs - resolvedAt.getTime() < TAG_RESOLVE_NOT_FOUND_TTL_MS;
}

/**
 * Single read of tag_metadata for the requested names.
 * found → foundTypes; not_found within TTL → activeNotFound; expired not_found → miss.
 */
export function loadTagMetadataCache(
  db: AppDatabase,
  uniqueTags: string[],
  nowMs: number = Date.now()
): TagMetadataCacheState {
  const foundTypes = new Map<string, number>();
  const activeNotFound = new Set<string>();

  if (uniqueTags.length === 0) {
    return { foundTypes, activeNotFound };
  }

  const rows = db
    .select()
    .from(tagMetadata)
    .where(inArray(tagMetadata.name, uniqueTags))
    .all();

  for (const row of rows) {
    if (row.status === "found") {
      foundTypes.set(row.name, row.type);
      continue;
    }
    if (row.status === "not_found" && isActiveNotFound(row.resolvedAt, nowMs)) {
      activeNotFound.add(row.name);
    }
  }

  return { foundTypes, activeNotFound };
}

async function lookupTagFromApi(
  tagName: string,
  settings: ProviderSettings
): Promise<TagLookupResult> {
  const provider = getRule34TagProvider();

  for (
    let attempt = 0;
    attempt <= TAG_RESOLVE_MAX_RATE_LIMIT_RETRIES;
    attempt += 1
  ) {
    try {
      return await fetchRule34TagMetadata(
        tagName,
        settings,
        provider.getRequestThrottle(),
        provider.getRequestHeaders()
      );
    } catch (error) {
      if (error instanceof Rule34TagRateLimitError) {
        recordRateLimitBurst(error.retryAfterMs, attempt);
        if (attempt >= TAG_RESOLVE_MAX_RATE_LIMIT_RETRIES) {
          throw error;
        }
        await sleep(resolveRetryAfterMs(error.retryAfterMs, attempt));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Tag lookup exhausted retries for "${tagName}"`);
}

async function lookupTagCoordinated(
  tagName: string,
  settings: ProviderSettings,
  stats: TagResolveWaveStats
): Promise<TagLookupResult> {
  const existing = inFlightLookups.get(tagName);
  if (existing) {
    stats.inFlightHits += 1;
    return existing;
  }

  const lookupPromise = (async (): Promise<TagLookupResult> => {
    stats.apiCalls += 1;
    try {
      return await lookupTagFromApi(tagName, settings);
    } catch (error) {
      if (error instanceof Rule34TagRateLimitError) {
        stats.rateLimitedCount += 1;
      }
      throw error;
    }
  })();

  inFlightLookups.set(tagName, lookupPromise);

  try {
    return await lookupPromise;
  } finally {
    inFlightLookups.delete(tagName);
  }
}

function upsertFoundEntries(
  db: AppDatabase,
  entries: Rule34TagMetadataEntry[],
  foundTypes: Map<string, number>
): void {
  if (entries.length === 0) {
    return;
  }

  const resolvedAt = new Date();
  const values = entries.map((entry) => ({
    name: entry.name,
    type: entry.type,
    status: "found" as const,
    resolvedAt,
  }));

  db.transaction((tx) => {
    tx.insert(tagMetadata)
      .values(values)
      .onConflictDoUpdate({
        target: tagMetadata.name,
        set: {
          type: sql`excluded.type`,
          status: sql`excluded.status`,
          resolvedAt: sql`excluded.resolved_at`,
        },
      })
      .run();
  });

  for (const entry of entries) {
    foundTypes.set(entry.name, entry.type);
  }
}

function upsertNotFoundEntries(
  db: AppDatabase,
  tagNames: string[],
  activeNotFound: Set<string>
): void {
  if (tagNames.length === 0) {
    return;
  }

  const resolvedAt = new Date();
  const values = tagNames.map((name) => ({
    name,
    type: NOT_FOUND_TYPE_PLACEHOLDER,
    status: "not_found" as const,
    resolvedAt,
  }));

  db.transaction((tx) => {
    tx.insert(tagMetadata)
      .values(values)
      .onConflictDoUpdate({
        target: tagMetadata.name,
        set: {
          type: sql`excluded.type`,
          status: sql`excluded.status`,
          resolvedAt: sql`excluded.resolved_at`,
        },
      })
      .run();
  });

  for (const name of tagNames) {
    activeNotFound.add(name);
  }
}

export async function resolveTagMetadataWave(
  db: AppDatabase,
  uniqueTags: string[],
  cache: TagMetadataCacheState,
  settings: ProviderSettings,
  context: string
): Promise<TagResolveWaveStats> {
  const stats: TagResolveWaveStats = {
    requested: uniqueTags.length,
    tagMetadataHits: 0,
    inFlightHits: 0,
    apiCalls: 0,
    rateLimitedCount: 0,
  };

  const { foundTypes, activeNotFound } = cache;

  const missingTags = uniqueTags.filter((tag) => {
    if (foundTypes.has(tag) || activeNotFound.has(tag)) {
      stats.tagMetadataHits += 1;
      return false;
    }
    return true;
  });

  if (missingTags.length === 0) {
    log.info(
      `[TagResolve] ${context}: requested=${stats.requested} tag_metadata=${stats.tagMetadataHits} in_flight=0 api_calls=0 rate_limited=0`
    );
    return stats;
  }

  const lookupResults = await Promise.all(
    missingTags.map(async (tagName) => {
      try {
        const result = await lookupTagCoordinated(tagName, settings, stats);
        return { tagName, result };
      } catch (error) {
        if (error instanceof Rule34TagRateLimitError) {
          log.warn(
            `[TagResolve] ${context}: giving up on "${tagName}" after rate limit retries`
          );
          return { tagName, result: null };
        }
        log.error(
          `[TagResolve] ${context}: lookup failed for "${tagName}":`,
          error
        );
        return { tagName, result: null };
      }
    })
  );

  const resolvedEntries = lookupResults.flatMap((item) =>
    item.result?.status === "found" ? [item.result.entry] : []
  );
  const notFoundNames = lookupResults.flatMap((item) =>
    item.result?.status === "not_found" ? [item.tagName] : []
  );
  const unresolvedNames = lookupResults.flatMap((item) =>
    item.result === null ? [item.tagName] : []
  );

  upsertFoundEntries(db, resolvedEntries, foundTypes);
  upsertNotFoundEntries(db, notFoundNames, activeNotFound);

  for (const tagName of unresolvedNames) {
    log.debug(
      `[TagResolve] ${context}: unresolved "${tagName}" (not persisted as not_found)`
    );
  }

  log.info(
    `[TagResolve] ${context}: requested=${stats.requested} tag_metadata=${stats.tagMetadataHits} in_flight=${stats.inFlightHits} api_calls=${stats.apiCalls} rate_limited=${stats.rateLimitedCount}`
  );

  return stats;
}

/** Test-only reset of module-level coordination state. */
export function resetTagResolveCoordinatorForTests(): void {
  inFlightLookups.clear();
  last429BurstLogAtMs = 0;
  try {
    getRule34TagProvider().getRequestThrottle().resetRateLimitGateForTests();
  } catch {
    // Provider may be mocked without a real throttle in some tests.
  }
}
