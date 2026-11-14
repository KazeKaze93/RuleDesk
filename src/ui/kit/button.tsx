import type { ComponentChildren, JSX, MouseEventHandler } from "preact";

import { KIT_FOCUS_CSS, KIT_MIN_TARGET_PX } from "./shared";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "s" | "m";

export type ButtonProps = {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly type?: "button" | "submit" | "reset";
  readonly children?: ComponentChildren;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly className?: string;
  readonly "aria-label"?: string;
  /** Native tooltip. */
  readonly title?: string;
};

export const BUTTON_CSS = `
${KIT_FOCUS_CSS}
.rdw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  min-height: ${KIT_MIN_TARGET_PX}px;
  border-radius: var(--rdw-radius-m);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  padding: 0 12px;
  color: var(--rdw-text);
  background: var(--rdw-surface);
}
.rdw-btn--s {
  min-height: ${KIT_MIN_TARGET_PX}px;
  padding: 0 10px;
  font-size: 12px;
}
.rdw-btn--m {
  min-height: ${KIT_MIN_TARGET_PX}px;
  padding: 0 12px;
}
.rdw-btn--primary {
  background: var(--rdw-accent);
  border-color: var(--rdw-accent);
  color: var(--rdw-surface);
}
.rdw-btn--secondary {
  background: var(--rdw-surface);
  border-color: var(--rdw-border);
  color: var(--rdw-text);
}
.rdw-btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--rdw-accent);
}
.rdw-btn--danger {
  background: var(--rdw-danger);
  border-color: var(--rdw-danger);
  color: var(--rdw-surface);
}
.rdw-btn:disabled,
.rdw-btn[aria-busy="true"] {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-btn__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: rdw-btn-spin 0.7s linear infinite;
}
@keyframes rdw-btn-spin {
  to { transform: rotate(360deg); }
}
`;

export function Button(props: ButtonProps): JSX.Element {
  const variant = props.variant ?? "secondary";
  const size = props.size ?? "m";
  const loading = props.loading === true;
  const disabled = props.disabled === true || loading;
  const className = [
    "rdw-btn",
    "rdw-kit-focusable",
    `rdw-btn--${variant}`,
    `rdw-btn--${size}`,
    props.className,
  ]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{BUTTON_CSS}</style>
      <button
        type={props.type ?? "button"}
        className={className}
        disabled={disabled}
        aria-busy={loading ? true : undefined}
        aria-label={props["aria-label"]}
        title={props.title}
        onClick={props.onClick}
      >
        {loading ? <span className="rdw-btn__spinner" aria-hidden="true" /> : null}
        {props.children}
      </button>
    </>
  );
}
