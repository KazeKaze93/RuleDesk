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
  PANEL_UI_CLASS,
  PLAYLIST_CHUNK_SIZE_ID,
  TWEAKS_SWITCH_ID,
  UPDATES_GROUP_SIZE_ID,
} from "../../src/pages/constants";
import {
  FEATURES,
  SETTINGS_GROUP,
  featureSettingsGroup,
} from "../../src/features/registry";
import {
  PAGE_CONTENT_CSS,
  SETTINGS_NUMBER_WIDTH_PX,
  SETTINGS_SELECT_WIDTH_PX,
} from "../../src/pages/page-css";
import { DARK_PALETTE, LIGHT_PALETTE, contrastRatio } from "../../src/ui/tokens";
import {
  VIDEO_PLAYER_FEATURE_ID,
  VIDEO_PREVIEW_FEATURE_ID,
  VIDEO_SIZE_FIT_HEIGHT,
  VIDEO_SIZE_FIT_WIDTH,
  VIDEO_SIZE_ORIGINAL,
} from "../../src/storage/schema";
import { tagGroupsFeature } from "../../src/features/tag-groups";
import { installSiteMenu } from "../../src/pages/menu";
import {
  clearStorageCache,
  getFeatureState,
  setFeatureState,
  setTweaksEnabled,
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

  it("folds a settings block to its title and remembers it", () => {
    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    const header = root?.querySelector('button[data-settings-section="page"]');
    if (!(header instanceof HTMLButtonElement)) {
      throw new Error("Page section header missing");
    }
    const body = root?.querySelector("#rdw-settings-section-page");
    expect(header.textContent).toBe("Page");
    expect(header.getAttribute("aria-expanded")).toBe("true");
    expect(body?.hasAttribute("hidden")).toBe(false);
    expect(
      Array.from(root?.querySelectorAll("button[data-settings-section]") ?? []).map(
        (node) => node.textContent,
      ),
    ).toEqual(["Appearance", "Page", "Blacklist", "Favorites", "Downloads", "Data"]);

    act(() => {
      header.click();
    });
    expect(header.getAttribute("aria-expanded")).toBe("false");
    expect(body?.hasAttribute("hidden")).toBe(true);
    // The body stays mounted: its controls keep their state while folded.
    expect(body?.querySelector(`#${FEATURE_CHECKBOX_ID_PREFIX}tag-groups`)).not.toBeNull();
    expect(getFeatureState("settings-sections")).toEqual(["page"]);

    let again: HTMLElement | undefined;
    act(() => {
      again = createSettingsPage();
      document.body.append(again);
    });
    expect(
      again
        ?.querySelector('button[data-settings-section="page"]')
        ?.getAttribute("aria-expanded"),
    ).toBe("false");
    expect(
      again
        ?.querySelector('button[data-settings-section="data"]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("shows the Page block in groups under subheadings, the master switch first", () => {
    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    const body = root?.querySelector("#rdw-settings-section-page");
    if (!(body instanceof HTMLElement)) {
      throw new Error("Page section body missing");
    }

    const firstRow = body.querySelector(`.${PANEL_UI_CLASS.settingsRow}`);
    expect(firstRow?.querySelector(`#${TWEAKS_SWITCH_ID}`)).not.toBeNull();
    expect(firstRow?.querySelector(`.${PANEL_UI_CLASS.settingsCaption}`)?.textContent).toBe(
      "Off: the site looks as without RuleDesk",
    );
    expect(firstRow?.closest("[data-settings-group]")).toBeNull();

    const groups = Array.from(body.querySelectorAll("[data-settings-group]"));
    const labelsOf = (group: Element): string[] =>
      Array.from(
        group.querySelectorAll(".rdw-switch__label, .rdw-select__label, .rdw-num__label"),
      ).map((node) => node.textContent ?? "");
    expect(
      groups.map((group) => [
        group.querySelector(".rdw-section-label")?.textContent,
        labelsOf(group),
      ]),
    ).toEqual([
      [
        "Header",
        [
          "Clean header menu",
          "Statistics in site menu",
          "Keep the header and the sidebar in place while scrolling",
        ],
      ],
      [
        "Grid and thumbnails",
        [
          "Dim seen posts",
          "Hide blacklisted posts",
          "Infinite scroll",
          "Hide tag tooltip on thumbnails",
        ],
      ],
      [
        "Post page",
        [
          "Post side panel",
          "Retry a failed post image on other servers",
          "Zoom the picture on click",
          "Play GIFs on the post page",
          "Load full-size image",
        ],
      ],
      [
        "Video",
        [
          "Video player tweaks",
          "Video size",
          "Video preview on hover",
          "Play icon on video thumbnails",
        ],
      ],
      ["Feed", ["Feed in site menu", "New posts counter beside Feed", "Artists per search"]],
      ["AI posts", ["Hide AI posts everywhere"]],
      [
        "Search and sidebar",
        [
          "Collapse tags",
          "Search tools",
          "Sidebar on the right",
          "Tag description on the ? in the sidebar",
        ],
      ],
      ["Collections", ["Add to collection button", "Collection header", "Collection part size"]],
      ["Favorites page", ["Bulk remove favorites"]],
      ["Other", ["Download manager", "Motion"]],
    ]);
    for (const group of groups) {
      expect(group.getAttribute("role")).toBe("group");
      expect(group.getAttribute("aria-label")).toBe(
        group.querySelector(".rdw-section-label")?.textContent,
      );
    }

    // Only the two that belong to no part of the site are under "Other".
    const other = FEATURES.filter(
      (feature) => featureSettingsGroup(feature.id) === SETTINGS_GROUP.other,
    ).map((feature) => feature.id);
    expect(other).toEqual(["downloads", "motion"]);
    expect(featureSettingsGroup("not-in-the-list")).toBe(SETTINGS_GROUP.other);
  });

  it("disables the page tweaks while the master switch is off, and nothing else", () => {
    setTweaksEnabled(false);
    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    const isDisabled = (selector: string): boolean => {
      const node = root?.querySelector(selector);
      if (!(node instanceof HTMLButtonElement) && !(node instanceof HTMLInputElement)) {
        throw new Error(`control missing: ${selector}`);
      }
      return node.disabled;
    };

    expect(isDisabled(`#${TWEAKS_SWITCH_ID}`)).toBe(false);
    for (const feature of FEATURES) {
      if (feature.id === "grid-density") {
        continue;
      }
      expect(isDisabled(`#${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`)).toBe(true);
    }
    expect(
      isDisabled(
        `#${FEATURE_CHOICE_ID_PREFIX}${VIDEO_PLAYER_FEATURE_ID} button.rdw-select__trigger`,
      ),
    ).toBe(true);
    // These do their work without the page tweaks.
    expect(isDisabled("#rdw-stats-menu")).toBe(false);
    expect(isDisabled("#rdw-ai-everywhere")).toBe(false);
    expect(isDisabled(`#${UPDATES_GROUP_SIZE_ID}`)).toBe(false);
    expect(isDisabled(`#${PLAYLIST_CHUNK_SIZE_ID}`)).toBe(false);
  });

  it("puts the hint of Artists per search in a line under its name", () => {
    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    const row = root
      ?.querySelector(`#${UPDATES_GROUP_SIZE_ID}`)
      ?.closest(`.${PANEL_UI_CLASS.settingsRow}`);
    expect(row?.querySelector(".rdw-num__label")?.textContent).toBe("Artists per search");
    expect(row?.querySelector(`.${PANEL_UI_CLASS.settingsCaption}`)?.textContent).toBe(
      "0 = 400",
    );
  });

  it("lays a list and a number out as a switch: the name on the left, a compact control on the right", () => {
    const row = String.raw`\.${PANEL_UI_CLASS.settingsRow}`;
    expect(PAGE_CONTENT_CSS).toMatch(
      new RegExp(
        String.raw`${row} \.rdw-select,\s*${row} \.rdw-num\s*\{[^}]*flex-direction:\s*row[^}]*justify-content:\s*space-between`,
      ),
    );
    expect(PAGE_CONTENT_CSS).toMatch(
      new RegExp(
        String.raw`${row} \.rdw-select__label,\s*${row} \.rdw-num__label\s*\{[^}]*text-transform:\s*none[^}]*color:\s*var\(--rdw-text\)`,
      ),
    );
    expect(PAGE_CONTENT_CSS).toMatch(
      new RegExp(
        String.raw`${row} \.rdw-select__trigger\s*\{[^}]*width:\s*${String(SETTINGS_SELECT_WIDTH_PX)}px`,
      ),
    );
    expect(PAGE_CONTENT_CSS).toMatch(
      new RegExp(
        String.raw`${row} \.rdw-num__input\s*\{[^}]*width:\s*${String(SETTINGS_NUMBER_WIDTH_PX)}px`,
      ),
    );
    expect(SETTINGS_SELECT_WIDTH_PX).toBe(160);
    expect(SETTINGS_NUMBER_WIDTH_PX).toBe(80);
    // A description is 12 px, in the muted colour of the theme.
    expect(PAGE_CONTENT_CSS).toMatch(
      new RegExp(
        String.raw`\.${PANEL_UI_CLASS.settingsCaption}\s*\{[^}]*font-size:\s*12px[^}]*color:\s*var\(--rdw-muted\)`,
      ),
    );
  });

  it("keeps a description readable in every theme of the script", () => {
    const AA = 4.5;
    for (const palette of [LIGHT_PALETTE, DARK_PALETTE]) {
      expect(contrastRatio(palette.muted, palette.surface)).toBeGreaterThanOrEqual(AA);
    }
    // In the site's own themes a description takes the colour of the text.
    expect(PAGE_CONTENT_CSS).toMatch(
      new RegExp(
        String.raw`:host-context\([^)]*\) \.${PANEL_UI_CLASS.settingsCaption}\s*\{[^}]*color:\s*var\(--rdw-text\)`,
      ),
    );
  });

  it("hides the Statistics menu item with its switch and has no statistics block", () => {
    const header = document.createElement("div");
    header.id = "header";
    header.innerHTML = '<ul id="navbar"><li><a href="#">Posts</a></li></ul>';
    document.body.append(header);
    installSiteMenu();
    expect(document.getElementById("rdw-nav-stats")?.textContent).toBe("Statistics");

    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    expect(root?.querySelector('button[data-settings-section="statistics"]')).toBeNull();
    const toggle = root?.querySelector("#rdw-stats-menu");
    if (!(toggle instanceof HTMLElement)) {
      throw new Error("statistics switch missing");
    }
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    act(() => {
      toggle.click();
    });
    expect(document.getElementById("rdw-nav-stats")).toBeNull();

    act(() => {
      toggle.click();
    });
    const item = document.getElementById("rdw-nav-stats");
    expect(item?.querySelector("a")?.getAttribute("href")).toBe("#rdw/stats");
    header.remove();
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
