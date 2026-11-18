import type { ComponentChildren, JSX } from "preact";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

import { Button, Dialog, IconButton, OverlayInPlace, Popover, TextField } from "./kit";
import { IconCheck, IconChevronDown, IconDots, IconPlus } from "./kit/icons";

/**
 * Groups of the Following page and of the Collections page (the designer,
 * 18.11.2026). A card is in one group or in none, so the groups are tabs over
 * the list: each card is under exactly one of them, and "No group" is the
 * rest. A card is moved from one menu, "Move to group", which is on the card,
 * in the bar of a selection, and is what a drop on a tab does. A name is
 * typed only for a new group, so a slip of the keys makes no second group.
 */

/** Values of the open tab that are not names of groups. */
export const GROUP_ALL = "";
export const GROUP_NONE = "\u0000none";

export const GROUPS_LABEL = "Groups";
export const GROUP_ALL_LABEL = "All";
export const GROUP_NONE_LABEL = "No group";
export const GROUP_NEW_LABEL = "New group";
export const GROUP_NEW_ITEM_LABEL = "New group…";
export const GROUP_MOVE_LABEL = "Move to group";
const GROUP_ACTIONS_PREFIX = "Actions of the group ";
const GROUP_RENAME_LABEL = "Rename";
const GROUP_RENAME_TITLE = "Rename group";
const GROUP_DELETE_LABEL = "Delete";
const GROUP_DELETE_TITLE = "Delete group";
const GROUP_NAME_LABEL = "Group name";
const GROUP_CREATE_LABEL = "Create";
const GROUP_SAVE_LABEL = "Save";
const CANCEL_LABEL = "Cancel";
const NAME_TAKEN = "There is a group with this name already.";
const GROUP_MORE_LABEL = "More";
const GROUP_FIND_LABEL = "Find a group";
const GROUP_NOT_FOUND = "No group with this name.";

/** With more groups than this a menu of groups has a field to find one in. */
export const GROUP_SEARCH_FROM = 10;
/** A name longer than this is cut on its tab; whole, it is in the hint and in the menus. */
export const GROUP_TAB_NAME_SHOWN = 20;
/** How long the name of a group may be. */
export const GROUP_NAME_MAX = 40;
const ELLIPSIS = "\u2026";
/** Between two tabs, in the styles and in the count of what fits. */
const TAB_GAP_PX = 28;
const EVENT_RESIZE = "resize";
const KEY_DOWN = "ArrowDown";
const KEY_UP = "ArrowUp";
const KEY_ENTER = "Enter";

const TABS_CLASS = "rdw-groups";
const TAB_CLASS = "rdw-groups__tab";
const TAB_WRAP_CLASS = "rdw-groups__item";
const TAB_COUNT_CLASS = "rdw-groups__count";
const TAB_OVER_CLASS = "rdw-groups__item--over";
/** On a tab that takes a dropped card, and on the one that has just taken it. */
const TAB_DROP_CLASS = "rdw-groups__item--drop";
const TAB_LANDED_CLASS = "rdw-groups__item--landed";
const TABS_DRAGGING_CLASS = "rdw-groups--dragging";
const TAB_MORE_CLASS = "rdw-groups__more";
const TAB_NEW_CLASS = "rdw-groups__new";
const TAB_MEASURE_CLASS = "rdw-groups__measure";
const MENU_LIST_BOX_CLASS = "rdw-groups-menu__box";
const MENU_LIST_CLASS = "rdw-groups-menu__list";
const MENU_COUNT_CLASS = "rdw-groups-menu__count";
const MENU_EMPTY_CLASS = "rdw-groups-menu__empty";
const NAME_COUNT_CLASS = "rdw-groups-name__count";
const MENU_ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';
const MENU_STOP_SELECTOR = `input, ${MENU_ITEM_SELECTOR}`;
const TAB_SELECTOR = '[role="tab"]';
const KEY_PREVIOUS = "ArrowLeft";
const KEY_NEXT = "ArrowRight";
const MENU_CLASS = "rdw-groups-menu";
const MENU_ITEM_CLASS = "rdw-groups-menu__item";
const MENU_RULE_CLASS = "rdw-groups-menu__rule";
/** On a menu drawn where it is opened, under its button, and not in the body. */
const MENU_IN_PLACE_CLASS = "rdw-groups-menu--in-place";
const MENU_END_CLASS = "rdw-groups-menu--end";
const MENU_TICK_CLASS = "rdw-groups-menu__tick";
const MOVE_TRIGGER_CLASS = "rdw-groups-move";
const NAME_FORM_CLASS = "rdw-groups-name";
const NAME_ERROR_CLASS = "rdw-groups-name__error";
const NAME_ACTIONS_CLASS = "rdw-groups-name__actions";

const MENU_WIDTH_PX = 220;
const TAB_MENU_WIDTH_PX = 160;
const ICON_PX = 14;

export const GROUPS_CSS = `
/* Tabs as in the header of the site (the designer's mock-up, 18.11.2026):
   words with no frames, a line under the row, a thicker one under the open tab. */
.${TABS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  position: relative;
  column-gap: ${String(TAB_GAP_PX)}px;
  min-width: 0;
  border-bottom: 1px solid var(--rdw-border);
}
.${TABS_CLASS}[inert] {
  opacity: 0.45;
}
.${TAB_WRAP_CLASS} {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  transition: border-color 120ms ease, background-color 120ms ease, transform 120ms ease;
}
.${TAB_WRAP_CLASS}[data-selected="true"] {
  border-bottom-color: var(--rdw-accent);
}
.${TAB_CLASS} {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0 9px;
  border: 0;
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
}
.${TAB_WRAP_CLASS}[data-none] .${TAB_CLASS} {
  opacity: 0.8;
}
.${TAB_CLASS}:hover,
.${TAB_WRAP_CLASS}[data-selected="true"] .${TAB_CLASS} {
  color: var(--rdw-text);
  opacity: 1;
}
.${TAB_WRAP_CLASS}[data-selected="true"] .${TAB_CLASS} {
  font-weight: 600;
}
.${TAB_COUNT_CLASS} {
  color: var(--rdw-muted);
  font-size: 12px;
  font-weight: 400;
}
/* The button of a group's own actions stands in the gap after its tab, so
   nothing moves when it comes. It is there under the pointer, for the keyboard
   and while its menu is open: on every tab at once it is noise. */
.${TAB_WRAP_CLASS} .${TAB_MORE_CLASS} {
  position: absolute;
  left: 100%;
  top: 50%;
  z-index: 1;
  min-width: 20px;
  min-height: 20px;
  width: 20px;
  height: 20px;
  margin-left: 4px;
  transform: translateY(-50%);
  border: 0;
  background: var(--rdw-surface-2);
  color: var(--rdw-muted);
}
.${TAB_WRAP_CLASS} .${TAB_MORE_CLASS}:hover,
.${TAB_WRAP_CLASS} .${TAB_MORE_CLASS}[aria-expanded="true"] {
  color: var(--rdw-text);
}
.${TAB_WRAP_CLASS}:not(:hover):not(:focus-within) .${TAB_MORE_CLASS}:not([aria-expanded="true"]) {
  opacity: 0;
}
/* Every group once more, unseen: by these it is counted how many fit the row. */
.${TAB_MEASURE_CLASS} {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
}
.${TAB_MEASURE_CLASS} > * {
  flex: none;
}
.${TAB_NEW_CLASS} {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  padding-bottom: 2px;
}
/* While a card is carried, the tabs that take it say so, and the one under
   it comes forward; the tab that took it nods once. */
.${TABS_DRAGGING_CLASS} .${TAB_DROP_CLASS} {
  border-bottom-style: dashed;
  border-bottom-color: var(--rdw-accent);
  animation: rdw-groups-wait 900ms ease-in-out infinite alternate;
}
.${TABS_DRAGGING_CLASS} .${TAB_DROP_CLASS} .${TAB_CLASS} {
  color: var(--rdw-text);
}
.${TABS_DRAGGING_CLASS} .${TAB_DROP_CLASS}.${TAB_OVER_CLASS} {
  border-bottom-style: solid;
  background: var(--rdw-accent-soft);
  box-shadow: 0 0 0 6px var(--rdw-accent-soft);
  border-radius: var(--rdw-radius-s);
  transform: scale(1.08);
  animation: none;
}
.${TAB_LANDED_CLASS} {
  animation: rdw-groups-land 320ms ease-out;
}
@keyframes rdw-groups-wait {
  from { opacity: 0.6; }
  to { opacity: 1; }
}
@keyframes rdw-groups-land {
  0% { transform: scale(1.08); }
  45% { transform: scale(0.94); }
  100% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .${TAB_WRAP_CLASS},
  .${TABS_DRAGGING_CLASS} .${TAB_DROP_CLASS},
  .${TAB_LANDED_CLASS} {
    animation: none;
    transition: none;
  }
}
.${MOVE_TRIGGER_CLASS} {
  position: relative;
  display: inline-flex;
}
`;

/* The menus are drawn in the body, out of the page's own styles: theirs go with them. */
const MENU_CSS = `
.${MENU_CLASS} {
  padding: 4px;
  gap: 0;
}
/*
 * An own page hides everything of the body but itself, so a menu drawn in the
 * body would not be seen there: it is drawn under its button instead, as the
 * dialogs and the lists of an own page are drawn inside the page.
 */
.${MENU_CLASS}.${MENU_IN_PLACE_CLASS} {
  top: calc(100% + 4px);
  left: 0;
  box-sizing: border-box;
  width: max-content;
  min-width: ${String(TAB_MENU_WIDTH_PX)}px;
  max-width: ${String(MENU_WIDTH_PX)}px;
}
.${MENU_CLASS}.${MENU_IN_PLACE_CLASS}.${MENU_END_CLASS} {
  left: auto;
  right: 0;
}
.${MENU_ITEM_CLASS} {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
  text-align: left;
  cursor: pointer;
}
.${MENU_ITEM_CLASS} > span:first-of-type {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${MENU_LIST_BOX_CLASS} {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.${MENU_LIST_CLASS} {
  display: grid;
  max-height: 320px;
  overflow-y: auto;
}
.${MENU_COUNT_CLASS} {
  flex: none;
  color: var(--rdw-muted);
}
.${MENU_EMPTY_CLASS} {
  margin: 0;
  padding: 6px 8px;
  color: var(--rdw-muted);
}
.${MENU_ITEM_CLASS}:hover:not(:disabled),
.${MENU_ITEM_CLASS}:focus-visible {
  background: var(--rdw-surface-2);
}
.${MENU_ITEM_CLASS}:disabled {
  cursor: default;
  font-weight: 600;
}
.${MENU_ITEM_CLASS}[data-tone="danger"] {
  color: var(--rdw-danger);
}
.${MENU_TICK_CLASS} {
  flex: none;
  display: inline-flex;
  color: var(--rdw-accent);
}
.${MENU_RULE_CLASS} {
  height: 1px;
  margin: 4px 0;
  background: var(--rdw-border);
}
`;

const NAME_CSS = `
.${NAME_FORM_CLASS} {
  display: grid;
  gap: 8px;
  min-width: 260px;
}
.${NAME_COUNT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11px;
  text-align: right;
}
.${NAME_ERROR_CLASS} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
.${NAME_ACTIONS_CLASS} {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
`;

/**
 * What goes with the pointer while a card is carried is the card itself, whole.
 * Left to the browser it was the one picture the drag began on.
 */
export function carryWholeCard(event: DragEvent): void {
  const card = event.currentTarget;
  // No transfer in an event made by hand, as in the tests.
  const transfer = event.dataTransfer ?? undefined;
  if (!(card instanceof HTMLElement) || transfer === undefined) {
    return;
  }
  const box = card.getBoundingClientRect();
  transfer.effectAllowed = "move";
  transfer.setDragImage(card, event.clientX - box.left, event.clientY - box.top);
}

export type GroupCount = {
  readonly name: string;
  readonly count: number;
};

/** How many of the list are in each group, in the order of the names given. */
export function countGroups(
  names: readonly string[],
  groupsOfItems: readonly (string | undefined)[],
): GroupCount[] {
  const counts = new Map<string, number>();
  for (const group of groupsOfItems) {
    if (group !== undefined && group.length > 0) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }
  return names.map((name) => ({ name, count: counts.get(name) ?? 0 }));
}

/** Whether something of this group is under the open tab. */
export function inGroupTab(group: string | undefined, tab: string): boolean {
  if (tab === GROUP_ALL) {
    return true;
  }
  const own = group ?? "";
  return tab === GROUP_NONE ? own.length === 0 : own === tab;
}

/** The name of a group as its tab shows it: cut when long. */
export function shortGroupName(name: string): string {
  return name.length > GROUP_TAB_NAME_SHOWN
    ? `${name.slice(0, GROUP_TAB_NAME_SHOWN)}${ELLIPSIS}`
    : name;
}

/**
 * Which of the groups have a tab in a row with this much room, by their
 * places in the list. All of them when they fit. Otherwise as many of the
 * first as fit beside "More", and the open one is among them always: it takes
 * the last place, and what was there goes to the menu.
 */
export function fitGroupTabs(
  widths: readonly number[],
  selected: number,
  room: number,
  moreWidth: number,
  gap: number,
): number[] {
  const all = widths.map((_width, index) => index);
  const whole = widths.reduce((sum, width) => sum + width + gap, 0);
  if (whole <= room) {
    return all;
  }
  let left = room - moreWidth - gap;
  const shown: number[] = [];
  for (const index of all) {
    const cost = (widths[index] ?? 0) + gap;
    if (cost > left) {
      break;
    }
    shown.push(index);
    left -= cost;
  }
  if (selected >= 0 && selected < widths.length && !shown.includes(selected)) {
    const cost = (widths[selected] ?? 0) + gap;
    while (shown.length > 0 && left < cost) {
      const last = shown.pop();
      left += (last === undefined ? 0 : (widths[last] ?? 0)) + gap;
    }
    shown.push(selected);
  }
  return shown;
}

type MenuEntry = {
  readonly key: string;
  readonly label: string;
  readonly count?: number;
  /** Ticked and not to be picked: where the thing is already. */
  readonly current?: boolean;
  readonly onPick: () => void;
};

/**
 * The list of groups of a menu. With many groups it has a field to find one
 * in, and the field has the focus at once. The arrows go through the field and
 * the items, Enter in the field picks the first found.
 */
function GroupMenuList(props: {
  readonly entries: readonly MenuEntry[];
  readonly searchable: boolean;
  /** What stands under the list whatever is typed. */
  readonly children?: ComponentChildren;
}): JSX.Element {
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { searchable } = props;
  useEffect(() => {
    if (searchable) {
      inputRef.current?.focus();
      return;
    }
    const first = boxRef.current?.querySelector(MENU_ITEM_SELECTOR);
    if (first instanceof HTMLElement) {
      first.focus();
    }
  }, [searchable]);

  const needle = query.trim().toLowerCase();
  const found =
    needle.length === 0
      ? props.entries
      : props.entries.filter((entry) => entry.label.toLowerCase().includes(needle));

  const onKeyDown = (event: KeyboardEvent): void => {
    const box = boxRef.current;
    if (box === null) {
      return;
    }
    if (event.key === KEY_ENTER && event.target instanceof HTMLInputElement) {
      const first = box.querySelector(`.${MENU_LIST_CLASS} ${MENU_ITEM_SELECTOR}`);
      if (first instanceof HTMLElement) {
        event.preventDefault();
        first.click();
      }
      return;
    }
    const step = event.key === KEY_DOWN ? 1 : event.key === KEY_UP ? -1 : 0;
    if (step === 0) {
      return;
    }
    const stops = [...box.querySelectorAll(MENU_STOP_SELECTOR)];
    if (stops.length === 0) {
      return;
    }
    const at = event.target instanceof Element ? stops.indexOf(event.target) : -1;
    const next = stops[(at + step + stops.length) % stops.length];
    if (next instanceof HTMLElement) {
      event.preventDefault();
      next.focus();
    }
  };

  return (
    <div className={MENU_LIST_BOX_CLASS} ref={boxRef} onKeyDown={onKeyDown}>
      {searchable ? (
        <TextField
          value={query}
          placeholder={GROUP_FIND_LABEL}
          aria-label={GROUP_FIND_LABEL}
          inputRef={inputRef}
          onChange={setQuery}
        />
      ) : null}
      <div className={MENU_LIST_CLASS}>
        {found.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="menuitem"
            className={`${MENU_ITEM_CLASS} rdw-kit-focusable`}
            disabled={entry.current === true}
            onClick={entry.onPick}
          >
            <span>{entry.label}</span>
            {entry.count === undefined ? null : (
              <span className={MENU_COUNT_CLASS}>{String(entry.count)}</span>
            )}
            {entry.current === true ? (
              <span className={MENU_TICK_CLASS} aria-hidden="true">
                <IconCheck size={ICON_PX} />
              </span>
            ) : null}
          </button>
        ))}
        {found.length === 0 && needle.length > 0 ? (
          <p className={MENU_EMPTY_CLASS}>{GROUP_NOT_FOUND}</p>
        ) : null}
      </div>
      {props.children}
    </div>
  );
}

export type GroupTabsProps = {
  /** How many there are in all: the number of "All". */
  readonly total: number;
  readonly groups: readonly GroupCount[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onNew: () => void;
  readonly onRename: (name: string) => void;
  readonly onDelete: (name: string) => void;
  /** True while a card is dragged: a tab of a group, and "No group", take a drop. */
  readonly dragging?: boolean;
  /** The card was dropped on a group, or on "No group" (null). */
  readonly onDropTo?: (group: string | null) => void;
  /** Seen, dimmed and not to be pressed: while cards are being selected. */
  readonly locked?: boolean;
};

type DropHandlers = {
  readonly onDragOver?: (event: DragEvent) => void;
  readonly onDragLeave?: () => void;
  readonly onDrop?: (event: DragEvent) => void;
};

type TabMenu = {
  readonly name: string;
  readonly anchor: HTMLElement;
};

export function GroupTabs(props: GroupTabsProps): JSX.Element {
  const [over, setOver] = useState<string | null>(null);
  const [menu, setMenu] = useState<TabMenu | null>(null);
  const [landed, setLanded] = useState<string | null>(null);
  // The names of the groups that have a tab; null while all of them have.
  const [fitting, setFitting] = useState<readonly string[] | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const inPlace = useContext(OverlayInPlace);
  const anchorRef = useRef<HTMLElement | null>(null);
  anchorRef.current = menu?.anchor ?? null;
  const dragging = props.dragging === true;
  useEffect(() => {
    if (!dragging) {
      setOver(null);
    }
  }, [dragging]);

  const inGroups = props.groups.reduce((sum, group) => sum + group.count, 0);

  // How many tabs fit is counted again when the groups change and when the
  // row gets another width.
  const groupsKey = props.groups.map((group) => `${group.name}\u0000${String(group.count)}`).join("\u0001");
  const { value, total } = props;
  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (row === null || measure === null) {
      return;
    }
    const count = (): void => {
      const names = groupsKey.length === 0 ? [] : groupsKey.split("\u0001").map((part) => part.split("\u0000")[0] ?? "");
      const samples = [...measure.querySelectorAll("[data-measure]")];
      const widths = samples.map((sample) => (sample instanceof HTMLElement ? sample.offsetWidth : 0));
      const more = measure.querySelector("[data-measure-more]");
      let room = row.clientWidth;
      for (const fixed of row.querySelectorAll("[data-fixed]")) {
        room -= (fixed instanceof HTMLElement ? fixed.offsetWidth : 0) + TAB_GAP_PX;
      }
      // A row with no width is one that is not laid out: nothing to count by.
      const places =
        row.clientWidth === 0
          ? widths.map((_width, index) => index)
          : fitGroupTabs(
              widths,
              names.indexOf(value),
              room,
              more instanceof HTMLElement ? more.offsetWidth : 0,
              TAB_GAP_PX,
            );
      const next = places.length === names.length ? null : places.map((place) => names[place] ?? "");
      setFitting((current) =>
        (current === null ? "" : current.join("\u0001")) === (next === null ? "" : next.join("\u0001")) &&
        (current === null) === (next === null)
          ? current
          : next,
      );
    };
    count();
    window.addEventListener(EVENT_RESIZE, count);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(count);
    observer?.observe(row);
    return () => {
      window.removeEventListener(EVENT_RESIZE, count);
      observer?.disconnect();
    };
  }, [groupsKey, value, total]);

  const tabbed =
    fitting === null
      ? props.groups
      : fitting.flatMap((name) => props.groups.filter((group) => group.name === name));
  const inMenu = fitting === null ? [] : props.groups.filter((group) => !fitting.includes(group.name));
  const dropProps = (key: string, target: string | null): DropHandlers =>
    dragging && props.onDropTo !== undefined
      ? {
          onDragOver: (event: DragEvent) => {
            event.preventDefault();
            const transfer = event.dataTransfer ?? undefined;
            if (transfer !== undefined) {
              transfer.dropEffect = "move";
            }
            setOver(key);
          },
          onDragLeave: () => {
            setOver((current) => (current === key ? null : current));
          },
          onDrop: (event: DragEvent) => {
            event.preventDefault();
            setOver(null);
            setLanded(key);
            props.onDropTo?.(target);
          },
        }
      : {};

  const tab = (key: string, label: string, count: number): JSX.Element => (
    <button
      type="button"
      role="tab"
      className={`${TAB_CLASS} rdw-kit-focusable`}
      aria-selected={props.value === key}
      {...(shortGroupName(label) === label ? {} : { title: label })}
      onClick={() => {
        props.onChange(key);
      }}
    >
      {shortGroupName(label)}
      <span className={TAB_COUNT_CLASS}>{String(count)}</span>
    </button>
  );
  const wrapClass = (key: string): string =>
    [
      TAB_WRAP_CLASS,
      TAB_DROP_CLASS,
      over === key ? TAB_OVER_CLASS : "",
      landed === key ? TAB_LANDED_CLASS : "",
    ]
      .filter((name) => name.length > 0)
      .join(" ");
  const landProps = (key: string): { readonly onAnimationEnd?: () => void } =>
    landed === key
      ? {
          onAnimationEnd: () => {
            setLanded(null);
          },
        }
      : {};

  // The arrows go from tab to tab and open the one they come to.
  const stepTabs = (event: KeyboardEvent): void => {
    const step = event.key === KEY_NEXT ? 1 : event.key === KEY_PREVIOUS ? -1 : 0;
    const from = event.target;
    if (step === 0 || !(from instanceof HTMLElement) || !from.matches(TAB_SELECTOR)) {
      return;
    }
    const row = event.currentTarget;
    if (!(row instanceof HTMLElement)) {
      return;
    }
    const tabs = [...row.querySelectorAll(TAB_SELECTOR)];
    const next = tabs[tabs.indexOf(from) + step];
    if (next instanceof HTMLElement) {
      event.preventDefault();
      next.focus();
      next.click();
    }
  };

  const tabMenu = (name: string): JSX.Element => (
    <Popover
      open
      onClose={() => {
        setMenu(null);
      }}
      anchorRef={anchorRef}
      {...(inPlace ? {} : { widthPx: TAB_MENU_WIDTH_PX })}
      role="menu"
      aria-label={`${GROUP_ACTIONS_PREFIX}${name}`}
      className={inPlace ? `${MENU_CLASS} ${MENU_IN_PLACE_CLASS}` : MENU_CLASS}
    >
      <style>{MENU_CSS}</style>
      <button
        type="button"
        role="menuitem"
        className={`${MENU_ITEM_CLASS} rdw-kit-focusable`}
        onClick={() => {
          setMenu(null);
          props.onRename(name);
        }}
      >
        <span>{GROUP_RENAME_LABEL}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={`${MENU_ITEM_CLASS} rdw-kit-focusable`}
        data-tone="danger"
        onClick={() => {
          setMenu(null);
          props.onDelete(name);
        }}
      >
        <span>{GROUP_DELETE_LABEL}</span>
      </button>
    </Popover>
  );

  return (
    <div
      className={dragging ? `${TABS_CLASS} ${TABS_DRAGGING_CLASS}` : TABS_CLASS}
      ref={rowRef}
      role="tablist"
      aria-label={GROUPS_LABEL}
      onKeyDown={stepTabs}
      {...(props.locked === true ? { inert: true } : {})}
    >
      <style>{GROUPS_CSS}</style>
      <span className={TAB_MEASURE_CLASS} ref={measureRef} aria-hidden="true">
        {props.groups.map((group) => (
          <span key={group.name} className={TAB_CLASS} data-measure="">
            {shortGroupName(group.name)}
            <span className={TAB_COUNT_CLASS}>{String(group.count)}</span>
          </span>
        ))}
        <span className={TAB_CLASS} data-measure-more="">
          {`${GROUP_MORE_LABEL} (${String(props.groups.length)})`}
          <IconChevronDown size={ICON_PX} />
        </span>
      </span>
      <span
        className={TAB_WRAP_CLASS}
        data-selected={String(props.value === GROUP_ALL)}
        data-fixed=""
      >
        {tab(GROUP_ALL, GROUP_ALL_LABEL, props.total)}
      </span>
      {tabbed.map((group) => (
        <span
          key={group.name}
          className={wrapClass(group.name)}
          data-selected={String(props.value === group.name)}
          data-group={group.name}
          onContextMenu={(event) => {
            event.preventDefault();
            const anchor = event.currentTarget;
            setMenu({ name: group.name, anchor });
          }}
          {...dropProps(group.name, group.name)}
          {...landProps(group.name)}
        >
          {tab(group.name, group.name, group.count)}
          <IconButton
            className={TAB_MORE_CLASS}
            label={`${GROUP_ACTIONS_PREFIX}${group.name}`}
            menuOpen={menu?.name === group.name}
            onClick={(event) => {
              const anchor = event.currentTarget;
              setMenu((current) =>
                current?.name === group.name ? null : { name: group.name, anchor },
              );
            }}
          >
            <IconDots size={ICON_PX} />
          </IconButton>
          {menu?.name === group.name ? tabMenu(group.name) : null}
        </span>
      ))}
      {inMenu.length > 0 ? (
        <span className={TAB_WRAP_CLASS} data-selected="false" data-more="">
          <button
            type="button"
            className={`${TAB_CLASS} rdw-kit-focusable`}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            ref={moreRef}
            onClick={() => {
              setMoreOpen((open) => !open);
            }}
          >
            {`${GROUP_MORE_LABEL} (${String(inMenu.length)})`}
            <IconChevronDown size={ICON_PX} />
          </button>
          {moreOpen ? (
            <Popover
              open
              onClose={() => {
                setMoreOpen(false);
              }}
              anchorRef={moreRef}
              {...(inPlace ? {} : { widthPx: MENU_WIDTH_PX })}
              role="menu"
              aria-label={GROUPS_LABEL}
              className={inPlace ? `${MENU_CLASS} ${MENU_IN_PLACE_CLASS}` : MENU_CLASS}
            >
              <style>{MENU_CSS}</style>
              <GroupMenuList
                searchable={props.groups.length > GROUP_SEARCH_FROM}
                entries={inMenu.map((group) => ({
                  key: group.name,
                  label: group.name,
                  count: group.count,
                  onPick: () => {
                    setMoreOpen(false);
                    props.onChange(group.name);
                  },
                }))}
              />
            </Popover>
          ) : null}
        </span>
      ) : null}
      {props.groups.length > 0 ? (
        <span
          className={wrapClass(GROUP_NONE)}
          data-selected={String(props.value === GROUP_NONE)}
          data-fixed=""
          data-none=""
          {...dropProps(GROUP_NONE, null)}
          {...landProps(GROUP_NONE)}
        >
          {tab(GROUP_NONE, GROUP_NONE_LABEL, props.total - inGroups)}
        </span>
      ) : null}
      <span className={TAB_NEW_CLASS} data-fixed="">
        <Button variant="ghost" onClick={props.onNew}>
          <IconPlus size={ICON_PX} />
          {GROUP_NEW_LABEL}
        </Button>
      </span>
    </div>
  );
}

export type MoveToGroupMenuProps = {
  readonly groups: readonly string[];
  /** The group of what is being moved, when it is one thing; ticked in the menu. */
  readonly current?: string | undefined;
  readonly disabled?: boolean;
  /** A button with the words, or the small button of a card with this label. */
  readonly iconLabel?: string;
  readonly onMove: (group: string | null) => void;
  readonly onNew: () => void;
};

/** "Move to group": the groups there are, "No group", and "New group…". */
export function MoveToGroupMenu(props: MoveToGroupMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const inPlace = useContext(OverlayInPlace);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const current = props.current ?? "";
  const pick = (run: () => void): void => {
    setOpen(false);
    run();
  };
  const toggle = (): void => {
    setOpen((value) => !value);
  };

  return (
    <span className={MOVE_TRIGGER_CLASS}>
      {props.iconLabel === undefined ? (
        <Button
          variant="secondary"
          disabled={props.disabled === true}
          buttonRef={anchorRef}
          onClick={toggle}
        >
          {GROUP_MOVE_LABEL}
          <IconChevronDown size={ICON_PX} />
        </Button>
      ) : (
        <IconButton
          label={props.iconLabel}
          menuOpen={open}
          disabled={props.disabled === true}
          buttonRef={anchorRef}
          onClick={toggle}
        >
          <IconFolderMove />
        </IconButton>
      )}
      <Popover
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        anchorRef={anchorRef}
        {...(inPlace ? {} : { widthPx: MENU_WIDTH_PX, alignEnd: true })}
        role="menu"
        aria-label={GROUP_MOVE_LABEL}
        className={
          inPlace ? `${MENU_CLASS} ${MENU_IN_PLACE_CLASS} ${MENU_END_CLASS}` : MENU_CLASS
        }
      >
        <style>{MENU_CSS}</style>
        <GroupMenuList
          key={String(open)}
          searchable={props.groups.length > GROUP_SEARCH_FROM}
          entries={props.groups.map((name) => ({
            key: name,
            label: name,
            current: name === current,
            onPick: () => {
              pick(() => {
                props.onMove(name);
              });
            },
          }))}
        >
          {props.groups.length > 0 ? <div className={MENU_RULE_CLASS} aria-hidden="true" /> : null}
          {props.groups.length > 0 ? (
            <button
              type="button"
              role="menuitem"
              className={`${MENU_ITEM_CLASS} rdw-kit-focusable`}
              disabled={props.current !== undefined && current.length === 0}
              onClick={() => {
                pick(() => {
                  props.onMove(null);
                });
              }}
            >
              <span>{GROUP_NONE_LABEL}</span>
              {props.current !== undefined && current.length === 0 ? (
                <span className={MENU_TICK_CLASS} aria-hidden="true">
                  <IconCheck size={ICON_PX} />
                </span>
              ) : null}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={`${MENU_ITEM_CLASS} rdw-kit-focusable`}
            onClick={() => {
              pick(props.onNew);
            }}
          >
            <span>{GROUP_NEW_ITEM_LABEL}</span>
          </button>
        </GroupMenuList>
      </Popover>
    </span>
  );
}

/** A folder with an arrow: "move to a group". Drawn here, it is used nowhere else. */
function IconFolderMove(): JSX.Element {
  return (
    <svg
      width={ICON_PX}
      height={ICON_PX}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M10 13h6" />
      <path d="M13.5 10.5 16 13l-2.5 2.5" />
    </svg>
  );
}

/**
 * What the page asks of the dialogs: a new group (and what to put into it at
 * once), another name for a group, or its deletion.
 */
export type GroupRequest =
  | { readonly kind: "new"; readonly targets: readonly string[] }
  | { readonly kind: "rename"; readonly name: string }
  | { readonly kind: "delete"; readonly name: string; readonly count: number };

export type GroupDialogsProps = {
  readonly request: GroupRequest | null;
  /** Names that are taken. */
  readonly groups: readonly string[];
  /** "3 artists", "1 collection": what goes to "No group" with a deleted group. */
  readonly countLabel: (count: number) => string;
  readonly onCreate: (name: string, targets: readonly string[]) => void;
  readonly onRename: (from: string, to: string) => void;
  readonly onDelete: (name: string) => void;
  readonly onClose: () => void;
};

/** "Delete the group “Artists”? Its 3 artists go to No group." */
export function deleteGroupMessage(name: string, countText: string, count: number): string {
  const head = `Delete the group “${name}”?`;
  if (count === 0) {
    return `${head} Nothing is in it.`;
  }
  return `${head} Its ${countText} ${count === 1 ? "goes" : "go"} to ${GROUP_NONE_LABEL}; nothing else is deleted.`;
}

export function GroupDialogs(props: GroupDialogsProps): JSX.Element {
  const { request } = props;
  const [draft, setDraft] = useState("");
  const naming = request !== null && request.kind !== "delete";
  const initial = request !== null && request.kind === "rename" ? request.name : "";
  useEffect(() => {
    if (naming) {
      setDraft(initial);
    }
  }, [naming, initial]);

  const name = draft.trim();
  const taken = name.length > 0 && name !== initial && props.groups.includes(name);
  const ready = name.length > 0 && name !== initial && !taken;
  const submit = (): void => {
    if (!ready || request === null) {
      return;
    }
    if (request.kind === "new") {
      props.onCreate(name, request.targets);
    } else if (request.kind === "rename") {
      props.onRename(request.name, name);
    }
  };

  return (
    <>
      <Dialog
        open={naming}
        title={request !== null && request.kind === "rename" ? GROUP_RENAME_TITLE : GROUP_NEW_LABEL}
        onClose={props.onClose}
      >
        <style>{NAME_CSS}</style>
        <form
          className={NAME_FORM_CLASS}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <TextField
            value={draft}
            placeholder={GROUP_NAME_LABEL}
            aria-label={GROUP_NAME_LABEL}
            inputAttrs={{ maxLength: GROUP_NAME_MAX }}
            onChange={(next) => {
              setDraft(next.slice(0, GROUP_NAME_MAX));
            }}
          />
          <p className={NAME_COUNT_CLASS}>{`${String(draft.length)} / ${String(GROUP_NAME_MAX)}`}</p>
          {taken ? (
            <p className={NAME_ERROR_CLASS} role="alert">
              {NAME_TAKEN}
            </p>
          ) : null}
          <div className={NAME_ACTIONS_CLASS}>
            <Button type="button" variant="secondary" size="s" onClick={props.onClose}>
              {CANCEL_LABEL}
            </Button>
            <Button type="submit" variant="primary" size="s" disabled={!ready}>
              {request !== null && request.kind === "rename" ? GROUP_SAVE_LABEL : GROUP_CREATE_LABEL}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        variant="confirm"
        open={request !== null && request.kind === "delete"}
        title={GROUP_DELETE_TITLE}
        message={
          request !== null && request.kind === "delete"
            ? deleteGroupMessage(request.name, props.countLabel(request.count), request.count)
            : ""
        }
        confirmLabel={GROUP_DELETE_LABEL}
        cancelLabel={CANCEL_LABEL}
        confirmTone="danger"
        onConfirm={() => {
          if (request !== null && request.kind === "delete") {
            props.onDelete(request.name);
          }
        }}
        onClose={props.onClose}
      />
    </>
  );
}
