import type { ComponentChildren, JSX, MouseEventHandler, RefObject } from "preact";

import { KIT_CONTROL_HEIGHT, KIT_FOCUS_CSS } from "./shared";
import { KitStyle } from "./kit-style";

export type IconButtonProps = {
  readonly label: string;
  readonly pressed?: boolean;
  readonly disabled?: boolean;
  readonly children: ComponentChildren;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly className?: string;
  /** Set on the button of a menu: aria-haspopup="menu" and aria-expanded. */
  readonly menuOpen?: boolean;
  readonly buttonRef?: RefObject<HTMLButtonElement | null>;
};

export const ICON_BUTTON_CSS = `
${KIT_FOCUS_CSS}
.rdw-icon-btn {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: ${KIT_CONTROL_HEIGHT};
  min-height: ${KIT_CONTROL_HEIGHT};
  width: ${KIT_CONTROL_HEIGHT};
  height: ${KIT_CONTROL_HEIGHT};
  padding: 0;
  border-radius: var(--rdw-radius-m);
  border: 1px solid var(--rdw-border);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-icon-btn[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
  color: var(--rdw-accent);
}
.rdw-icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;

export function IconButton(props: IconButtonProps): JSX.Element {
  const className = ["rdw-icon-btn", "rdw-kit-focusable", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <KitStyle css={ICON_BUTTON_CSS} />
      <button
        type="button"
        className={className}
        aria-label={props.label}
        // An icon has no words: its name is the hint under the pointer too.
        title={props.label}
        aria-pressed={props.pressed}
        aria-haspopup={props.menuOpen === undefined ? undefined : "menu"}
        aria-expanded={props.menuOpen}
        {...(props.buttonRef === undefined ? {} : { ref: props.buttonRef })}
        disabled={props.disabled}
        onClick={props.onClick}
      >
        {props.children}
      </button>
    </>
  );
}
