import type { JSX } from "preact";

import { KIT_CONTROL_HEIGHT, KIT_FOCUS_CSS } from "./shared";
import { KitStyle } from "./kit-style";

export type TabItem = {
  readonly id: string;
  readonly label: string;
};

export type TabsProps = {
  readonly items: readonly TabItem[];
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly className?: string;
  readonly "aria-label"?: string;
};

const TAB_ID_PREFIX = "rdw-tab-";
const TAB_PANEL_ID_PREFIX = "rdw-tabpanel-";
const KEY_ARROW_RIGHT = "ArrowRight";
const KEY_ARROW_LEFT = "ArrowLeft";

export function kitTabId(id: string): string {
  return `${TAB_ID_PREFIX}${id}`;
}

export function kitTabPanelId(id: string): string {
  return `${TAB_PANEL_ID_PREFIX}${id}`;
}

export const TABS_CSS = `
${KIT_FOCUS_CSS}
.rdw-tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--rdw-border);
  padding: 0 8px;
}
.rdw-tabs__tab {
  box-sizing: border-box;
  min-height: ${KIT_CONTROL_HEIGHT};
  padding: 7px 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  margin-bottom: -1px;
}
.rdw-tabs__tab[aria-selected="true"] {
  color: var(--rdw-text);
  font-weight: 600;
  border-bottom-color: var(--rdw-accent);
}
`;

export function Tabs(props: TabsProps): JSX.Element {
  const className = ["rdw-tabs", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <KitStyle css={TABS_CSS} />
      <div
        className={className}
        role="tablist"
        aria-label={props["aria-label"]}
      >
        {props.items.map((item) => {
          const selected = item.id === props.value;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={kitTabId(item.id)}
              className="rdw-tabs__tab rdw-kit-focusable"
              aria-selected={selected}
              aria-controls={kitTabPanelId(item.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                props.onChange(item.id);
              }}
              onKeyDown={(event) => {
                if (
                  event.key !== KEY_ARROW_RIGHT &&
                  event.key !== KEY_ARROW_LEFT
                ) {
                  return;
                }
                event.preventDefault();
                const index = props.items.findIndex(
                  (entry) => entry.id === props.value,
                );
                if (index < 0) {
                  return;
                }
                const delta = event.key === KEY_ARROW_RIGHT ? 1 : -1;
                const next =
                  props.items[
                    (index + delta + props.items.length) % props.items.length
                  ];
                if (next === undefined) {
                  return;
                }
                props.onChange(next.id);
                const list = event.currentTarget.parentElement;
                const nextTab = list?.querySelector(`#${kitTabId(next.id)}`);
                if (nextTab instanceof HTMLElement) {
                  nextTab.focus();
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
