import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { UI_TEXT } from "../src/config/constants";
import { hideRdwPage, showRdwPage } from "../src/pages/host";
import {
  PANEL_UI_CLASS,
  RDW_PAGE_ROOT_ID,
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_SETTINGS,
} from "../src/pages/constants";
import { createDefaultStorage } from "../src/storage/schema";
import { clearStorageCache, save } from "../src/storage/store";
import { createBlacklistSection } from "../src/pages/blacklist-section";
import {
  createCollectionsPage,
} from "../src/pages/collections-page";
import { createSettingsPage } from "../src/pages/settings-page";

const memory = new Map<string, unknown>();
const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
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
}

function mountHeader(): HTMLElement {
  document.body.replaceChildren();
  const header = document.createElement("div");
  header.id = "header";
  document.body.append(header);
  return header;
}

function shadowRoot(): ShadowRoot {
  const host = document.getElementById(RDW_PAGE_ROOT_ID);
  expect(host).not.toBeNull();
  const shadow = host?.shadowRoot;
  expect(shadow).not.toBeNull();
  if (shadow === null || shadow === undefined) {
    throw new Error("expected page shadow root");
  }
  return shadow;
}

describe("own pages smoke", () => {
  beforeEach(() => {
    installGmMocks();
    save(createDefaultStorage());
    mountHeader();
  });

  afterEach(() => {
    hideRdwPage();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mounts Settings with Appearance, Page, Blacklist, Favorites, Data", async () => {
    const header = document.getElementById("header");
    if (!(header instanceof HTMLElement)) {
      throw new Error("header missing");
    }
    await showRdwPage(RDW_ROUTE_SETTINGS, header);
    const text = shadowRoot().textContent ?? "";
    expect(text).toContain("Appearance");
    expect(text).toContain("Page");
    expect(text).toContain("Blacklist");
    expect(text).toContain("Favorites");
    expect(text).toContain("Data");
    expect(text).toContain(UI_TEXT.gridFavButtonsLabel);
    expect(
      (text.match(new RegExp(UI_TEXT.gridFavButtonsLabel, "g")) ?? []).length,
    ).toBe(1);
    expect(shadowRoot().querySelector(`.${PANEL_UI_CLASS.pageCard}`)).not.toBeNull();
  });

  it("mounts Following empty state with add field and Open Posts", async () => {
    const header = document.getElementById("header");
    if (!(header instanceof HTMLElement)) {
      throw new Error("header missing");
    }
    await showRdwPage(RDW_ROUTE_FOLLOWING, header);
    const shadow = shadowRoot();
    const text = shadow.textContent ?? "";
    expect(text).toContain("No followed artists yet");
    expect(text).toContain("Follow");
    expect(text).toContain(UI_TEXT.artistTagLabel);
    expect(text).toContain("Open Posts");
    expect(shadow.querySelector("#rdw-following-add-tag")).not.toBeNull();
  });

  it("mounts the collections list without Save current search", async () => {
    const header = document.getElementById("header");
    if (!(header instanceof HTMLElement)) {
      throw new Error("header missing");
    }
    await showRdwPage(RDW_ROUTE_COLLECTIONS, header);
    const text = shadowRoot().textContent ?? "";
    expect(shadowRoot().querySelectorAll("h1")).toHaveLength(1);
    expect(text).toContain("Collections");
    expect(text).toContain(
      "Custom collections are posts you pick. Dynamic collections are saved searches.",
    );
    expect(text).toContain("New");
    expect(text).not.toContain(UI_TEXT.saveCurrent);
    expect(text).not.toContain("Playlists");
    expect(text).not.toContain("Saved searches");
  });

  it("createSettingsPage / createCollectionsPage helpers mount", () => {
    const settings = createSettingsPage();
    expect(settings.textContent).toContain("Appearance");
    expect(settings.textContent).toContain("Data");
    const collections = createCollectionsPage();
    expect(collections.querySelector("h1")).toBeNull();
    expect(collections.textContent).toContain("New");
    expect(collections.textContent).not.toContain(UI_TEXT.saveCurrent);
  });
});

describe("blacklist section (Package F handoff)", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("has no Reload hint or Reload button", () => {
    const section = createBlacklistSection();
    document.body.append(section);
    const text = section.textContent ?? "";
    expect(text).toContain("Blacklist");
    expect(text).not.toContain("Reload");
    expect(text).not.toContain("Saved. Reload the page to apply.");
    const buttons = Array.from(section.querySelectorAll("button"));
    expect(buttons.some((button) => button.textContent === "Reload")).toBe(
      false,
    );
  });
});

describe("appearance section cast", () => {
  it("does not use as AppearanceTheme", () => {
    const source = readFileSync(
      path.join(ROOT_DIR, "src/ui/appearance-section.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/\bas\s+AppearanceTheme\b/);
    expect(source).toContain("AppearanceThemeSchema.safeParse");
  });
});
