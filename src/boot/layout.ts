/**
 * DOM-ready, still before first paint yield: layout-affecting body classes + CSS.
 * Does not mount thumb buttons, search Preact panel, feed, marks, etc.
 */

import { ensureStyleElement } from "./appearance-dom";
import {
  peekLayoutSettings,
  resolveFeatureChoice,
  resolveFeatureEnabled,
} from "./cheap-appearance";
import { gridDensityFeature } from "../features/grid-density";
import { menuCleanupFeature } from "../features/menu-cleanup";
import { applyFeatureChrome } from "../features/runtime";
import { featureBodyClass, type Feature } from "../features/types";
import { detectPageKind } from "../site/pages";
import { installMenuSkeleton } from "./menu-skeleton";
import {
  SEARCH_TOOLS_AI_ROW_BODY_CLASS,
  SEARCH_TOOLS_MOUNTED_CLASS,
  readSearchToolsReserveHeight,
} from "./search-tools-reserve";

/** Must match search-tools root id/class (feature owns mount; we only reserve). */
const SEARCH_TOOLS_FEATURE_ID = "search-tools";
const SEARCH_TOOLS_ROOT_ID = "rdw-search-tools";
const SEARCH_TOOLS_ROOT_CLASS = "rdw-search-tools";
const SEARCH_TOOLS_RESERVE_STYLE_ID = "rdw-search-tools-reserve";
const SEARCH_TOOLS_RESERVE_MARGIN_TOP_PX = 8;
const TAGS_INPUT_SELECTOR = 'input[name="tags"]';
const TAG_SIDEBAR_SELECTOR = "ul#tag-sidebar";
const CONTENT_ID = "content";

const LAYOUT_FEATURES: readonly Feature[] = [
  menuCleanupFeature,
  gridDensityFeature,
];

function buildSearchReserveCss(bodyClass: string): string {
  return [
    `body.${bodyClass} #${SEARCH_TOOLS_ROOT_ID}:not(.${SEARCH_TOOLS_MOUNTED_CLASS}) {`,
    `  min-height: ${String(readSearchToolsReserveHeight())}px;`,
    "}",
    `body.${bodyClass} #${SEARCH_TOOLS_ROOT_ID} {`,
    `  margin-top: ${String(SEARCH_TOOLS_RESERVE_MARGIN_TOP_PX)}px;`,
    "  box-sizing: border-box;",
    "}",
  ].join("\n");
}

function ensureSearchToolsPlaceholder(): void {
  const input = document.querySelector(TAGS_INPUT_SELECTOR);
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  const form = input.closest("form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const existing = document.getElementById(SEARCH_TOOLS_ROOT_ID);
  if (existing instanceof HTMLDivElement) {
    if (existing.previousElementSibling !== form) {
      form.after(existing);
    }
    return;
  }
  const root = document.createElement("div");
  root.id = SEARCH_TOOLS_ROOT_ID;
  root.className = SEARCH_TOOLS_ROOT_CLASS;
  form.after(root);
}

/**
 * Reserves the place of the search panel under the site's search form.
 * Returns false while the form is not in the page yet. Safe to call again.
 */
export function reserveSearchTools(): boolean {
  const pageKind = detectPageKind(window.location.search);
  if (pageKind !== "list" && pageKind !== "post") {
    return true;
  }
  if (!resolveFeatureEnabled(peekLayoutSettings(), SEARCH_TOOLS_FEATURE_ID, true)) {
    return true;
  }
  if (document.body === null || document.querySelector(TAGS_INPUT_SELECTOR) === null) {
    return false;
  }
  const bodyClass = featureBodyClass(SEARCH_TOOLS_FEATURE_ID);
  document.body.classList.add(bodyClass);
  // The panel takes over the site's "Filter AI" row: hide it from the start.
  document.body.classList.add(SEARCH_TOOLS_AI_ROW_BODY_CLASS);
  const style = ensureStyleElement(SEARCH_TOOLS_RESERVE_STYLE_ID);
  style.textContent = buildSearchReserveCss(bodyClass);
  ensureSearchToolsPlaceholder();
  return true;
}

/**
 * The script's menu items and the place of the search panel, put in while the
 * page is still being parsed, so that the first paint already has them.
 * Watches the document until both are done or the page is parsed.
 */
export function startEarlyLayout(): void {
  const layout = peekLayoutSettings();
  let menuDone = false;
  let searchDone = false;
  const attempt = (): boolean => {
    // The menu is complete once something after the header is parsed.
    if (!menuDone && document.getElementById(CONTENT_ID) !== null) {
      menuDone = installMenuSkeleton(layout);
    }
    // The search form is complete once the tag list after it is parsed.
    if (!searchDone && document.querySelector(TAG_SIDEBAR_SELECTOR) !== null) {
      searchDone = reserveSearchTools();
    }
    return menuDone && searchDone;
  };
  if (attempt()) {
    return;
  }
  const observer = new MutationObserver(() => {
    if (attempt()) {
      observer.disconnect();
    }
  });
  observer.observe(document, { childList: true, subtree: true });
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      observer.disconnect();
      installMenuSkeleton(layout);
    },
    { once: true },
  );
}

/**
 * Apply grid-density / menu-cleanup chrome (+ menu mount) and reserve search
 * panel space. Uses cached cheap layout settings (no store.load / zod).
 */
export function applyLayoutBeforePaint(): void {
  const pageKind = detectPageKind(window.location.search);
  const search = window.location.search;
  const layout = peekLayoutSettings();

  for (const feature of LAYOUT_FEATURES) {
    if (!feature.pages.includes(pageKind)) {
      continue;
    }
    if (!resolveFeatureEnabled(layout, feature.id, feature.defaultEnabled)) {
      continue;
    }
    const choiceValue =
      feature.choice !== undefined
        ? resolveFeatureChoice(
            layout,
            feature.id,
            feature.choice.defaultValue,
            feature.choice.options.map((option) => option.value),
          )
        : undefined;
    applyFeatureChrome(feature, pageKind, search, {
      ...(choiceValue !== undefined ? { choiceValue } : {}),
    });
  }

  reserveSearchTools();
}
