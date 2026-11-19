import { detectPageKind, type PageKind } from "../site/pages";
import { resetThumbsBus } from "../site/thumbs-bus";
import {
  getFeatureChoiceValue,
  getFeatureEnabled,
  getTweaksEnabled,
} from "../storage/store";
import {
  activePage,
  applyFeatureChrome,
  clearChoiceBodyClasses,
  ensureFeatureCss,
  isFeatureMounted,
  mountFeatureOnce,
  resetFeatureChromeState,
  setActivePage,
  yieldToMain,
} from "./chrome";
import { FEATURES } from "./registry";
import {
  featureBodyClass,
  featureChoiceBodyClass,
  type Feature,
} from "./types";

/*
 * What needs the list of features. Putting one feature on the page is in
 * chrome.ts, and the event of added thumbs in site/thumbs-bus.ts: both are
 * given again from here for the code that took them from this module.
 */
export { applyFeatureChrome, yieldToMain, type ApplyFeatureChromeOptions } from "./chrome";
export {
  notifyThumbsAdded,
  onThumbsAdded,
  type ThumbsAddedListener,
} from "../site/thumbs-bus";

function findFeature(id: string): Feature | undefined {
  return FEATURES.find((feature) => feature.id === id);
}

export function isFeatureEnabled(id: string): boolean {
  const feature = findFeature(id);
  if (feature === undefined) {
    return false;
  }
  return getFeatureEnabled(id, feature.defaultEnabled);
}

export function getFeatureChoice(id: string): string {
  const feature = findFeature(id);
  if (feature?.choice === undefined) {
    return "";
  }
  const stored = getFeatureChoiceValue(id);
  if (
    stored !== undefined &&
    feature.choice.options.some((option) => option.value === stored)
  ) {
    return stored;
  }
  return feature.choice.defaultValue;
}

function resolvePageContext(): { pageKind: PageKind; search: string } {
  return (
    activePage() ?? {
      pageKind: detectPageKind(window.location.search),
      search: window.location.search,
    }
  );
}

/**
 * Live-apply a cssOnly feature enable/disable: body classes + CSS injection.
 * Mounts once if not yet mounted when enabling. Does not remount on re-enable.
 */
export function applyCssOnlyFeatureEnabled(id: string, enabled: boolean): void {
  const feature = findFeature(id);
  if (feature?.cssOnly !== true) {
    return;
  }
  if (!getTweaksEnabled()) {
    return;
  }

  if (!enabled) {
    document.body.classList.remove(featureBodyClass(feature.id));
    clearChoiceBodyClasses(feature);
    return;
  }

  ensureFeatureCss(feature);
  document.body.classList.add(featureBodyClass(feature.id));
  if (feature.choice !== undefined) {
    clearChoiceBodyClasses(feature);
    document.body.classList.add(
      featureChoiceBodyClass(feature.id, getFeatureChoice(feature.id)),
    );
  }
  const { pageKind, search } = resolvePageContext();
  mountFeatureOnce(feature, pageKind, search);
}

/**
 * Live-apply a cssOnly feature choice: swap body.rdw-f-<id>-<value> classes.
 */
export function applyCssOnlyFeatureChoice(id: string, value: string): void {
  const feature = findFeature(id);
  if (feature?.cssOnly !== true || feature.choice === undefined) {
    return;
  }
  if (!getTweaksEnabled()) {
    return;
  }
  if (!getFeatureEnabled(id, feature.defaultEnabled)) {
    return;
  }

  ensureFeatureCss(feature);
  clearChoiceBodyClasses(feature);
  document.body.classList.add(featureChoiceBodyClass(feature.id, value));
}

/** Clears mount tracking, thumbs bus, and page context (tests). */
export function resetFeatureRuntimeState(): void {
  resetFeatureChromeState();
  resetThumbsBus();
}

function wanted(feature: Feature, pageKind: PageKind): boolean {
  return (
    !isFeatureMounted(feature.id) &&
    feature.pages.includes(pageKind) &&
    getFeatureEnabled(feature.id, feature.defaultEnabled)
  );
}

export function runFeatures(
  pageKind: PageKind,
  search: string,
  features: readonly Feature[] = FEATURES,
): void {
  setActivePage(pageKind, search);

  if (!getTweaksEnabled()) {
    return;
  }

  for (const feature of features) {
    if (wanted(feature, pageKind)) {
      applyFeatureChrome(feature, pageKind, search);
    }
  }
}

/**
 * Mount remaining features one-by-one, yielding to the main thread between each.
 * Skips ids already mounted during layout-before-paint.
 */
export async function runFeaturesYielding(
  pageKind: PageKind,
  search: string,
  features: readonly Feature[] = FEATURES,
): Promise<void> {
  setActivePage(pageKind, search);

  if (!getTweaksEnabled()) {
    return;
  }

  for (const feature of features) {
    if (!wanted(feature, pageKind)) {
      continue;
    }
    applyFeatureChrome(feature, pageKind, search);
    await yieldToMain();
  }
}
