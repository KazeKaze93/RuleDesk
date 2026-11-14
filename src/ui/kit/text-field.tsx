import type { JSX } from "preact";
import { useId } from "preact/hooks";

import { KIT_FOCUS_CSS, KIT_MIN_TARGET_PX } from "./shared";

export type TextFieldProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
  readonly "aria-label"?: string;
};

export const TEXT_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-field__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-field__input {
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
/* Site CSS paints focused text inputs light yellow; keep the theme colours. */
input.rdw-field__input.rdw-kit-focusable:focus {
  background: var(--rdw-surface);
  color: var(--rdw-text);
}
.rdw-field__input::placeholder {
  color: var(--rdw-muted);
}
.rdw-field__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;

export function TextField(props: TextFieldProps): JSX.Element {
  const autoId = useId();
  const inputId = props.id ?? autoId;
  const className = ["rdw-field", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{TEXT_FIELD_CSS}</style>
      <div className={className}>
        {props.label !== undefined ? (
          <label className="rdw-field__label" htmlFor={inputId}>
            {props.label}
          </label>
        ) : null}
        <input
          id={inputId}
          className="rdw-field__input rdw-kit-focusable"
          type="text"
          value={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          aria-label={props["aria-label"] ?? props.label}
          onInput={(event) => {
            props.onChange(event.currentTarget.value);
          }}
        />
      </div>
    </>
  );
}
