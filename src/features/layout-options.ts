import { featureBodyClass, type Feature } from "./types";

/**
 * Two switches of RuleDesk → Page that are styles and nothing else:
 *
 * - "Sidebar on the right": the tag sidebar of Posts and of a post page goes
 *   to the right of the content;
 * - "Motion": thumbnails lift a little under the pointer, buttons change
 *   state smoothly, menus and dialogs fade in.
 *
 * No imports but the feature type: the first is applied before the first
 * paint, with the rest of the layout.
 */

export const SIDEBAR_RIGHT_FEATURE_ID = "sidebar-right";
export const MOTION_FEATURE_ID = "motion";
export const MOTION_BODY_CLASS = featureBodyClass(MOTION_FEATURE_ID);

const SIDEBAR_RIGHT_BODY = `body.${featureBodyClass(SIDEBAR_RIGHT_FEATURE_ID)}`;
const MOTION_BODY = `body.${MOTION_BODY_CLASS}`;

/** How long a control takes to change state. */
export const MOTION_FAST = "120ms";
/** How long a thumbnail takes to lift, a menu to appear. */
export const MOTION_BASE = "160ms";
const MOTION_EASE = "cubic-bezier(0.2, 0, 0, 1)";
const LIFT = "translateY(-2px)";

/**
 * The site lays `div#post-list` and `div#post-view` out as a flex row with
 * the sidebar first; `order` moves it without touching the page.
 */
const SIDEBAR_RIGHT_CSS = `
${SIDEBAR_RIGHT_BODY} div#post-list > div.sidebar,
${SIDEBAR_RIGHT_BODY} div#post-view > div.sidebar {
  order: 2;
  margin-right: 0 !important;
  margin-left: 1em;
}
${SIDEBAR_RIGHT_BODY} div#post-list > div.content {
  flex: 1 1 auto;
  min-width: 0;
}
`.trim();

/** The controls of the script's kit that change state under the pointer. */
const KIT_CONTROLS = [
  ".rdw-btn",
  ".rdw-icon-btn",
  ".rdw-seg__btn",
  ".rdw-chip",
  ".rdw-field__input",
  ".rdw-switch__track",
  ".rdw-switch__thumb",
] as const;

function transitionRule(scope: string): string {
  return `${KIT_CONTROLS.map((control) => `${scope} ${control}`).join(",\n")} {
  transition:
    background-color ${MOTION_FAST} ${MOTION_EASE},
    border-color ${MOTION_FAST} ${MOTION_EASE},
    color ${MOTION_FAST} ${MOTION_EASE},
    opacity ${MOTION_FAST} ${MOTION_EASE},
    transform ${MOTION_FAST} ${MOTION_EASE};
}
${scope} .rdw-btn:active,
${scope} .rdw-icon-btn:active {
  transform: scale(0.97);
}`;
}

const APPEAR_KEYFRAMES = `
@keyframes rdw-appear {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
@keyframes rdw-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}`.trim();

function appearRule(scope: string): string {
  return `${scope} .rdw-popover {
  animation: rdw-appear ${MOTION_BASE} ${MOTION_EASE};
}
${scope} .rdw-dialog-backdrop {
  animation: rdw-fade ${MOTION_BASE} ${MOTION_EASE};
}`;
}

/**
 * Everything is inside `prefers-reduced-motion: no-preference`: someone who
 * asked their system for less motion gets none, whatever the switch says.
 */
const MOTION_CSS = `
@media (prefers-reduced-motion: no-preference) {
${APPEAR_KEYFRAMES}
${MOTION_BODY} span.thumb img {
  transition: transform ${MOTION_BASE} ${MOTION_EASE}, opacity ${MOTION_FAST} ${MOTION_EASE};
}
/* Not a video thumb: its hover preview is laid over the picture by measured
   position, and a picture that moves would slip from under it. */
${MOTION_BODY} span.thumb:not(.rdw-video-thumb):hover img:not(.webm-thumb) {
  transform: ${LIFT};
}
${MOTION_BODY} div#header ul#navbar li a,
${MOTION_BODY} div#header ul#navbar li button {
  transition: color ${MOTION_FAST} ${MOTION_EASE}, box-shadow ${MOTION_FAST} ${MOTION_EASE};
}
${transitionRule(MOTION_BODY)}
${appearRule(MOTION_BODY)}
}
`.trim();

/**
 * The same for the script's own pages. They live in a shadow root, where a
 * class on <body> is reached only through `:host-context`.
 */
export const MOTION_PAGE_CSS = `
@media (prefers-reduced-motion: no-preference) {
${APPEAR_KEYFRAMES}
${transitionRule(`:host-context(${MOTION_BODY})`)}
${appearRule(`:host-context(${MOTION_BODY})`)}
}
`.trim();

export const sidebarRightFeature: Feature = {
  id: SIDEBAR_RIGHT_FEATURE_ID,
  label: "Sidebar on the right",
  pages: ["list", "post"],
  defaultEnabled: false,
  cssOnly: true,
  css: SIDEBAR_RIGHT_CSS,
  mount: () => undefined,
};

export const motionFeature: Feature = {
  id: MOTION_FEATURE_ID,
  label: "Motion",
  pages: ["list", "post", "favorites", "other"],
  defaultEnabled: true,
  cssOnly: true,
  settingsCaption:
    "Thumbnails lift under the pointer, buttons change smoothly, menus fade in. Never shown when your system asks for reduced motion.",
  css: MOTION_CSS,
  mount: () => undefined,
};
