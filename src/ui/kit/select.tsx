import type { JSX } from "preact";
import { useEffect, useId, useRef, useState } from "preact/hooks";

import { IconChevronDown } from "./icons";
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
.rdw-select__list {
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
  const [open, setOpen] = useState(false);
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
      if (!event.composedPath().includes(root)) {
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
          onClick={() => {
            setOpen((prev) => !prev);
          }}
        >
          <span>{selected?.label ?? props.value}</span>
          <IconChevronDown size={14} />
        </button>
        {open ? (
          <ul
            className="rdw-select__list"
            role="listbox"
            id={listId}
            tabIndex={-1}
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
                  }
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
