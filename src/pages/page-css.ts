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

const SITE_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
const SITE_DARK_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;

/**
 * Shared layout CSS for own-page section content (lists, settings rows, artists).
 * Injected once from the page host shadow root.
 */
export const PAGE_CONTENT_CSS = `
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
/* The options of a setting are part of it: no line between the two. */
.${PANEL_UI_CLASS.settingsRow} + .${PANEL_UI_CLASS.settingsRow}.${PANEL_UI_CLASS.settingsRowSub} {
  border-top: 0;
  padding-top: 0;
}
.${PANEL_UI_CLASS.settingsCaption} {
  flex: 1 0 100%;
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: var(--rdw-muted);
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
.${PANEL_UI_CLASS.settingsRow} .rdw-select,
.${PANEL_UI_CLASS.settingsRow} .rdw-num {
  width: 100%;
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
