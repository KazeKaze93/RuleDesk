import type { ComponentChildren, JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";

import { Button } from "./button";
import { KIT_CONTROL_FONT, KIT_CONTROL_HEIGHT } from "./shared";

/**
 * The bar of a selection, one for the whole product (the designer's mock-up,
 * 18.11.2026). The order is always the same: how many are selected, select
 * all, clear, the actions, a rule, the dangerous action, cancel. Each page
 * had its own row, with the number inside the names of the buttons and the
 * parts in a different order.
 *
 * "row" stands in the place of a page's toolbar; "stack" is a card in a
 * narrow column, the same parts from top to bottom with Cancel beside the
 * number.
 */
export type SelectionBarLayout = "row" | "stack";

export type SelectionBarProps = {
  readonly layout?: SelectionBarLayout;
  /** How many are selected: the only place the number is shown. */
  readonly count: number;
  /** "Select all", or "Select page" where only a page of the list is in hand. */
  readonly selectAllLabel?: string;
  readonly onSelectAll: () => void;
  /** In place of the button of select all, where it is a menu. */
  readonly selectAll?: ComponentChildren;
  readonly onClear: () => void;
  readonly onCancel: () => void;
  /** The actions that destroy nothing. */
  readonly children?: ComponentChildren;
  /** The dangerous action, after a rule. */
  readonly danger?: ComponentChildren;
};

const CLASS_ROOT = "rdw-selbar";
const CLASS_ROW = "rdw-selbar--row";
const CLASS_STACK = "rdw-selbar--stack";
const CLASS_COUNT = "rdw-selbar__count";
const CLASS_HEAD = "rdw-selbar__head";
const CLASS_PICK = "rdw-selbar__pick";
const CLASS_SPACER = "rdw-selbar__spacer";
const CLASS_ACTIONS = "rdw-selbar__actions";
const CLASS_RULE = "rdw-selbar__rule";

export const SELECTION_BAR_LABEL = "Selection";
export const SELECTION_SELECT_ALL = "Select all";
export const SELECTION_CLEAR = "Clear";
export const SELECTION_CANCEL = "Cancel";
const SELECTED_SUFFIX = " selected";
/** In the hint of the button of select all: the key that does the same (Kaze, 18.11.2026). */
const SELECT_ALL_KEY_HINT = " (Ctrl+A)";

const EVENT_KEYDOWN = "keydown";
const SELECT_ALL_KEY_CODE = "KeyA";
/** Where Ctrl+A selects the text of a field or belongs to what is open. */
const OWN_SELECT_ALL_SELECTOR = 'input, textarea, select, [contenteditable], [role="dialog"]';
const OPEN_DIALOG_SELECTOR = '[role="dialog"]';

/* The fill of the row goes 5px past its box as a shadow, not as padding: the
   row is as tall as the toolbar it stands in for, and the list under it does
   not move when the selection starts. */
const ROW_SPREAD_PX = 5;

export const SELECTION_BAR_CSS = `
.${CLASS_ROOT} {
  box-sizing: border-box;
  color: var(--rdw-text);
  font-size: ${KIT_CONTROL_FONT};
}
.${CLASS_ROW} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: ${KIT_CONTROL_HEIGHT};
  margin-inline: ${String(ROW_SPREAD_PX)}px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-accent-soft);
  box-shadow: 0 0 0 ${String(ROW_SPREAD_PX)}px var(--rdw-accent-soft);
}
.${CLASS_STACK} {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-accent-soft);
}
.${CLASS_COUNT} {
  font-weight: 600;
  white-space: nowrap;
}
.${CLASS_ROW} > .${CLASS_COUNT} {
  padding-inline: 4px 8px;
}
.${CLASS_HEAD},
.${CLASS_PICK} {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${CLASS_HEAD} {
  justify-content: space-between;
}
.${CLASS_SPACER} {
  flex: 1 1 0;
  min-width: 0;
}
.${CLASS_ACTIONS} {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${CLASS_STACK} .${CLASS_ACTIONS} {
  flex-direction: column;
  align-items: stretch;
}
.${CLASS_STACK} .${CLASS_ACTIONS} > .rdw-btn {
  width: 100%;
}
.${CLASS_RULE} {
  flex: none;
  align-self: stretch;
  background: var(--rdw-border);
}
.${CLASS_ROW} > .${CLASS_RULE} {
  width: 1px;
  margin-block: 4px;
}
.${CLASS_STACK} > .${CLASS_RULE} {
  height: 1px;
}
`;

function ownSelectAll(event: KeyboardEvent): boolean {
  if (document.querySelector(OPEN_DIALOG_SELECTOR) !== null) {
    return true;
  }
  const origin = event.composedPath()[0];
  if (!(origin instanceof Element)) {
    return false;
  }
  if (origin.closest(OWN_SELECT_ALL_SELECTOR) !== null) {
    return true;
  }
  // A dialog of an own page is in its shadow root, which the document does not see into.
  const root = origin.getRootNode();
  return root instanceof ShadowRoot && root.querySelector(OPEN_DIALOG_SELECTOR) !== null;
}

export function SelectionBar(props: SelectionBarProps): JSX.Element {
  const layout = props.layout ?? "row";
  const none = props.count === 0;
  const latestSelectAll = useRef(props.onSelectAll);
  latestSelectAll.current = props.onSelectAll;

  // Ctrl+A (Cmd+A) is select all while the bar is there; in a field it stays the field's.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        event.code !== SELECT_ALL_KEY_CODE ||
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.shiftKey ||
        event.defaultPrevented ||
        ownSelectAll(event)
      ) {
        return;
      }
      event.preventDefault();
      latestSelectAll.current();
    };
    document.addEventListener(EVENT_KEYDOWN, onKeyDown);
    return () => {
      document.removeEventListener(EVENT_KEYDOWN, onKeyDown);
    };
  }, []);

  const count = (
    <span className={CLASS_COUNT} aria-live="polite">
      {`${String(props.count)}${SELECTED_SUFFIX}`}
    </span>
  );
  const selectAllLabel = props.selectAllLabel ?? SELECTION_SELECT_ALL;
  const selectAll = props.selectAll ?? (
    <Button
      variant="ghost"
      title={`${selectAllLabel}${SELECT_ALL_KEY_HINT}`}
      onClick={props.onSelectAll}
    >
      {selectAllLabel}
    </Button>
  );
  const clear = (
    <Button variant="ghost" disabled={none} onClick={props.onClear}>
      {SELECTION_CLEAR}
    </Button>
  );
  const cancel = (
    <Button variant="secondary" onClick={props.onCancel}>
      {SELECTION_CANCEL}
    </Button>
  );
  const hasActions = props.children !== undefined && props.children !== null;
  const hasDanger = props.danger !== undefined && props.danger !== null;
  const rule =
    hasActions && hasDanger ? <span className={CLASS_RULE} aria-hidden="true" /> : null;

  if (layout === "stack") {
    return (
      <div
        className={`${CLASS_ROOT} ${CLASS_STACK}`}
        role="toolbar"
        aria-label={SELECTION_BAR_LABEL}
        aria-orientation="vertical"
      >
        <style>{SELECTION_BAR_CSS}</style>
        <div className={CLASS_HEAD}>
          {count}
          {cancel}
        </div>
        <div className={CLASS_PICK}>
          {selectAll}
          {clear}
        </div>
        {hasActions ? <div className={CLASS_ACTIONS}>{props.children}</div> : null}
        {rule}
        {hasDanger ? <div className={CLASS_ACTIONS}>{props.danger}</div> : null}
      </div>
    );
  }

  return (
    <div className={`${CLASS_ROOT} ${CLASS_ROW}`} role="toolbar" aria-label={SELECTION_BAR_LABEL}>
      <style>{SELECTION_BAR_CSS}</style>
      {count}
      {selectAll}
      {clear}
      <span className={CLASS_SPACER} aria-hidden="true" />
      {hasActions ? <div className={CLASS_ACTIONS}>{props.children}</div> : null}
      {rule}
      {hasDanger ? <div className={CLASS_ACTIONS}>{props.danger}</div> : null}
      {cancel}
    </div>
  );
}
