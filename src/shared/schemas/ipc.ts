import { z } from "zod";

export const IdSchema = z.number().int().positive();
export const OptionalIdSchema = IdSchema.optional();

/**
 * Artist filter for post queries: optional DB id, including 0 (external / browse scope).
 * Do not use for rows that must be real FK ids — use {@link IdSchema}.
 */
export const OptionalArtistScopeIdSchema = z.number().int().nonnegative().optional();

export const PageSchema = z.number().int().min(1);
export const LimitSchema = z.number().int().min(1);
export const PaginationSchema = z.object({
  page: PageSchema,
  limit: LimitSchema,
});

/**
 * Inclusive upper bound for optional random-order seeds (signed 32-bit max).
 * Callers keep the same seed across pages for a stable shuffle; a new seed
 * starts a new shuffle.
 */
export const MAX_RANDOM_SEED = 2_147_483_647;

/** Optional seed for deterministic local `isRandom` pagination. */
export const RandomSeedSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_RANDOM_SEED)
  .optional();

export const RatingSchema = z.enum(["s", "q", "e"]);
export const MediaTypeSchema = z.enum(["all", "images", "videos"]);
export const PostFiltersSchema = z.object({
  mediaType: MediaTypeSchema.optional(),
});
