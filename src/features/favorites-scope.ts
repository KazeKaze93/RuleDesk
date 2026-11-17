import { COLLECTION_KIND_POSTS } from "../config/constants";
import type { ArtistEntry, Collection, FollowKind } from "../storage/schema";
import { FOLLOW_KIND_ARTIST } from "../storage/schema";
import type { SelectOption } from "../ui/kit";
import type { TagCount } from "./favorites-search";
import { queryChips, removeChip, toggleChip } from "./favorites-suggest";

/** The collection filter of Favorites: every favorite, whatever collection it is in. */
export const COLLECTION_ANY = "any";
/** The collection filter of Favorites: the favorites that are in no collection yet. */
export const COLLECTION_NONE = "none";
/** Before a collection's id in the value of the filter, so that no id reads as "any" or "none". */
const COLLECTION_VALUE_PREFIX = "id:";

const COLLECTION_ANY_LABEL = "Any";
const COLLECTION_NONE_LABEL = "Not in any collection";

function hasPosts(collection: Collection): boolean {
  return collection.kind === COLLECTION_KIND_POSTS;
}

/** The choices of the collection filter: any, none, then the collections of posts by name. */
export function collectionChoices(collections: readonly Collection[]): SelectOption[] {
  const named = collections
    .filter(hasPosts)
    .map((collection) => ({
      value: `${COLLECTION_VALUE_PREFIX}${collection.id}`,
      label: collection.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return [
    { value: COLLECTION_ANY, label: COLLECTION_ANY_LABEL },
    { value: COLLECTION_NONE, label: COLLECTION_NONE_LABEL },
    ...named,
  ];
}

/**
 * Says whether a post passes the collection filter, or null where the filter
 * lets everything through: "any", or a collection that is no longer there.
 */
export function collectionScope(
  collections: readonly Collection[],
  choice: string,
): ((postId: number) => boolean) | null {
  if (choice === COLLECTION_NONE) {
    const taken = new Set<number>();
    for (const collection of collections) {
      if (hasPosts(collection)) {
        for (const id of collection.postIds ?? []) {
          taken.add(id);
        }
      }
    }
    return (postId) => !taken.has(postId);
  }
  if (!choice.startsWith(COLLECTION_VALUE_PREFIX)) {
    return null;
  }
  const id = choice.slice(COLLECTION_VALUE_PREFIX.length);
  const picked = collections.find((collection) => hasPosts(collection) && collection.id === id);
  if (picked === undefined) {
    return null;
  }
  const inside = new Set(picked.postIds ?? []);
  return (postId) => inside.has(postId);
}

/** A followed entry that some favorites carry. */
export type FollowedCount = {
  readonly tag: string;
  readonly kind: FollowKind;
  readonly count: number;
};

/**
 * The entries of Following found among the favorites, with the number of
 * favorites each has: the most favorited first, equal ones by name.
 */
export function followedInFavorites(
  followed: readonly ArtistEntry[],
  tags: readonly TagCount[],
): FollowedCount[] {
  const counts = new Map<string, number>();
  for (const item of tags) {
    counts.set(item.tag, item.count);
  }
  const found: FollowedCount[] = [];
  const seen = new Set<string>();
  for (const entry of followed) {
    const tag = entry.tag.toLowerCase();
    const count = counts.get(tag);
    if (count === undefined || count === 0 || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    found.push({ tag, kind: entry.kind ?? FOLLOW_KIND_ARTIST, count });
  }
  return found.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** True when the query names the tag as it is, not excluded and not inside a group. */
export function queryHasTag(text: string, tag: string): boolean {
  return queryChips(text).some(
    (chip) => !chip.group && !chip.excluded && chip.label.toLowerCase() === tag,
  );
}

/**
 * The query with the tag added at its end, or taken out when it is there
 * already. A tag the query excludes is included instead: both at once would
 * find nothing.
 */
export function toggleQueryTag(text: string, tag: string): string {
  const chip = queryChips(text).find(
    (item) => !item.group && item.label.toLowerCase() === tag,
  );
  if (chip !== undefined) {
    return chip.excluded ? toggleChip(text, chip) : removeChip(text, chip);
  }
  const base = text.trim();
  return base.length === 0 ? tag : `${base} ${tag}`;
}
