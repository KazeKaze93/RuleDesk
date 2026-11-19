import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyAppearanceToDocument,
  injectSiteSkinHook,
  injectTokenStyles,
} from "../src/boot/appearance-dom";
import {
  cheapParseAppearance,
  clearRawStorageCache,
  peekAppearanceForPaint,
  readRawStorageOnce,
} from "../src/boot/cheap-appearance";
import { bootEarly } from "../src/boot/early";
import {
  scheduleAfterFirstPaint,
  whenDomReady,
} from "../src/boot/ready";
import {
  DEFAULT_APPEARANCE_THEME,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
  SITE_SKIN_STYLE_ID,
  STORAGE_KEY,
  TOKEN_STYLE_ID,
} from "../src/config/constants";
import { getSiteSkinCss } from "../src/skin/site-skin";
import { SITE_DARK_PALETTE_RESOLVED } from "../src/skin/theme";
import { clearStorageCache } from "../src/storage/store";
import { LIGHT_PALETTE, TOKEN_VAR } from "../src/ui/tokens";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  clearRawStorageCache();
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

describe("cheap appearance parse (no zod)", () => {
  beforeEach(() => {
    installGmMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads theme from nested settings without validating marks", () => {
    const appearance = cheapParseAppearance({
      version: 1,
      collections: "not-an-array",
      artists: null,
      marks: { boom: "invalid" },
      settings: {
        appearance: { theme: "site-dark" },
      },
    });
    expect(appearance).toEqual({ theme: "site-dark" });
  });

  it("defaults when appearance missing", () => {
    expect(cheapParseAppearance(undefined).theme).toBe(DEFAULT_APPEARANCE_THEME);
    expect(cheapParseAppearance({ version: 1 }).theme).toBe(
      DEFAULT_APPEARANCE_THEME,
    );
  });

  it("peekAppearanceForPaint uses a single GM read", () => {
    const spy = vi.fn((key: string, defaultValue?: unknown): unknown => {
      if (!memory.has(key)) {
        return defaultValue;
      }
      return memory.get(key);
    });
    vi.stubGlobal("GM_getValue", spy);
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: {},
      settings: { appearance: { theme: "dark" } },
    });
    expect(peekAppearanceForPaint().theme).toBe("dark");
    expect(peekAppearanceForPaint().theme).toBe("dark");
    const storageReads = spy.mock.calls.filter(
      (call) => call[0] === STORAGE_KEY,
    );
    expect(storageReads.length).toBe(1);
    expect(readRawStorageOnce()).toBe(memory.get(STORAGE_KEY));
  });
});

describe("boot early appearance — CSS first", () => {
  beforeEach(() => {
    installGmMocks();
    document.documentElement.removeAttribute(RDW_THEME_ATTR);
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    document.getElementById(SITE_SKIN_STYLE_ID)?.remove();
    document.documentElement.style.cssText = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("injects token styles and theme attrs without needing body", () => {
    expect(document.body).toBeTruthy();
    const bodySpy = vi.spyOn(document.body, "append");
    bootEarly();
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe(
      DEFAULT_APPEARANCE_THEME,
    );
    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      true,
    );
    const style = document.getElementById(TOKEN_STYLE_ID);
    expect(style).toBeInstanceOf(HTMLStyleElement);
    expect(style?.textContent).toContain(TOKEN_VAR.accent);
    expect(style?.textContent).toContain(LIGHT_PALETTE.accent);
    const skin = document.getElementById(SITE_SKIN_STYLE_ID);
    expect(skin).toBeInstanceOf(HTMLStyleElement);
    expect(skin?.textContent).toBe(getSiteSkinCss());
    expect(bodySpy).not.toHaveBeenCalled();
  });

  it("injects CSS immediately after the cheap GM read (order contract)", () => {
    const order: string[] = [];
    vi.stubGlobal(
      "GM_getValue",
      (key: string, defaultValue?: unknown): unknown => {
        if (key === STORAGE_KEY) {
          order.push("gm-appearance");
        }
        if (!memory.has(key)) {
          return defaultValue;
        }
        return memory.get(key);
      },
    );
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: {},
      settings: { appearance: { theme: "site-dark" } },
    });

    const parent = document.head ?? document.documentElement;
    const originalAppend = parent.append.bind(parent);
    vi.spyOn(parent, "append").mockImplementation((...nodes: Array<Node | string>) => {
      for (const node of nodes) {
        if (node instanceof HTMLStyleElement) {
          order.push(`style:${node.id}`);
        }
      }
      return originalAppend(...nodes);
    });

    bootEarly();

    expect(order[0]).toBe("gm-appearance");
    const firstStyle = order.findIndex((step) => step.startsWith("style:"));
    expect(firstStyle).toBeGreaterThan(0);
    expect(order.slice(firstStyle)).toEqual(
      expect.arrayContaining([
        `style:${TOKEN_STYLE_ID}`,
        `style:${SITE_SKIN_STYLE_ID}`,
      ]),
    );
    expect(order.indexOf("gm-appearance")).toBeLessThan(firstStyle);
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe(
      "site-dark",
    );
    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).toContain(
      SITE_DARK_PALETTE_RESOLVED.bg,
    );
  });

  it("does not call store.load / favs on the pre-paint path", async () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: { "1": { seen: true } },
      settings: { appearance: { theme: "light" } },
    });
    const store = await import("../src/storage/store");
    const loadSpy = vi.spyOn(store, "load");
    bootEarly();
    expect(loadSpy).not.toHaveBeenCalled();
    loadSpy.mockRestore();
  });

  it("applies custom dark base via token stylesheet", () => {
    applyAppearanceToDocument({
      appearance: {
        theme: "custom",
        custom: {
          base: "dark",
          backgroundDim: 0.2,
        },
      },
      omitBackgroundImage: true,
    });
    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).toContain(
      "#16181c",
    );
    expect(
      document.documentElement.style.getPropertyValue(TOKEN_VAR.backgroundDim),
    ).toBe("0.2");
  });

  it("does not enable rdw-skin for site theme", () => {
    applyAppearanceToDocument({
      appearance: { theme: "site" },
    });
    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      false,
    );
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe("site");
  });
});

describe("whenDomReady + scheduleAfterFirstPaint", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defers callback until DOMContentLoaded while loading", () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "loading",
    });
    const callback = vi.fn();
    whenDomReady(callback);
    expect(callback).not.toHaveBeenCalled();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("runs immediately when document is already interactive", () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "interactive",
    });
    const callback = vi.fn();
    whenDomReady(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("runs after rAF then zero-delay timeout", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });
    scheduleAfterFirstPaint(callback);
    expect(callback).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(raf).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("boot order contract", () => {
  beforeEach(() => {
    installGmMocks();
    document.documentElement.removeAttribute(RDW_THEME_ATTR);
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    document.getElementById(SITE_SKIN_STYLE_ID)?.remove();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("injects styles before DOMContentLoaded and modules after paint gate", () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "loading",
    });

    const order: string[] = [];
    const startApp = vi.fn(() => {
      order.push("modules");
    });

    bootEarly();
    order.push("styles");
    expect(document.getElementById(TOKEN_STYLE_ID)).toBeInstanceOf(
      HTMLStyleElement,
    );
    expect(startApp).not.toHaveBeenCalled();

    whenDomReady(() => {
      scheduleAfterFirstPaint(() => {
        startApp();
      });
    });
    expect(startApp).not.toHaveBeenCalled();
    expect(order).toEqual(["styles"]);

    vi.useFakeTimers();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      },
    );
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(startApp).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(startApp).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["styles", "modules"]);
    vi.useRealTimers();
  });
});

describe("token injection helpers", () => {
  beforeEach(() => {
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    document.getElementById(SITE_SKIN_STYLE_ID)?.remove();
  });

  it("reuses the same style element on reinject", () => {
    const first = injectTokenStyles(LIGHT_PALETTE);
    const second = injectTokenStyles(LIGHT_PALETTE);
    expect(first).toBe(second);
    expect(document.querySelectorAll(`#${TOKEN_STYLE_ID}`).length).toBe(1);
  });

  it("fills the site-skin style element when CSS is passed", () => {
    const css = getSiteSkinCss();
    const hook = injectSiteSkinHook(css);
    expect(hook.id).toBe(SITE_SKIN_STYLE_ID);
    expect(hook.textContent).toBe(css);
  });
});

describe("old storage still loads for boot", () => {
  beforeEach(() => {
    installGmMocks();
    document.getElementById(TOKEN_STYLE_ID)?.remove();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults appearance to light when settings are missing", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: {},
    });
    bootEarly();
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe("light");
    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).toContain(
      LIGHT_PALETTE.bg,
    );
  });
});
