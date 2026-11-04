import type { ProviderId } from "../../shared/constants";
import { sanitizeProviderTagToken } from "../../shared/utils/provider-tag-sanitize";
import { parseAutocompleteLabelCount } from "../../shared/utils/autocomplete-label-count";
import type { SearchResults } from "../providers/types";

/**
 * Max Rule34 DAPI tag lookups per Add-Artist autocomplete keystroke.
 * Second-pass uses user throttle + `tag_metadata` cache; 5 bounds cost
 * without resolving the full 10–20 autocomplete page.
 */
export const ARTIST_AUTOCOMPLETE_RESOLVE_LIMIT = 5;

export function normalizeAutocompleteTagName(value: string): string {
  return sanitizeProviderTagToken(value).toLowerCase().trim();
}

export function selectTopAutocompleteByPostCount(
  results: SearchResults[],
  limit: number = ARTIST_AUTOCOMPLETE_RESOLVE_LIMIT
): SearchResults[] {
  return [...results]
    .sort(
      (a, b) =>
        parseAutocompleteLabelCount(b.label) -
        parseAutocompleteLabelCount(a.label)
    )
    .slice(0, limit);
}

export function keepResolvedArtistTags(
  candidates: SearchResults[],
  artistNames: ReadonlySet<string>
): SearchResults[] {
  return candidates.filter((item) =>
    artistNames.has(normalizeAutocompleteTagName(item.value))
  );
}

/**
 * Artist-only filter for Add Artist autocomplete (Rule34-only).
 * Top-N by post_count, then caller-supplied resolve (DAPI / tag_metadata).
 * No silent fallback to unfiltered results when nothing matches.
 */
export async function applyArtistOnlyAutocompleteFilter(
  providerId: ProviderId,
  results: SearchResults[],
  resolveArtistNames: (tags: string[]) => Promise<string[]>
): Promise<SearchResults[]> {
  if (providerId !== "rule34") {
    return [];
  }

  const topN = selectTopAutocompleteByPostCount(results);
  const tagsToResolve = [
    ...new Set(
      topN
        .map((item) => normalizeAutocompleteTagName(item.value))
        .filter((name) => name.length > 0)
    ),
  ];
  if (tagsToResolve.length === 0) {
    return [];
  }

  const artistNames = await resolveArtistNames(tagsToResolve);
  const artistSet = new Set(
    artistNames.map((name) => normalizeAutocompleteTagName(name)).filter(Boolean)
  );
  return keepResolvedArtistTags(topN, artistSet);
}
