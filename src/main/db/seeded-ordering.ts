import { randomInt } from "node:crypto";
import { sql, type AnyColumn, type SQL } from "drizzle-orm";
import { MAX_RANDOM_SEED } from "../../shared/schemas/ipc";

/** Knuth multiplicative constant (⌊2^32 / φ⌋) for id mixing. */
const HASH_MULTIPLIER = 2654435761;

/** 32-bit mask applied after XOR mix (keeps ORDER BY values in uint32 range). */
const HASH_MASK = 4294967295;

/**
 * Create a new random seed for the first page of a shuffle sequence.
 */
export function createRandomSeed(): number {
  return randomInt(0, MAX_RANDOM_SEED + 1);
}

/**
 * Use the caller-provided seed, or mint one when absent (single-page / first request).
 */
export function resolveRandomSeed(seed: number | undefined): number {
  return seed ?? createRandomSeed();
}

/**
 * Deterministic ORDER BY pair for paginated random: same (id, seed) → same total
 * order so LIMIT/OFFSET pages neither reshuffle nor leave gaps/dupes.
 *
 * SQLite has no bitwise XOR; mix via (id + seed) * Knuth constant, masked to
 * uint32. Secondary key is `id` so equal hashes stay stable.
 */
export function seededOrderBy(
  idColumn: AnyColumn | SQL,
  seed: number
): [SQL, SQL] {
  return [
    sql`((((${idColumn}) + ${seed}) * ${HASH_MULTIPLIER}) & ${HASH_MASK})`,
    sql`${idColumn}`,
  ];
}
