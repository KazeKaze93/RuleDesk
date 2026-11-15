import {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
  SITE_SKIN_STYLE_ID,
  TOKEN_STYLE_ID,
} from "../config/constants";
import { RDW_PAGE_ROOT_ID } from "../pages/constants";
import { resolveAppearancePalette } from "../skin/theme";
import type { Appearance, AppearanceTheme } from "../storage/schema";
import {
  applyCustomThemeProperties,
  applyTokenProperties,
  buildTokensCss,
  clearCustomThemeProperties,
  type TokenPalette,
} from "../ui/tokens";

/**
 * Whether RuleDesk site-skin class is active.
 * site / site-dark keep native page chrome; light / dark / custom enable rdw-skin.
 */
export function themeEnablesSkin(theme: AppearanceTheme): boolean {
  return (
    theme === APPEARANCE_THEME_LIGHT ||
    theme === APPEARANCE_THEME_DARK ||
    theme === APPEARANCE_THEME_CUSTOM
  );
}

/**
 * Ensures a <style id=...> exists under documentElement (works before <head>).
 * Safe at document-start. B1/B2 should reuse these helpers.
 */
export function ensureStyleElement(id: string): HTMLStyleElement {
  const existing = document.getElementById(id);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }
  if (existing !== null) {
    existing.remove();
  }
  const style = document.createElement("style");
  style.id = id;
  const parent = document.head ?? document.documentElement;
  parent.append(style);
  return style;
}

/** Inject or replace the design-token stylesheet. */
export function injectTokenStyles(palette: TokenPalette): HTMLStyleElement {
  const style = ensureStyleElement(TOKEN_STYLE_ID);
  style.textContent = buildTokensCss(palette, ":root");
  return style;
}

/**
 * Copy the same palette onto #rdw-page-root when present.
 * Shadow DOM uses :host { all: initial }, so document :root tokens do not inherit.
 */
export function syncPageRootTokens(palette: TokenPalette): void {
  const host = document.getElementById(RDW_PAGE_ROOT_ID);
  if (!(host instanceof HTMLElement)) {
    return;
  }
  applyTokenProperties(host, palette);
}

/**
 * Inject or replace the site-skin stylesheet (rules scoped under html.rdw-skin).
 */
export function injectSiteSkinHook(cssText = ""): HTMLStyleElement {
  const style = ensureStyleElement(SITE_SKIN_STYLE_ID);
  style.textContent = cssText;
  return style;
}

export function applyHtmlThemeAttributes(theme: AppearanceTheme): void {
  const root = document.documentElement;
  root.setAttribute(RDW_THEME_ATTR, theme);
  if (themeEnablesSkin(theme)) {
    root.classList.add(RDW_SKIN_CLASS);
  } else {
    root.classList.remove(RDW_SKIN_CLASS);
  }
}

export type ApplyAppearanceOptions = {
  readonly appearance: Appearance;
  /** Data URL from background-store / IDB, if any. Not read on the hot path. */
  readonly backgroundDataUrl?: string;
  /** Site-skin CSS text for #SITE_SKIN_STYLE_ID. */
  readonly siteSkinCss?: string;
  /**
   * When true, skip background-image custom props (pre-paint: base color only).
   * Dim may still apply for custom themes.
   */
  readonly omitBackgroundImage?: boolean;
};

/**
 * Document-start-safe appearance apply:
 * html class/attr + token CSS (+ site-skin) + optional custom props.
 * Palette from {@link resolveAppearancePalette} (site ≠ Light/Dark).
 * Also syncs live #rdw-page-root Shadow host to the same palette.
 */
export function applyAppearanceToDocument(
  options: ApplyAppearanceOptions,
): void {
  const { appearance } = options;
  applyHtmlThemeAttributes(appearance.theme);
  const palette = resolveAppearancePalette(appearance);
  injectTokenStyles(palette);
  syncPageRootTokens(palette);
  injectSiteSkinHook(options.siteSkinCss ?? "");

  const root = document.documentElement;
  clearCustomThemeProperties(root);

  const omitImage = options.omitBackgroundImage === true;
  const backgroundImage = omitImage
    ? undefined
    : options.backgroundDataUrl ?? appearance.custom?.backgroundImage;

  if (appearance.theme === APPEARANCE_THEME_CUSTOM && appearance.custom !== undefined) {
    const overrides =
      backgroundImage !== undefined && backgroundImage.length > 0
        ? {
            backgroundImage,
            ...(appearance.custom.backgroundDim !== undefined
              ? { backgroundDim: appearance.custom.backgroundDim }
              : {}),
          }
        : {
            ...(appearance.custom.backgroundDim !== undefined
              ? { backgroundDim: appearance.custom.backgroundDim }
              : {}),
          };
    applyCustomThemeProperties(root, overrides);
  } else if (
    !omitImage &&
    options.backgroundDataUrl !== undefined &&
    options.backgroundDataUrl.length > 0
  ) {
    applyCustomThemeProperties(root, {
      backgroundImage: options.backgroundDataUrl,
    });
  }
}

export {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
};
