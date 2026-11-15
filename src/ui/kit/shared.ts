/** Shared kit class prefixes and a11y helpers (no DOM creation). */

export const KIT_MIN_TARGET_PX = 28;

/** A page may make the kit's controls larger by setting these on its root. */
export const KIT_CONTROL_HEIGHT_VAR = "--rdw-control-h";
export const KIT_CONTROL_FONT_VAR = "--rdw-control-font";
const KIT_CONTROL_FONT_PX = 12;
/** Height of a button, a field, a switch of options; 28px unless the page says otherwise. */
export const KIT_CONTROL_HEIGHT = `var(${KIT_CONTROL_HEIGHT_VAR}, ${String(KIT_MIN_TARGET_PX)}px)`;
/** Text size inside those controls; 12px unless the page says otherwise. */
export const KIT_CONTROL_FONT = `var(${KIT_CONTROL_FONT_VAR}, ${String(KIT_CONTROL_FONT_PX)}px)`;

export const KIT_FOCUS_CSS = `
.rdw-kit-focusable:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`;
