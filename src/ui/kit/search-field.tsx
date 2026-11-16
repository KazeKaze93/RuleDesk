import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";

import { IconHelp, IconSearch, IconX } from "./icons";
import { Popover } from "./popover";
import { TextField } from "./text-field";

/**
 * A field to search or filter with: a magnifier at the left, a button that
 * clears what was typed, and, when the field understands more than plain
 * words, a "?" that lists it. The same on Favorites, Collections, Following.
 */

export type SearchHelp = {
  /** Name of the "?" button and of the list it opens. */
  readonly label: string;
  /** What can be typed: an example and what it does. */
  readonly rows: readonly (readonly [string, string])[];
  /** A line under the list. */
  readonly note?: string;
  readonly widthPx?: number;
};

export type SearchFieldProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder: string;
  readonly "aria-label": string;
  readonly id?: string;
  readonly className?: string;
  readonly help?: SearchHelp;
  /** Name of the clear button. */
  readonly clearLabel?: string;
};

export const SEARCH_FIELD_CLASS = "rdw-search-field";
export const SEARCH_HELP_CLASS = "rdw-search-help";
const ICON_CLASS = "rdw-search-field__icon";
const TOOLS_CLASS = "rdw-search-field__tools";
const TOOL_CLASS = "rdw-search-field__tool";
const NOTE_CLASS = "rdw-search-help__note";
const INPUT_CLASS = "rdw-search-field__input";

const DEFAULT_CLEAR_LABEL = "Clear";
const DEFAULT_HELP_WIDTH_PX = 320;
const ICON_PX = 14;
const HELP_FONT = 'ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace';

export const SEARCH_FIELD_CSS = `
.${SEARCH_FIELD_CLASS} {
  position: relative;
  min-width: 0;
}
.${SEARCH_FIELD_CLASS} .${INPUT_CLASS} {
  margin: 0;
}
.${SEARCH_FIELD_CLASS} .${INPUT_CLASS} .rdw-field__input {
  padding-left: 30px;
  padding-right: 56px;
}
.${ICON_CLASS} {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--rdw-muted);
  pointer-events: none;
}
.${TOOLS_CLASS} {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
}
.${TOOL_CLASS} {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-muted);
  cursor: pointer;
}
.${TOOL_CLASS}:hover,
.${TOOL_CLASS}[aria-expanded="true"] {
  color: var(--rdw-text);
}
.${SEARCH_HELP_CLASS} {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  margin: 0;
}
/* The site styles dt on its own (bold, its own font); a command has to be in
   a fixed-width font, or the spaces that matter in it cannot be seen. */
.rdw-popover .${SEARCH_HELP_CLASS} dt {
  margin: 0;
  font: 400 12px/1.4 ${HELP_FONT} !important;
  white-space: pre;
  color: var(--rdw-text);
}
.${SEARCH_HELP_CLASS} dd {
  margin: 0;
  color: var(--rdw-muted);
}
.${NOTE_CLASS} {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--rdw-border);
  color: var(--rdw-muted);
  line-height: 1.4;
}
`.trim();

/** The list a "?" opens; also used by the help of the site's own search field. */
export function SearchHelpList(props: { readonly help: SearchHelp }): JSX.Element {
  return (
    <>
      <style>{SEARCH_FIELD_CSS}</style>
      <dl className={SEARCH_HELP_CLASS}>
        {props.help.rows.map(([example, meaning]) => (
          <>
            <dt>{example}</dt>
            <dd>{meaning}</dd>
          </>
        ))}
      </dl>
      {props.help.note === undefined ? null : <p className={NOTE_CLASS}>{props.help.note}</p>}
    </>
  );
}

export function SearchField(props: SearchFieldProps): JSX.Element {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { help } = props;
  const clearLabel = props.clearLabel ?? DEFAULT_CLEAR_LABEL;
  const className = [SEARCH_FIELD_CLASS, props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <div className={className} ref={rootRef}>
      <style>{SEARCH_FIELD_CSS}</style>
      <IconSearch className={ICON_CLASS} size={ICON_PX} />
      <TextField
        {...(props.id === undefined ? {} : { id: props.id })}
        className={INPUT_CLASS}
        value={props.value}
        placeholder={props.placeholder}
        aria-label={props["aria-label"]}
        onChange={props.onChange}
      />
      <span className={TOOLS_CLASS}>
        {props.value.length > 0 ? (
          <button
            type="button"
            className={`${TOOL_CLASS} rdw-kit-focusable`}
            aria-label={clearLabel}
            title={clearLabel}
            onClick={() => {
              props.onChange("");
              rootRef.current?.querySelector("input")?.focus();
            }}
          >
            <IconX size={ICON_PX} />
          </button>
        ) : null}
        {help === undefined ? null : (
          <button
            type="button"
            ref={helpButtonRef}
            className={`${TOOL_CLASS} rdw-kit-focusable`}
            aria-label={help.label}
            title={help.label}
            aria-expanded={helpOpen}
            onClick={() => {
              setHelpOpen(!helpOpen);
            }}
          >
            <IconHelp size={ICON_PX} />
          </button>
        )}
      </span>
      {help === undefined ? null : (
        <Popover
          open={helpOpen}
          onClose={() => {
            setHelpOpen(false);
          }}
          anchorRef={helpButtonRef}
          widthPx={help.widthPx ?? DEFAULT_HELP_WIDTH_PX}
          alignEnd
          aria-label={help.label}
        >
          <SearchHelpList help={help} />
        </Popover>
      )}
    </div>
  );
}
