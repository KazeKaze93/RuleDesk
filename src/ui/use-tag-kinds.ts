import { useEffect, useState } from "preact/hooks";

import { lookUpTagKinds, onTagKindsLearned } from "../site/tag-type-lookup";
import { chipKindOfTag } from "./tag-chip-kind";

const SEPARATOR = " ";

/**
 * For a component that draws chips of tags: the kinds of those not known yet
 * are asked of the site, and the component is drawn again as they come, so a
 * grey dot takes its colour without the page being opened anew.
 */
export function useTagKindLookup(tags: readonly string[]): void {
  const [, bump] = useState(0);
  const key = tags.join(SEPARATOR);
  useEffect(() => {
    // A followed tag has the kind it is followed as: the site is not asked about it.
    lookUpTagKinds(
      (key.length === 0 ? [] : key.split(SEPARATOR)).filter(
        (tag) => chipKindOfTag(tag) === "default",
      ),
    );
  }, [key]);
  useEffect(
    () =>
      onTagKindsLearned(() => {
        bump((value) => value + 1);
      }),
    [],
  );
}
