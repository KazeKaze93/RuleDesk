/**
 * The filter fields of the Collections and Following pages take several
 * names at once; a card is shown when any of them matches.
 */

/** Artist tags have no spaces, so a space separates names as well as a comma. */
export const ARTIST_TERM_SEPARATOR = /[\s,]+/;
/** A collection name may have spaces: only a comma separates names. */
export const COLLECTION_TERM_SEPARATOR = /,/;

/** The names typed into a filter field, lower-cased, without empty ones. */
export function filterTerms(text: string, separator: RegExp): string[] {
  return text
    .toLowerCase()
    .split(separator)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
}

/** True when there is nothing to filter by, or any term is part of any text. */
export function matchesAnyTerm(
  texts: readonly string[],
  terms: readonly string[],
): boolean {
  if (terms.length === 0) {
    return true;
  }
  const lowered = texts.map((text) => text.toLowerCase());
  return terms.some((term) => lowered.some((text) => text.includes(term)));
}
