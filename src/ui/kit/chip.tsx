import type { JSX } from "preact";

import { IconX } from "./icons";
import { KIT_CONTROL_FONT, KIT_CONTROL_HEIGHT, KIT_FOCUS_CSS } from "./shared";

export type ChipKind = "artist" | "character" | "copyright" | "metadata" | "default";
export type ChipVariant = "dot" | "exclude" | "group";

export type ChipProps = {
  readonly label: string;
  readonly variant?: ChipVariant;
  readonly kind?: ChipKind;
  readonly onRemove?: () => void;
  readonly className?: string;
};

export const CHIP_CSS = `
${KIT_FOCUS_CSS}
.rdw-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  height: 24px;
  padding: 0 4px 0 8px;
  border-radius: 12px;
  background: var(--rdw-surface-2);
  border: 1px solid var(--rdw-border);
  font-size: ${KIT_CONTROL_FONT};
  color: var(--rdw-text);
  max-width: 100%;
  white-space: nowrap;
}
.rdw-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--rdw-muted);
  flex: none;
}
.rdw-chip--artist .rdw-chip__dot { background: var(--rdw-tag-artist); }
.rdw-chip--character .rdw-chip__dot { background: var(--rdw-tag-character); }
.rdw-chip--copyright .rdw-chip__dot { background: var(--rdw-tag-copyright); }
.rdw-chip--metadata .rdw-chip__dot { background: var(--rdw-tag-metadata); }
.rdw-chip--exclude {
  background: var(--rdw-danger-soft);
  border-color: var(--rdw-danger);
  color: var(--rdw-danger);
  text-decoration: line-through;
}
.rdw-chip--group {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
  color: var(--rdw-accent);
  font-weight: 600;
}
.rdw-chip__remove {
  box-sizing: border-box;
  width: ${KIT_CONTROL_HEIGHT};
  height: ${KIT_CONTROL_HEIGHT};
  min-width: ${KIT_CONTROL_HEIGHT};
  min-height: ${KIT_CONTROL_HEIGHT};
  margin: -2px -2px -2px 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--rdw-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}
.rdw-chip__remove:hover {
  background: var(--rdw-surface);
}
`;

export function Chip(props: ChipProps): JSX.Element {
  const variant = props.variant ?? "dot";
  const kind = props.kind ?? "default";
  const className = [
    "rdw-chip",
    `rdw-chip--${variant}`,
    kind !== "default" ? `rdw-chip--${kind}` : undefined,
    props.className,
  ]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{CHIP_CSS}</style>
      <span className={className}>
        {variant === "dot" ? <i className="rdw-chip__dot" aria-hidden="true" /> : null}
        <span>{props.label}</span>
        {props.onRemove !== undefined ? (
          <button
            type="button"
            className="rdw-chip__remove rdw-kit-focusable"
            aria-label={`Remove ${props.label}`}
            onClick={props.onRemove}
          >
            <IconX size={12} />
          </button>
        ) : null}
      </span>
    </>
  );
}
