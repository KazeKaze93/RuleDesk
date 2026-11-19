import { h, render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY } from "../src/config/constants";
import { notifyThumbsAdded, onThumbsAdded, resetThumbsBus } from "../src/site/thumbs-bus";
import { readCountMirror, readCoverMirror } from "../src/storage/cover-mirror";
import { Button, KitStylesProvided } from "../src/ui/kit";
import { clearFavsCache } from "../src/storage/favs";
import {
  clearStorageCache,
  getFeatureState,
  load,
  setFeatureState,
  setPostSeenMark,
} from "../src/storage/store";

/** What the audit of 19.11.2026 found, held by tests. */

const memory = new Map<string, unknown>();
let mainReads = 0;
let mainWrites = 0;

beforeEach(() => {
  memory.clear();
  mainReads = 0;
  mainWrites = 0;
  clearStorageCache();
  clearFavsCache();
  resetThumbsBus();
  localStorage.clear();
  vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown => {
    if (key === STORAGE_KEY) {
      mainReads += 1;
    }
    return memory.has(key) ? structuredClone(memory.get(key)) : fallback;
  });
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    if (key === STORAGE_KEY) {
      mainWrites += 1;
    }
    memory.set(key, structuredClone(value));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the event of added thumbs", () => {
  it("is heard by the others when one listener throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const heard: string[] = [];
    onThumbsAdded(() => {
      throw new Error("broken listener");
    });
    onThumbsAdded(() => {
      heard.push("second");
    });
    expect(() => {
      notifyThumbsAdded(document);
    }).not.toThrow();
    expect(heard).toEqual(["second"]);
  });
});

describe("the thumbs a listener is shown", () => {
  it("are the added ones only, when the caller names them", () => {
    const list = document.createElement("div");
    list.innerHTML =
      '<span class="thumb" id="old"></span><span class="thumb" id="new"></span><div id="wrap"><span class="thumb" id="inner"></span></div>';
    const fresh = list.querySelector("#new");
    const wrap = list.querySelector("#wrap");
    const seen: string[][] = [];
    onThumbsAdded((root) => {
      seen.push([...root.querySelectorAll("span.thumb")].map((thumb) => thumb.id));
    });
    // The whole list: every thumb, as before.
    notifyThumbsAdded(list);
    // The nodes put in: themselves when they match, and what is inside them.
    notifyThumbsAdded(list, fresh === null || wrap === null ? [] : [fresh, wrap]);
    expect(seen).toEqual([
      ["old", "new", "inner"],
      ["new", "inner"],
    ]);
  });
});

describe("the styles of the kit", () => {
  it("come with each component, but not inside a tree that has them already", () => {
    const alone = document.createElement("div");
    const inside = document.createElement("div");
    render(h(Button, null, "One"), alone);
    render(h(KitStylesProvided.Provider, { value: true }, h(Button, null, "Two")), inside);
    expect(alone.querySelectorAll("style")).toHaveLength(1);
    expect(inside.querySelectorAll("style")).toHaveLength(0);
    expect(inside.querySelector("button")?.className).toContain("rdw-btn");
  });
});

describe("writes of the storage", () => {
  it("reads the storage once to load it, not three times", () => {
    setFeatureState("a", 1);
    clearStorageCache();
    mainReads = 0;
    load();
    expect(mainReads).toBe(1);
  });

  it("does not write a value that is there already", () => {
    setFeatureState("volume", { level: 0.5 });
    const writes = mainWrites;
    setFeatureState("volume", { level: 0.5 });
    expect(mainWrites).toBe(writes);
    setFeatureState("volume", { level: 0.6 });
    expect(mainWrites).toBe(writes + 1);
    expect(getFeatureState("volume")).toEqual({ level: 0.6 });
  });

  it("does not write a post as seen twice", () => {
    setPostSeenMark("5");
    const writes = mainWrites;
    setPostSeenMark("5");
    expect(mainWrites).toBe(writes);
    expect(load().marks["5"]?.seen).toBe(true);
  });
});

describe("the mirrors of covers and counts", () => {
  it("give nothing for an id that is a word every object has", () => {
    expect(readCoverMirror("constructor")).toBeNull();
    expect(readCountMirror("constructor")).toBeNull();
    expect(readCountMirror("toString")).toBeNull();
  });
});
