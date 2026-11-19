import { useEffect, useState } from "preact/hooks";

import { lookUpTagKinds, onTagKindsLearned } from "../site/tag-type-lookup";

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
    lookUpTagKinds(key.length === 0 ? [] : key.split(SEPARATOR));
  }, [key]);
  useEffect(
    () =>
      onTagKindsLearned(() => {
        bump((value) => value + 1);
      }),
    [],
  );
}
