import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEBUG_KEY,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_STYLESHEET_LIGHT,
  TOKEN_STYLE_ID,
} from "../../src/config/constants";
import { featureChoiceBodyClass } from "../../src/features/types";
import {
  SITE_DARK_PALETTE_RESOLVED,
  SITE_DEFAULT_PALETTE_RESOLVED,
} from "../../src/skin/theme";
import {
  clearStorageCache,
  getAppearance,
  getFeatureChoiceValue,
  setAppearance,
} from "../../src/storage/store";
import {
  APPEARANCE_SECTION_CSS,
  createAppearanceSection,
} from "../../src/ui/appearance-section";
import { DARK_PALETTE, LIGHT_PALETTE, TOKEN_VAR } from "../../src/ui/tokens";
import { fireClick, flushEffects } from "../kit/render";

const memory = new Map<string, unknown>();
const LIGHT_HREF = `https://rule34.xxx/css/${SITE_THEME_STYLESHEET_LIGHT}?v=1`;

const loadBackgroundMock = vi.fn(async (): Promise<string | null> => null);
const saveBackgroundMock = vi.fn(async (_dataUrl: string): Promise<void> => {});
const clearBackgroundMock = vi.fn(async (): Promise<void> => {});

vi.mock("../../src/storage/background-store", () => ({
  loadBackground: (): Promise<string | null> => loadBackgroundMock(),
  saveBackground: (dataUrl: string): Promise<void> => saveBackgroundMock(dataUrl),
  clearBackground: (): Promise<void> => clearBackgroundMock(),
}));

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

function setDocumentCookie(value: string): void {
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => value,
    set: (next: string) => {
      const [pair] = next.split(";");
      if (pair === undefined) {
        return;
      }
      const eq = pair.indexOf("=");
      const name = eq === -1 ? pair.trim() : pair.slice(0, eq).trim();
      const cookieValue = eq === -1 ? "" : pair.slice(eq + 1);
      const entries = value
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .filter((part) => !part.startsWith(`${name}=`));
      if (cookieValue.length > 0) {
        entries.push(`${name}=${cookieValue}`);
      }
      value = entries.join("; ");
    },
  });
}

function appendStylesheet(href: string): void {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
}

function selectTriggers(section: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    section.querySelectorAll<HTMLButtonElement>(".rdw-select__trigger"),
  );
}

function chooseSelectOption(section: HTMLElement, label: string): void {
  const options = Array.from(
    section.querySelectorAll<HTMLElement>(".rdw-select__option"),
  );
  const option = options.find((node) => node.textContent === label);
  if (option === undefined) {
    throw new Error(`option not found: ${label}`);
  }
  fireClick(option);
}

describe("createAppearanceSection", () => {
  let host: HTMLElement | null = null;

  beforeEach(() => {
    installGmMocks();
    loadBackgroundMock.mockReset();
    saveBackgroundMock.mockReset();
    clearBackgroundMock.mockReset();
    loadBackgroundMock.mockResolvedValue(null);
    saveBackgroundMock.mockResolvedValue(undefined);
    clearBackgroundMock.mockResolvedValue(undefined);
    memory.set(DEBUG_KEY, false);
    document.head.replaceChildren();
    document.body.replaceChildren();
    document.documentElement.removeAttribute(RDW_THEME_ATTR);
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
    document.documentElement.style.cssText = "";
    document.body.style.cssText = "";
    document.body.className = "";
    setDocumentCookie("");
    appendStylesheet(LIGHT_HREF);
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2,
    });
    Object.defineProperty(window.screen, "width", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window.screen, "height", {
      configurable: true,
      value: 600,
    });
  });

  afterEach(() => {
    if (host !== null) {
      host.remove();
      host = null;
    }
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports section CSS and mounts a labeled Appearance block", () => {
    expect(APPEARANCE_SECTION_CSS).toContain(".rdw-appearance");
    host = createAppearanceSection();
    document.body.append(host);
    expect(host.querySelector('[aria-label="Appearance"]')).toBeTruthy();
    expect(host.textContent).toContain("Site theme");
    expect(host.textContent).toContain("Grid");
  });

  it("custom mode shows Light/Dark base segmented and screen size hint", async () => {
    host = createAppearanceSection();
    document.body.append(host);

    const themeTrigger = selectTriggers(host)[0];
    expect(themeTrigger).toBeTruthy();
    fireClick(themeTrigger!);
    chooseSelectOption(host, "Custom");
    await flushEffects();

    expect(getAppearance().theme).toBe("custom");
    expect(getAppearance().custom?.base).toBe("light");
    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      true,
    );
    expect(document.cookie).not.toContain(`${SITE_THEME_COOKIE_NAME}=`);
    expect(host.querySelector('input[type="color"]')).toBeNull();
    expect(host.textContent).toContain("For this screen use at least 1600x1200");

    const darkBase = Array.from(
      host.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    ).find((button) => button.textContent === "Dark");
    expect(darkBase).toBeTruthy();
    fireClick(darkBase!);
    await flushEffects();

    expect(getAppearance().custom?.base).toBe("dark");
    const tokenStyle = document.getElementById(TOKEN_STYLE_ID);
    expect(tokenStyle?.textContent).toContain(DARK_PALETTE.bg);
    expect(tokenStyle?.textContent).not.toContain(
      `${TOKEN_VAR.bg}: ${LIGHT_PALETTE.bg}`,
    );
  });

  it("grid select writes featureChoice grid-density", async () => {
    host = createAppearanceSection();
    document.body.append(host);

    const gridTrigger = selectTriggers(host)[1];
    expect(gridTrigger).toBeTruthy();
    fireClick(gridTrigger!);
    chooseSelectOption(host, "Large");
    await flushEffects();

    expect(getFeatureChoiceValue("grid-density")).toBe("large");
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("grid-density", "large"),
      ),
    ).toBe(true);
  });

  it("shows the name of the background in one line over the field, and a small copy of the picture", async () => {
    const dataUrl = "data:image/jpeg;base64,thumb";
    loadBackgroundMock.mockResolvedValue(dataUrl);
    setAppearance({
      theme: "custom",
      custom: { base: "light", backgroundDim: 0 },
    });

    host = createAppearanceSection();
    document.body.append(host);
    expect(host.querySelector(".rdw-appearance__bg-thumb")).toBeNull();
    for (let i = 0; i < 20 && host.querySelector(".rdw-appearance__bg-thumb") === null; i += 1) {
      await flushEffects();
    }

    const thumb = host.querySelector(".rdw-appearance__bg-thumb");
    expect(thumb?.getAttribute("src")).toBe(dataUrl);
    const field = thumb?.parentElement;
    expect(field?.querySelector("input")).not.toBeNull();

    const row = host.querySelector(".rdw-appearance__row--stack");
    expect(row?.firstElementChild?.textContent).toBe(
      "Background imageFrom a link or a file",
    );
    expect(APPEARANCE_SECTION_CSS).toMatch(
      /\.rdw-appearance__row--stack\s*\{[^}]*flex-direction:\s*column/,
    );
  });

  it("the chosen theme has a tick in the open list", () => {
    host = createAppearanceSection();
    document.body.append(host);
    fireClick(selectTriggers(host)[0]!);
    const ticked = Array.from(
      host.querySelectorAll<HTMLElement>(".rdw-select__option"),
    ).filter((option) => option.querySelector(".rdw-select__tick") !== null);
    expect(ticked.map((option) => option.textContent)).toEqual(["Light"]);
  });

  it("Reset theme asks first, and Cancel keeps the theme", async () => {
    host = createAppearanceSection();
    document.body.append(host);

    fireClick(selectTriggers(host)[0]!);
    chooseSelectOption(host, "Custom");
    await flushEffects();
    const darkBase = Array.from(
      host.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    ).find((button) => button.textContent === "Dark");
    fireClick(darkBase!);
    await flushEffects();

    const findButton = (label: string): HTMLButtonElement | undefined =>
      Array.from(host?.querySelectorAll("button") ?? []).find(
        (button) => button.textContent === label,
      );
    expect(findButton("Reset to defaults")).toBeUndefined();
    fireClick(findButton("Reset theme")!);
    await flushEffects();

    const dialog = host.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Reset theme?");
    expect(getAppearance().custom?.base).toBe("dark");

    fireClick(findButton("Cancel")!);
    await flushEffects();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(getAppearance().custom?.base).toBe("dark");
    expect(clearBackgroundMock).not.toHaveBeenCalled();
  });

  it("reset theme restores light custom base once confirmed", async () => {
    host = createAppearanceSection();
    document.body.append(host);

    fireClick(selectTriggers(host)[0]!);
    chooseSelectOption(host, "Custom");
    await flushEffects();

    const darkBase = Array.from(
      host.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    ).find((button) => button.textContent === "Dark");
    fireClick(darkBase!);
    await flushEffects();
    expect(getAppearance().custom?.base).toBe("dark");

    const reset = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === "Reset theme",
    );
    expect(reset).toBeTruthy();
    fireClick(reset!);
    await flushEffects();
    const confirm = Array.from(
      host.querySelectorAll('[role="dialog"] button'),
    ).find((button) => button.textContent === "Reset");
    expect(confirm).toBeTruthy();
    fireClick(confirm!);
    await flushEffects();

    expect(getAppearance().custom?.base).toBe("light");
    expect(clearBackgroundMock).toHaveBeenCalled();
  });

  it("site themes inject site palettes, not Light/Dark", async () => {
    host = createAppearanceSection();
    document.body.append(host);

    fireClick(selectTriggers(host)[0]!);
    chooseSelectOption(host, "Site dark");
    await flushEffects();

    const tokenStyle = document.getElementById(TOKEN_STYLE_ID);
    expect(tokenStyle?.textContent).toContain(SITE_DARK_PALETTE_RESOLVED.bg);
    expect(tokenStyle?.textContent).not.toContain(
      `${TOKEN_VAR.bg}: ${DARK_PALETTE.bg}`,
    );

    fireClick(selectTriggers(host)[0]!);
    chooseSelectOption(host, "Site default");
    await flushEffects();

    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).toContain(
      SITE_DEFAULT_PALETTE_RESOLVED.bg,
    );
    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).not.toContain(
      `${TOKEN_VAR.bg}: ${LIGHT_PALETTE.bg}`,
    );
  });

  it("loads stored background after first paint via loadBackground", async () => {
    const dataUrl = "data:image/jpeg;base64,asyncbg";
    loadBackgroundMock.mockResolvedValue(dataUrl);
    setAppearance({
      theme: "custom",
      custom: { base: "light", backgroundDim: 0 },
    });

    host = createAppearanceSection();
    document.body.append(host);
    // First paint: base color only (no image yet).
    expect(document.body.style.backgroundImage).toBe("");
    // Under full-suite load, one macrotask flush can race the async load.
    for (let i = 0; i < 20 && !loadBackgroundMock.mock.calls.length; i += 1) {
      await flushEffects();
    }

    expect(loadBackgroundMock).toHaveBeenCalled();
    expect(document.body.style.backgroundImage).toContain(dataUrl);
  });
});
