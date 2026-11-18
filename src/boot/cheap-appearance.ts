/**
 * Pre-paint appearance read: one GM_getValue + shape checks only (no zod).
 * Full AppearanceSchema validation stays on the post-paint store path.
 */

import {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  DEFAULT_APPEARANCE_THEME,
  DEFAULT_TWEAKS_ENABLED,
  STORAGE_KEY,
} from "../config/constants";
import type {
  Appearance,
  AppearanceCustom,
  AppearanceTheme,
} from "../storage/schema";

const CUSTOM_BASE_LIGHT = "light" as const;
const CUSTOM_BASE_DARK = "dark" as const;

type GmGetValue = (key: string, defaultValue?: unknown) => unknown;

/** Cached raw STORAGE_KEY payload from the single pre-paint GM read. */
let rawStorageCache: unknown;
let rawStorageRead = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getGmGetValue(): GmGetValue {
  return GM_getValue;
}

/**
 * Single GM read for the pre-paint path. Subsequent calls reuse the cache
 * so layout peek does not hit GM again before first paint.
 */
export function readRawStorageOnce(): unknown {
  if (!rawStorageRead) {
    rawStorageCache = getGmGetValue()(STORAGE_KEY, undefined);
    rawStorageRead = true;
  }
  return rawStorageCache;
}

/** Clears the pre-paint raw cache (tests). */
export function clearRawStorageCache(): void {
  rawStorageCache = undefined;
  rawStorageRead = false;
}

function cheapParseTheme(value: unknown): AppearanceTheme {
  if (value === APPEARANCE_THEME_SITE) {
    return APPEARANCE_THEME_SITE;
  }
  if (value === APPEARANCE_THEME_SITE_DARK) {
    return APPEARANCE_THEME_SITE_DARK;
  }
  if (value === APPEARANCE_THEME_LIGHT) {
    return APPEARANCE_THEME_LIGHT;
  }
  if (value === APPEARANCE_THEME_DARK) {
    return APPEARANCE_THEME_DARK;
  }
  if (value === APPEARANCE_THEME_CUSTOM) {
    return APPEARANCE_THEME_CUSTOM;
  }
  return DEFAULT_APPEARANCE_THEME;
}

function cheapParseCustom(raw: unknown): AppearanceCustom | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const baseRaw = raw.base;
  const base =
    baseRaw === CUSTOM_BASE_DARK || baseRaw === CUSTOM_BASE_LIGHT
      ? baseRaw
      : CUSTOM_BASE_LIGHT;
  const custom: {
    base: typeof CUSTOM_BASE_LIGHT | typeof CUSTOM_BASE_DARK;
    backgroundImage?: string;
    backgroundDim?: number;
  } = { base };
  if (typeof raw.backgroundImage === "string") {
    custom.backgroundImage = raw.backgroundImage;
  }
  if (
    typeof raw.backgroundDim === "number" &&
    Number.isFinite(raw.backgroundDim)
  ) {
    custom.backgroundDim = raw.backgroundDim;
  }
  return custom;
}

/**
 * Cheap appearance extract from a raw GM storage blob (or undefined).
 * Does not validate marks / collections / artists / favs.
 */
export function cheapParseAppearance(raw: unknown): Appearance {
  if (!isRecord(raw)) {
    return { theme: DEFAULT_APPEARANCE_THEME };
  }
  const settings = raw.settings;
  if (!isRecord(settings)) {
    return { theme: DEFAULT_APPEARANCE_THEME };
  }
  const appearanceRaw = settings.appearance;
  if (!isRecord(appearanceRaw)) {
    return { theme: DEFAULT_APPEARANCE_THEME };
  }
  const theme = cheapParseTheme(appearanceRaw.theme);
  if (theme !== APPEARANCE_THEME_CUSTOM) {
    return { theme };
  }
  const custom = cheapParseCustom(appearanceRaw.custom);
  if (custom === undefined) {
    return { theme };
  }
  return { theme, custom };
}

/** Pre-paint appearance: one GM read + cheap shape check. */
export function peekAppearanceForPaint(): Appearance {
  return cheapParseAppearance(readRawStorageOnce());
}

export type BootLayoutSettings = {
  readonly tweaksEnabled: boolean;
  readonly features: Readonly<Record<string, boolean>>;
  readonly featureChoice: Readonly<Record<string, string>>;
};

/**
 * Cheap layout flags from the same cached GM blob (no second GM read, no zod).
 * Used after CSS injection for grid-density / menu-cleanup / search reserve.
 */
export function peekLayoutSettings(): BootLayoutSettings {
  const raw = readRawStorageOnce();
  if (!isRecord(raw) || !isRecord(raw.settings)) {
    return {
      tweaksEnabled: DEFAULT_TWEAKS_ENABLED,
      features: {},
      featureChoice: {},
    };
  }
  const settings = raw.settings;
  const tweaksEnabled =
    typeof settings.tweaksEnabled === "boolean"
      ? settings.tweaksEnabled
      : DEFAULT_TWEAKS_ENABLED;

  const features: Record<string, boolean> = {};
  if (isRecord(settings.features)) {
    for (const [key, value] of Object.entries(settings.features)) {
      if (typeof value === "boolean") {
        features[key] = value;
      }
    }
  }

  const featureChoice: Record<string, string> = {};
  if (isRecord(settings.featureChoice)) {
    for (const [key, value] of Object.entries(settings.featureChoice)) {
      if (typeof value === "string") {
        featureChoice[key] = value;
      }
    }
  }

  return { tweaksEnabled, features, featureChoice };
}

export function resolveFeatureEnabled(
  layout: BootLayoutSettings,
  id: string,
  defaultEnabled: boolean,
): boolean {
  if (!layout.tweaksEnabled) {
    return false;
  }
  const stored = layout.features[id];
  if (stored === undefined) {
    return defaultEnabled;
  }
  return stored;
}

export function resolveFeatureChoice(
  layout: BootLayoutSettings,
  id: string,
  defaultValue: string,
  allowed: readonly string[],
): string {
  const stored = layout.featureChoice[id];
  if (stored !== undefined && allowed.includes(stored)) {
    return stored;
  }
  return defaultValue;
}

/**
 * One feature's saved state, read without validating the storage: for a
 * decision that has to be made before the first paint. Undefined when there
 * is none.
 */
export function peekFeatureState(id: string): unknown {
  const raw = readRawStorageOnce();
  if (!isRecord(raw) || !isRecord(raw.settings) || !isRecord(raw.settings.featureState)) {
    return undefined;
  }
  return raw.settings.featureState[id];
}
