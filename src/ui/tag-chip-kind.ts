import { tagKey, tagKindOf } from "../site/tag-types";
import { followKindOf, load } from "../storage/store";
import type { ChipKind } from "./kit";

/**
 * The colour of a tag's chip: by what the site called the tag where it was
 * seen, and for a followed tag by the kind it is followed as. "default" when
 * nothing is known, and for what is not a tag at all ("rating:safe").
 */
export function chipKindOfTag(tag: string): ChipKind {
  const key = tagKey(tag);
  if (key.length === 0 || key.includes(":")) {
    return "default";
  }
  const seen = tagKindOf(key);
  if (seen !== null) {
    return seen;
  }
  try {
    const followed = load().artists.find((entry) => tagKey(entry.tag) === key);
    return followed === undefined ? "default" : followKindOf(followed);
  } catch {
    // Without the storage nothing is known of what is followed.
    return "default";
  }
}
