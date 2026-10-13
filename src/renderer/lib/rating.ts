import { normalizeRating } from "@shared/utils/post-normalization";

export type RatingBadgeVariant = "success" | "warning" | "destructive";

export type RatingMeta = {
  label: string;
  shortLabel: string;
  badgeVariant: RatingBadgeVariant;
  textClassName: string;
};

const RATING_META: Record<"s" | "q" | "e", RatingMeta> = {
  s: {
    label: "Safe",
    shortLabel: "Safe",
    badgeVariant: "success",
    textClassName: "text-success",
  },
  q: {
    label: "Questionable",
    shortLabel: "Quest.",
    badgeVariant: "warning",
    textClassName: "text-warning",
  },
  e: {
    label: "Explicit",
    shortLabel: "Explicit",
    badgeVariant: "destructive",
    textClassName: "text-destructive",
  },
};

/**
 * UI metadata for a post rating. Normalizes via {@link normalizeRating}
 * (unknown / empty → "q") and never throws.
 */
export function getRatingMeta(
  rating: string | undefined | null
): RatingMeta {
  const key = normalizeRating(rating);
  return RATING_META[key];
}
