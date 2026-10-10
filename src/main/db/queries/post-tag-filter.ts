import { and, not, or, sql, type SQL } from "drizzle-orm";
import { posts } from "../schema";
import { escapeLikePattern } from "../utils";
import {
  parseTagFilterQuery,
  type ParsedSearchTerm,
} from "../../ipc/controllers/posts-tag-query";

function createSearchTermCondition(term: ParsedSearchTerm): SQL | null {
  const normalizedValue = term.value.trim();
  if (normalizedValue.length === 0) {
    return null;
  }

  // Exact token = space-delimited whole tag (same grammar as FTS phrase MATCH
  // after unicode61 tokenchars in 0041; underscore/hyphen are inside the token).
  if (term.mode === "exact") {
    return sql`instr(' ' || lower(${posts.tags}) || ' ', ' ' || ${normalizedValue} || ' ') > 0`;
  }

  if (term.mode === "wildcard") {
    const likePattern = `%${escapeLikePattern(normalizedValue).replace(
      /\*/g,
      "%"
    )}%`;
    return sql`lower(${posts.tags}) LIKE ${likePattern} ESCAPE '\\'`;
  }

  const fuzzyPattern = `%${escapeLikePattern(normalizedValue)}%`;
  return sql`lower(${posts.tags}) LIKE ${fuzzyPattern} ESCAPE '\\'`;
}

/**
 * Exact-token blacklist exclusion on `posts.tags`.
 *
 * Caller supplies tags already read once for the query (typically
 * `getAllBlacklistedTags()`). Tags are bound as SQL parameters in a single
 * `NOT (instr… OR instr…)` predicate so the query does not correlate against
 * `tag_blacklist` per candidate row. Match grammar matches the previous
 * `NOT EXISTS … FROM tag_blacklist … instr(…)` filter: space-wrapped,
 * case-insensitive whole-token match.
 *
 * @returns SQL condition, or `null` when the blacklist is empty (no-op).
 */
export function buildPostsBlacklistFilterCondition(
  blacklistedTags: readonly string[]
): SQL | null {
  const normalizedTags: string[] = [];
  const seen = new Set<string>();
  for (const tag of blacklistedTags) {
    const normalized = tag.trim().toLowerCase();
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    normalizedTags.push(normalized);
  }

  if (normalizedTags.length === 0) {
    return null;
  }

  const matchConditions = normalizedTags.map(
    (tag) =>
      sql`instr(' ' || lower(${posts.tags}) || ' ', ' ' || ${tag} || ' ') > 0`
  );
  const anyBlacklisted = or(...matchConditions);
  if (!anyBlacklisted) {
    return null;
  }
  return not(anyBlacklisted);
}

/**
 * Tag filter for posts.tags (same semantics as PostsController feed queries).
 */
export function buildPostsTagsFilterCondition(tagFilter: string): SQL {
  const parsedTokens = parseTagFilterQuery(tagFilter);
  if (parsedTokens.length === 0) {
    return sql`1 = 1`;
  }

  const tokenConditions: SQL[] = [];
  for (const token of parsedTokens) {
    const termConditions = token.terms
      .map((term) => createSearchTermCondition(term))
      .filter((condition): condition is SQL => Boolean(condition));

    if (termConditions.length === 0) {
      continue;
    }

    const tokenCondition =
      termConditions.length === 1
        ? termConditions[0]
        : (or(...termConditions) ?? termConditions[0]);

    tokenConditions.push(token.exclude ? not(tokenCondition) : tokenCondition);
  }

  if (tokenConditions.length === 0) {
    return sql`1 = 1`;
  }

  if (tokenConditions.length === 1) {
    return tokenConditions[0];
  }

  return and(...tokenConditions) ?? tokenConditions[0];
}
