import type { JSX } from "preact";
import { useState } from "preact/hooks";

import {
  AI_MODE_HIDE,
  AI_MODE_SHOW,
  aiHiddenEverywhere,
  aiModeIn,
  alignSiteAiFilter,
  setAiHiddenIn,
  type AiScope,
} from "../features/ai-scope";
import { Select, type SelectOption } from "./kit";

const OPTION_SHOW = "AI posts: shown";
const OPTION_HIDE = "AI posts: hidden";
const OPTION_EVERYWHERE = "AI posts: hidden everywhere";
const ARIA_LABEL_CLASS = "rdw-ai-select";

const OPTIONS: readonly SelectOption[] = [
  { value: AI_MODE_SHOW, label: OPTION_SHOW },
  { value: AI_MODE_HIDE, label: OPTION_HIDE },
];
/** With "Hide AI posts everywhere" on in the settings there is nothing to choose. */
const OPTIONS_EVERYWHERE: readonly SelectOption[] = [
  { value: AI_MODE_HIDE, label: OPTION_EVERYWHERE },
];

export type AiPostsSelectProps = {
  readonly scope: AiScope;
};

/**
 * The choice of one part of the site for AI posts, for the toolbar of an own
 * page: what is opened from this page, and what the page reads from the site,
 * is given with AI posts shown or hidden.
 */
export function AiPostsSelect(props: AiPostsSelectProps): JSX.Element {
  const everywhere = aiHiddenEverywhere();
  const [mode, setMode] = useState(() => aiModeIn(props.scope));
  return (
    <Select
      className={ARIA_LABEL_CLASS}
      options={everywhere ? OPTIONS_EVERYWHERE : OPTIONS}
      value={everywhere ? AI_MODE_HIDE : mode}
      disabled={everywhere}
      onChange={(value) => {
        if (value !== AI_MODE_SHOW && value !== AI_MODE_HIDE) {
          return;
        }
        setAiHiddenIn(props.scope, value === AI_MODE_HIDE);
        alignSiteAiFilter(props.scope);
        setMode(value);
      }}
    />
  );
}
