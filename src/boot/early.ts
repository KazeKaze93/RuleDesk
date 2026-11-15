import {
  applyAppearanceToDocument,
  ensureStyleElement,
} from "./appearance-dom";
import { peekAppearanceForPaint } from "./cheap-appearance";
import {
  RDW_OWN_PAGE_CLASS,
  RDW_OWN_PAGE_STYLE_ID,
  buildOwnPageCss,
  parseRdwHash,
} from "../pages/constants";
import { FAVORITES_PAGE_CLASS } from "../features/types";
import { detectPageKind } from "../site/pages";
import { getSiteSkinCss } from "../skin/site-skin";
import {
  scheduleSiteDesktopStylesheet,
  writeSiteThemeCookie,
  type SiteTheme,
} from "../site/theme";
import { APPEARANCE_THEME_SITE_DARK } from "../config/constants";
import type { Appearance } from "../storage/schema";

/**
 * Pre-CSS operations on document-start (must stay minimal — A1 counts these):
 * 1. GM_getValue(STORAGE_KEY) via {@link peekAppearanceForPaint}
 * 2. cheap shape parse of settings.appearance (no zod)
 * Then immediately inject theme + skin CSS (base color only, no background image).
 */

function syncSiteCookieAfterCss(appearance: Appearance): void {
  const theme: SiteTheme =
    appearance.theme === APPEARANCE_THEME_SITE_DARK ? "dark" : "light";
  writeSiteThemeCookie(theme);
  scheduleSiteDesktopStylesheet(theme);
}

/**
 * If the URL already has #rdw/…, stamp html.rdw-own-page after CSS inject.
 * Kept here (not in pages/router) so document-start does not import Preact host.
 */
function applyOwnPageClassEarly(): void {
  if (parseRdwHash(window.location.hash) === null) {
    return;
  }
  const root = document.documentElement;
  if (root === null) {
    return;
  }
  const style = ensureStyleElement(RDW_OWN_PAGE_STYLE_ID);
  style.textContent = buildOwnPageCss();
  root.classList.add(RDW_OWN_PAGE_CLASS);
}

/**
 * Runs at userscript document-start, before DOMContentLoaded.
 * Hot path: cheap appearance GM read → inject token + site-skin CSS (no bg image).
 * Cookie sync / rdw-own-page run only after styles are in the DOM.
 */
export function bootEarly(): void {
  const appearance = peekAppearanceForPaint();
  applyAppearanceToDocument({
    appearance,
    siteSkinCss: getSiteSkinCss(),
    omitBackgroundImage: true,
  });
  syncSiteCookieAfterCss(appearance);
  applyOwnPageClassEarly();
  if (detectPageKind(window.location.search) === "favorites") {
    document.documentElement.classList.add(FAVORITES_PAGE_CLASS);
  }
}
