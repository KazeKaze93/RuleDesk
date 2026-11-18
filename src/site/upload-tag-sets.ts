import { getFeatureState, setFeatureState } from "../storage/store";

/**
 * The user's own sets of tags for the Upload page: a name and the tags under
 * it. On the page a set is a button that adds its tags to the Tags field. The
 * site has "My Tags" for the same in the settings of the account; these are
 * kept by the script, need no account page and can be several.
 */

/** Under featureState: the sets, in the order they were made. */
export const UPLOAD_TAG_SETS_STATE_ID = "upload-tag-sets";
export const TAG_SET_NAME_MAX = 40;
/** A set is a handful of tags, not a text: longer is cut. */
export const TAG_SET_TAGS_MAX = 2000;
const TAG_SPLIT = /\s+/;

export type TagSet = {
  readonly name: string;
  readonly tags: string;
};

function cleanSet(value: unknown): TagSet | null {
  if (typeof value !== "object" || value === null || !("name" in value) || !("tags" in value)) {
    return null;
  }
  const { name, tags } = value;
  if (typeof name !== "string" || typeof tags !== "string") {
    return null;
  }
  return { name: name.slice(0, TAG_SET_NAME_MAX), tags: tags.slice(0, TAG_SET_TAGS_MAX) };
}

/** The sets as they are kept; what is not a set is left out. */
export function readTagSets(): TagSet[] {
  const kept = getFeatureState(UPLOAD_TAG_SETS_STATE_ID);
  if (!Array.isArray(kept)) {
    return [];
  }
  const sets: TagSet[] = [];
  for (const item of kept) {
    const set = cleanSet(item);
    if (set !== null) {
      sets.push(set);
    }
  }
  return sets;
}

export function writeTagSets(sets: readonly TagSet[]): void {
  setFeatureState(
    UPLOAD_TAG_SETS_STATE_ID,
    sets.map((set) => ({
      name: set.name.slice(0, TAG_SET_NAME_MAX),
      tags: set.tags.slice(0, TAG_SET_TAGS_MAX),
    })),
  );
}

/** The sets that give a button: with a name and at least one tag. */
export function usableTagSets(): TagSet[] {
  return readTagSets().filter(
    (set) => set.name.trim().length > 0 && set.tags.trim().length > 0,
  );
}

/**
 * The text of the Tags field with the tags of a set added at its end. A tag
 * that is there already, in any case, is not added again; what was typed stays
 * as it was, in its order.
 */
export function addTagsToText(text: string, tags: string): string {
  const have = new Set(
    text
      .toLowerCase()
      .split(TAG_SPLIT)
      .filter((tag) => tag.length > 0),
  );
  const added: string[] = [];
  for (const tag of tags.split(TAG_SPLIT)) {
    const key = tag.toLowerCase();
    if (tag.length > 0 && !have.has(key)) {
      have.add(key);
      added.push(tag);
    }
  }
  if (added.length === 0) {
    return text;
  }
  const head = text.trimEnd();
  return `${head.length > 0 ? `${head} ` : ""}${added.join(" ")} `;
}
