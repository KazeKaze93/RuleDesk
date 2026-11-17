import type { InputHTMLAttributes, JSX, TargetedKeyboardEvent } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "preact/hooks";

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

/** One line of the list of suggestions. */
export type SearchSuggestItem = {
  readonly key: string;
  /** The text of the line; the part from `matchStart` on is what was typed. */
  readonly label: string;
  readonly matchStart: number;
  readonly matchLength: number;
  /** At the right end of the line: a count or a word of explanation. */
  readonly trailing: string | null;
  /** What a screen reader says for the line ("zootopia, 5 posts"). */
  readonly announce: string;
  /** A rule over this line: it starts another kind of match. */
  readonly divider: boolean;
};

export type SearchSuggestList = {
  readonly heading: string | null;
  readonly items: readonly SearchSuggestItem[];
};

/**
 * Where a field gets its suggestions. The field asks for the list for what is
 * typed and where the caret is, and for the text with one of them put in.
 */
export type SearchSuggest = {
  /** Name of the list for screen readers. */
  readonly label: string;
  readonly list: (text: string, caret: number) => SearchSuggestList | null;
  readonly pick: (
    text: string,
    caret: number,
    index: number,
  ) => { readonly text: string; readonly caret: number } | null;
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
  /** Suggestions under the field, by the ARIA combobox pattern. */
  readonly suggest?: SearchSuggest;
  /**
   * Told when what is typed is meant: on Enter, on a suggestion picked, when
   * the field is left, and on every change while no list of suggestions is
   * open (a space ends a word, and with it the list). A field without
   * suggestions tells on every change.
   */
  readonly onCommit?: (value: string) => void;
  /** Told when the field gets the focus (a field with suggestions only). */
  readonly onFocus?: () => void;
};

export const SEARCH_FIELD_CLASS = "rdw-search-field";
export const SEARCH_HELP_CLASS = "rdw-search-help";
const ICON_CLASS = "rdw-search-field__icon";
const TOOLS_CLASS = "rdw-search-field__tools";
const TOOL_CLASS = "rdw-search-field__tool";
const NOTE_CLASS = "rdw-search-help__note";
const INPUT_CLASS = "rdw-search-field__input";

const SUGGEST_CLASS = "rdw-suggest";
const SUGGEST_HEADING_CLASS = "rdw-suggest__heading";
const SUGGEST_LIST_CLASS = "rdw-suggest__list";
const SUGGEST_ROW_CLASS = "rdw-suggest__row";
const SUGGEST_ROW_ACTIVE_CLASS = "rdw-suggest__row--active";
const SUGGEST_ROW_DIVIDER_CLASS = "rdw-suggest__row--divider";
const SUGGEST_LABEL_CLASS = "rdw-suggest__label";
const SUGGEST_TRAILING_CLASS = "rdw-suggest__trailing";
const SUGGEST_MIN_WIDTH_PX = 320;
const SUGGEST_MAX_WIDTH_PX = 480;
const SUGGEST_ROW_HEIGHT_PX = 28;
const SUGGEST_VISIBLE_ROWS = 8;
const SUGGEST_GAP_PX = 4;
const SUGGEST_EDGE_PX = 8;
/** Above the pinned rows and the post panel, as an anchored popover is. */
const SUGGEST_Z_INDEX = 120;
const SUGGEST_ACCENT_BAR_PX = 3;
const KEY_DOWN = "ArrowDown";
const KEY_UP = "ArrowUp";
const KEY_ENTER = "Enter";
const KEY_TAB = "Tab";
const KEY_ESCAPE = "Escape";

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

/* The list is drawn in <body>, fixed under the field, so that a row that
   clips its content (the pinned row of Favorites) cannot clip it. */
export const SEARCH_SUGGEST_CSS = `
.${SUGGEST_CLASS} {
  position: fixed;
  z-index: ${String(SUGGEST_Z_INDEX)};
  box-sizing: border-box;
  margin: 0;
  padding: 4px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12.5px/1.35 var(--rdw-font);
}
.${SUGGEST_HEADING_CLASS} {
  padding: 4px 8px 6px;
  color: var(--rdw-muted);
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.${SUGGEST_LIST_CLASS} {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: ${String(SUGGEST_ROW_HEIGHT_PX * SUGGEST_VISIBLE_ROWS)}px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
}
.${SUGGEST_ROW_CLASS} {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: ${String(SUGGEST_ROW_HEIGHT_PX)}px;
  margin: 0;
  padding: 0 8px 0 ${String(8 + SUGGEST_ACCENT_BAR_PX)}px;
  border-radius: var(--rdw-radius-s);
  list-style: none;
  cursor: pointer;
  position: relative;
}
.${SUGGEST_ROW_CLASS}.${SUGGEST_ROW_DIVIDER_CLASS} {
  margin-top: 9px;
}
/* The rule between the tags that begin with what was typed and the rest. */
.${SUGGEST_ROW_CLASS}.${SUGGEST_ROW_DIVIDER_CLASS}::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: -5px;
  border-top: 1px solid var(--rdw-border);
}
.${SUGGEST_ROW_CLASS}:hover,
.${SUGGEST_ROW_CLASS}.${SUGGEST_ROW_ACTIVE_CLASS} {
  background: var(--rdw-surface-2);
}
/* The line chosen with the keyboard has a bar as well: not told by colour alone. */
.${SUGGEST_ROW_CLASS}.${SUGGEST_ROW_ACTIVE_CLASS}::before {
  content: "";
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: ${String(SUGGEST_ACCENT_BAR_PX)}px;
  border-radius: ${String(SUGGEST_ACCENT_BAR_PX)}px;
  background: var(--rdw-accent);
}
.${SUGGEST_LABEL_CLASS} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-muted);
}
.${SUGGEST_LABEL_CLASS} b {
  color: var(--rdw-text);
  font-weight: 700;
}
.${SUGGEST_TRAILING_CLASS} {
  flex: none;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
`.trim();

/** Where the list goes: under the field, from its left edge, kept inside the window. */
export function suggestBox(
  fieldLeft: number,
  fieldBottom: number,
  fieldWidth: number,
  viewportWidth: number,
): { readonly top: number; readonly left: number; readonly width: number } {
  const room = Math.max(0, viewportWidth - SUGGEST_EDGE_PX * 2);
  const width = Math.min(
    room,
    Math.max(SUGGEST_MIN_WIDTH_PX, Math.min(SUGGEST_MAX_WIDTH_PX, fieldWidth)),
  );
  const left = Math.max(
    SUGGEST_EDGE_PX,
    Math.min(fieldLeft, viewportWidth - SUGGEST_EDGE_PX - width),
  );
  return { top: fieldBottom + SUGGEST_GAP_PX, left, width };
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  // The list was closed with Esc; typing opens it again.
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);
  // Where the caret goes once a picked suggestion is in the field.
  const caretAfterPick = useRef<number | null>(null);
  const { help, suggest, onCommit } = props;
  const clearLabel = props.clearLabel ?? DEFAULT_CLEAR_LABEL;
  const className = [SEARCH_FIELD_CLASS, props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  const list =
    suggest !== undefined && focused && !dismissed ? suggest.list(props.value, caret) : null;
  const items = list?.items ?? [];
  const open = items.length > 0;
  const activeIndex = open ? Math.min(active, items.length - 1) : -1;

  const readCaret = (): number => inputRef.current?.selectionStart ?? props.value.length;

  const change = (value: string): void => {
    props.onChange(value);
    const at = inputRef.current?.selectionStart ?? value.length;
    setCaret(at);
    setDismissed(false);
    setActive(0);
    // While a list is open the word is not finished: the page keeps what it shows.
    const next = suggest === undefined ? null : suggest.list(value, at);
    if (next === null || next.items.length === 0) {
      onCommit?.(value);
    }
  };

  const pick = (index: number): void => {
    const done = suggest?.pick(props.value, caret, index) ?? null;
    if (done === null) {
      return;
    }
    caretAfterPick.current = done.caret;
    props.onChange(done.text);
    setCaret(done.caret);
    setActive(0);
    onCommit?.(done.text);
  };

  useLayoutEffect(() => {
    const at = caretAfterPick.current;
    const input = inputRef.current;
    if (at !== null && input !== null) {
      caretAfterPick.current = null;
      input.setSelectionRange(at, at);
    }
  });

  // The list is fixed under the field; it follows the field when the page moves.
  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }
    const place = (): void => {
      const root = rootRef.current;
      const box = listRef.current;
      if (root === null || box === null) {
        return;
      }
      const rect = root.getBoundingClientRect();
      const at = suggestBox(rect.left, rect.bottom, rect.width, window.innerWidth);
      box.style.top = `${String(at.top)}px`;
      box.style.left = `${String(at.left)}px`;
      box.style.width = `${String(at.width)}px`;
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }
    const row = listRef.current?.querySelector(`#${CSS.escape(`${listId}-${String(activeIndex)}`)}`);
    if (row instanceof HTMLElement && typeof row.scrollIntoView === "function") {
      row.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, listId]);

  const onKeyDown = (event: TargetedKeyboardEvent<HTMLInputElement>): void => {
    if (!open) {
      if (event.key === KEY_ENTER) {
        onCommit?.(props.value);
      }
      return;
    }
    if (event.key === KEY_DOWN || event.key === KEY_UP) {
      event.preventDefault();
      const step = event.key === KEY_DOWN ? 1 : -1;
      setActive((activeIndex + step + items.length) % items.length);
    } else if (event.key === KEY_ENTER || event.key === KEY_TAB) {
      event.preventDefault();
      pick(activeIndex);
    } else if (event.key === KEY_ESCAPE) {
      // Only the list is closed; what is typed stays and is taken as it is.
      event.preventDefault();
      event.stopPropagation();
      setDismissed(true);
      onCommit?.(props.value);
    }
  };

  const suggestions = open ? (
    <>
      <style>{SEARCH_SUGGEST_CSS}</style>
      <div
        className={SUGGEST_CLASS}
        ref={listRef}
        // A press in the list must not take the focus out of the field.
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        {list?.heading === null || list?.heading === undefined ? null : (
          <div className={SUGGEST_HEADING_CLASS} aria-hidden="true">
            {list.heading}
          </div>
        )}
        <ul
          className={SUGGEST_LIST_CLASS}
          id={listId}
          role="listbox"
          aria-label={
            list?.heading === null || list?.heading === undefined
              ? suggest?.label
              : `${suggest?.label ?? ""}: ${list.heading}`
          }
        >
          {items.map((item, index) => (
            <li
              key={item.key}
              id={`${listId}-${String(index)}`}
              role="option"
              aria-selected={index === activeIndex}
              aria-label={item.announce}
              className={[
                SUGGEST_ROW_CLASS,
                index === activeIndex ? SUGGEST_ROW_ACTIVE_CLASS : "",
                item.divider ? SUGGEST_ROW_DIVIDER_CLASS : "",
              ]
                .filter((part) => part.length > 0)
                .join(" ")}
              onClick={() => {
                pick(index);
              }}
            >
              <span className={SUGGEST_LABEL_CLASS}>
                {item.label.slice(0, item.matchStart)}
                <b>{item.label.slice(item.matchStart, item.matchStart + item.matchLength)}</b>
                {item.label.slice(item.matchStart + item.matchLength)}
              </span>
              {item.trailing === null ? null : (
                <span className={SUGGEST_TRAILING_CLASS}>{item.trailing}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  ) : null;

  const comboAttrs: InputHTMLAttributes =
    suggest === undefined
      ? {}
      : {
          role: "combobox",
          autocomplete: "off",
          "aria-autocomplete": "list",
          "aria-expanded": open,
          "aria-controls": listId,
          ...(activeIndex >= 0
            ? { "aria-activedescendant": `${listId}-${String(activeIndex)}` }
            : {}),
          onKeyDown,
          onKeyUp: () => {
            setCaret(readCaret());
          },
          onClick: () => {
            setCaret(readCaret());
          },
          onFocus: () => {
            setFocused(true);
            setCaret(readCaret());
            props.onFocus?.();
          },
          onBlur: () => {
            setFocused(false);
            setDismissed(false);
            onCommit?.(props.value);
          },
        };

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
        inputRef={inputRef}
        inputAttrs={comboAttrs}
        onChange={change}
      />
      {suggestions !== null && document.body !== null
        ? createPortal(suggestions, document.body)
        : null}
      <span className={TOOLS_CLASS}>
        {props.value.length > 0 ? (
          <button
            type="button"
            className={`${TOOL_CLASS} rdw-kit-focusable`}
            aria-label={clearLabel}
            title={clearLabel}
            onClick={() => {
              props.onChange("");
              onCommit?.("");
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
