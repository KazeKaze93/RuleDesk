/**
 * Site chrome CSS for html.rdw-skin (light / dark / custom themes).
 * Colors only via --rdw-* tokens. Does not change .thumb 200×200 cell size.
 * Injected via applyAppearanceTheme → injectSiteSkinHook(getSiteSkinCss()).
 */

import {
  FAVORITE_IMAGE_ANCHOR_NAME,
  FAVORITES_PAGE_CLASS,
  THUMB_ANCHOR_NAME,
} from "../features/types";
import { VIDEO_THUMB_CLASS } from "../site/video-thumbs";
import {
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  CSS_CLASS,
  IMAGE_LIST_GAP_PX,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
} from "../config/constants";
import { RDW_PAGE_ROOT_ID } from "../pages/constants";
import { SITE_SELECTORS } from "../site/selectors";
import { TOKEN_VAR } from "../ui/tokens";

const ROOT = `html.${RDW_SKIN_CLASS}`;
/** The site's Favorites page only (see FAVORITES_PAGE_CLASS). */
const ROOT_FAVORITES = `${ROOT}.${FAVORITES_PAGE_CLASS}`;
const ROOT_DARK = `${ROOT}[${RDW_THEME_ATTR}="${APPEARANCE_THEME_DARK}"]`;
const ROOT_SITE = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
const ROOT_SITE_DARK = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;
const ROOT_THEME_DARK = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_DARK}"]`;

/** search-tools mount root (id + class in src/features/search-tools.tsx). */
const SEARCH_TOOLS_ROOT_ID = "rdw-search-tools";
/** Reset control class (src/features/search-tools.tsx). */
/** Exclude our light-DOM controls from site button/input chrome. */
/** Height of the site's own text fields and selects, next to its buttons. */
const SITE_CONTROL_MIN_HEIGHT_PX = 30;
/** Widest a comment or forum post grows before the line gets too long to read. */
const COMMENT_MAX_WIDTH_PX = 1100;
/** Anchor of a favorites preview, visible to the Remove link beside its thumb. */
const FAV_REMOVE_ANCHOR_NAME = FAVORITE_IMAGE_ANCHOR_NAME;
const FAV_REMOVE_INSET_PX = 6;
/** The same square as the buttons on a Posts thumb. */
const FAV_REMOVE_SIZE_PX = 28;
const FAV_REMOVE_ICON_PX = 16;
/** A bin, drawn as a mask so that it takes the colour of the rule. */
const FAV_REMOVE_ICON_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 6h18'/%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'/%3E%3Cpath d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'/%3E%3Cpath d='M10 11v6'/%3E%3Cpath d='M14 11v6'/%3E%3C/svg%3E") center / contain no-repeat`;
/** Above the hover video preview. */
const FAV_REMOVE_Z_INDEX = 4;
const ACCOUNT_CARD_MAX_WIDTH_PX = 640;
const HELP_CARD_MIN_WIDTH_PX = 220;
const NOT_RDW_CLASS = ':not([class*="rdw-"])';
const NOT_SEARCH_TOOLS_DESCENDANT = `:not(#${SEARCH_TOOLS_ROOT_ID} *)`;
/**
 * Same exclusions as :not…:not…, but :where() zeros their specificity so an
 * ID-bearing :not cannot outrank accent rules like div.tag-search submit.
 */
const WHERE_NOT_OUR_CONTROL = `:where(${NOT_RDW_CLASS}${NOT_SEARCH_TOOLS_DESCENDANT})`;

/**
 * Body class Package E sets only while the post panel host is mounted
 * (`POST_PANEL_MOUNTED_CLASS` in post-actions.ts).
 */
export const RDW_POST_PANEL_MOUNTED_CLASS = "rdw-post-panel-mounted";
/** Native "I came" counter row — hide with panel chrome (E HANDOFF). */
const POST_PANEL_ICAME_ROW = 'li:has(a[onclick^="iCame("])';
/** Post panel host id — keep in sync with POST_ACTIONS_ID in features/types.ts. */
const POST_ACTIONS_HOST_ID = "rdw-post-actions";

/** Kit select list — keep in sync with src/ui/kit/select.tsx. */
const KIT_SELECT_LIST_CLASS = "rdw-select__list";
/** Kit autocomplete list — keep in sync with src/ui/kit/autocomplete-field.tsx. */
const KIT_AC_LIST_CLASS = "rdw-ac__list";
/** Kit dialog panel — keep in sync with src/ui/kit/dialog.tsx. */
const KIT_DIALOG_CLASS = "rdw-dialog";
/** Playlist add-to menu — keep in sync with src/features/playlist-menu.ts. */
const PLAYLIST_MENU_CLASS = "rdw-playlist-menu";

/** Firefox / modern Chromium thin scrollbar (E HANDOFF). */
const SCROLLBAR_WIDTH = "thin";

/** Post panel Original control — keep in sync with post-actions ORIGINAL_BUTTON_SIZE_PX. */
const POST_PANEL_ORIGINAL_SIZE_PX = 34;
/** Active tab underline — keep in sync with kit/tabs.tsx. */
const POST_PANEL_TAB_UNDERLINE_PX = 2;

/** Post panel classes — keep in sync with src/features/post-panel/post-panel.tsx. */
const POST_PANEL_ACTIONS_CLASS = "rdw-post-panel-actions";
const POST_PANEL_ACTIONS_ROW_CLASS = "rdw-post-panel-actions-row";
const POST_PANEL_FAV_CLASS = "rdw-post-panel-fav";
const POST_PANEL_ORIGINAL_CLASS = "rdw-post-panel-original";
const POST_PANEL_TABPANEL_CLASS = "rdw-post-panel-tabpanel";
const POST_PANEL_POST_ACTION_CLASS = "rdw-post-panel-post-action";
/** Kit tabs — keep in sync with src/ui/kit/tabs.tsx. */
const KIT_TABS_CLASS = "rdw-tabs";
const KIT_TAB_CLASS = "rdw-tabs__tab";
const KIT_BTN_PRIMARY_CLASS = "rdw-btn--primary";

/**
 * Body class while search-tools «AI posts» row is rendered
 * (`SEARCH_TOOLS_AI_ROW_BODY_CLASS` in search-tools.tsx — F HANDOFF).
 */
const SEARCH_TOOLS_AI_ROW_BODY_CLASS = "rdw-search-tools-ai-posts";

/** F bulk-select chrome — keep in sync with src/features/favorites-bulk.tsx. */
const FAV_BULK_SELECTED_CLASS = "rdw-fav-bulk-selected";
const FAV_BULK_CHECK_CLASS = "rdw-fav-bulk-check";
const FAV_BULK_ROOT_ID = "rdw-favorites-bulk";
const FAV_BULK_BAR_CLASS = "rdw-favorites-bulk-bar";
const FAV_BULK_STATUS_CLASS = "rdw-favorites-bulk-status";
/** Body class while selection mode is active (featureBodyClass + "-selecting"). */
const FAV_BULK_SELECTING_BODY_CLASS = "rdw-f-favorites-bulk-selecting";
const FAV_BULK_OUTLINE_WIDTH = "2px";
const FAV_BULK_OUTLINE_OFFSET = "2px";
const FAV_BULK_CHECK_SIZE = "1.25rem";
const FAV_BULK_CHECK_INSET = "0.25rem";
const FAV_BULK_CHECK_Z_INDEX = 2;
const FAV_BULK_CHECK_FONT_SIZE = "0.75rem";

const v = {
  bg: `var(${TOKEN_VAR.bg})`,
  surface: `var(${TOKEN_VAR.surface})`,
  surface2: `var(${TOKEN_VAR.surface2})`,
  border: `var(${TOKEN_VAR.border})`,
  text: `var(${TOKEN_VAR.text})`,
  muted: `var(${TOKEN_VAR.muted})`,
  accent: `var(${TOKEN_VAR.accent})`,
  accentSoft: `var(${TOKEN_VAR.accentSoft})`,
  danger: `var(${TOKEN_VAR.danger})`,
  dangerSoft: `var(${TOKEN_VAR.dangerSoft})`,
  tagArtist: `var(${TOKEN_VAR.tagArtist})`,
  tagCharacter: `var(${TOKEN_VAR.tagCharacter})`,
  tagCopyright: `var(${TOKEN_VAR.tagCopyright})`,
  tagMetadata: `var(${TOKEN_VAR.tagMetadata})`,
  radiusS: `var(${TOKEN_VAR.radiusS})`,
  radiusM: `var(${TOKEN_VAR.radiusM})`,
  radiusL: `var(${TOKEN_VAR.radiusL})`,
  shadow1: `var(${TOKEN_VAR.shadow1})`,
  shadow2: `var(${TOKEN_VAR.shadow2})`,
  font: `var(${TOKEN_VAR.font})`,
} as const;

/** Full site-skin stylesheet (empty until injected by boot). */
export const SITE_SKIN_CSS = `
/* —— base —— */
${ROOT} body {
  font-family: ${v.font};
  font-size: 13px;
  line-height: 1.4;
  background: ${v.bg};
  color: ${v.text};
}

${ROOT} body,
${ROOT} body div,
${ROOT} body h1,
${ROOT} body h2,
${ROOT} body h3,
${ROOT} body h4,
${ROOT} body h5,
${ROOT} body h6,
${ROOT} body p,
${ROOT} body ul,
${ROOT} body li,
${ROOT} body dd,
${ROOT} body dt,
${ROOT} body input,
${ROOT} body select,
${ROOT} body button,
${ROOT} body textarea {
  font-family: ${v.font};
}

/* A visited link looks like any other link: one colour for links on a page. */
${ROOT} a:link,
${ROOT} a:visited {
  color: ${v.accent};
  text-decoration: none;
}

${ROOT} a:hover,
${ROOT} a:active {
  color: ${v.text};
  text-decoration: none;
}

/*
 * My Account: "Logout" is not a link but a form button dressed as a heading,
 * <h4><button type="submit" style="… color: inherit …">. It takes the link
 * colour so the list of headings is one colour; the inline style needs
 * !important to be overridden.
 */
${ROOT} h4 > button[type="submit"][style*="color: inherit"] {
  color: ${v.accent} !important;
}

${ROOT} h4 > button[type="submit"][style*="color: inherit"]:hover {
  color: ${v.text} !important;
}

${ROOT} a.last-page {
  color: ${v.muted};
}

${ROOT} a.spoiler,
${ROOT} span.spoiler {
  color: ${v.text};
  background: ${v.text};
}

${ROOT} a.spoiler:hover,
${ROOT} span.spoiler:hover {
  color: ${v.bg};
  background: ${v.text};
}

${ROOT} hr {
  border-color: ${v.border};
}

${ROOT} code {
  font-family: ui-monospace, monospace;
}

/* —— header —— */
${ROOT} div#header {
  background: ${v.surface};
  border-bottom: 1px solid ${v.border};
  margin-bottom: 0.75em;
}

${ROOT} div#header #site-title {
  background-image: none;
  background-color: transparent;
  padding: 12px 18px 4px 18px;
  font: 800 17px ${v.font};
  letter-spacing: -0.02em;
  color: ${v.text};
}

${ROOT} div#header #site-title a {
  color: ${v.text};
  font-weight: 800;
  background: none;
  text-shadow: none;
}

${ROOT} div#header ul#navbar {
  background: transparent;
  padding: 4px 18px 8px 10px;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

${ROOT} div#header ul#navbar li {
  font-size: 13px;
  font-weight: normal;
  padding: 0;
  margin: 0;
  background: transparent;
  background-image: none;
  list-style: none;
  display: inline;
}

${ROOT} div#header ul#navbar li a {
  display: inline-block;
  padding: 6px 10px;
  border-radius: ${v.radiusM};
  color: ${v.muted};
  font-weight: normal;
}

${ROOT} div#header ul#navbar li.current-page {
  background: transparent;
  background-image: none;
}

${ROOT} div#header ul#navbar li.current-page a,
${ROOT} #navbar li.current-page a {
  background: ${v.accentSoft};
  color: ${v.accent};
  font-weight: 600;
}

${ROOT} div#header ul#subnavbar {
  background: ${v.surface};
  border-top: 1px solid ${v.border};
  border-bottom: none;
  padding: 6px 18px;
  margin: 0;
}

${ROOT} div#header ul#subnavbar li {
  padding: 0 8px;
  font-size: 12.5px;
}

${ROOT} div#header ul#subnavbar li a {
  color: ${v.muted};
}

${ROOT} div#header ul#subnavbar li a:hover {
  color: ${v.accent};
}

${ROOT} div.tips {
  background: ${v.accentSoft};
  background-image: none;
  border-bottom: 1px solid ${v.border};
  color: ${v.text};
}

/* —— sidebar —— */
${ROOT} div.sidebar {
  width: 228px;
  min-width: 228px;
  max-width: 228px;
  margin-right: 1em;
}

${ROOT} div.sidebar h5,
${ROOT} div.sidebar h6,
${ROOT} ul#tag-sidebar h5,
${ROOT} ul#tag-sidebar h6 {
  font: 600 10.5px ${v.font};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${v.muted};
  margin: 0 0 6px;
}

/* Standalone "Tags"/"Search" (and similar) headings above the list card */
${ROOT} div.sidebar > h5 {
  display: none;
}

/* Tags between search panel card and tag list (typical site markup) */
${ROOT} div.tag-search + h5 {
  display: none;
}

/* D: Tags heading immediately after search-tools when they are siblings */
${ROOT} ${SITE_SELECTORS.tagsHeadingAfterSearchTools} {
  display: none;
}

/* F: native AI filter row — only while search-tools AI posts row is rendered */
${ROOT} body.${SEARCH_TOOLS_AI_ROW_BODY_CLASS} ${SITE_SELECTORS.filterAiRow} {
  display: none;
}

${ROOT} div.tag-search,
${ROOT} ul#tag-sidebar {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  padding: 12px;
  box-shadow: ${v.shadow1};
  box-sizing: border-box;
}

${ROOT} div.tag-search {
  margin-bottom: 12px;
}

${ROOT} ul#tag-sidebar {
  margin: 0;
  padding: 12px;
  list-style: none;
}

/*
 * Tag rows: ?/+/- /name (list) or ?/name (post) wrap as inline text;
 * count stays top-right on the first line (artists-sidebar.test markup).
 */
${ROOT} ul#tag-sidebar > li {
  display: block;
  position: relative;
  margin: 0 0 5px;
  padding-right: 4.5em;
  font-size: 12.5px;
  line-height: 1.35;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

${ROOT} ul#tag-sidebar > li > a {
  display: inline;
}

${ROOT} ul#tag-sidebar > li > h5,
${ROOT} ul#tag-sidebar > li > h6 {
  display: block;
  margin-top: 8px;
}

${ROOT} ul#tag-sidebar > li:first-child > h5,
${ROOT} ul#tag-sidebar > li:first-child > h6 {
  margin-top: 0;
}

${ROOT} .tag-count,
${ROOT} span.post-count,
${ROOT} span.tag-count {
  position: absolute;
  top: 0;
  right: 0;
  margin-left: 0;
  color: ${v.muted};
  font-size: 12px;
  line-height: 1.35;
}

/*
 * Tag type color on the LAST link of the row (tag name).
 * List rows: ? + − name — name is 4th. Post rows: ? name — name is 2nd.
 * Operators / wiki stay muted on every page.
 */
${ROOT} ul#tag-sidebar > li[class*="tag-type-"] > a:not(:last-of-type) {
  color: ${v.muted};
  font-size: 11px;
  font-weight: normal;
}

${ROOT} .tag-type-artist > a,
${ROOT} .tag-type-artist {
  color: ${v.tagArtist};
}

${ROOT} .tag-type-character > a,
${ROOT} .tag-type-character {
  color: ${v.tagCharacter};
}

${ROOT} .tag-type-copyright > a,
${ROOT} .tag-type-copyright {
  color: ${v.tagCopyright};
}

${ROOT} .tag-type-metadata > a,
${ROOT} .tag-type-metadata {
  color: ${v.tagMetadata};
}

${ROOT} ul#tag-sidebar > li.tag-type-artist > a:last-of-type {
  color: ${v.tagArtist};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-character > a:last-of-type {
  color: ${v.tagCharacter};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-copyright > a:last-of-type {
  color: ${v.tagCopyright};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-metadata > a:last-of-type {
  color: ${v.tagMetadata};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} .tag-type-artist > a:hover,
${ROOT} .tag-type-artist:hover,
${ROOT} .tag-type-character > a:hover,
${ROOT} .tag-type-character:hover,
${ROOT} .tag-type-copyright > a:hover,
${ROOT} .tag-type-copyright:hover,
${ROOT} .tag-type-metadata > a:hover,
${ROOT} .tag-type-metadata:hover,
${ROOT} ul#tag-sidebar > li[class*="tag-type-"] > a:last-of-type:hover {
  color: ${v.accent};
}

/* Artist Follow: kit secondary on theme tokens (beats document-chrome #fff) */
${ROOT} button.${CSS_CLASS.artistFollow} {
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  border-radius: ${v.radiusS};
}

${ROOT} button.${CSS_CLASS.artistFollow}:hover {
  background: ${v.accentSoft};
  border-color: ${v.accent};
  color: ${v.accent};
}

${ROOT} button.${CSS_CLASS.artistFollow}.${CSS_CLASS.artistFollowMarked} {
  background: ${v.accentSoft};
  border-color: ${v.accent};
  color: ${v.accent};
}

/* —— search field —— */
${ROOT} div.tag-search input[type="text"],
${ROOT} div.tag-search input[type="search"] {
  width: 100%;
  height: 34px;
  box-sizing: border-box;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusM};
  padding: 0 10px;
  background: ${v.surface};
  color: ${v.text};
  font-size: 13px;
}

${ROOT} div.tag-search input[type="submit"]${WHERE_NOT_OUR_CONTROL},
${ROOT} div.tag-search button[type="submit"]${WHERE_NOT_OUR_CONTROL} {
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: ${v.radiusS};
  background: ${v.accent};
  color: ${v.surface};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

${ROOT} div.tag-search input[type="submit"]${WHERE_NOT_OUR_CONTROL}:hover,
${ROOT} div.tag-search button[type="submit"]${WHERE_NOT_OUR_CONTROL}:hover {
  filter: brightness(1.05);
}

${ROOT} input[type="text"]${WHERE_NOT_OUR_CONTROL}:focus,
${ROOT} input[type="password"]${WHERE_NOT_OUR_CONTROL}:focus,
${ROOT} input[type="search"]${WHERE_NOT_OUR_CONTROL}:focus,
${ROOT} textarea${WHERE_NOT_OUR_CONTROL}:focus,
${ROOT} select${WHERE_NOT_OUR_CONTROL}:focus {
  background: ${v.surface};
  outline: 2px solid ${v.accent};
  outline-offset: 1px;
  border-color: ${v.accent};
}

/* —— awesomplete —— */
/* Site hides closed lists with opacity/scale + display:block; do not undo that. */
${ROOT} .awesomplete > ul[hidden],
${ROOT} .awesomplete > ul:empty {
  display: none !important;
  pointer-events: none;
}

${ROOT} .awesomplete > ul:not([hidden]):not(:empty) {
  background: ${v.surface};
  background-image: none;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  box-shadow: ${v.shadow2};
  margin: 0.35em 0 0;
  padding: 4px 0;
  text-shadow: none;
  transform: none;
}

${ROOT} .awesomplete > ul:before {
  display: none;
  content: none;
}

${ROOT} .awesomplete > ul > li {
  padding: 6px 10px;
  color: ${v.text};
  cursor: pointer;
}

${ROOT} .awesomplete > ul > li:hover,
${ROOT} .awesomplete > ul > li[aria-selected="true"] {
  background: ${v.accentSoft};
  color: ${v.accent};
}

${ROOT} .awesomplete mark {
  background: ${v.accentSoft};
  color: ${v.text};
}

${ROOT} div.auto_complete {
  background: ${v.surface};
}

${ROOT} div.auto_complete ul {
  border-color: ${v.border};
  background: ${v.surface};
}

${ROOT} div.auto_complete ul li.selected {
  background-color: ${v.accentSoft};
}

${ROOT} div.auto_complete ul strong.highlight {
  color: ${v.accent};
}

/* —— grid / thumbs (cell size unchanged) —— */
${ROOT} div.image-list {
  column-gap: ${String(IMAGE_LIST_GAP_PX)}px;
  row-gap: ${String(IMAGE_LIST_GAP_PX)}px;
  align-items: flex-start;
  align-content: flex-start;
}

${ROOT} img.preview,
${ROOT} span.thumb > a > img {
  border-radius: ${v.radiusL};
}

/* Favorites: Remove stays subtle; hover must not paint the thumb cell */
${ROOT} span.thumb,
${ROOT} span.thumb:hover,
${ROOT} span.thumb > a,
${ROOT} span.thumb > a:hover {
  background-color: transparent;
}

${ROOT} span.thumb > a[onclick] {
  color: ${v.muted};
  font-size: 12px;
  font-weight: normal;
  padding: 2px 8px;
  border-radius: ${v.radiusS};
  background: transparent;
  border: none;
}

${ROOT} span.thumb > a[onclick]:hover {
  color: ${v.danger};
  background: transparent;
}

${ROOT} span.thumb > a[onclick] b {
  font-weight: normal;
  color: inherit;
}

/* —— favorites bulk select (F HANDOFF; tokens for Light/Dark/Site) —— */
${ROOT} body.${FAV_BULK_SELECTING_BODY_CLASS} span.thumb {
  position: relative;
  cursor: pointer;
}

${ROOT} span.thumb.${FAV_BULK_SELECTED_CLASS} {
  outline: ${FAV_BULK_OUTLINE_WIDTH} solid ${v.accent};
  outline-offset: ${FAV_BULK_OUTLINE_OFFSET};
  border-radius: ${v.radiusL};
}

/*
 * Check badge is a sibling of a#p{ID}, never inside the link.
 * Hidden until the thumb is selected.
 */
${ROOT} span.thumb > .${FAV_BULK_CHECK_CLASS} {
  position: absolute;
  top: ${FAV_BULK_CHECK_INSET};
  left: ${FAV_BULK_CHECK_INSET};
  z-index: ${String(FAV_BULK_CHECK_Z_INDEX)};
  display: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${FAV_BULK_CHECK_SIZE};
  height: ${FAV_BULK_CHECK_SIZE};
  border-radius: 50%;
  background: ${v.accent};
  color: ${v.surface};
  font-size: ${FAV_BULK_CHECK_FONT_SIZE};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}

${ROOT} span.thumb.${FAV_BULK_SELECTED_CLASS} > .${FAV_BULK_CHECK_CLASS} {
  display: inline-flex;
}

${ROOT} #${FAV_BULK_ROOT_ID},
${ROOT} .${FAV_BULK_BAR_CLASS} {
  color: ${v.text};
}

${ROOT} #${FAV_BULK_ROOT_ID} .${FAV_BULK_STATUS_CLASS} {
  color: ${v.muted};
}

${ROOT} .${VIDEO_THUMB_CLASS} > a > img,
${ROOT} .webm-thumb {
  border: 1px solid ${v.accent};
  box-sizing: border-box;
}

${ROOT} img.flagged,
${ROOT} img.has-children,
${ROOT} img.has-parent,
${ROOT} img.pending,
${ROOT} img.video {
  border-width: 1px;
  border-style: solid;
  box-sizing: border-box;
}

${ROOT} img.flagged {
  border-color: ${v.danger};
}

${ROOT} img.has-children {
  border-color: ${v.tagCharacter};
}

${ROOT} img.has-parent {
  border-color: ${v.tagMetadata};
}

${ROOT} img.pending,
${ROOT} img.video {
  border-color: ${v.accent};
}

/* —— pagination —— */
${ROOT} div#paginator,
${ROOT} .pagination {
  display: block;
  padding: 1.5em 0 1em;
  text-align: center;
  clear: both;
}

${ROOT} div#paginator a,
${ROOT} .pagination a {
  display: inline-block;
  margin: 0 3px;
  padding: 4px 10px;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusM};
  background: ${v.surface};
  color: ${v.text};
  text-decoration: none;
}

${ROOT} div#paginator a:hover,
${ROOT} .pagination a:hover {
  background: ${v.accentSoft};
  color: ${v.accent};
  border-color: ${v.accent};
}

${ROOT} div#paginator a.current,
${ROOT} div#paginator span.current,
${ROOT} .pagination a.current,
${ROOT} .pagination span.current {
  background: ${v.accent};
  border-color: ${v.accent};
  color: ${v.surface};
  font-weight: 600;
}

${ROOT} div#paginator span {
  margin: 0 3px;
  padding: 4px 8px;
}

${ROOT} .manual-page-chooser > input[type="text"] {
  width: 4em;
  height: 28px;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  background: ${v.surface};
  color: ${v.text};
  padding: 0 6px;
}

${ROOT} .manual-page-chooser > input[type="submit"] {
  height: 28px;
  margin-left: 4px;
  padding: 0 10px;
  border: none;
  border-radius: ${v.radiusS};
  background: ${v.accent};
  color: ${v.surface};
  font-weight: 600;
  cursor: pointer;
}

/* —— forms / tables (site chrome; skip search-tools + any .rdw-* control) —— */
${ROOT} input${WHERE_NOT_OUR_CONTROL},
${ROOT} select${WHERE_NOT_OUR_CONTROL},
${ROOT} textarea${WHERE_NOT_OUR_CONTROL},
${ROOT} button${WHERE_NOT_OUR_CONTROL} {
  color: ${v.text};
  font-family: ${v.font};
}

${ROOT} input[type="text"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="password"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="search"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="number"]${WHERE_NOT_OUR_CONTROL},
${ROOT} select${WHERE_NOT_OUR_CONTROL},
${ROOT} textarea${WHERE_NOT_OUR_CONTROL} {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  color: ${v.text};
}

${ROOT} button${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="submit"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="button"]${WHERE_NOT_OUR_CONTROL},
${ROOT} .gdprbutton button {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  color: ${v.text};
  padding: 4px 10px;
  cursor: pointer;
}

${ROOT} button${WHERE_NOT_OUR_CONTROL}:hover,
${ROOT} input[type="submit"]${WHERE_NOT_OUR_CONTROL}:hover,
${ROOT} input[type="button"]${WHERE_NOT_OUR_CONTROL}:hover,
${ROOT} .gdprbutton button:hover {
  background: ${v.accentSoft};
  border-color: ${v.accent};
  color: ${v.accent};
}

/* Keep search submit as primary accent (overrides generic button chrome) */
${ROOT} div.tag-search input[type="submit"],
${ROOT} div.tag-search button[type="submit"],
${ROOT} .manual-page-chooser > input[type="submit"] {
  background: ${v.accent};
  border: none;
  color: ${v.surface};
  font-weight: 600;
}

${ROOT} div.tag-search input[type="submit"]:hover,
${ROOT} div.tag-search button[type="submit"]:hover,
${ROOT} .manual-page-chooser > input[type="submit"]:hover {
  background: ${v.accent};
  border: none;
  color: ${v.surface};
  filter: brightness(1.05);
}

${ROOT} table {
  color: ${v.text};
}

${ROOT} tr.tableheader,
${ROOT} thead tr {
  background: ${v.surface2} !important;
  background-image: none !important;
  color: ${v.text};
}

${ROOT} table.highlightable th {
  color: ${v.text};
  background: ${v.surface2};
}

${ROOT} table.highlightable td {
  border-color: ${v.border};
}

${ROOT} table.highlightable > tbody > tr:hover {
  background: ${v.accentSoft};
}

${ROOT} table tr.good {
  background: ${v.accentSoft};
}

${ROOT} table tr.selected {
  background: ${v.accentSoft} !important;
}

${ROOT} table tr.highlight {
  background: ${v.surface2};
}

${ROOT} table tr.pending-tag {
  background: ${v.surface2};
}

/* Zebra without native green tint */
${ROOT} table tr:nth-child(odd) {
  background: ${v.surface2};
}

/* —— data tables: one frame for every list (aliases, artists, tags, pools, forum) —— */
${ROOT} table.highlightable {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
}

/*
 * Favorites: "Remove" sits beside the thumb, not inside it
 * (div.image-list > span > [span.thumb, br, a > b]). Quiet, not bold.
 */
${ROOT_FAVORITES} div.image-list > span > a[onclick] {
  color: ${v.muted};
  font-size: 12px;
}

${ROOT_FAVORITES} div.image-list > span > a[onclick] > b {
  font-weight: normal;
}

${ROOT_FAVORITES} div.image-list > span > a[onclick]:hover {
  color: ${v.danger};
}

/*
 * Favorites: the grid is the site's own, the same as on Posts: a square cell
 * with the picture in its middle. Only the row the site keeps under each thumb
 * for "Remove" goes away (below), so the rows sit as close as on Posts.
 */

/*
 * A favorites cell whose post was removed leaves no hole in its column.
 * The :not(.thumb) part matters: on a search page the thumbs themselves are the
 * direct children of the list, and they must never match.
 */
${ROOT_FAVORITES} div.image-list > span:not(.thumb):not(:has(span.thumb)) {
  /* The cell carries an inline display: grid. */
  display: none !important;
}

${ROOT_FAVORITES} div.image-list > span > span.thumb {
  position: relative;
}

/*
 * Favorites: "Remove" is a small bin button in the top right corner of the
 * picture, where Posts has the favorite star, and shows while the pointer is
 * over the post. The link stays where the site put it in the page; it is only
 * positioned against the image, and its text is kept for screen readers. The
 * row the site kept for it under the thumb goes away. Hidden while posts are
 * being selected.
 */
@supports (anchor-name: --a) {
  ${ROOT_FAVORITES} div.image-list > span:has(> a[onclick]) {
    anchor-scope: ${FAV_REMOVE_ANCHOR_NAME};
    grid-template-rows: auto !important;
  }

  ${ROOT_FAVORITES} div.image-list > span:has(> a[onclick]) > br {
    display: none;
  }

  ${ROOT_FAVORITES} div.image-list > span > span.thumb > a > img {
    anchor-name: ${THUMB_ANCHOR_NAME}, ${FAV_REMOVE_ANCHOR_NAME};
  }

  ${ROOT_FAVORITES} div.image-list > span > a[onclick] {
    position: absolute;
    position-anchor: ${FAV_REMOVE_ANCHOR_NAME};
    top: calc(anchor(top) + ${String(FAV_REMOVE_INSET_PX)}px);
    right: calc(anchor(right) + ${String(FAV_REMOVE_INSET_PX)}px);
    z-index: ${String(FAV_REMOVE_Z_INDEX)};
    box-sizing: border-box;
    display: grid;
    place-items: center;
    width: ${String(FAV_REMOVE_SIZE_PX)}px;
    height: ${String(FAV_REMOVE_SIZE_PX)}px;
    padding: 0;
    border: 1px solid rgba(0, 0, 0, 0.13);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.93);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    font-size: 0;
    line-height: 0;
    text-decoration: none;
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  ${ROOT_FAVORITES} div.image-list > span > a[onclick]::before {
    content: "";
    width: ${String(FAV_REMOVE_ICON_PX)}px;
    height: ${String(FAV_REMOVE_ICON_PX)}px;
    background: rgb(28, 34, 40);
    -webkit-mask: ${FAV_REMOVE_ICON_MASK};
    mask: ${FAV_REMOVE_ICON_MASK};
  }

  ${ROOT_FAVORITES} div.image-list > span > a[onclick]:hover::before {
    background: ${v.danger};
  }

  ${ROOT_FAVORITES} div.image-list > span:hover > a[onclick] {
    opacity: 0.65;
  }

  ${ROOT_FAVORITES} div.image-list > span > a[onclick]:hover,
  ${ROOT_FAVORITES} div.image-list > span > a[onclick]:focus-visible {
    opacity: 1;
  }

  ${ROOT_FAVORITES} body.${FAV_BULK_SELECTING_BODY_CLASS} div.image-list > span > a[onclick] {
    display: none;
  }
}

/*
 * Comments and forum posts: the site gives the text columns fixed widths
 * (50em and 30em) and leaves half the window empty. They take the width that
 * is there, up to a readable limit.
 */
${ROOT} div#comments div#comment-list > div.post {
  float: none;
  display: flex;
  gap: 16px;
  max-width: ${String(COMMENT_MAX_WIDTH_PX)}px;
}

${ROOT} div#comments div#comment-list > div.post > div.col1 {
  float: none;
  flex: 0 0 auto;
}

${ROOT} div#comments div#comment-list > div.post > div.col2 {
  float: none;
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}

${ROOT} div.response-list > div.post {
  display: flex;
  max-width: ${String(COMMENT_MAX_WIDTH_PX)}px;
}

${ROOT} div.response-list > div.post > div.author {
  float: none;
  flex: 0 0 auto;
}

${ROOT} div.response-list > div.post > div.content {
  float: none;
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}

/*
 * Wiki → Create: the intro and the form labels carry an inline dark grey at
 * 11px, unreadable on a dark page. Inline styles need !important.
 */
${ROOT} div.content > div[style*="width: 100%"] > div[style*="font-size: 11px"],
${ROOT} div.content > div[style*="width: 100%"] center > div[style*="font-size: 11px"] {
  color: ${v.muted} !important;
  font-size: 12px !important;
}

${ROOT} div.content > div[style*="width: 100%"] > div[style*="font-size: 11px"] > h3 {
  color: ${v.text};
}

/* Aliases: the example line under the intro is pure red inline. */
${ROOT} div#content > div[style^="color:"] {
  color: ${v.muted} !important;
}

/* Artists: the links under the pager (Create, Order by …) are oversized. */
${ROOT} div#content > div#footer {
  font-size: 13px;
}

/*
 * My Account: a bare list of headings (div#user-index > [h4 > a, p]…, then
 * h1 > a "To main post page"). One card, quiet captions, a normal last link.
 */
${ROOT} div#user-index {
  box-sizing: border-box;
  max-width: ${String(ACCOUNT_CARD_MAX_WIDTH_PX)}px;
  padding: 8px 20px 16px;
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
}

${ROOT} div#user-index h4 {
  margin: 14px 0 2px;
  font-size: 15px;
}

${ROOT} div#user-index > p {
  margin: 0;
  color: ${v.muted};
}

${ROOT} div#user-index > h1 {
  margin: 0;
  font-size: 13px;
  font-weight: normal;
}

/* Help: each group (div#static-more > div > ul > [li > h4, li > a]) is a card. */
${ROOT} div#static-more > div {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}

${ROOT} div#static-more > div > ul {
  box-sizing: border-box;
  min-width: ${String(HELP_CARD_MIN_WIDTH_PX)}px;
  margin: 0;
  padding: 12px 20px 14px;
  list-style: none;
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
}

${ROOT} div#static-more > div > ul > li {
  margin: 0;
  padding: 2px 0;
}

${ROOT} div#static-more > div > ul h4 {
  margin: 0 0 4px;
}

/* Forms are not data: no stripes across their rows. */
${ROOT} table.form tr:nth-child(odd),
${ROOT} div#upload-form table tr:nth-child(odd),
${ROOT} div#edit-form table tr:nth-child(odd) {
  background: transparent;
}

${ROOT} table.form th {
  color: ${v.muted};
}

/* —— site form controls: one height, readable padding —— */
${ROOT} input[type="text"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="password"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="search"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="number"]${WHERE_NOT_OUR_CONTROL},
${ROOT} select${WHERE_NOT_OUR_CONTROL} {
  box-sizing: border-box;
  min-height: ${String(SITE_CONTROL_MIN_HEIGHT_PX)}px;
  padding: 4px 8px;
  font-size: 13px;
}

${ROOT} textarea${WHERE_NOT_OUR_CONTROL} {
  box-sizing: border-box;
  padding: 6px 8px;
  font-size: 13px;
}

/* "Choose File": the browser's own button, dressed as a secondary button. */
${ROOT} input[type="file"]${WHERE_NOT_OUR_CONTROL} {
  color: ${v.text};
  font-size: 12px;
}

${ROOT} input[type="file"]${WHERE_NOT_OUR_CONTROL}::file-selector-button {
  margin-right: 8px;
  padding: 4px 10px;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusM};
  background: ${v.surface};
  color: ${v.text};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

${ROOT} input[type="file"]${WHERE_NOT_OUR_CONTROL}::file-selector-button:hover {
  border-color: ${v.accent};
}

/* Forum tables */
${ROOT} div#forum > table {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  box-shadow: ${v.shadow1};
}

${ROOT} div#forum > table th,
${ROOT} div#forum > table td {
  border-color: ${v.border};
  color: ${v.text};
}

${ROOT} div#forum > table th:first-child,
${ROOT} div#forum > table td:first-child {
  text-align: left;
}

${ROOT} div#forum > table tr:nth-child(odd) {
  background: ${v.surface2};
}

${ROOT} div#forum > table tr:nth-child(even) {
  background: ${v.surface};
}

${ROOT} div#forum > table.highlightable > tbody > tr:hover {
  background: ${v.accentSoft};
}

${ROOT} .added-tags {
  color: ${v.tagCharacter};
}

${ROOT} .removed-tags {
  color: ${v.danger};
}

${ROOT} .obsolete-tag-change {
  color: ${v.text};
}

/* —— notices / cards —— */
${ROOT} div.status-notice,
${ROOT} div.notice,
${ROOT} div.has-mail,
${ROOT} div.blocked,
${ROOT} div.quote,
${ROOT} div.help div.code,
${ROOT} div#post-comments div#comment-list > div,
${ROOT} div#comments div#comment-list > div.post > div.col2,
${ROOT} div.response-list > div.post > div.content {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  box-shadow: ${v.shadow1};
}

${ROOT} div.status-notice {
  border-color: ${v.border};
  padding: 1em;
  margin: 1em;
  color: ${v.text};
}

${ROOT} div.notice {
  color: ${v.danger};
  padding: 0.75em 1em;
  margin-bottom: 1em;
}

${ROOT} div.has-mail {
  border-color: ${v.tagCharacter};
  background: ${v.accentSoft};
  padding: 1em;
  margin: 1em;
  color: ${v.text};
}

${ROOT} div.blocked {
  border-color: ${v.danger};
  background: ${v.dangerSoft};
  color: ${v.danger};
  padding: 1em;
  margin: 1em;
}

${ROOT} div.quote {
  border-color: ${v.border};
  background: ${v.surface2};
  background-image: none;
  color: ${v.text};
  padding: 12px;
  margin-top: 10px;
}

${ROOT} div.help div.code {
  border: 1px dashed ${v.border};
  background: ${v.surface2};
  color: ${v.text};
}

${ROOT} div.help h4 {
  color: ${v.tagCharacter};
}

${ROOT} div#post-comments div#comment-list > div,
${ROOT} div#comments div#comment-list > div.post > div.col2 {
  padding: 12px;
  margin-bottom: 1em;
}

${ROOT} div.response-list > div.post > div.content {
  padding: 10px 12px;
}

${ROOT} div.response-list > div.post > div.content > div.footer {
  color: ${v.muted};
  margin-top: 0.75em;
}

/* Edit | Respond (and similar) on comments / forum posts */
${ROOT} div.response-list > div.post > div.content > div.footer a,
${ROOT} ul.flat-list li a {
  color: ${v.muted};
  font-weight: normal;
  padding: 2px 6px;
  border-radius: ${v.radiusS};
}

${ROOT} div.response-list > div.post > div.content > div.footer a:hover,
${ROOT} ul.flat-list li a:hover {
  color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} ul.flat-list li a.forum-update {
  font-style: italic;
  color: ${v.muted};
}

${ROOT} div.link-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

${ROOT} div.link-list li {
  margin: 0 0 4px;
}

${ROOT} div.link-list a {
  display: inline-block;
  padding: 4px 8px;
  border-radius: ${v.radiusS};
  color: ${v.muted};
}

${ROOT} div.link-list a:hover {
  color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} span.author,
${ROOT} span.date {
  color: ${v.muted};
}

${ROOT} span.locked-topic {
  color: ${v.muted};
}

${ROOT} strong.divider {
  color: ${v.muted};
}

${ROOT} div#footer {
  color: ${v.muted};
}

${ROOT} div#footer > .footer-disabled,
${ROOT} div#footer > #label {
  color: ${v.muted};
}

${ROOT} div#user-record > table > tbody > tr.positive-record {
  background: ${v.accentSoft};
}

${ROOT} div#user-record > table > tbody > tr.negative-record {
  background: ${v.dangerSoft};
}

${ROOT} div.mailbody {
  background-color: ${v.surface};
  border-color: ${v.border};
}

${ROOT} div.mail .received {
  color: ${v.tagCharacter};
}

${ROOT} div.mail .sent {
  color: ${v.danger};
}

${ROOT} .gdprinner {
  background-color: ${v.surface};
  border-color: ${v.border};
  color: ${v.text};
}

/* —— post page —— */
/* E: hide native left-column chrome only while body.rdw-post-panel-mounted */
${ROOT} body.${RDW_POST_PANEL_MOUNTED_CLASS} div#stats {
  display: none !important;
}

${ROOT} body.${RDW_POST_PANEL_MOUNTED_CLASS} div.link-list {
  display: none !important;
}

${ROOT} body.${RDW_POST_PANEL_MOUNTED_CLASS} ${POST_PANEL_ICAME_ROW} {
  display: none !important;
}

/*
 * A: comments moved into the panel column — lift site max-width: 680px
 * so #post-comments fills the narrow column.
 */
${ROOT} body.${RDW_POST_PANEL_MOUNTED_CLASS} #${POST_ACTIONS_HOST_ID} #post-comments {
  max-width: none;
}

${ROOT} img#image {
  border-radius: ${v.radiusL};
}

${ROOT} div#post-view > div#right-col > div#edit,
${ROOT} div#edit-box {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  color: ${v.text};
}

${ROOT} div#note-container > div.note-body {
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  border-radius: ${v.radiusS};
}

${ROOT} div#note-container > div.note-body > p.tn,
${ROOT} tn {
  color: ${v.muted};
}

${ROOT} div#note-container > div.note-box {
  border-color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} div#note-container > div.note-box > div.note-corner {
  background: ${v.accent};
}

${ROOT} div#note-container > div.unsaved {
  background: ${v.surface};
  border-color: ${v.danger};
}

${ROOT} div#note-container > div.unsaved > div.note-corner {
  background: ${v.danger};
}

${ROOT} a.original-file-changed#highres {
  color: ${v.accent};
}

${ROOT} div#post-add p#scale {
  color: ${v.muted};
}

${ROOT} h2.wiki-title {
  color: ${v.accent};
}

${ROOT} div.wiki > h2.title {
  color: ${v.accent};
}

${ROOT} div#wiki-show > div#body > div#byline {
  color: ${v.muted};
}

${ROOT} div#wiki-diff del {
  background-color: ${v.dangerSoft};
  color: ${v.danger};
}

${ROOT} div#wiki-diff ins {
  background-color: ${v.accentSoft};
  color: ${v.text};
}

${ROOT} dt.bad {
  color: ${v.danger};
}

${ROOT} .blacklisted-tags-disabled {
  color: ${v.muted} !important;
}

/* —— dark theme contrast (tokens already dark; keep chrome readable) —— */
${ROOT_DARK} a:hover,
${ROOT_DARK} a:active {
  color: ${v.text};
}

${ROOT_DARK} a.spoiler,
${ROOT_DARK} span.spoiler {
  color: ${v.bg};
  background: ${v.text};
}

${ROOT_DARK} a.spoiler:hover,
${ROOT_DARK} span.spoiler:hover {
  color: ${v.text};
  background: ${v.muted};
}

${ROOT_DARK} div#paginator a.current,
${ROOT_DARK} div#paginator span.current,
${ROOT_DARK} .pagination a.current,
${ROOT_DARK} .pagination span.current,
${ROOT_DARK} div.tag-search input[type="submit"],
${ROOT_DARK} div.tag-search button[type="submit"],
${ROOT_DARK} .manual-page-chooser > input[type="submit"],
${ROOT_DARK} span.thumb > .${FAV_BULK_CHECK_CLASS},
${ROOT_DARK} #${POST_ACTIONS_HOST_ID} .${POST_PANEL_FAV_CLASS}.${KIT_BTN_PRIMARY_CLASS} {
  color: ${v.text};
}

${ROOT_DARK} div.has-mail {
  background: ${v.surface2};
  border-color: ${v.tagCharacter};
}

/*
 * Post panel actions + tabs (A→E HANDOFF).
 * Unscoped under #rdw-post-actions so Site default/Site dark (no html.rdw-skin)
 * still beat native button/link chrome via document --rdw-* tokens.
 */
#${POST_ACTIONS_HOST_ID} .${POST_PANEL_ACTIONS_CLASS},
#${POST_ACTIONS_HOST_ID} .${POST_PANEL_ACTIONS_ROW_CLASS},
#${POST_ACTIONS_HOST_ID} .${POST_PANEL_TABPANEL_CLASS} {
  color: ${v.text};
}

#${POST_ACTIONS_HOST_ID} .${POST_PANEL_FAV_CLASS}.${KIT_BTN_PRIMARY_CLASS} {
  background: ${v.accent};
  border-color: ${v.accent};
  color: ${v.surface};
}

#${POST_ACTIONS_HOST_ID} .${POST_PANEL_ORIGINAL_CLASS} {
  box-sizing: border-box;
  width: ${String(POST_PANEL_ORIGINAL_SIZE_PX)}px;
  height: ${String(POST_PANEL_ORIGINAL_SIZE_PX)}px;
  min-width: ${String(POST_PANEL_ORIGINAL_SIZE_PX)}px;
  min-height: ${String(POST_PANEL_ORIGINAL_SIZE_PX)}px;
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  text-decoration: none;
}

#${POST_ACTIONS_HOST_ID} .${KIT_TABS_CLASS} {
  border-bottom: 1px solid ${v.border};
  color: ${v.text};
}

#${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS} {
  background: transparent;
  border: 0;
  border-bottom: ${String(POST_PANEL_TAB_UNDERLINE_PX)}px solid transparent;
  color: ${v.muted};
}

#${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS}[aria-selected="true"] {
  color: ${v.text};
  font-weight: 600;
  border-bottom-color: ${v.accent};
}

#${POST_ACTIONS_HOST_ID} .${POST_PANEL_POST_ACTION_CLASS} {
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  justify-content: flex-start;
}

/* Site themes: muted fails AA on green/dark chrome — tabs use text; keep accent underline. */
${ROOT_SITE} #${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS},
${ROOT_SITE_DARK} #${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS} {
  color: ${v.text};
}

${ROOT_SITE} #${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS}[aria-selected="true"],
${ROOT_SITE_DARK} #${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS}[aria-selected="true"] {
  border-bottom-color: ${v.accent};
  color: ${v.text};
}

/* Dark RuleDesk: primary fill uses light label (surface token is dark). */
${ROOT_THEME_DARK} #${POST_ACTIONS_HOST_ID} .${POST_PANEL_FAV_CLASS}.${KIT_BTN_PRIMARY_CLASS} {
  color: ${v.text};
}

/*
 * Own scrollable UI — tokens for all four themes (site/site-dark have no html.rdw-skin).
 * Fixes white post-column scrollbar on dark. Kit lists/dialogs + playlist menu.
 */
#${POST_ACTIONS_HOST_ID},
.${KIT_SELECT_LIST_CLASS},
.${KIT_AC_LIST_CLASS},
.${KIT_DIALOG_CLASS},
.${PLAYLIST_MENU_CLASS} {
  scrollbar-width: ${SCROLLBAR_WIDTH};
  scrollbar-color: ${v.border} ${v.surface};
}

/* Site autocomplete lists under rdw-skin */
${ROOT} .awesomplete > ul:not([hidden]):not(:empty),
${ROOT} div.auto_complete ul {
  scrollbar-width: ${SCROLLBAR_WIDTH};
  scrollbar-color: ${v.border} ${v.surface};
}

/*
 * Script page host sits on site bg for Site default / Site dark (no html.rdw-skin).
 * Color uses document tokens; Shadow title inherits from the host once tokens sync.
 */
#${RDW_PAGE_ROOT_ID} {
  color: ${v.text};
}
`.trim();

/** Returns the site-skin CSS string for injection. */
export function getSiteSkinCss(): string {
  return SITE_SKIN_CSS;
}
