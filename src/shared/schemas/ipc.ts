import { z } from "zod";

export const IdSchema = z.number().int().positive();
export const OptionalIdSchema = IdSchema.optional();

export const PageSchema = z.number().int().min(1);
export const LimitSchema = z.number().int().min(1);
export const PaginationSchema = z.object({
  page: PageSchema,
  limit: LimitSchema,
});

export const RatingSchema = z.enum(["s", "q", "e"]);
export const MediaTypeSchema = z.enum(["all", "images", "videos"]);
export const PostFiltersSchema = z.object({
  rating: RatingSchema.optional(),
  mediaType: MediaTypeSchema.optional(),
});
