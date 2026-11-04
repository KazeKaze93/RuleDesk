/**
 * Exact AI tag tokens for AI content filtering (hide/only).
 * Canonical shared source — import this; do not copy the list into consumers.
 */
export const AI_TAGS = [
  "ai_generated",
  "ai-generated",
  "ai_generation",
  "ai-generated_content",
] as const;

export type AiTag = (typeof AI_TAGS)[number];

/**
 * Exact-token AI check for space-separated tag strings (DB / IPC posts).
 * Same predicate main and renderer must use for smart-collection totals.
 */
export function hasAiGeneratedTag(tags: string | undefined | null): boolean {
  if (!tags) return false;

  const tagArray = tags
    .toLowerCase()
    .split(/\s+/)
    .filter((tag) => tag.length > 0);

  return AI_TAGS.some((aiTag) => tagArray.includes(aiTag));
}
