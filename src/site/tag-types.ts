import { getFeatureState, setFeatureState } from "../storage/store";

/**
 * What kind a tag is: artist, character, copyright or metadata. The site says
 * it in two places the script already reads, the suggestions of a search field
 * and the tag list beside a post, and nowhere for a tag typed by hand. What was
 * seen there is remembered, so that a chip of the tag can be coloured later on
 * a page where the site does not say: in the search of Favorites, in the
 * blacklist. Nothing is asked of the site for it.
 *
 * A general tag is not kept: it is what a tag is taken for when nothing is known.
 */

export type TagKind = "artist" | "character" | "copyright" | "metadata";

/** Under featureState: "a:tag", the first letter is the kind. */
export const TAG_TYPES_STATE_ID = "tag-types";
/** The oldest are dropped past this many. */
export const TAG_TYPES_MAX = 3000;

const CODE_OF: Readonly<Record<TagKind, string>> = {
  artist: "a",
  character: "c",
  copyright: "p",
  metadata: "m",
};
const CODE_SEPARATOR = ":";

function kindOfCode(code: string): TagKind | null {
  for (const kind of ["artist", "character", "copyright", "metadata"] as const) {
    if (CODE_OF[kind] === code) {
      return kind;
    }
  }
  return null;
}

function kindOfName(name: string): TagKind | null {
  return name === "artist" || name === "character" || name === "copyright" || name === "metadata"
    ? name
    : null;
}

/** A tag as it is kept and looked up: lower case, underscores for spaces. */
export function tagKey(tag: string): string {
  return tag.trim().toLowerCase().replaceAll(" ", "_");
}

let known: Map<string, TagKind> | null = null;

function load(): Map<string, TagKind> {
  if (known !== null) {
    return known;
  }
  const map = new Map<string, TagKind>();
  let kept: unknown = null;
  try {
    kept = getFeatureState(TAG_TYPES_STATE_ID);
  } catch {
    // Where the storage cannot be read, the kinds are remembered for the page only.
  }
  if (Array.isArray(kept)) {
    for (const item of kept) {
      if (typeof item !== "string") {
        continue;
      }
      const at = item.indexOf(CODE_SEPARATOR);
      const kind = at > 0 ? kindOfCode(item.slice(0, at)) : null;
      if (kind !== null) {
        map.set(item.slice(at + 1), kind);
      }
    }
  }
  known = map;
  return map;
}

/** Forgets what is held in memory; the next question reads the storage again. */
export function resetTagTypesCache(): void {
  known = null;
}

/** The kind of a tag when it was seen before, or null. */
export function tagKindOf(tag: string): TagKind | null {
  return load().get(tagKey(tag)) ?? null;
}

/**
 * Remembers the kinds of the tags given, each as the site named it ("artist",
 * "general", …). Written to the storage only when something new came.
 */
export function rememberTagKinds(entries: Iterable<readonly [string, string | undefined]>): void {
  const map = load();
  let changed = false;
  for (const [tag, name] of entries) {
    const kind = name === undefined ? null : kindOfName(name);
    const key = tagKey(tag);
    if (kind === null || key.length === 0 || map.get(key) === kind) {
      continue;
    }
    // Put last, so that what is seen again is the last to be dropped.
    map.delete(key);
    map.set(key, kind);
    changed = true;
  }
  if (!changed) {
    return;
  }
  while (map.size > TAG_TYPES_MAX) {
    const oldest = map.keys().next();
    if (oldest.done === true) {
      break;
    }
    map.delete(oldest.value);
  }
  try {
    setFeatureState(
      TAG_TYPES_STATE_ID,
      [...map].map(([tag, kind]) => `${CODE_OF[kind]}${CODE_SEPARATOR}${tag}`),
    );
  } catch {
    // Kept in memory all the same: see load().
  }
}
