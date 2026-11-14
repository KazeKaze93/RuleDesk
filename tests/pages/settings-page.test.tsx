import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import { DEBUG_KEY } from "../../src/config/constants";
import {
  VIDEO_PLAYER_SETTING_CAPTION,
  videoPlayerFeature,
} from "../../src/features/video-player";
import { createSettingsPage } from "../../src/pages/settings-page";
import {
  FEATURE_CHECKBOX_ID_PREFIX,
  FEATURE_CHOICE_ID_PREFIX,
} from "../../src/pages/constants";
import {
  VIDEO_PLAYER_FEATURE_ID,
  VIDEO_PREVIEW_FEATURE_ID,
  VIDEO_SIZE_FIT_HEIGHT,
  VIDEO_SIZE_FIT_WIDTH,
  VIDEO_SIZE_ORIGINAL,
} from "../../src/storage/schema";
import { tagGroupsFeature } from "../../src/features/tag-groups";
import {
  clearStorageCache,
  getFeatureState,
  setFeatureState,
} from "../../src/storage/store";

const APPEARANCE_ROW_CLASS = "rdw-appearance__row";
const WHEEL_COPY_RE = /wheel/i;
const VIDEO_PREVIEW_CAPTION_TEXT =
  "Each preview loads the video file itself.";

describe("SettingsPage flat rows", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    clearStorageCache();
    const memory = new Map<string, unknown>();
    vi.stubGlobal(
      "GM_getValue",
      (key: string, defaultValue?: unknown): unknown => {
        if (!memory.has(key)) {
          return defaultValue;
        }
        return memory.get(key);
      },
    );
    vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
      memory.set(key, value);
    });
    memory.set(DEBUG_KEY, false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("injects a late style that clears Appearance (Grid) row zebra", () => {
    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    if (root === undefined) {
      throw new Error("expected settings page root");
    }
    const styleNodes = Array.from(root.querySelectorAll("style"));
    const flatRe = new RegExp(
      String.raw`\.${APPEARANCE_ROW_CLASS}:nth-child\(even\)\s*\{[^}]*background:\s*transparent`,
    );
    const flatIndex = styleNodes.findIndex((node) =>
      flatRe.test(node.textContent ?? ""),
    );
    expect(flatIndex).toBeGreaterThanOrEqual(0);
    // Must come after AppearanceSection's own <style> so it wins the cascade.
    const appearanceOwn = styleNodes.findIndex((node) =>
      (node.textContent ?? "").includes(".rdw-appearance {"),
    );
    expect(appearanceOwn).toBeGreaterThanOrEqual(0);
    expect(flatIndex).toBeGreaterThan(appearanceOwn);
  });

  it("forgets collapsed tag groups when the Collapse tags switch is flipped", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    setFeatureState("tag-groups", { collapsed: ["Artist"] });
    setFeatureState("other-feature", { keep: true });

    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    const toggle = root?.querySelector(`#${FEATURE_CHECKBOX_ID_PREFIX}tag-groups`);
    if (!(toggle instanceof HTMLElement)) {
      throw new Error("tag groups switch missing");
    }
    expect(tagGroupsFeature.resetStateOnToggle).toBe(true);
    act(() => {
      toggle.click();
    });

    expect(getFeatureState("tag-groups")).toBeUndefined();
    expect(getFeatureState("other-feature")).toEqual({ keep: true });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows Video player size choice and caption without wheel volume UI", () => {
    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    if (root === undefined) {
      throw new Error("expected settings page root");
    }

    expect(videoPlayerFeature.cssOnly).toBe(true);
    expect(videoPlayerFeature.settingsCaption).toBe(VIDEO_PLAYER_SETTING_CAPTION);

    const playerToggle = root.querySelector(
      `#${FEATURE_CHECKBOX_ID_PREFIX}${VIDEO_PLAYER_FEATURE_ID}`,
    );
    expect(playerToggle).not.toBeNull();

    const choiceRow = root.querySelector(
      `#${FEATURE_CHOICE_ID_PREFIX}${VIDEO_PLAYER_FEATURE_ID}`,
    );
    expect(choiceRow).not.toBeNull();
    const choiceText = choiceRow?.textContent ?? "";
    expect(choiceText).toContain("Video size");
    expect(choiceText).toContain("Fit height");

    const trigger = choiceRow?.querySelector("button.rdw-select__trigger");
    expect(trigger).not.toBeNull();
    act(() => {
      if (trigger instanceof HTMLButtonElement) {
        trigger.click();
      }
    });
    const openText = choiceRow?.textContent ?? "";
    expect(openText).toContain("Fit width");
    expect(openText).toContain("Original");

    const pageText = root.textContent ?? "";
    expect(pageText).toContain(VIDEO_PLAYER_SETTING_CAPTION);
    expect(pageText).toContain(VIDEO_PREVIEW_CAPTION_TEXT);
    expect(WHEEL_COPY_RE.test(pageText)).toBe(false);

    const previewToggle = root.querySelector(
      `#${FEATURE_CHECKBOX_ID_PREFIX}${VIDEO_PREVIEW_FEATURE_ID}`,
    );
    expect(previewToggle).not.toBeNull();

    expect(videoPlayerFeature.choice?.options.map((o) => o.value)).toEqual([
      VIDEO_SIZE_FIT_HEIGHT,
      VIDEO_SIZE_FIT_WIDTH,
      VIDEO_SIZE_ORIGINAL,
    ]);
  });
});
