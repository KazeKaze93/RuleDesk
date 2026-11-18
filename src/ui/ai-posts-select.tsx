import type { JSX } from "preact";
import { useState } from "preact/hooks";

import {
  AI_MODE_HIDE,
  AI_MODE_OPTIONS,
  AI_MODE_SHOW,
  aiHiddenEverywhere,
  aiModeIn,
  alignSiteAiFilter,
  setAiHiddenIn,
  type AiScope,
} from "../features/ai-scope";
import { SETTINGS_SECTION_AI, openSettingsAt } from "../pages/settings-focus";
import { Segmented } from "./kit";

const TOGGLE_CLASS = "rdw-ai-toggle";
const TOGGLE_LABEL_CLASS = "rdw-ai-toggle__label";
const NOTE_CLASS = "rdw-ai-note";
const NOTE_LINK_CLASS = "rdw-ai-note__link";
/** Short, before the two options: the toolbar it stands in has no room for a caption. */
const TOGGLE_PREFIX = "AI";
const TOGGLE_ARIA = "AI posts";
const NOTE_TEXT = "Hidden everywhere.";
const NOTE_LINK = "Change in Settings";

const AI_CONTROL_CSS = `
.${TOGGLE_CLASS} {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.${TOGGLE_LABEL_CLASS} {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.${NOTE_CLASS} {
  margin: 4px 0 0;
  color: var(--rdw-muted);
  font: 11.5px/1.35 var(--rdw-font);
}
.${NOTE_CLASS}[data-inline="true"] {
  margin: 0;
  white-space: nowrap;
}
.${NOTE_LINK_CLASS} {
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
`;

export type AiEverywhereNoteProps = {
  /** In a row of controls, not under one. */
  readonly inline?: boolean;
};

/**
 * Says why the "AI posts" control beside it cannot be changed, and takes the
 * user to where it can: the Page block of the settings.
 */
export function AiEverywhereNote(props: AiEverywhereNoteProps): JSX.Element {
  return (
    <>
      <style>{AI_CONTROL_CSS}</style>
      <p className={NOTE_CLASS} data-inline={props.inline === true ? "true" : undefined}>
        {NOTE_TEXT}{" "}
        <button
          type="button"
          className={`${NOTE_LINK_CLASS} rdw-kit-focusable`}
          onClick={() => {
            openSettingsAt(SETTINGS_SECTION_AI);
          }}
        >
          {NOTE_LINK}
        </button>
      </p>
    </>
  );
}

export type AiPostsToggleProps = {
  readonly scope: AiScope;
};

/**
 * The choice of one part of the site for AI posts, for the toolbar of an own
 * page: what is opened from this page, and what the page reads from the site,
 * is given with AI posts shown or hidden. The same two options as everywhere
 * else, with "AI" before them in place of a caption.
 */
export function AiPostsToggle(props: AiPostsToggleProps): JSX.Element {
  const everywhere = aiHiddenEverywhere();
  const [mode, setMode] = useState(() => aiModeIn(props.scope));
  return (
    <>
      <style>{AI_CONTROL_CSS}</style>
      <span className={TOGGLE_CLASS}>
        <span className={TOGGLE_LABEL_CLASS} aria-hidden="true">
          {TOGGLE_PREFIX}
        </span>
        <Segmented
          label={TOGGLE_ARIA}
          options={AI_MODE_OPTIONS}
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
      </span>
      {everywhere ? <AiEverywhereNote inline /> : null}
    </>
  );
}
