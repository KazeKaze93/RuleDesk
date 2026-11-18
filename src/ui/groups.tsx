import type { JSX } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";

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

const TABS_CLASS = "rdw-groups";
const TAB_CLASS = "rdw-groups__tab";
const TAB_WRAP_CLASS = "rdw-groups__item";
const TAB_COUNT_CLASS = "rdw-groups__count";
const TAB_OVER_CLASS = "rdw-groups__item--over";
const TAB_MORE_CLASS = "rdw-groups__more";
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
.${TABS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.${TABS_CLASS}[inert] {
  opacity: 0.45;
}
.${TAB_WRAP_CLASS} {
  position: relative;
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--rdw-radius-m);
}
.${TAB_WRAP_CLASS}[data-selected="true"] {
  border-color: var(--rdw-border);
  background: var(--rdw-surface);
}
.${TAB_OVER_CLASS} {
  border-color: var(--rdw-accent);
  background: var(--rdw-accent-soft);
}
.${TAB_CLASS} {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--rdw-radius-m);
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.${TAB_CLASS}:hover,
.${TAB_WRAP_CLASS}[data-selected="true"] .${TAB_CLASS} {
  color: var(--rdw-text);
}
.${TAB_COUNT_CLASS} {
  color: var(--rdw-muted);
  font-weight: 400;
}
.${TAB_MORE_CLASS} {
  margin-right: 2px;
}
/* The button of a group's own actions shows for the open tab, under the
   pointer and for the keyboard: on every tab at once it is noise. */
.${TAB_WRAP_CLASS}:not([data-selected="true"]):not(:hover):not(:focus-within) .${TAB_MORE_CLASS} {
  opacity: 0;
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
  const dropProps = (key: string, target: string | null): DropHandlers =>
    dragging && props.onDropTo !== undefined
      ? {
          onDragOver: (event: DragEvent) => {
            event.preventDefault();
            setOver(key);
          },
          onDragLeave: () => {
            setOver((current) => (current === key ? null : current));
          },
          onDrop: (event: DragEvent) => {
            event.preventDefault();
            setOver(null);
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
      onClick={() => {
        props.onChange(key);
      }}
    >
      {label}
      <span className={TAB_COUNT_CLASS}>{String(count)}</span>
    </button>
  );
  const wrapClass = (key: string): string =>
    over === key ? `${TAB_WRAP_CLASS} ${TAB_OVER_CLASS}` : TAB_WRAP_CLASS;

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
      className={TABS_CLASS}
      role="tablist"
      aria-label={GROUPS_LABEL}
      {...(props.locked === true ? { inert: true } : {})}
    >
      <style>{GROUPS_CSS}</style>
      <span className={TAB_WRAP_CLASS} data-selected={String(props.value === GROUP_ALL)}>
        {tab(GROUP_ALL, GROUP_ALL_LABEL, props.total)}
      </span>
      {props.groups.map((group) => (
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
      {props.groups.length > 0 ? (
        <span
          className={wrapClass(GROUP_NONE)}
          data-selected={String(props.value === GROUP_NONE)}
          {...dropProps(GROUP_NONE, null)}
        >
          {tab(GROUP_NONE, GROUP_NONE_LABEL, props.total - inGroups)}
        </span>
      ) : null}
      <Button variant="ghost" onClick={props.onNew}>
        <IconPlus size={ICON_PX} />
        {GROUP_NEW_LABEL}
      </Button>
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
        {props.groups.map((name) => (
          <button
            key={name}
            type="button"
            role="menuitem"
            className={`${MENU_ITEM_CLASS} rdw-kit-focusable`}
            disabled={name === current}
            onClick={() => {
              pick(() => {
                props.onMove(name);
              });
            }}
          >
            <span>{name}</span>
            {name === current ? (
              <span className={MENU_TICK_CLASS} aria-hidden="true">
                <IconCheck size={ICON_PX} />
              </span>
            ) : null}
          </button>
        ))}
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
            onChange={setDraft}
          />
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
