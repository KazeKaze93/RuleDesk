import type { ComponentChildren, JSX } from "preact";
import { KitStyle } from "./kit-style";

export type EmptyStateProps = {
  readonly title: string;
  readonly description?: string;
  readonly action?: ComponentChildren;
  readonly className?: string;
};

export const EMPTY_STATE_CSS = `
.rdw-empty {
  display: grid;
  gap: 6px;
  justify-items: start;
  padding: 16px 8px;
  color: var(--rdw-muted);
  font: 12.5px/1.4 var(--rdw-font);
}
.rdw-empty__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rdw-text);
}
.rdw-empty__desc {
  margin: 0;
}
`;

export function EmptyState(props: EmptyStateProps): JSX.Element {
  const className = ["rdw-empty", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <KitStyle css={EMPTY_STATE_CSS} />
      <div className={className} role="status">
        <p className="rdw-empty__title">{props.title}</p>
        {props.description !== undefined ? (
          <p className="rdw-empty__desc">{props.description}</p>
        ) : null}
        {props.action}
      </div>
    </>
  );
}
