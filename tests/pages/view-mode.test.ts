import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FOLLOWING_VIEW_STATE_ID,
  COLLECTIONS_VIEW_STATE_ID,
  VIEW_LIST,
  VIEW_TILES,
  WIDE_PAGES_SETTING_ID,
  readViewMode,
  widePagesEnabled,
  writeViewMode,
} from "../../src/pages/view-mode";
import { clearStorageCache, setFeatureEnabled, setFeatureState } from "../../src/storage/store";

const memory = new Map<string, unknown>();

describe("view mode and page width", () => {
  beforeEach(() => {
    memory.clear();
    clearStorageCache();
    vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown =>
      memory.has(key) ? memory.get(key) : fallback,
    );
    vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
      memory.set(key, value);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows tiles until the user chose a list, and remembers the choice per page", () => {
    expect(readViewMode(FOLLOWING_VIEW_STATE_ID)).toBe(VIEW_TILES);
    writeViewMode(FOLLOWING_VIEW_STATE_ID, VIEW_LIST);
    clearStorageCache();
    expect(readViewMode(FOLLOWING_VIEW_STATE_ID)).toBe(VIEW_LIST);
    expect(readViewMode(COLLECTIONS_VIEW_STATE_ID)).toBe(VIEW_TILES);
  });

  it("falls back to tiles on a value it does not know", () => {
    setFeatureState(COLLECTIONS_VIEW_STATE_ID, "table");
    expect(readViewMode(COLLECTIONS_VIEW_STATE_ID)).toBe(VIEW_TILES);
  });

  it("keeps the centred column until full width is switched on", () => {
    expect(widePagesEnabled()).toBe(false);
    setFeatureEnabled(WIDE_PAGES_SETTING_ID, true);
    expect(widePagesEnabled()).toBe(true);
  });
});
