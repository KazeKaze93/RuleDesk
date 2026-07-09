import log from "electron-log";
import { sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../db/schema";
import { tagMetadata } from "../db/schema";
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
  TAG_RESOLVE_NEGATIVE_CACHE_TTL_MS,
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

const inFlightLookups = new Map<string, Promise<TagLookupResult>>();
const negativeCacheUntil = new Map<string, number>();
let globalRateLimitUntilMs = 0;
let last429BurstLogAtMs = 0;

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

async function waitForGlobalRateLimit(): Promise<void> {
  const waitMs = globalRateLimitUntilMs - Date.now();
  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

function recordRateLimitBurst(retryAfterMs: number, attempt: number): void {
  const delayMs = resolveRetryAfterMs(retryAfterMs, attempt);
  globalRateLimitUntilMs = Math.max(
    globalRateLimitUntilMs,
    Date.now() + delayMs
  );

  const now = Date.now();
  if (now - last429BurstLogAtMs >= TAG_RESOLVE_429_BURST_LOG_WINDOW_MS) {
    last429BurstLogAtMs = now;
    log.warn(
      `[TagResolve] Rule34 tag API rate limited; backing off for ${delayMs}ms`
    );
  }
}

function isNegativeCacheActive(tagName: string): boolean {
  const until = negativeCacheUntil.get(tagName);
  if (until === undefined) {
    return false;
  }
  if (until <= Date.now()) {
    negativeCacheUntil.delete(tagName);
    return false;
  }
  return true;
}

function rememberNegativeCache(tagName: string): void {
  negativeCacheUntil.set(
    tagName,
    Date.now() + TAG_RESOLVE_NEGATIVE_CACHE_TTL_MS
  );
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
      await waitForGlobalRateLimit();
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
  if (isNegativeCacheActive(tagName)) {
    return { status: "not_found" };
  }

  const existing = inFlightLookups.get(tagName);
  if (existing) {
    stats.inFlightHits += 1;
    return existing;
  }

  const lookupPromise = (async (): Promise<TagLookupResult> => {
    stats.apiCalls += 1;
    try {
      const result = await lookupTagFromApi(tagName, settings);
      if (result.status === "not_found") {
        rememberNegativeCache(tagName);
      }
      return result;
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

function upsertTagMetadataEntries(
  db: AppDatabase,
  entries: Rule34TagMetadataEntry[],
  cachedMap: Map<string, number>
): void {
  if (entries.length === 0) {
    return;
  }

  db.transaction((tx) => {
    tx.insert(tagMetadata)
      .values(entries)
      .onConflictDoUpdate({
        target: tagMetadata.name,
        set: { type: sql`excluded.type` },
      })
      .run();
  });

  for (const entry of entries) {
    cachedMap.set(entry.name, entry.type);
  }
}

export async function resolveTagMetadataWave(
  db: AppDatabase,
  uniqueTags: string[],
  cachedMap: Map<string, number>,
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

  const missingTags = uniqueTags.filter((tag) => {
    if (cachedMap.has(tag)) {
      stats.tagMetadataHits += 1;
      return false;
    }
    if (isNegativeCacheActive(tag)) {
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

  upsertTagMetadataEntries(db, resolvedEntries, cachedMap);

  log.info(
    `[TagResolve] ${context}: requested=${stats.requested} tag_metadata=${stats.tagMetadataHits} in_flight=${stats.inFlightHits} api_calls=${stats.apiCalls} rate_limited=${stats.rateLimitedCount}`
  );

  return stats;
}

/** Test-only reset of module-level coordination state. */
export function resetTagResolveCoordinatorForTests(): void {
  inFlightLookups.clear();
  negativeCacheUntil.clear();
  globalRateLimitUntilMs = 0;
  last429BurstLogAtMs = 0;
}
