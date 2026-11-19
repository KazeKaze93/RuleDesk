import type { JSX } from "preact";

import {
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  RDW_THEME_ATTR,
} from "../../config/constants";
import {
  SITE_DARK_C_ACCENT,
  SITE_DARK_C_BG,
  SITE_DARK_C_BORDER,
  SITE_DEFAULT_SWITCH_ON,
  SITE_DEFAULT_SWITCH_THUMB_ON,
  SITE_LIGHT_C_BG_ALT,
  resolveSwitchThumbOn,
} from "../tokens";
import { KIT_CONTROL_HEIGHT, KIT_FOCUS_CSS } from "./shared";
import { KitStyle } from "./kit-style";

export type SwitchProps = {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
};

const SITE_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
const SITE_DARK_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;

/** Resolved thumb for Site default ON track (contrast-checked). */
export const SITE_DEFAULT_SWITCH_THUMB_RESOLVED = resolveSwitchThumbOn(
  SITE_DEFAULT_SWITCH_ON,
  SITE_DEFAULT_SWITCH_THUMB_ON,
  [SITE_LIGHT_C_BG_ALT, "#ffffff"],
);

/** Resolved thumb for Site dark ON track (accent on card/page bg). */
export const SITE_DARK_SWITCH_THUMB_RESOLVED = resolveSwitchThumbOn(
  SITE_DARK_C_ACCENT,
  SITE_DARK_C_BG,
  ["#16181c", "#ffffff"],
);

export const SWITCH_CSS = `
${KIT_FOCUS_CSS}
.rdw-switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: ${KIT_CONTROL_HEIGHT};
}
.rdw-switch {
  position: relative;
  box-sizing: border-box;
  width: 36px;
  height: ${KIT_CONTROL_HEIGHT};
  min-width: 36px;
  min-height: ${KIT_CONTROL_HEIGHT};
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.rdw-switch__track {
  display: block;
  width: 30px;
  height: 17px;
  margin: 0 auto;
  border-radius: 9px;
  background: var(--rdw-border);
  /* Off, the track was dark on a dark card: an outline tells it from the card. */
  box-shadow: inset 0 0 0 1px var(--rdw-muted);
  position: relative;
  transition: background 0.15s ease;
}
.rdw-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  /* Lighter than the track it lies on while off. */
  background: var(--rdw-muted);
  transition: left 0.15s ease;
}
.rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: var(--rdw-accent);
  box-shadow: none;
}
.rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  left: 15px;
  background: var(--rdw-surface);
}
.rdw-switch:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-switch__label {
  font-size: 12.5px;
  color: var(--rdw-text);
}
/* Site default: green ON (not link blue); OFF stays border; thumb contrast-checked. */
html${SITE_THEME_SELECTOR} .rdw-switch[aria-checked="true"] .rdw-switch__track,
:host-context(${SITE_THEME_SELECTOR}) .rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: ${SITE_DEFAULT_SWITCH_ON};
}
html${SITE_THEME_SELECTOR} .rdw-switch[aria-checked="true"] .rdw-switch__thumb,
:host-context(${SITE_THEME_SELECTOR}) .rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  background: ${SITE_DEFAULT_SWITCH_THUMB_RESOLVED};
}
html${SITE_THEME_SELECTOR} .rdw-switch:not([aria-checked="true"]) .rdw-switch__track,
:host-context(${SITE_THEME_SELECTOR}) .rdw-switch:not([aria-checked="true"]) .rdw-switch__track {
  background: var(--rdw-border);
}
/* Site dark: ON = accent; OFF = border; thumb contrast-checked vs accent. */
html${SITE_DARK_THEME_SELECTOR} .rdw-switch[aria-checked="true"] .rdw-switch__track,
:host-context(${SITE_DARK_THEME_SELECTOR}) .rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: ${SITE_DARK_C_ACCENT};
}
html${SITE_DARK_THEME_SELECTOR} .rdw-switch[aria-checked="true"] .rdw-switch__thumb,
:host-context(${SITE_DARK_THEME_SELECTOR}) .rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  background: ${SITE_DARK_SWITCH_THUMB_RESOLVED};
}
html${SITE_DARK_THEME_SELECTOR} .rdw-switch:not([aria-checked="true"]) .rdw-switch__track,
:host-context(${SITE_DARK_THEME_SELECTOR}) .rdw-switch:not([aria-checked="true"]) .rdw-switch__track {
  background: ${SITE_DARK_C_BORDER};
}
`;

export function Switch(props: SwitchProps): JSX.Element {
  const className = ["rdw-switch-row", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <KitStyle css={SWITCH_CSS} />
      <div className={className}>
        <button
          type="button"
          id={props.id}
          className="rdw-switch rdw-kit-focusable"
          role="switch"
          aria-checked={props.checked}
          aria-label={props.label}
          disabled={props.disabled}
          onClick={() => {
            props.onChange(!props.checked);
          }}
        >
          <span className="rdw-switch__track">
            <span className="rdw-switch__thumb" />
          </span>
        </button>
        {props.label !== undefined ? (
          <span className="rdw-switch__label">{props.label}</span>
        ) : null}
      </div>
    </>
  );
}
