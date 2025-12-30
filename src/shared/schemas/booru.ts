import { z } from "zod";

/**
 * Booru API Raw Post Schema (Rule34.xxx)
 *
 * Validates raw post data from Rule34.xxx API before mapping to BooruPost.
 * This ensures type safety and prevents runtime errors from malformed API responses.
 */
export const R34RawPostSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  file_url: z.string().min(1),
  sample_url: z.string().optional(),
  preview_url: z.string().optional(),
  tags: z.string(),
  rating: z.string(),
  change: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  score: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  source: z.string().optional(),
  width: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  height: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
}).strip();

/**
 * Booru API Raw Post Schema (Gelbooru)
 *
 * Validates raw post data from Gelbooru API before mapping to BooruPost.
 */
export const GelbooruRawPostSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  file_url: z.string().min(1),
  sample_url: z.string().optional(),
  preview_url: z.string().optional(),
  tags: z.string().optional(),
  rating: z.string().optional(),
  score: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  width: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  height: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  created_at: z.string().optional(),
}).strip();

/**
 * Booru Post Schema
 *
 * Validates normalized BooruPost after mapping from raw API data.
 * This is the final validated format used throughout the application.
 */
export const BooruPostSchema = z.object({
  id: z.number().int().positive(),
  fileUrl: z.string().min(1), // URL validation can be too strict, validate format in provider
  previewUrl: z.string().min(1),
  sampleUrl: z.string().min(1),
  tags: z.array(z.string()),
  rating: z.enum(["s", "q", "e"]),
  score: z.number().int().default(0),
  source: z.string().default(""),
  width: z.number().int().nonnegative().default(0),
  height: z.number().int().nonnegative().default(0),
  createdAt: z.date(),
});

/**
 * Type exports
 */
export type R34RawPost = z.infer<typeof R34RawPostSchema>;
export type GelbooruRawPost = z.infer<typeof GelbooruRawPostSchema>;
export type BooruPost = z.infer<typeof BooruPostSchema>;

