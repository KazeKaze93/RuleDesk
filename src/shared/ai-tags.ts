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
