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
