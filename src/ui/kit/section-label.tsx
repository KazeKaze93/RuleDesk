import type { ComponentChildren, JSX } from "preact";
import { KitStyle } from "./kit-style";

export type SectionLabelProps = {
  readonly children: ComponentChildren;
  readonly className?: string;
  readonly htmlFor?: string;
};

export const SECTION_LABEL_CSS = `
.rdw-section-label {
  display: block;
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
  margin: 0 0 4px;
}
`;

export function SectionLabel(props: SectionLabelProps): JSX.Element {
  const className = ["rdw-section-label", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  if (props.htmlFor !== undefined) {
    return (
      <>
        <KitStyle css={SECTION_LABEL_CSS} />
        <label className={className} htmlFor={props.htmlFor}>
          {props.children}
        </label>
      </>
    );
  }

  return (
    <>
      <KitStyle css={SECTION_LABEL_CSS} />
      <div className={className}>{props.children}</div>
    </>
  );
}
