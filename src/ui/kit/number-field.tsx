import type { JSX } from "preact";
import { useId } from "preact/hooks";

import { KIT_CONTROL_FONT, KIT_CONTROL_HEIGHT, KIT_FOCUS_CSS } from "./shared";

export type NumberFieldProps = {
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly label?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly className?: string;
  readonly id?: string;
};

export const NUMBER_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-num {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-num__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-num__input {
  box-sizing: border-box;
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
}
.rdw-num__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
/* The browser's own arrows are white boxes on a dark field; the arrow keys
   still change the number. */
.rdw-num__input::-webkit-inner-spin-button,
.rdw-num__input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.rdw-num__input {
  -moz-appearance: textfield;
  appearance: textfield;
}
/* The ring of a field lies on its border and does not stand off it. */
.rdw-num__input.rdw-kit-focusable:focus-visible {
  outline-offset: -1px;
  border-color: var(--rdw-accent);
}
`;

export function NumberField(props: NumberFieldProps): JSX.Element {
  const autoId = useId();
  const inputId = props.id ?? autoId;
  const className = ["rdw-num", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{NUMBER_FIELD_CSS}</style>
      <div className={className}>
        {props.label !== undefined ? (
          <label className="rdw-num__label" htmlFor={inputId}>
            {props.label}
          </label>
        ) : null}
        <input
          id={inputId}
          className="rdw-num__input rdw-kit-focusable"
          type="number"
          value={props.value ?? ""}
          min={props.min}
          max={props.max}
          step={props.step}
          placeholder={props.placeholder}
          disabled={props.disabled}
          aria-label={props.label}
          onInput={(event) => {
            const raw = event.currentTarget.value;
            if (raw.trim() === "") {
              props.onChange(null);
              return;
            }
            const next = Number(raw);
            props.onChange(Number.isFinite(next) ? next : null);
          }}
        />
      </div>
    </>
  );
}
