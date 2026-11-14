import { h, render } from "preact";

import { log } from "../log";
import { readPostIdFromSearch } from "../site/pages";
import { PostPanel } from "./post-panel/post-panel";
import {
  findFlexi,
  findMediaWrapper,
  measureHeaderOffsetPx,
} from "./post-panel/site-reads";
import {
  POST_ACTIONS_ID,
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FEATURE_ID = "post-actions";
const FEATURE_LABEL = "Post side panel";
const FEATURE_PAGES = ["post"] as const;

/** Body class while the panel host is in the document — CSS hide handoff for G. */
export const POST_PANEL_MOUNTED_CLASS = "rdw-post-panel-mounted";

const NARROW_BREAKPOINT_PX = 1100;
const NARROW_MEDIA_QUERY = `(max-width: ${String(NARROW_BREAKPOINT_PX - 1)}px)`;
const PANEL_WIDTH_PX = 360;
const PANEL_MIN_WIDTH_PX = 320;
const PANEL_MAX_WIDTH_PX = 420;
const PANEL_FONT_SIZE_PX = 13;
const PANEL_BUTTON_HEIGHT_PX = 34;
const PANEL_BLOCK_GAP_PX = 10;
const PANEL_BUTTON_GAP_PX = 8;
const PANEL_CARD_PADDING_PX = 12;
const PANEL_STICKY_GAP_PX = 12;
const PANEL_Z_INDEX = 100;
const STAT_LABEL_WIDTH_PX = 62;
const ORIGINAL_BUTTON_SIZE_PX = 34;
const STICKY_TOP_VAR = "--rdw-post-panel-sticky-top";

const CLASS_PANEL = "rdw-post-actions";
const CLASS_MODE_WIDE = "rdw-post-actions--wide";
const CLASS_MODE_NARROW = "rdw-post-actions--narrow";

const WARN_NO_FLEXI =
  "post-actions: div.flexi missing; panel not mounted";

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_CLASS}`;

const FEATURE_CSS = `
${BODY_SELECTOR} #fit-to-screen div.flexi,
${BODY_SELECTOR} div#right-col div.flexi,
${BODY_SELECTOR} div.flexi {
  flex-wrap: wrap;
  align-items: flex-start;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_PANEL} {
  box-sizing: border-box;
  width: ${String(PANEL_WIDTH_PX)}px;
  min-width: ${String(PANEL_MIN_WIDTH_PX)}px;
  max-width: min(${String(PANEL_MAX_WIDTH_PX)}px, 100%);
  flex: 0 1 ${String(PANEL_WIDTH_PX)}px;
  z-index: ${String(PANEL_Z_INDEX)};
  font: ${String(PANEL_FONT_SIZE_PX)}px/1.35 var(--rdw-font);
  color: var(--rdw-text);
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_WIDE} {
  position: sticky;
  top: var(${STICKY_TOP_VAR}, ${String(PANEL_STICKY_GAP_PX)}px);
  align-self: flex-start;
  max-height: calc(100vh - var(${STICKY_TOP_VAR}, ${String(PANEL_STICKY_GAP_PX)}px) - ${String(PANEL_STICKY_GAP_PX)}px);
  overflow-y: auto;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_NARROW} {
  position: static;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  flex: 1 1 100%;
  margin: 0.75rem 0 0;
  max-height: none;
  overflow-y: visible;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel {
  display: grid;
  gap: ${String(PANEL_BLOCK_GAP_PX)}px;
  position: relative;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-card {
  padding: ${String(PANEL_CARD_PADDING_PX)}px;
  display: grid;
  gap: ${String(PANEL_BLOCK_GAP_PX)}px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-btn {
  min-height: ${String(PANEL_BUTTON_HEIGHT_PX)}px;
  font-size: ${String(PANEL_FONT_SIZE_PX)}px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-actions {
  display: grid;
  gap: ${String(PANEL_BUTTON_GAP_PX)}px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: ${String(PANEL_BUTTON_GAP_PX)}px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-actions-row > .rdw-btn,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-actions-row > .rdw-post-panel-collections {
  flex: 1 1 0;
  min-width: 0;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collections {
  position: relative;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collections .rdw-btn {
  width: 100%;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-original {
  box-sizing: border-box;
  flex: 0 0 ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  width: ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  height: ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  min-width: ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  min-height: ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  text-decoration: none;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-stats {
  display: grid;
  grid-template-columns: ${String(STAT_LABEL_WIDTH_PX)}px 1fr;
  column-gap: ${String(PANEL_BUTTON_GAP_PX)}px;
  row-gap: ${String(PANEL_BUTTON_GAP_PX)}px;
  font-size: ${String(PANEL_FONT_SIZE_PX)}px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-stat-label {
  color: var(--rdw-muted);
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-source {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-accent);
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-info {
  display: grid;
  gap: ${String(PANEL_BLOCK_GAP_PX)}px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-post-actions {
  display: grid;
  gap: ${String(PANEL_BUTTON_GAP_PX)}px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-post-action {
  width: 100%;
  justify-content: flex-start;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-tabpanel[hidden] {
  display: none;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-comments-host {
  min-width: 0;
}
@media ${NARROW_MEDIA_QUERY} {
  ${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_WIDE} {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
}
`.trim();

let layoutCleanup: (() => void) | null = null;
let panelHost: HTMLElement | null = null;

function removeExistingPanel(): void {
  if (layoutCleanup !== null) {
    layoutCleanup();
    layoutCleanup = null;
  }
  if (panelHost !== null) {
    render(null, panelHost);
    panelHost.remove();
    panelHost = null;
  }
  const existing = document.getElementById(POST_ACTIONS_ID);
  if (existing !== null) {
    existing.remove();
  }
  document.body.classList.remove(POST_PANEL_MOUNTED_CLASS);
}

function isNarrowViewport(): boolean {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(NARROW_MEDIA_QUERY).matches;
  }
  return window.innerWidth < NARROW_BREAKPOINT_PX;
}

function applyStickyTop(panel: HTMLElement): void {
  const topPx = measureHeaderOffsetPx(PANEL_STICKY_GAP_PX);
  panel.style.setProperty(STICKY_TOP_VAR, `${String(topPx)}px`);
}

function placePanel(panel: HTMLElement, flexi: HTMLElement): void {
  const narrow = isNarrowViewport();
  panel.classList.toggle(CLASS_MODE_WIDE, !narrow);
  panel.classList.toggle(CLASS_MODE_NARROW, narrow);
  applyStickyTop(panel);

  const media = findMediaWrapper(flexi, POST_ACTIONS_ID);
  if (media !== null) {
    media.after(panel);
    return;
  }
  flexi.append(panel);
}

function bindLayout(panel: HTMLElement, flexi: HTMLElement): void {
  const sync = (): void => {
    placePanel(panel, flexi);
  };
  sync();

  const onResize = (): void => {
    sync();
  };
  window.addEventListener("resize", onResize);

  let mediaCleanup: (() => void) | null = null;
  if (typeof window.matchMedia === "function") {
    const media = window.matchMedia(NARROW_MEDIA_QUERY);
    const onChange = (): void => {
      sync();
    };
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      mediaCleanup = (): void => {
        media.removeEventListener("change", onChange);
      };
    } else if (typeof media.addListener === "function") {
      media.addListener(onChange);
      mediaCleanup = (): void => {
        media.removeListener(onChange);
      };
    }
  }

  layoutCleanup = (): void => {
    window.removeEventListener("resize", onResize);
    if (mediaCleanup !== null) {
      mediaCleanup();
    }
  };
}

function mountPostActions(ctx: FeatureContext): void {
  removeExistingPanel();

  const flexi = findFlexi();
  if (flexi === null) {
    log.warn(WARN_NO_FLEXI);
    return;
  }

  const host = document.createElement("div");
  host.id = POST_ACTIONS_ID;
  host.className = CLASS_PANEL;
  host.setAttribute("role", "complementary");
  host.setAttribute("aria-label", FEATURE_LABEL);

  const postId = readPostIdFromSearch(ctx.search);
  panelHost = host;
  document.body.classList.add(POST_PANEL_MOUNTED_CLASS);
  placePanel(host, flexi);
  bindLayout(host, flexi);
  render(h(PostPanel, { postId }), host);
}

export const postActionsFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountPostActions,
};

export { mountPostActions };
