import {
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  CSS_CLASS,
  RDW_THEME_ATTR,
} from "../config/constants";
import {
  SITE_DARK_C_BG,
  SITE_DARK_C_BORDER,
  SITE_LIGHT_C_BG,
  SITE_LIGHT_C_BG_ALT,
  TOKEN_VAR,
} from "../ui/tokens";
import { PANEL_UI_CLASS } from "./constants";

/** Matches host.tsx page title class (owned there; styled here for site polish). */
const PAGE_TITLE_CLASS = "rdw-page-title";

/** Matches kit SectionLabel class. */
const SECTION_LABEL_CLASS = "rdw-section-label";

/** Kit select list — keep in sync with src/ui/kit/select.tsx. */
const KIT_SELECT_LIST_CLASS = "rdw-select__list";
/** Kit autocomplete list — keep in sync with src/ui/kit/autocomplete-field.tsx. */
const KIT_AC_LIST_CLASS = "rdw-ac__list";
/** Kit dialog panel — keep in sync with src/ui/kit/dialog.tsx. */
const KIT_DIALOG_CLASS = "rdw-dialog";

/** Firefox / modern Chromium thin scrollbar (E HANDOFF). */
const SCROLLBAR_WIDTH = "thin";

/** Kit tabs — keep in sync with src/ui/kit/tabs.tsx (A→E HANDOFF). */
const KIT_TABS_CLASS = "rdw-tabs";
const KIT_TAB_CLASS = "rdw-tabs__tab";
/** Active tab underline width — keep in sync with kit/tabs.tsx. */
const TAB_UNDERLINE_PX = 2;

/** A description under a setting: large enough to read at a glance. */
const SETTINGS_CAPTION_FONT_PX = 12;
/** A list in a settings row; the same width as the lists of Appearance. */
export const SETTINGS_SELECT_WIDTH_PX = 160;
/** A number in a settings row: room for four digits. */
export const SETTINGS_NUMBER_WIDTH_PX = 80;

const SITE_THEME_SELECTOR =`[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
const SITE_DARK_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;

/**
 * Shared layout CSS for own-page section content (lists, settings rows, artists).
 * Injected once from the page host shadow root.
 */
export const PAGE_CONTENT_CSS = `
/* One ring for the keyboard's focus on the own pages too: the cover of a post
   in a collection, a link, a button without a ring of its own. Inside
   ":where", so that a control with its own way of showing focus keeps it. */
:where(a, button, summary, [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
.${PANEL_UI_CLASS.pageCard} {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}
.${PANEL_UI_CLASS.scrollRegion} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* Shadow-DOM scrollables — tokens (site-skin cannot pierce :host). */
.${PANEL_UI_CLASS.scrollRegion},
.${KIT_SELECT_LIST_CLASS},
.${KIT_AC_LIST_CLASS},
.${KIT_DIALOG_CLASS} {
  scrollbar-width: ${SCROLLBAR_WIDTH};
  scrollbar-color: var(${TOKEN_VAR.border}) var(${TOKEN_VAR.surface});
}
/* Kit tabs in page shadow — tokens for all themes; Site muted→text. */
.${KIT_TABS_CLASS} {
  border-bottom: 1px solid var(${TOKEN_VAR.border});
  color: var(${TOKEN_VAR.text});
}
.${KIT_TAB_CLASS} {
  background: transparent;
  border: 0;
  border-bottom: ${String(TAB_UNDERLINE_PX)}px solid transparent;
  color: var(${TOKEN_VAR.muted});
}
.${KIT_TAB_CLASS}[aria-selected="true"] {
  color: var(${TOKEN_VAR.text});
  font-weight: 600;
  border-bottom-color: var(${TOKEN_VAR.accent});
}
:host-context(${SITE_THEME_SELECTOR}) .${KIT_TAB_CLASS},
:host-context(${SITE_DARK_THEME_SELECTOR}) .${KIT_TAB_CLASS} {
  color: var(${TOKEN_VAR.text});
}
:host-context(${SITE_THEME_SELECTOR}) .${KIT_TAB_CLASS}[aria-selected="true"],
:host-context(${SITE_DARK_THEME_SELECTOR}) .${KIT_TAB_CLASS}[aria-selected="true"] {
  border-bottom-color: var(${TOKEN_VAR.accent});
  color: var(${TOKEN_VAR.text});
}
.${CSS_CLASS.section} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${PANEL_UI_CLASS.settingsGroup} {
  display: grid;
  gap: 2px;
}
.${PANEL_UI_CLASS.settingsRow} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--rdw-radius-m);
  font-size: 12.5px;
  color: var(--rdw-text);
}
/* A line between settings, so that a switch reads with its own name. */
.${PANEL_UI_CLASS.settingsRow} + .${PANEL_UI_CLASS.settingsRow} {
  border-top: 1px solid var(--rdw-border);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
/* The switches of the features are a group of their own inside the list:
   the line is also drawn where that group begins and where it ends. */
.${PANEL_UI_CLASS.settingsRow} + .${PANEL_UI_CLASS.settingsGroup},
.${PANEL_UI_CLASS.settingsGroup} + .${PANEL_UI_CLASS.settingsRow} {
  border-top: 1px solid var(--rdw-border);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
/* The options of a setting are part of it: no line between the two. */
.${PANEL_UI_CLASS.settingsRow} + .${PANEL_UI_CLASS.settingsRow}.${PANEL_UI_CLASS.settingsRowSub} {
  border-top: 0;
  padding-top: 0;
}
.${PANEL_UI_CLASS.settingsCaption} {
  flex: 1 0 100%;
  margin: 0;
  font-size: ${String(SETTINGS_CAPTION_FONT_PX)}px;
  line-height: 1.4;
  color: var(--rdw-muted);
}
/* Muted fails AA on the site's own themes (see the section label below). */
:host-context(${SITE_THEME_SELECTOR}) .${PANEL_UI_CLASS.settingsCaption},
:host-context(${SITE_DARK_THEME_SELECTOR}) .${PANEL_UI_CLASS.settingsCaption} {
  color: var(--rdw-text);
}
/*
 * Card vs page: surface not darker than page; Site default card = --c-bg,
 * border = --c-bg-alt. Higher specificity than kit .rdw-card so it wins.
 */
:host-context(${SITE_THEME_SELECTOR}) .rdw-card.${PANEL_UI_CLASS.pageCard} {
  background: ${SITE_LIGHT_C_BG};
  border-color: ${SITE_LIGHT_C_BG_ALT};
}
:host-context(${SITE_DARK_THEME_SELECTOR}) .rdw-card.${PANEL_UI_CLASS.pageCard} {
  background: ${SITE_DARK_C_BG};
  border-color: ${SITE_DARK_C_BORDER};
}
.${PAGE_TITLE_CLASS} {
  color: var(--rdw-text);
}
.${SECTION_LABEL_CLASS} {
  color: var(--rdw-muted);
}
/* Muted fails AA on site greens / site-dark chrome — use text. */
:host-context(${SITE_THEME_SELECTOR}) .${PAGE_TITLE_CLASS},
:host-context(${SITE_DARK_THEME_SELECTOR}) .${PAGE_TITLE_CLASS},
:host-context(${SITE_THEME_SELECTOR}) .${SECTION_LABEL_CLASS},
:host-context(${SITE_DARK_THEME_SELECTOR}) .${SECTION_LABEL_CLASS} {
  color: var(--rdw-text);
}
.${PANEL_UI_CLASS.settingsRow} .rdw-switch-row {
  width: 100%;
  justify-content: space-between;
  flex-direction: row-reverse;
}
/* A list and a number read as a switch does: the name on the left, the
   control on the right, as wide as what it holds. */
.${PANEL_UI_CLASS.settingsRow} .rdw-select,
.${PANEL_UI_CLASS.settingsRow} .rdw-num {
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
/* The name of a setting is not a heading: no capitals, the text of a row. */
.${PANEL_UI_CLASS.settingsRow} .rdw-select__label,
.${PANEL_UI_CLASS.settingsRow} .rdw-num__label {
  font: 400 12.5px var(--rdw-font);
  letter-spacing: 0;
  text-transform: none;
  color: var(--rdw-text);
}
.${PANEL_UI_CLASS.settingsRow} .rdw-select__trigger {
  flex: none;
  width: ${String(SETTINGS_SELECT_WIDTH_PX)}px;
}
/* The open list keeps under its trigger, not under the whole row. */
.${PANEL_UI_CLASS.settingsRow} .${KIT_SELECT_LIST_CLASS} {
  left: auto;
  width: ${String(SETTINGS_SELECT_WIDTH_PX)}px;
  box-sizing: border-box;
}
.${PANEL_UI_CLASS.settingsRow} .rdw-num__input {
  flex: none;
  width: ${String(SETTINGS_NUMBER_WIDTH_PX)}px;
}
.${CSS_CLASS.list} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.${CSS_CLASS.listItem} {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
}
.${CSS_CLASS.itemName} {
  border: 0;
  background: transparent;
  color: var(--rdw-accent);
  text-align: left;
  cursor: pointer;
  padding: 0;
  font: inherit;
  font-weight: 600;
  word-break: break-word;
}
.${CSS_CLASS.itemName}:disabled {
  color: var(--rdw-muted);
  cursor: not-allowed;
}
.${CSS_CLASS.itemActions},
.${CSS_CLASS.formActions},
.${CSS_CLASS.toolbar},
.${CSS_CLASS.confirmRow} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.${CSS_CLASS.form} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${CSS_CLASS.hint} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${CSS_CLASS.error} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
`.trim();
