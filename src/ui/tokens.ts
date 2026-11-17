/**
 * Design tokens for RuleDesk Web UI and site skin.
 * Light values match docs/design/mock-components.html.
 */

export const TOKEN_VAR = {
  bg: "--rdw-bg",
  surface: "--rdw-surface",
  surface2: "--rdw-surface-2",
  border: "--rdw-border",
  text: "--rdw-text",
  muted: "--rdw-muted",
  accent: "--rdw-accent",
  accentSoft: "--rdw-accent-soft",
  danger: "--rdw-danger",
  dangerSoft: "--rdw-danger-soft",
  warn: "--rdw-warn",
  warnSoft: "--rdw-warn-soft",
  tagArtist: "--rdw-tag-artist",
  tagCharacter: "--rdw-tag-character",
  tagCopyright: "--rdw-tag-copyright",
  tagMetadata: "--rdw-tag-metadata",
  radiusS: "--rdw-radius-s",
  radiusM: "--rdw-radius-m",
  radiusL: "--rdw-radius-l",
  shadow1: "--rdw-shadow-1",
  shadow2: "--rdw-shadow-2",
  font: "--rdw-font",
  segTrack: "--rdw-seg-track",
  segText: "--rdw-seg-text",
  segOn: "--rdw-seg-on",
  segOnText: "--rdw-seg-on-text",
  backgroundImage: "--rdw-background-image",
  backgroundDim: "--rdw-background-dim",
} as const;

export type TokenVarName = (typeof TOKEN_VAR)[keyof typeof TOKEN_VAR];

export type TokenPalette = {
  readonly bg: string;
  readonly surface: string;
  readonly surface2: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly danger: string;
  readonly dangerSoft: string;
  /** A warning that is not an error: its text, and the plate it stands on. */
  readonly warn: string;
  readonly warnSoft: string;
  readonly tagArtist: string;
  readonly tagCharacter: string;
  readonly tagCopyright: string;
  readonly tagMetadata: string;
  readonly radiusS: string;
  readonly radiusM: string;
  readonly radiusL: string;
  readonly shadow1: string;
  readonly shadow2: string;
  readonly font: string;
  /** A switch of options: its track, the text of an option, the chosen option and its text. */
  readonly segTrack: string;
  readonly segText: string;
  readonly segOn: string;
  readonly segOnText: string;
};

/** Light palette — page bg from mock-site-skin.html (.new); surfaces from mock-components. */
export const LIGHT_PALETTE: TokenPalette = {
  bg: "#f3f5f7",
  surface: "#ffffff",
  surface2: "#f4f6f8",
  border: "#cfd6dd",
  text: "#1c2228",
  muted: "#5a6672",
  accent: "#2f6fed",
  accentSoft: "#e8f0fe",
  danger: "#c0392b",
  dangerSoft: "#fdecea",
  warn: "#6b4e00",
  warnSoft: "#fff4d6",
  tagArtist: "#b00020",
  tagCharacter: "#0a7a2f",
  tagCopyright: "#8e24aa",
  tagMetadata: "#ff8800",
  radiusS: "6px",
  radiusM: "8px",
  radiusL: "10px",
  shadow1: "0 1px 2px rgba(0, 0, 0, 0.06)",
  shadow2: "0 8px 24px rgba(0, 0, 0, 0.25)",
  font: 'system-ui, "Segoe UI", sans-serif',
  segTrack: "#c9d1d9",
  segText: "#4a5560",
  segOn: "#ffffff",
  segOnText: "#1c2228",
};

/** Dark palette for theme=dark / site-dark / custom base. */
export const DARK_PALETTE: TokenPalette = {
  bg: "#16181c",
  surface: "#1e2228",
  surface2: "#262b33",
  border: "#3a424c",
  text: "#e8edf2",
  muted: "#8a96a3",
  accent: "#4c8bf5",
  accentSoft: "#1a2f5a",
  danger: "#e57373",
  dangerSoft: "#3d1f1f",
  warn: "#f0d68a",
  warnSoft: "#3a3016",
  tagArtist: "#ff6b81",
  tagCharacter: "#5dcea0",
  tagCopyright: "#ce93d8",
  tagMetadata: "#ffb74d",
  radiusS: "6px",
  radiusM: "8px",
  radiusL: "10px",
  shadow1: "0 1px 2px rgba(0, 0, 0, 0.35)",
  shadow2: "0 8px 24px rgba(0, 0, 0, 0.55)",
  font: 'system-ui, "Segoe UI", sans-serif',
  segTrack: "transparent",
  segText: "#8a96a3",
  segOn: "#3a424c",
  segOnText: "#e8edf2",
};

export type PaletteMode = "light" | "dark";

/** WCAG relative-luminance midpoint: below → dark base, else light. */
export const CUSTOM_BASE_LUMA_THRESHOLD = 0.5;

const HEX_SHORT_PATTERN = /^#([0-9a-fA-F]{3})$/;
const HEX_LONG_PATTERN = /^#([0-9a-fA-F]{6})$/;
const SRGB_LINEAR_THRESHOLD = 0.03928;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA = 2.4;
const SRGB_A = 0.055;
const SRGB_B = 1.055;
const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

function channelToLinear(channel: number): number {
  const c = channel / 255;
  if (c <= SRGB_LINEAR_THRESHOLD) {
    return c / SRGB_LINEAR_DIVISOR;
  }
  return ((c + SRGB_A) / SRGB_B) ** SRGB_GAMMA;
}

/** Parse #rgb / #rrggbb into 0–255 channels; null if unsupported. */
export function parseHexColor(
  value: string,
): { r: number; g: number; b: number } | null {
  const short = HEX_SHORT_PATTERN.exec(value.trim());
  if (short !== null) {
    const hex = short[1];
    if (hex === undefined) {
      return null;
    }
    return {
      r: Number.parseInt(hex[0]! + hex[0]!, 16),
      g: Number.parseInt(hex[1]! + hex[1]!, 16),
      b: Number.parseInt(hex[2]! + hex[2]!, 16),
    };
  }
  const long = HEX_LONG_PATTERN.exec(value.trim());
  if (long !== null) {
    const hex = long[1];
    if (hex === undefined) {
      return null;
    }
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHexColor(hex);
  if (rgb === null) {
    return null;
  }
  const r = channelToLinear(rgb.r);
  const g = channelToLinear(rgb.g);
  const b = channelToLinear(rgb.b);
  return LUMA_R * r + LUMA_G * g + LUMA_B * b;
}

const CONTRAST_OFFSET = 0.05;

/** WCAG AA normal-text minimum contrast ratio. */
export const CONTRAST_RATIO_TEXT_MIN = 4.5;

/** WCAG UI-component / large-text minimum contrast ratio (e.g. switch track). */
export const CONTRAST_RATIO_UI_MIN = 3;

/**
 * Hex equivalents of `docs/design/site-desktop.css` light `* { --c-* }`.
 * Script-page Site default chrome; keep in sync with skin/theme site palette.
 */
export const SITE_LIGHT_C_BG = "#aae5a4";
export const SITE_LIGHT_C_BG_ALT = "#89cf81";
export const SITE_LIGHT_C_BG_OVERLAY = "#98d491";
export const SITE_LIGHT_C_TEXT = "#000000";
export const SITE_LIGHT_C_TEXT_SOFT = "#666666";
export const SITE_LIGHT_C_LINK = "#000099";
/**
 * The script's own secondary text on the site's light background. The site's
 * own soft text (#666666) is 3.95:1 there; this is 5.82:1.
 */
export const SITE_LIGHT_TEXT_SOFT_AA = "#4d4d4d";

/** Site dark script-page chrome (theme=site-dark). */
export const SITE_DARK_C_BG = "#303a30";
export const SITE_DARK_C_SURFACE2 = "#303030";
export const SITE_DARK_C_BORDER = "#505a50";
export const SITE_DARK_C_TEXT = "#c0c0c0";
export const SITE_DARK_C_MUTED = "#878787";
export const SITE_DARK_C_ACCENT = "#b0e0b0";
/**
 * The script's own secondary text on the site's dark background. The site's
 * own muted text (#878787) is 3.30:1 there; this is 4.98:1.
 */
export const SITE_DARK_TEXT_SOFT_AA = "#a8a8a8";

/**
 * Site default switch ON track: green-family control color (not link blue).
 * Must keep ≥ {@link CONTRAST_RATIO_UI_MIN} vs card bg ({@link SITE_LIGHT_C_BG}).
 */
export const SITE_DEFAULT_SWITCH_ON = "#1a4d1a";

/** Preferred thumb fill on Site default switch ON (page/card green). */
export const SITE_DEFAULT_SWITCH_THUMB_ON = SITE_LIGHT_C_BG;

/** WCAG contrast ratio of two hex colors; null if either is unparseable. */
export function contrastRatio(
  foreground: string,
  background: string,
): number | null {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 === null || l2 === null) {
    return null;
  }
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET);
}

/**
 * Prefer `preferred` when it meets `minRatio` vs `background`; else first
 * candidate that does. Falls back to `preferred` if none pass.
 */
export function pickContrastingHex(
  background: string,
  preferred: string,
  candidates: readonly string[],
  minRatio: number,
): string {
  const preferredRatio = contrastRatio(preferred, background);
  if (preferredRatio !== null && preferredRatio >= minRatio) {
    return preferred;
  }
  for (const candidate of candidates) {
    const ratio = contrastRatio(candidate, background);
    if (ratio !== null && ratio >= minRatio) {
      return candidate;
    }
  }
  return preferred;
}

/** Thumb fill for a switch ON track that meets UI contrast, if possible. */
export function resolveSwitchThumbOn(
  trackOn: string,
  preferredThumb: string,
  fallbacks: readonly string[] = ["#ffffff"],
): string {
  return pickContrastingHex(
    trackOn,
    preferredThumb,
    fallbacks,
    CONTRAST_RATIO_UI_MIN,
  );
}

/** Pick light/dark custom base from a legacy background hex. */
export function customBaseFromLegacyBg(bg: string | undefined): PaletteMode {
  if (bg === undefined) {
    return "light";
  }
  const luma = relativeLuminance(bg);
  if (luma !== null && luma < CUSTOM_BASE_LUMA_THRESHOLD) {
    return "dark";
  }
  return "light";
}

function escapeCssValue(value: string): string {
  return value.replace(/</g, "\\3c ");
}

export function tokensToCssDeclarations(palette: TokenPalette): string {
  return [
    `${TOKEN_VAR.bg}: ${escapeCssValue(palette.bg)};`,
    `${TOKEN_VAR.surface}: ${escapeCssValue(palette.surface)};`,
    `${TOKEN_VAR.surface2}: ${escapeCssValue(palette.surface2)};`,
    `${TOKEN_VAR.border}: ${escapeCssValue(palette.border)};`,
    `${TOKEN_VAR.text}: ${escapeCssValue(palette.text)};`,
    `${TOKEN_VAR.muted}: ${escapeCssValue(palette.muted)};`,
    `${TOKEN_VAR.accent}: ${escapeCssValue(palette.accent)};`,
    `${TOKEN_VAR.accentSoft}: ${escapeCssValue(palette.accentSoft)};`,
    `${TOKEN_VAR.danger}: ${escapeCssValue(palette.danger)};`,
    `${TOKEN_VAR.dangerSoft}: ${escapeCssValue(palette.dangerSoft)};`,
    `${TOKEN_VAR.warn}: ${escapeCssValue(palette.warn)};`,
    `${TOKEN_VAR.warnSoft}: ${escapeCssValue(palette.warnSoft)};`,
    `${TOKEN_VAR.tagArtist}: ${escapeCssValue(palette.tagArtist)};`,
    `${TOKEN_VAR.tagCharacter}: ${escapeCssValue(palette.tagCharacter)};`,
    `${TOKEN_VAR.tagCopyright}: ${escapeCssValue(palette.tagCopyright)};`,
    `${TOKEN_VAR.tagMetadata}: ${escapeCssValue(palette.tagMetadata)};`,
    `${TOKEN_VAR.radiusS}: ${escapeCssValue(palette.radiusS)};`,
    `${TOKEN_VAR.radiusM}: ${escapeCssValue(palette.radiusM)};`,
    `${TOKEN_VAR.radiusL}: ${escapeCssValue(palette.radiusL)};`,
    `${TOKEN_VAR.shadow1}: ${escapeCssValue(palette.shadow1)};`,
    `${TOKEN_VAR.shadow2}: ${escapeCssValue(palette.shadow2)};`,
    `${TOKEN_VAR.font}: ${escapeCssValue(palette.font)};`,
    `${TOKEN_VAR.segTrack}: ${escapeCssValue(palette.segTrack)};`,
    `${TOKEN_VAR.segText}: ${escapeCssValue(palette.segText)};`,
    `${TOKEN_VAR.segOn}: ${escapeCssValue(palette.segOn)};`,
    `${TOKEN_VAR.segOnText}: ${escapeCssValue(palette.segOnText)};`,
  ].join("\n  ");
}

/** CSS text for :root (or a host) with the given palette. */
export function buildTokensCss(palette: TokenPalette, selector = ":root"): string {
  return `${selector} {\n  ${tokensToCssDeclarations(palette)}\n}\n`;
}

/**
 * Apply palette CSS variables on an element (documentElement or Shadow host).
 * Inline properties so Shadow :host { all: initial } still sees the tokens.
 */
export function applyTokenProperties(
  target: HTMLElement,
  palette: TokenPalette,
): void {
  target.style.setProperty(TOKEN_VAR.bg, palette.bg);
  target.style.setProperty(TOKEN_VAR.surface, palette.surface);
  target.style.setProperty(TOKEN_VAR.surface2, palette.surface2);
  target.style.setProperty(TOKEN_VAR.border, palette.border);
  target.style.setProperty(TOKEN_VAR.text, palette.text);
  target.style.setProperty(TOKEN_VAR.muted, palette.muted);
  target.style.setProperty(TOKEN_VAR.accent, palette.accent);
  target.style.setProperty(TOKEN_VAR.accentSoft, palette.accentSoft);
  target.style.setProperty(TOKEN_VAR.danger, palette.danger);
  target.style.setProperty(TOKEN_VAR.dangerSoft, palette.dangerSoft);
  target.style.setProperty(TOKEN_VAR.warn, palette.warn);
  target.style.setProperty(TOKEN_VAR.warnSoft, palette.warnSoft);
  target.style.setProperty(TOKEN_VAR.tagArtist, palette.tagArtist);
  target.style.setProperty(TOKEN_VAR.tagCharacter, palette.tagCharacter);
  target.style.setProperty(TOKEN_VAR.tagCopyright, palette.tagCopyright);
  target.style.setProperty(TOKEN_VAR.tagMetadata, palette.tagMetadata);
  target.style.setProperty(TOKEN_VAR.radiusS, palette.radiusS);
  target.style.setProperty(TOKEN_VAR.radiusM, palette.radiusM);
  target.style.setProperty(TOKEN_VAR.radiusL, palette.radiusL);
  target.style.setProperty(TOKEN_VAR.shadow1, palette.shadow1);
  target.style.setProperty(TOKEN_VAR.shadow2, palette.shadow2);
  target.style.setProperty(TOKEN_VAR.font, palette.font);
  target.style.setProperty(TOKEN_VAR.segTrack, palette.segTrack);
  target.style.setProperty(TOKEN_VAR.segText, palette.segText);
  target.style.setProperty(TOKEN_VAR.segOn, palette.segOn);
  target.style.setProperty(TOKEN_VAR.segOnText, palette.segOnText);
}

export type CustomThemeOverrides = {
  readonly backgroundImage?: string;
  readonly backgroundDim?: number;
};

/**
 * Apply custom overrides via CSS variables (setProperty only — no inline style attrs).
 * Call on document.documentElement (or a shadow host).
 */
export function applyCustomThemeProperties(
  target: HTMLElement,
  custom: CustomThemeOverrides,
): void {
  if (custom.backgroundImage !== undefined && custom.backgroundImage.length > 0) {
    target.style.setProperty(
      TOKEN_VAR.backgroundImage,
      `url("${custom.backgroundImage.replace(/"/g, '\\"')}")`,
    );
  }
  if (custom.backgroundDim !== undefined) {
    target.style.setProperty(
      TOKEN_VAR.backgroundDim,
      String(custom.backgroundDim),
    );
  }
}

export function clearCustomThemeProperties(target: HTMLElement): void {
  // Legacy custom color overrides (removed in 0.11) plus image/dim.
  target.style.removeProperty(TOKEN_VAR.accent);
  target.style.removeProperty(TOKEN_VAR.bg);
  target.style.removeProperty(TOKEN_VAR.surface);
  target.style.removeProperty(TOKEN_VAR.text);
  target.style.removeProperty(TOKEN_VAR.backgroundImage);
  target.style.removeProperty(TOKEN_VAR.backgroundDim);
}
