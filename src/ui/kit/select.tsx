import type { JSX } from "preact";
import { createPortal } from "preact/compat";
import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "preact/hooks";

import { IconChevronDown } from "./icons";
import { OVERLAY_Z_INDEX, OverlayInPlace } from "./overlay";
import { KIT_CONTROL_FONT, KIT_CONTROL_HEIGHT, KIT_FOCUS_CSS } from "./shared";

export type SelectOption = {
  readonly value: string;
  readonly label: string;
};

export type SelectProps = {
  readonly options: readonly SelectOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly className?: string;
};

const LIST_CLASS = "rdw-select__list";
const LIST_FLOATING_CLASS = "rdw-select__list--floating";
const LIST_GAP_PX = 4;
const LIST_MAX_HEIGHT_PX = 220;
const LIST_EDGE_PX = 8;
const EVENT_SCROLL = "scroll";
const EVENT_RESIZE = "resize";

export const SELECT_CSS = `
${KIT_FOCUS_CSS}
.rdw-select {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-select__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-select__trigger {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: ${KIT_CONTROL_HEIGHT};
  height: ${KIT_CONTROL_HEIGHT};
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: ${KIT_CONTROL_FONT};
  cursor: pointer;
}
.rdw-select__trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.${LIST_CLASS} {
  position: absolute;
  z-index: 20;
  top: calc(100% + ${String(LIST_GAP_PX)}px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  box-shadow: var(--rdw-shadow-2);
  max-height: ${String(LIST_MAX_HEIGHT_PX)}px;
  overflow: auto;
}
/* On a page of the site the list is drawn in <body> and placed by the trigger. */
.${LIST_CLASS}.${LIST_FLOATING_CLASS} {
  position: fixed;
  z-index: ${String(OVERLAY_Z_INDEX)};
  right: auto;
  box-sizing: border-box;
  font: 12.5px/1.4 var(--rdw-font);
  text-align: left;
}
.rdw-select__option {
  min-height: ${KIT_CONTROL_HEIGHT};
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--rdw-radius-s);
  font-size: ${KIT_CONTROL_FONT};
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-select__option[aria-selected="true"],
.rdw-select__option:hover {
  background: var(--rdw-surface-2);
}
`;

export function Select(props: SelectProps): JSX.Element {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  // In a shadow root the list stays in it whatever the context says: its styles are there.
  const inPlace = useContext(OverlayInPlace);
  const floating = !inPlace && !(rootRef.current?.getRootNode() instanceof ShadowRoot);
  const selected =
    props.options.find((option) => option.value === props.value) ??
    props.options[0];
  const className = ["rdw-select", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (root === null) {
        return;
      }
      // Shadow DOM retargets event.target to the host; composedPath keeps the real nodes.
      const path = event.composedPath();
      const list = listRef.current;
      if (!path.includes(root) && (list === null || !path.includes(list))) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  // The list in <body> keeps under its trigger, or over it where there is no room below.
  useLayoutEffect(() => {
    if (!open || !floating) {
      return undefined;
    }
    const place = (): void => {
      const trigger = triggerRef.current;
      const list = listRef.current;
      if (trigger === null || list === null) {
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const height = Math.min(list.scrollHeight, LIST_MAX_HEIGHT_PX);
      const below = rect.bottom + LIST_GAP_PX;
      const fitsBelow = below + height <= window.innerHeight - LIST_EDGE_PX;
      const above = rect.top - LIST_GAP_PX - height;
      list.style.top = `${String(fitsBelow || above < LIST_EDGE_PX ? below : above)}px`;
      list.style.left = `${String(rect.left)}px`;
      list.style.minWidth = `${String(rect.width)}px`;
    };
    place();
    window.addEventListener(EVENT_SCROLL, place, true);
    window.addEventListener(EVENT_RESIZE, place);
    return () => {
      window.removeEventListener(EVENT_SCROLL, place, true);
      window.removeEventListener(EVENT_RESIZE, place);
    };
  }, [open, floating]);

  const list = open ? (
    <ul
      className={floating ? `${LIST_CLASS} ${LIST_FLOATING_CLASS}` : LIST_CLASS}
      role="listbox"
      id={listId}
      tabIndex={-1}
      ref={listRef}
    >
      {props.options.map((option) => (
        <li
          key={option.value}
          role="option"
          className="rdw-select__option rdw-kit-focusable"
          aria-selected={option.value === props.value}
          tabIndex={0}
          onClick={() => {
            props.onChange(option.value);
            setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              props.onChange(option.value);
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          {option.label}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <>
      <style>{SELECT_CSS}</style>
      <div className={className} ref={rootRef}>
        {props.label !== undefined ? (
          <span className="rdw-select__label" id={`${listId}-label`}>
            {props.label}
          </span>
        ) : null}
        <button
          type="button"
          className="rdw-select__trigger rdw-kit-focusable"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={
            props.label !== undefined ? `${listId}-label` : undefined
          }
          disabled={props.disabled}
          ref={triggerRef}
          onClick={() => {
            setOpen((prev) => !prev);
          }}
        >
          <span>{selected?.label ?? props.value}</span>
          <IconChevronDown size={14} />
        </button>
        {floating ? null : list}
      </div>
      {floating && list !== null ? createPortal(list, document.body) : null}
    </>
  );
}
