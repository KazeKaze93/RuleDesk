import type { JSX } from "preact";

import { KIT_CONTROL_FONT, KIT_CONTROL_HEIGHT, KIT_FOCUS_CSS } from "./shared";

export type SegmentedOption = {
  readonly value: string;
  readonly label: string;
};

export type SegmentedProps = {
  readonly options: readonly SegmentedOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly className?: string;
};

export const SEGMENTED_CSS = `
${KIT_FOCUS_CSS}
.rdw-seg {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  background: var(--rdw-seg-track, transparent);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  padding: 2px;
  gap: 2px;
  /* The whole control is as tall as a button or a field beside it. */
  box-sizing: border-box;
  height: ${KIT_CONTROL_HEIGHT};
}
.rdw-seg__btn {
  min-height: 0;
  height: 100%;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-seg-text, var(--rdw-muted));
  font: inherit;
  font-size: ${KIT_CONTROL_FONT};
  cursor: pointer;
  padding: 0 8px;
}
.rdw-seg__btn[aria-checked="true"] {
  background: var(--rdw-seg-on, var(--rdw-surface));
  color: var(--rdw-seg-on-text, var(--rdw-text));
  font-weight: 600;
}
`;

export function Segmented(props: SegmentedProps): JSX.Element {
  const className = ["rdw-seg", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{SEGMENTED_CSS}</style>
      <div
        className={className}
        role="radiogroup"
        aria-label={props.label}
      >
        {props.options.map((option) => {
          const selected = option.value === props.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              className="rdw-seg__btn rdw-kit-focusable"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                props.onChange(option.value);
              }}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                  return;
                }
                event.preventDefault();
                const index = props.options.findIndex(
                  (item) => item.value === props.value,
                );
                if (index < 0) {
                  return;
                }
                const delta = event.key === "ArrowRight" ? 1 : -1;
                const next =
                  props.options[
                    (index + delta + props.options.length) % props.options.length
                  ];
                if (next !== undefined) {
                  props.onChange(next.value);
                }
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
