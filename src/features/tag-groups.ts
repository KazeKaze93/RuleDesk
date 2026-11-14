import * as z from "zod/mini";

import { RDW_SKIN_CLASS } from "../config/constants";
import { log } from "../log";
import {
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FEATURE_ID = "tag-groups";
const FEATURE_LABEL = "Collapse tags";
const TAG_SIDEBAR_SELECTOR = "ul#tag-sidebar";
const TOGGLE_CLASS = "rdw-tag-group-toggle";
const COLLAPSED_CLASS = "rdw-tag-group-collapsed";
const BODY_FEATURE_CLASS = featureBodyClass(FEATURE_ID);
const MISSING_SIDEBAR_WARN = "Tag sidebar not found";

const GROUP_HEADER_NAMES = [
  "Copyright",
  "Character",
  "Artist",
  "General",
  "Meta",
] as const;

type GroupHeaderName = (typeof GROUP_HEADER_NAMES)[number];

const GROUP_HEADER_NAME_SET: ReadonlySet<string> = new Set(GROUP_HEADER_NAMES);

const DEFAULT_COLLAPSED: readonly GroupHeaderName[] = ["General", "Meta"];

const FEATURE_PAGES = ["list", "post"] as const;

/**
 * Site-skin `html.rdw-skin ul#tag-sidebar > li { display: block }` includes an id,
 * so a body+class rule cannot hide the row. Match that chain, then add the
 * collapsed class. The second selector covers site themes (no html.rdw-skin).
 */
const COLLAPSED_ROW = `ul#tag-sidebar > li.${COLLAPSED_CLASS}`;
const HIDE_COLLAPSED_WITH_SKIN = `html.${RDW_SKIN_CLASS} body.${BODY_FEATURE_CLASS} ${COLLAPSED_ROW}`;
const HIDE_COLLAPSED_SITE_THEME = `body.${BODY_FEATURE_CLASS} ${COLLAPSED_ROW}`;

const FEATURE_CSS = [
  `${HIDE_COLLAPSED_WITH_SKIN},`,
  `${HIDE_COLLAPSED_SITE_THEME} { display: none; }`,
  `body.${BODY_FEATURE_CLASS} button.${TOGGLE_CLASS} {`,
  "  background: transparent;",
  "  border: none;",
  "  color: inherit;",
  "  cursor: pointer;",
  "  font: inherit;",
  "  padding: 0;",
  "}",
  `body.${BODY_FEATURE_CLASS} button.${TOGGLE_CLASS}:focus-visible {`,
  "  outline: 2px solid var(--rdw-accent);",
  "  outline-offset: 2px;",
  "}",
].join("\n");

const TagGroupsStateSchema = z.object({
  collapsed: z.array(z.string()),
});

type TagGroupsState = z.infer<typeof TagGroupsStateSchema>;

type TagGroup = {
  name: string;
  headerLi: HTMLLIElement;
  members: HTMLLIElement[];
};

function defaultState(): TagGroupsState {
  return { collapsed: [...DEFAULT_COLLAPSED] };
}

function parseTagGroupsState(raw: unknown): TagGroupsState {
  const parsed = TagGroupsStateSchema.safeParse(raw);
  if (!parsed.success) {
    return defaultState();
  }
  return parsed.data;
}

function isGroupHeaderName(text: string): boolean {
  return GROUP_HEADER_NAME_SET.has(text);
}

function readHeaderName(li: HTMLLIElement): string | null {
  const h6 = li.querySelector(":scope > h6");
  if (!(h6 instanceof HTMLHeadingElement)) {
    return null;
  }
  const text = h6.textContent?.trim() ?? "";
  if (!isGroupHeaderName(text)) {
    return null;
  }
  return text;
}

function collectGroups(sidebar: HTMLUListElement): TagGroup[] {
  const groups: TagGroup[] = [];
  let current: TagGroup | null = null;

  for (const child of sidebar.children) {
    if (!(child instanceof HTMLLIElement)) {
      continue;
    }
    const headerName = readHeaderName(child);
    if (headerName !== null) {
      current = {
        name: headerName,
        headerLi: child,
        members: [],
      };
      groups.push(current);
      continue;
    }
    if (current !== null) {
      current.members.push(child);
    }
  }

  return groups;
}

function formatToggleLabel(name: string, count: number): string {
  return `${name} (${String(count)})`;
}

function applyGroupCollapsed(
  members: readonly HTMLLIElement[],
  button: HTMLButtonElement,
  collapsed: boolean,
): void {
  for (const member of members) {
    member.classList.toggle(COLLAPSED_CLASS, collapsed);
  }
  button.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function writeCollapsedState(
  ctx: FeatureContext,
  collapsedNames: readonly string[],
): void {
  ctx.setState({ collapsed: [...collapsedNames] });
}

function mountToggle(
  group: TagGroup,
  collapsedNames: Set<string>,
  ctx: FeatureContext,
): void {
  const h6 = group.headerLi.querySelector(":scope > h6");
  if (!(h6 instanceof HTMLHeadingElement)) {
    return;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = TOGGLE_CLASS;
  button.textContent = formatToggleLabel(group.name, group.members.length);

  const initiallyCollapsed = collapsedNames.has(group.name);
  applyGroupCollapsed(group.members, button, initiallyCollapsed);

  button.addEventListener("click", () => {
    const currentlyCollapsed = collapsedNames.has(group.name);
    const nextCollapsed = !currentlyCollapsed;
    if (nextCollapsed) {
      collapsedNames.add(group.name);
    } else {
      collapsedNames.delete(group.name);
    }
    applyGroupCollapsed(group.members, button, nextCollapsed);
    writeCollapsedState(ctx, [...collapsedNames]);
  });

  h6.replaceChildren(button);
}

function mountTagGroups(ctx: FeatureContext): void {
  const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR);
  if (!(sidebar instanceof HTMLUListElement)) {
    log.warn(MISSING_SIDEBAR_WARN);
    return;
  }

  const state = ctx.getState(parseTagGroupsState);
  const collapsedNames = new Set(state.collapsed);
  const groups = collectGroups(sidebar);

  for (const group of groups) {
    mountToggle(group, collapsedNames, ctx);
  }
}

export const tagGroupsFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  // Turning the setting off and on again returns to General and Meta collapsed.
  resetStateOnToggle: true,
  mount: mountTagGroups,
};
