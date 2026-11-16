import {
  applyAppearanceToDocument,
  injectTokenStyles,
  syncPageRootTokens,
  themeEnablesSkin,
} from "../boot/appearance-dom";
import {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  RDW_SKIN_CLASS,
} from "../config/constants";
import { getSiteSkinCss } from "./site-skin";
import { forceLightSiteBase, setSiteTheme } from "../site/theme";
import {
  APPEARANCE_CUSTOM_BASE_DARK,
  APPEARANCE_CUSTOM_BASE_LIGHT,
  type Appearance,
  type AppearanceCustom,
} from "../storage/schema";
import {
  DARK_PALETTE,
  LIGHT_PALETTE,
  parseHexColor,
  relativeLuminance,
  SITE_DARK_C_ACCENT,
  SITE_DARK_C_BG,
  SITE_DARK_C_BORDER,
  SITE_DARK_TEXT_SOFT_AA,
  SITE_DARK_C_SURFACE2,
  SITE_DARK_C_TEXT,
  SITE_LIGHT_C_BG,
  SITE_LIGHT_C_BG_ALT,
  SITE_LIGHT_C_BG_OVERLAY,
  SITE_LIGHT_C_LINK,
  SITE_LIGHT_C_TEXT,
  SITE_LIGHT_TEXT_SOFT_AA,
  TOKEN_VAR,
  type TokenPalette,
} from "../ui/tokens";

/** WCAG AA normal-text minimum contrast ratio. */
export const CONTRAST_RATIO_MIN = 4.5;

export const BACKGROUND_DIM_MIN = 0;
export const BACKGROUND_DIM_MAX = 0.8;
export const DEFAULT_BACKGROUND_DIM = 0;

/** JPEG quality when downscaling a custom background to screen size. */
export const APPEARANCE_BACKGROUND_JPEG_QUALITY = 0.85;

const CONTRAST_OFFSET = 0.05;
const JPEG_MIME = "image/jpeg";

const BODY_BG_IMAGE = "background-image";
const BODY_BG_SIZE = "background-size";
const BODY_BG_POSITION = "background-position";
const BODY_BG_REPEAT = "background-repeat";
const BODY_BG_ATTACHMENT = "background-attachment";

/** Site light tag/link colors (not exported from tokens). */
const SITE_C_LINK_ARTIST = "#cc0000";
const SITE_C_LINK_CHARACTER = "#00aa00";
const SITE_C_LINK_COPYRIGHT = "#aa00aa";
const SITE_C_LINK_METADATA = "#ff8800";

/** Site dark accent-soft / tag colors (not exported from tokens). */
const SITE_DARK_ACCENT_SOFT = SITE_DARK_C_BORDER;
const SITE_DARK_TAG_ARTIST = "#f0a0a0";
const SITE_DARK_TAG_CHARACTER = "#f0f0a0";
const SITE_DARK_TAG_COPYRIGHT = "#f0a0f0";
const SITE_DARK_TAG_METADATA = "#90d9ed";

/** Site default switch of options: a track darker than the page, 1.58:1 under the chosen option. */
const SITE_DEFAULT_SEG_TRACK = "#74bc6b";
/** 5.50:1 on that track. */
const SITE_DEFAULT_SEG_TEXT = "#333333";
/** Site dark: text of the chosen option, 5.76:1 on the border colour it is filled with. */
const SITE_DARK_SEG_ON_TEXT = "#e6e6e6";

/**
 * Script-page / token palette for Appearance theme "Site default".
 * Card surface = --c-bg; border = --c-bg-alt (aligned with page-css host cards).
 * Danger/radius/shadow/font from Light.
 */
export const SITE_DEFAULT_PALETTE: TokenPalette = {
  bg: SITE_LIGHT_C_BG,
  surface: SITE_LIGHT_C_BG,
  surface2: SITE_LIGHT_C_BG_OVERLAY,
  border: SITE_LIGHT_C_BG_ALT,
  text: SITE_LIGHT_C_TEXT,
  muted: SITE_LIGHT_TEXT_SOFT_AA,
  accent: SITE_LIGHT_C_LINK,
  accentSoft: SITE_LIGHT_C_BG_ALT,
  danger: LIGHT_PALETTE.danger,
  dangerSoft: LIGHT_PALETTE.dangerSoft,
  tagArtist: SITE_C_LINK_ARTIST,
  tagCharacter: SITE_C_LINK_CHARACTER,
  tagCopyright: SITE_C_LINK_COPYRIGHT,
  tagMetadata: SITE_C_LINK_METADATA,
  radiusS: LIGHT_PALETTE.radiusS,
  radiusM: LIGHT_PALETTE.radiusM,
  radiusL: LIGHT_PALETTE.radiusL,
  shadow1: LIGHT_PALETTE.shadow1,
  shadow2: LIGHT_PALETTE.shadow2,
  font: LIGHT_PALETTE.font,
  segTrack: SITE_DEFAULT_SEG_TRACK,
  segText: SITE_DEFAULT_SEG_TEXT,
  segOn: SITE_LIGHT_C_BG,
  segOnText: SITE_LIGHT_C_TEXT,
};

/**
 * Script-page / token palette for Appearance theme "Site dark".
 * Surface = page bg (not darker chrome); danger/radius/shadow/font from Dark.
 */
export const SITE_DARK_PALETTE: TokenPalette = {
  bg: SITE_DARK_C_BG,
  surface: SITE_DARK_C_BG,
  surface2: SITE_DARK_C_SURFACE2,
  border: SITE_DARK_C_BORDER,
  text: SITE_DARK_C_TEXT,
  muted: SITE_DARK_TEXT_SOFT_AA,
  accent: SITE_DARK_C_ACCENT,
  accentSoft: SITE_DARK_ACCENT_SOFT,
  danger: DARK_PALETTE.danger,
  dangerSoft: DARK_PALETTE.dangerSoft,
  tagArtist: SITE_DARK_TAG_ARTIST,
  tagCharacter: SITE_DARK_TAG_CHARACTER,
  tagCopyright: SITE_DARK_TAG_COPYRIGHT,
  tagMetadata: SITE_DARK_TAG_METADATA,
  radiusS: DARK_PALETTE.radiusS,
  radiusM: DARK_PALETTE.radiusM,
  radiusL: DARK_PALETTE.radiusL,
  shadow1: DARK_PALETTE.shadow1,
  shadow2: DARK_PALETTE.shadow2,
  font: DARK_PALETTE.font,
  segTrack: "transparent",
  segText: SITE_DARK_TEXT_SOFT_AA,
  segOn: SITE_DARK_C_BORDER,
  segOnText: SITE_DARK_SEG_ON_TEXT,
};

/**
 * Pick text color for a surface: prefer `preferred`, else the first
 * neighboring candidate that meets {@link CONTRAST_RATIO_MIN}.
 */
export function pickContrastingText(
  surface: string,
  preferred: string,
  neighbors: readonly string[],
): { text: string; ratio: number | null; swapped: boolean } {
  const preferredRatio = contrastRatio(preferred, surface);
  if (
    preferredRatio !== null &&
    preferredRatio >= CONTRAST_RATIO_MIN
  ) {
    return { text: preferred, ratio: preferredRatio, swapped: false };
  }
  for (const candidate of neighbors) {
    const ratio = contrastRatio(candidate, surface);
    if (ratio !== null && ratio >= CONTRAST_RATIO_MIN) {
      return { text: candidate, ratio, swapped: true };
    }
  }
  return {
    text: preferred,
    ratio: preferredRatio,
    swapped: false,
  };
}

function finalizeSitePaletteText(palette: TokenPalette): TokenPalette {
  const picked = pickContrastingText(palette.surface, palette.text, [
    palette.bg,
    palette.muted,
    palette.accent,
    LIGHT_PALETTE.text,
    DARK_PALETTE.text,
  ]);
  if (!picked.swapped) {
    return palette;
  }
  return {
    ...palette,
    text: picked.text,
  };
}

/** Site default after contrast gate (text-on-surface). */
export const SITE_DEFAULT_PALETTE_RESOLVED: TokenPalette =
  finalizeSitePaletteText(SITE_DEFAULT_PALETTE);

/** Site dark after contrast gate (text-on-surface). */
export const SITE_DARK_PALETTE_RESOLVED: TokenPalette =
  finalizeSitePaletteText(SITE_DARK_PALETTE);

export type ApplyAppearanceThemeOptions = {
  readonly appearance: Appearance;
  /** Data URL from the dedicated background store, if any. */
  readonly backgroundDataUrl?: string;
  /** Site-skin CSS; defaults to getSiteSkinCss() when omitted. */
  readonly siteSkinCss?: string;
};

export type ApplyAppearanceThemeResult = {
  readonly contrastWarning: boolean;
  readonly contrastRatio: number | null;
};

export function createDefaultCustomTheme(): AppearanceCustom {
  return {
    base: APPEARANCE_CUSTOM_BASE_LIGHT,
    backgroundDim: DEFAULT_BACKGROUND_DIM,
  };
}

export function clampBackgroundDim(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BACKGROUND_DIM;
  }
  return Math.min(BACKGROUND_DIM_MAX, Math.max(BACKGROUND_DIM_MIN, value));
}

export { parseHexColor, relativeLuminance };

/** WCAG contrast ratio of two hex colors; null if either is unparseable. */
export function contrastRatio(foreground: string, background: string): number | null {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 === null || l2 === null) {
    return null;
  }
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET);
}

export function hasInsufficientTextContrast(
  text: string,
  bg: string,
): boolean {
  const ratio = contrastRatio(text, bg);
  if (ratio === null) {
    return false;
  }
  return ratio < CONTRAST_RATIO_MIN;
}

/**
 * Canonical token palette for an Appearance value.
 * Site themes use site chrome colors — not RuleDesk Light/Dark.
 * Callers (boot/host) should use this instead of light/dark-only resolvers.
 */
export function resolveAppearancePalette(appearance: Appearance): TokenPalette {
  const theme = appearance.theme;
  if (theme === APPEARANCE_THEME_SITE_DARK) {
    return SITE_DARK_PALETTE_RESOLVED;
  }
  if (theme === APPEARANCE_THEME_SITE) {
    return SITE_DEFAULT_PALETTE_RESOLVED;
  }
  if (theme === APPEARANCE_THEME_DARK) {
    return DARK_PALETTE;
  }
  if (theme === APPEARANCE_THEME_CUSTOM) {
    return appearance.custom?.base === APPEARANCE_CUSTOM_BASE_DARK
      ? DARK_PALETTE
      : LIGHT_PALETTE;
  }
  return LIGHT_PALETTE;
}

function escapeUrlForCss(url: string): string {
  return url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function clearBodyBackground(): void {
  const body = document.body;
  if (body === null) {
    return;
  }
  body.style.removeProperty(BODY_BG_IMAGE);
  body.style.removeProperty(BODY_BG_SIZE);
  body.style.removeProperty(BODY_BG_POSITION);
  body.style.removeProperty(BODY_BG_REPEAT);
  body.style.removeProperty(BODY_BG_ATTACHMENT);
}

/**
 * Apply custom background image on <body> with a dim overlay (0–0.8).
 * Cleared when image is empty.
 */
export function applyBodyBackgroundImage(
  imageUrl: string | undefined,
  dim: number,
): void {
  const body = document.body;
  if (body === null) {
    return;
  }
  if (imageUrl === undefined || imageUrl.length === 0) {
    clearBodyBackground();
    return;
  }
  const clamped = clampBackgroundDim(dim);
  const escaped = escapeUrlForCss(imageUrl);
  body.style.setProperty(
    BODY_BG_IMAGE,
    `linear-gradient(rgba(0, 0, 0, ${String(clamped)}), rgba(0, 0, 0, ${String(clamped)})), url("${escaped}")`,
  );
  body.style.setProperty(BODY_BG_SIZE, "cover");
  body.style.setProperty(BODY_BG_POSITION, "center");
  body.style.setProperty(BODY_BG_REPEAT, "no-repeat");
  body.style.setProperty(BODY_BG_ATTACHMENT, "fixed");
}

function syncSiteCookieAndStylesheet(appearance: Appearance): void {
  if (appearance.theme === APPEARANCE_THEME_SITE_DARK) {
    setSiteTheme("dark");
    return;
  }
  if (appearance.theme === APPEARANCE_THEME_SITE) {
    // Native site chrome: no theme cookie (light default).
    setSiteTheme("light");
    return;
  }
  // light / dark / custom — predictable light site base under rdw-skin
  forceLightSiteBase();
}

/** CSS pixel screen size × devicePixelRatio (for background hints/resize). */
export function getScreenPixelSize(): { width: number; height: number } {
  const dpr =
    Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;
  return {
    width: Math.round(window.screen.width * dpr),
    height: Math.round(window.screen.height * dpr),
  };
}

/**
 * Fit source inside max box without upscaling. Pure sizing helper (testable).
 */
export function computeDownscaleSize(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    return { width: 0, height: 0 };
  }
  if (sourceWidth <= maxWidth && sourceHeight <= maxHeight) {
    return {
      width: Math.round(sourceWidth),
      height: Math.round(sourceHeight),
    };
  }
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

export type PreparedBackgroundImage = {
  readonly dataUrl: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly outputWidth: number;
  readonly outputHeight: number;
  readonly belowScreen: boolean;
};

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error("Could not decode image"));
    };
    image.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read image file"));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Could not read image file"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Decode file, downscale to screen pixels (never upscale), encode JPEG.
 */
export async function prepareBackgroundImageFile(
  file: File,
): Promise<PreparedBackgroundImage> {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(rawDataUrl);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const screen = getScreenPixelSize();
  const sized = computeDownscaleSize(
    sourceWidth,
    sourceHeight,
    screen.width,
    screen.height,
  );
  const canvas = document.createElement("canvas");
  canvas.width = sized.width;
  canvas.height = sized.height;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Could not prepare background image");
  }
  context.drawImage(image, 0, 0, sized.width, sized.height);
  const dataUrl = canvas.toDataURL(
    JPEG_MIME,
    APPEARANCE_BACKGROUND_JPEG_QUALITY,
  );
  return {
    dataUrl,
    sourceWidth,
    sourceHeight,
    outputWidth: sized.width,
    outputHeight: sized.height,
    belowScreen:
      sourceWidth < screen.width || sourceHeight < screen.height,
  };
}

/**
 * Full theme apply for boot and settings UI:
 * site cookie/stylesheet + html.rdw-skin / tokens / site-skin / custom props + body image.
 * Token palette comes from {@link resolveAppearancePalette} and is written once via
 * injectTokenStyles + syncPageRootTokens (same tick as applyAppearanceToDocument).
 */
export function applyAppearanceTheme(
  options: ApplyAppearanceThemeOptions,
): ApplyAppearanceThemeResult {
  const { appearance } = options;
  syncSiteCookieAndStylesheet(appearance);

  applyAppearanceToDocument({
    appearance,
    siteSkinCss: options.siteSkinCss ?? getSiteSkinCss(),
    ...(options.backgroundDataUrl !== undefined
      ? { backgroundDataUrl: options.backgroundDataUrl }
      : {}),
  });

  // Canonical palette (site ≠ Light/Dark). Same-tick write avoids dual-source lag.
  const palette = resolveAppearancePalette(appearance);
  injectTokenStyles(palette);
  syncPageRootTokens(palette);

  // Defensive: site modes must not keep rdw-skin even if attrs race.
  if (!themeEnablesSkin(appearance.theme)) {
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
  }

  if (
    appearance.theme === APPEARANCE_THEME_CUSTOM &&
    appearance.custom !== undefined
  ) {
    const custom = appearance.custom;
    const imageUrl =
      options.backgroundDataUrl ?? custom.backgroundImage;
    applyBodyBackgroundImage(
      imageUrl,
      custom.backgroundDim ?? DEFAULT_BACKGROUND_DIM,
    );

    if (custom.backgroundDim !== undefined) {
      document.documentElement.style.setProperty(
        TOKEN_VAR.backgroundDim,
        String(clampBackgroundDim(custom.backgroundDim)),
      );
    }
  } else {
    clearBodyBackground();
  }

  const textOnSurface = contrastRatio(palette.text, palette.surface);

  return {
    contrastWarning:
      textOnSurface !== null && textOnSurface < CONTRAST_RATIO_MIN,
    contrastRatio: textOnSurface,
  };
}
