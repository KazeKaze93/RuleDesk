import { log } from "../log";
import type { PageKind } from "../site/pages";
import { getFeatureChoiceValue, getFeatureState, setFeatureState } from "../storage/store";
import {
  FEATURE_STYLE_ID_PREFIX,
  featureBodyClass,
  featureChoiceBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

/**
 * Putting one feature on the page: its body class, its CSS, its mount, once.
 * This module knows no feature by name and does not import the registry, so
 * the code run before the first paint (boot/layout.ts), which needs it for
 * three small features, does not draw every feature in with it. What needs
 * the list of features is in runtime.ts.
 */

const mountedIds = new Set<string>();
let activePageKind: PageKind | null = null;
let activeSearch = "";

export function isFeatureMounted(id: string): boolean {
  return mountedIds.has(id);
}

/** The page the features are mounted for; null before any was. */
export function activePage(): { pageKind: PageKind; search: string } | null {
  return activePageKind === null ? null : { pageKind: activePageKind, search: activeSearch };
}

export function setActivePage(pageKind: PageKind, search: string): void {
  activePageKind = pageKind;
  activeSearch = search;
}

/** Clears mount tracking and page context (tests). */
export function resetFeatureChromeState(): void {
  mountedIds.clear();
  activePageKind = null;
  activeSearch = "";
}

export function ensureFeatureCss(feature: Feature): void {
  const styleId = `${FEATURE_STYLE_ID_PREFIX}${feature.id}`;
  if (document.getElementById(styleId) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = feature.css;
  document.head.append(style);
}

function createContext(feature: Feature, pageKind: PageKind, search: string): FeatureContext {
  return {
    pageKind,
    search,
    getState: <T>(parse: (raw: unknown) => T): T => {
      return parse(getFeatureState(feature.id));
    },
    setState: (value: unknown): void => {
      setFeatureState(feature.id, value);
    },
  };
}

export function clearChoiceBodyClasses(feature: Feature): void {
  if (feature.choice === undefined) {
    return;
  }
  for (const option of feature.choice.options) {
    document.body.classList.remove(
      featureChoiceBodyClass(feature.id, option.value),
    );
  }
}

/** Mounts a feature that is not mounted yet, on the page given. */
export function mountFeatureOnce(feature: Feature, pageKind: PageKind, search: string): void {
  if (mountedIds.has(feature.id)) {
    return;
  }
  if (!feature.pages.includes(pageKind)) {
    return;
  }
  mountedIds.add(feature.id);
  try {
    feature.mount(createContext(feature, pageKind, search));
  } catch (error) {
    log.error(`Feature mount failed: ${feature.id}`, error);
  }
}

export type ApplyFeatureChromeOptions = {
  /** Pre-paint: pass choice from cheap peek instead of reading store. */
  readonly choiceValue?: string;
};

/**
 * Body class + feature CSS + mount once. Used by layout-before-paint and runtime.
 * Records the id in mountedIds so deferred runFeatures will not remount.
 */
export function applyFeatureChrome(
  feature: Feature,
  pageKind: PageKind,
  search: string,
  options: ApplyFeatureChromeOptions = {},
): void {
  if (mountedIds.has(feature.id)) {
    return;
  }
  if (!feature.pages.includes(pageKind)) {
    return;
  }

  setActivePage(pageKind, search);

  document.body.classList.add(featureBodyClass(feature.id));
  if (feature.choice !== undefined) {
    const choiceValue =
      options.choiceValue ??
      (() => {
        const stored = getFeatureChoiceValue(feature.id);
        if (
          stored !== undefined &&
          feature.choice.options.some((option) => option.value === stored)
        ) {
          return stored;
        }
        return feature.choice.defaultValue;
      })();
    clearChoiceBodyClasses(feature);
    document.body.classList.add(
      featureChoiceBodyClass(feature.id, choiceValue),
    );
  }

  ensureFeatureCss(feature);
  mountFeatureOnce(feature, pageKind, search);
}

/** Zero-delay yield so the browser can paint / handle input between mounts. */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
