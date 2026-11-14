import type { JSX } from "preact";
import { useEffect, useId, useRef, useState } from "preact/hooks";

import { KIT_FOCUS_CSS, KIT_MIN_TARGET_PX } from "./shared";

export type AutocompleteOption = {
  readonly label: string;
  readonly value: string;
  readonly type?: string;
};

export type AutocompleteFieldProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly suggestions: readonly AutocompleteOption[];
  readonly onSelect?: (option: AutocompleteOption) => void;
  /**
   * False: picking an option only calls `onSelect`, and the caller writes the
   * new value (multi-token fields). Default: the option replaces the value.
   */
  readonly replaceOnSelect?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
  readonly "aria-label"?: string;
};

const KEY_ARROW_DOWN = "ArrowDown";
const KEY_ARROW_UP = "ArrowUp";
const KEY_ENTER = "Enter";
const KEY_ESCAPE = "Escape";
const NO_ACTIVE_INDEX = -1;

export const AUTOCOMPLETE_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-ac {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-ac__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-ac__input {
  box-sizing: border-box;
  min-height: ${KIT_MIN_TARGET_PX}px;
  height: ${KIT_MIN_TARGET_PX}px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
}
.rdw-ac__input::placeholder {
  color: var(--rdw-muted);
}
.rdw-ac__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-ac__list {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  box-shadow: var(--rdw-shadow-2);
  max-height: 220px;
  overflow: auto;
}
.rdw-ac__option {
  min-height: ${KIT_MIN_TARGET_PX}px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--rdw-radius-s);
  font-size: 12px;
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-ac__option[aria-selected="true"],
.rdw-ac__option:hover {
  background: var(--rdw-surface-2);
}
`;

export function AutocompleteField(props: AutocompleteFieldProps): JSX.Element {
  const autoId = useId();
  const listId = useId();
  const inputId = props.id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_INDEX);

  const suggestions = props.suggestions;
  const hasSuggestions = suggestions.length > 0;
  const listOpen = open && hasSuggestions && props.disabled !== true;

  useEffect(() => {
    setActiveIndex(NO_ACTIVE_INDEX);
    if (hasSuggestions) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [suggestions, hasSuggestions]);

  useEffect(() => {
    if (!listOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (root === null) {
        return;
      }
      // Shadow DOM retargets event.target to the host; composedPath keeps the real nodes.
      if (!event.composedPath().includes(root)) {
        setOpen(false);
        setActiveIndex(NO_ACTIVE_INDEX);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [listOpen]);

  const selectOption = (option: AutocompleteOption): void => {
    if (props.replaceOnSelect !== false) {
      props.onChange(option.value);
    }
    props.onSelect?.(option);
    setOpen(false);
    setActiveIndex(NO_ACTIVE_INDEX);
  };

  const className = ["rdw-ac", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  const activeOption =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? suggestions[activeIndex]
      : undefined;

  return (
    <>
      <style>{AUTOCOMPLETE_FIELD_CSS}</style>
      <div className={className} ref={rootRef}>
        {props.label !== undefined ? (
          <label className="rdw-ac__label" htmlFor={inputId}>
            {props.label}
          </label>
        ) : null}
        <input
          id={inputId}
          className="rdw-ac__input rdw-kit-focusable"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-activedescendant={
            activeOption !== undefined
              ? `${listId}-opt-${String(activeIndex)}`
              : undefined
          }
          value={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          aria-label={props["aria-label"] ?? props.label}
          autoComplete="off"
          onInput={(event) => {
            props.onChange(event.currentTarget.value);
          }}
          onFocus={() => {
            if (hasSuggestions) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === KEY_ESCAPE) {
              if (listOpen) {
                event.preventDefault();
                setOpen(false);
                setActiveIndex(NO_ACTIVE_INDEX);
              }
              return;
            }
            if (event.key === KEY_ARROW_DOWN) {
              if (!hasSuggestions) {
                return;
              }
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => {
                if (current < 0) {
                  return 0;
                }
                return Math.min(current + 1, suggestions.length - 1);
              });
              return;
            }
            if (event.key === KEY_ARROW_UP) {
              if (!listOpen) {
                return;
              }
              event.preventDefault();
              setActiveIndex((current) => {
                if (current <= 0) {
                  return NO_ACTIVE_INDEX;
                }
                return current - 1;
              });
              return;
            }
            if (event.key === KEY_ENTER) {
              if (listOpen && activeOption !== undefined) {
                event.preventDefault();
                selectOption(activeOption);
              }
              // No active highlight: let the form submit with typed text.
            }
          }}
        />
        {listOpen ? (
          <ul
            className="rdw-ac__list"
            role="listbox"
            id={listId}
            tabIndex={-1}
          >
            {suggestions.map((option, index) => (
              <li
                key={`${option.value}:${option.type ?? ""}:${option.label}`}
                id={`${listId}-opt-${String(index)}`}
                role="option"
                className="rdw-ac__option rdw-kit-focusable"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => {
                  // Keep focus on the input; prevent blur-before-click races.
                  event.preventDefault();
                }}
                onClick={() => {
                  selectOption(option);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
