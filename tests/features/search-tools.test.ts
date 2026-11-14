import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import { DEBUG_KEY } from "../../src/config/constants";
import {
  SEARCH_TOOLS_AI_ROW_BODY_CLASS,
  searchToolsFeature,
} from "../../src/features/search-tools";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { SITE_SELECTORS } from "../../src/site/selectors";
import {
  clearArtistsMirror,
  writeArtistsMirror,
} from "../../src/storage/artists-mirror";
import { clearStorageCache, save } from "../../src/storage/store";
import { createDefaultStorage } from "../../src/storage/schema";

const ROOT_ID = "rdw-search-tools";
const CHIP_CLASS = "rdw-search-tools-chip";
const CHIPS_CLASS = "rdw-search-tools-chips";
const NAV_DEBOUNCE_MS = 400;
const FOOT_HINT =
  "Typing needs Search or Enter; chips and filters apply instantly";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  clearArtistsMirror();
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
}

function makeCtx(): FeatureContext {
  return {
    pageKind: "list",
    search: "?page=post&s=list&tags=a+b",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildSearchForm(value = ""): {
  form: HTMLFormElement;
  input: HTMLInputElement;
  parent: HTMLElement;
} {
  const parent = document.createElement("div");
  parent.id = "search-host";
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.name = "tags";
  input.value = value;
  const awesomplete = document.createElement("div");
  awesomplete.className = "awesomplete";
  form.append(input, awesomplete);
  parent.append(form);
  document.body.append(parent);
  return { form, input, parent };
}

function chipRoots(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll(`#${ROOT_ID} .${CHIP_CLASS}`),
  ).filter((node): node is HTMLElement => node instanceof HTMLElement);
}

function chipLabels(): string[] {
  return chipRoots().map((chip) => {
    const label = chip.querySelector(":scope > span");
    return label?.textContent ?? chip.textContent ?? "";
  });
}

function mediaRadio(label: string): HTMLButtonElement {
  const buttons = Array.from(
    document.querySelectorAll(`#${ROOT_ID} [role="radiogroup"][aria-label="Media"] button`),
  );
  for (const node of buttons) {
    if (!(node instanceof HTMLButtonElement)) {
      continue;
    }
    if (node.textContent === label) {
      return node;
    }
  }
  throw new Error(`media button not found: ${label}`);
}

function aiPostsRadio(label: string): HTMLButtonElement {
  const buttons = Array.from(
    document.querySelectorAll(
      `#${ROOT_ID} [role="radiogroup"][aria-label="AI posts"] button`,
    ),
  );
  for (const node of buttons) {
    if (!(node instanceof HTMLButtonElement)) {
      continue;
    }
    if (node.textContent === label) {
      return node;
    }
  }
  throw new Error(`AI posts button not found: ${label}`);
}

function mountFilterAiCheckbox(checked = false): HTMLInputElement {
  const li = document.createElement("li");
  const label = document.createElement("label");
  label.append("Filter AI posts");
  const switchSpan = document.createElement("span");
  switchSpan.className = "switch";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.className = "toggleSwitch";
  input.id = "chkFilterAI";
  input.checked = checked;
  const slider = document.createElement("span");
  slider.className = "slider";
  switchSpan.append(input, slider);
  label.append(switchSpan);
  li.append(label);
  document.body.append(li);
  return input;
}

function resetButton(): HTMLButtonElement {
  const buttons = Array.from(document.querySelectorAll(`#${ROOT_ID} button`));
  for (const node of buttons) {
    if (!(node instanceof HTMLButtonElement)) {
      continue;
    }
    if (node.textContent === "Reset search") {
      return node;
    }
  }
  throw new Error("Reset search button not found");
}

function mountFeature(): void {
  act(() => {
    searchToolsFeature.mount(makeCtx());
  });
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("searchToolsFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    installGmMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for list and post", () => {
    expect(searchToolsFeature.id).toBe("search-tools");
    expect(searchToolsFeature.label).toBe("Search tools");
    expect(searchToolsFeature.pages).toEqual(["list", "post"]);
    expect(searchToolsFeature.defaultEnabled).toBe(true);
  });

  it("scopes every css rule under body.rdw-f-search-tools", () => {
    const bodyClass = featureBodyClass("search-tools");
    const rules = searchToolsFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("parses whitespace tokens into chips under the form", () => {
    const { form, input } = buildSearchForm("cat  dog  -bird");
    mountFeature();

    const root = document.getElementById(ROOT_ID);
    expect(root).not.toBeNull();
    expect(root?.previousElementSibling).toBe(form);
    expect(chipLabels()).toEqual(["cat", "dog", "-bird"]);
    expect(chipRoots()[2]?.classList.contains("rdw-chip--exclude")).toBe(true);
    expect(chipRoots()[0]?.classList.contains("rdw-chip--exclude")).toBe(false);
    expect(
      chipRoots()[0]
        ?.querySelector("button.rdw-chip__remove")
        ?.getAttribute("aria-label"),
    ).toBe("Remove cat");
    expect(input.parentElement).toBe(form);
  });

  it("hides controlled media/sort/score tokens from chips", () => {
    buildSearchForm("cat -video sort:score:desc score:>=10 dog");
    mountFeature();
    expect(chipLabels()).toEqual(["cat", "dog"]);
    expect(mediaRadio("Images").getAttribute("aria-checked")).toBe("true");
    const sortTrigger = document.querySelector(
      `#${ROOT_ID} .rdw-select__trigger`,
    );
    expect(sortTrigger?.textContent).toContain("Top score");
  });

  it("renders OR-group and id-group as single chips", () => {
    save({
      ...createDefaultStorage(),
      artists: [{ tag: "nyx_x" }, { tag: "other_artist" }],
    });
    buildSearchForm("( nyx_x ~ other_artist ) ( id:10 ~ id:20 ~ id:30 )");
    mountFeature();
    expect(chipLabels()).toEqual(["Feed · 2 artists", "3 posts"]);
    expect(chipRoots()[0]?.classList.contains("rdw-chip--group")).toBe(true);
    expect(chipRoots()[0]?.getAttribute("title")).toBe("nyx_x other_artist");
    expect(chipRoots()[1]?.getAttribute("title")).toContain("id:10");
  });

  it("labels partial OR-groups as Any of N tags", () => {
    save({
      ...createDefaultStorage(),
      artists: [{ tag: "a" }, { tag: "b" }, { tag: "c" }],
    });
    buildSearchForm("( a ~ b )");
    mountFeature();
    expect(chipLabels()).toEqual(["Any of 2 tags"]);
    expect(chipRoots()[0]?.getAttribute("title")).toBe("a b");
  });

  it("labels Feed chip from mirror artists absent from GM store", () => {
    save({
      ...createDefaultStorage(),
      artists: [{ tag: "nyx_x" }],
    });
    writeArtistsMirror(["nyx_x", "mirror_only"]);
    buildSearchForm("( nyx_x ~ mirror_only )");
    mountFeature();
    expect(chipLabels()).toEqual(["Feed · 2 artists"]);
  });

  it("does not move form, input, or awesomplete and keeps the same parent", () => {
    const { form, input, parent } = buildSearchForm("one two");
    const awesomplete = form.querySelector("div.awesomplete");
    expect(awesomplete).not.toBeNull();

    mountFeature();

    expect(form.parentElement).toBe(parent);
    expect(input.parentElement).toBe(form);
    expect(awesomplete?.parentElement).toBe(form);
    expect(input.getAttribute("name")).toBe("tags");
    expect(document.getElementById(ROOT_ID)?.previousElementSibling).toBe(form);
  });

  it("toggles include/exclude via delegated chip click and removes via ×", () => {
    const { input } = buildSearchForm("alpha beta gamma");
    mountFeature();

    const beta = chipRoots()[1];
    expect(beta).toBeTruthy();
    click(beta!);
    expect(input.value).toBe("alpha -beta gamma");
    expect(chipLabels()).toEqual(["alpha", "-beta", "gamma"]);

    const remove = chipRoots()[1]?.querySelector("button.rdw-chip__remove");
    expect(remove).toBeTruthy();
    click(remove!);
    expect(input.value).toBe("alpha gamma");
    expect(chipLabels()).toEqual(["alpha", "gamma"]);
  });

  it("removes a whole OR-group with one × click", () => {
    const { input } = buildSearchForm("keep ( a ~ b ) tail");
    mountFeature();
    expect(chipLabels()).toEqual(["keep", "Any of 2 tags", "tail"]);
    const remove = chipRoots()[1]?.querySelector("button.rdw-chip__remove");
    click(remove!);
    expect(input.value).toBe("keep tail");
    expect(chipLabels()).toEqual(["keep", "tail"]);
  });

  it("never focuses or dispatches input/keydown on the site tags field", () => {
    const { input } = buildSearchForm("cat dog");
    const focusSpy = vi.spyOn(input, "focus");
    const dispatchSpy = vi.spyOn(input, "dispatchEvent");
    mountFeature();

    click(chipRoots()[0]!);
    click(mediaRadio("Images"));

    expect(focusSpy).not.toHaveBeenCalled();
    const typedEvents = dispatchSpy.mock.calls.filter(([event]) => {
      if (!(event instanceof Event)) {
        return false;
      }
      return event.type === "input" || event.type === "keydown";
    });
    expect(typedEvents).toHaveLength(0);
  });

  it("keeps chip node identity when the free-token string is unchanged", () => {
    const { input } = buildSearchForm("cat -video");
    mountFeature();
    const before = chipRoots()[0];
    expect(before?.textContent).toContain("cat");

    act(() => {
      click(mediaRadio("Videos"));
    });
    const after = chipRoots()[0];
    expect(input.value).toBe("cat video");
    expect(after).toBe(before);
  });

  it("uses container delegation so chips remain clickable after control updates", () => {
    const { input } = buildSearchForm("alpha beta");
    mountFeature();
    click(mediaRadio("Images"));
    expect(input.value).toBe("alpha beta -video");

    click(chipRoots()[1]!);
    expect(input.value).toBe("alpha -beta -video");
  });

  it("debounces navigation by 400ms and resets the timer on new changes", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: "?page=post&s=list&tags=cat",
    });
    const { input } = buildSearchForm("cat dog");
    mountFeature();

    click(mediaRadio("Images"));
    expect(input.value).toBe("cat dog -video");
    expect(assign).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(assign).not.toHaveBeenCalled();

    click(mediaRadio("Videos"));
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(assign).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(assign).toHaveBeenCalledTimes(1);
    const url = String(assign.mock.calls[0]?.[0] ?? "");
    expect(url).toContain("video");
    expect(url).not.toContain("-video");
  });

  it("colors chips from tag-sidebar type classes", () => {
    const sidebar = document.createElement("ul");
    sidebar.id = "tag-sidebar";
    const li = document.createElement("li");
    li.className = "tag-type-artist";
    const link = document.createElement("a");
    link.href = "index.php?page=post&s=list&tags=nyx_x";
    link.textContent = "nyx x";
    li.append(link);
    sidebar.append(li);
    document.body.append(sidebar);

    buildSearchForm("nyx_x other");
    mountFeature();

    expect(chipRoots()[0]?.classList.contains("rdw-chip--artist")).toBe(true);
    expect(chipRoots()[1]?.classList.contains("rdw-chip--artist")).toBe(false);
  });

  it("updates chips from site input events without stealing focus or navigating", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: "?page=post&s=list&tags=a",
    });
    const { input } = buildSearchForm("a");
    mountFeature();
    input.focus();
    expect(document.activeElement).toBe(input);

    act(() => {
      input.value = "a b";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(chipLabels()).toEqual(["a", "b"]);
    expect(document.activeElement).toBe(input);

    act(() => {
      vi.advanceTimersByTime(NAV_DEBOUNCE_MS);
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not navigate on tags input, change, or awesomplete-selectcomplete", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: "?page=post&s=list&tags=start",
    });
    const { input } = buildSearchForm("start");
    mountFeature();

    act(() => {
      input.value = "start typed";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      vi.advanceTimersByTime(NAV_DEBOUNCE_MS);
    });
    expect(chipLabels()).toEqual(["start", "typed"]);
    expect(assign).not.toHaveBeenCalled();

    act(() => {
      input.value = "start typed more";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    act(() => {
      vi.advanceTimersByTime(NAV_DEBOUNCE_MS);
    });
    expect(chipLabels()).toEqual(["start", "typed", "more"]);
    expect(assign).not.toHaveBeenCalled();

    act(() => {
      input.value = "start typed more auto";
      input.dispatchEvent(
        new Event("awesomplete-selectcomplete", { bubbles: true }),
      );
    });
    act(() => {
      vi.advanceTimersByTime(NAV_DEBOUNCE_MS);
    });
    expect(chipLabels()).toEqual(["start", "typed", "more", "auto"]);
    expect(assign).not.toHaveBeenCalled();
  });

  it("still auto-applies navigation for chip toggle and media", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: "?page=post&s=list&tags=alpha+beta",
    });
    const { input } = buildSearchForm("alpha beta");
    mountFeature();

    click(chipRoots()[1]!);
    expect(input.value).toBe("alpha -beta");
    act(() => {
      vi.advanceTimersByTime(NAV_DEBOUNCE_MS);
    });
    expect(assign).toHaveBeenCalledTimes(1);
    expect(String(assign.mock.calls[0]?.[0] ?? "")).toContain("-beta");

    assign.mockClear();
    click(mediaRadio("Images"));
    expect(input.value).toBe("alpha -beta -video");
    act(() => {
      vi.advanceTimersByTime(NAV_DEBOUNCE_MS);
    });
    expect(assign).toHaveBeenCalledTimes(1);
    expect(String(assign.mock.calls[0]?.[0] ?? "")).toContain("-video");
  });

  it("polls programmatic value changes for chips only without navigating", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: "?page=post&s=list&tags=start",
    });
    const { input } = buildSearchForm("start");
    mountFeature();
    expect(chipLabels()).toEqual(["start"]);

    input.value = "start next";
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(chipLabels()).toEqual(["start", "next"]);
    expect(assign).not.toHaveBeenCalled();
  });

  it("rereads after tag-sidebar click on the next macrotask", () => {
    const { input } = buildSearchForm("old");
    const sidebar = document.createElement("ul");
    sidebar.id = "tag-sidebar";
    document.body.append(sidebar);
    mountFeature();

    input.value = "old new";
    act(() => {
      sidebar.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(chipLabels()).toEqual(["old"]);

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(chipLabels()).toEqual(["old", "new"]);
  });

  it("warns and returns when the search form is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      mountFeature();
    }).not.toThrow();
    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("has no Save search link without tags in the page address, and no Collections control", () => {
    vi.stubGlobal("location", {
      ...window.location,
      search: "?page=post&s=list",
    });
    buildSearchForm("fox");
    mountFeature();
    const root = document.getElementById(ROOT_ID);
    expect(root?.textContent).not.toContain("Save search");
    expect(root?.textContent).not.toContain("Collections");
    expect(root?.textContent).toContain(FOOT_HINT);
    expect(root?.textContent).not.toContain("Applies instantly");
    expect(root?.querySelector(`.${CHIPS_CLASS}`)).not.toBeNull();
  });

  it("shows a quiet Save search link under Reset search when the page has tags", () => {
    vi.stubGlobal("location", {
      ...window.location,
      search: "?page=post&s=list&tags=fox",
    });
    buildSearchForm("fox");
    mountFeature();
    const links = document.querySelector(`#${ROOT_ID} .rdw-search-tools-foot-links`);
    const labels = Array.from(links?.querySelectorAll("button") ?? []).map(
      (button) => button.textContent,
    );
    expect(labels).toEqual(["Reset search", "Save search"]);
  });

  it("omits the Tags section when there are no chips", () => {
    buildSearchForm("-video sort:score:desc");
    mountFeature();
    const root = document.getElementById(ROOT_ID);
    expect(root?.querySelector(`.${CHIPS_CLASS}`)).toBeNull();
    expect(root?.textContent).not.toContain("Tags");
    expect(mediaRadio("Images").getAttribute("aria-checked")).toBe("true");
  });

  it("omits the Tags section for an empty tags field", () => {
    buildSearchForm("");
    mountFeature();
    const root = document.getElementById(ROOT_ID);
    expect(root?.querySelector(`.${CHIPS_CLASS}`)).toBeNull();
    expect(root?.textContent).not.toContain("Tags");
  });

  it("Reset search navigates to an empty tag list", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: "?page=post&s=list&tags=cat",
    });
    const { input } = buildSearchForm("cat dog -video");
    mountFeature();

    click(resetButton());
    expect(input.value).toBe("");
    expect(assign).toHaveBeenCalledTimes(1);
    const url = String(assign.mock.calls[0]?.[0] ?? "");
    expect(url).toContain("tags=");
    expect(url.endsWith("tags=") || url.includes("tags=&") || /tags=$/.test(url)).toBe(
      true,
    );
    expect(url).not.toContain("cat");
  });

  it("exposes sort hint on the sort/score row", () => {
    buildSearchForm("cat");
    mountFeature();
    const hinted = document.querySelector(
      `#${ROOT_ID} [title="Sorts within the current search"]`,
    );
    expect(hinted).not.toBeNull();
  });

  it("omits the AI posts row when #chkFilterAI is absent", () => {
    buildSearchForm("cat");
    mountFeature();
    const root = document.getElementById(ROOT_ID);
    expect(root?.textContent).not.toContain("AI posts");
    expect(
      root?.querySelector('[role="radiogroup"][aria-label="AI posts"]'),
    ).toBeNull();
    expect(
      document.body.classList.contains(SEARCH_TOOLS_AI_ROW_BODY_CLASS),
    ).toBe(false);
  });

  it("keeps native Filter AI visible (no body class) until timeout without checkbox", () => {
    buildSearchForm("cat");
    mountFeature();
    expect(
      document.body.classList.contains(SEARCH_TOOLS_AI_ROW_BODY_CLASS),
    ).toBe(false);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(
      document.body.classList.contains(SEARCH_TOOLS_AI_ROW_BODY_CLASS),
    ).toBe(false);
    expect(
      document
        .getElementById(ROOT_ID)
        ?.querySelector('[role="radiogroup"][aria-label="AI posts"]'),
    ).toBeNull();
  });

  it("adds AI-row body class only after #chkFilterAI appears via MutationObserver", async () => {
    buildSearchForm("cat");
    mountFeature();
    expect(
      document.body.classList.contains(SEARCH_TOOLS_AI_ROW_BODY_CLASS),
    ).toBe(false);
    expect(
      document
        .getElementById(ROOT_ID)
        ?.querySelector('[role="radiogroup"][aria-label="AI posts"]'),
    ).toBeNull();

    await act(async () => {
      mountFilterAiCheckbox(false);
      // jsdom delivers MutationObserver callbacks on a microtask.
      await Promise.resolve();
    });

    expect(
      document.body.classList.contains(SEARCH_TOOLS_AI_ROW_BODY_CLASS),
    ).toBe(true);
    expect(
      document
        .getElementById(ROOT_ID)
        ?.querySelector('[role="radiogroup"][aria-label="AI posts"]'),
    ).not.toBeNull();
    expect(SEARCH_TOOLS_AI_ROW_BODY_CLASS).toBe("rdw-search-tools-ai-posts");
  });

  it("mirrors #chkFilterAI into AI posts Show/Hide under Source", () => {
    mountFilterAiCheckbox(false);
    buildSearchForm("cat");
    mountFeature();

    const group = document.querySelector(
      `#${ROOT_ID} [role="radiogroup"][aria-label="AI posts"]`,
    );
    expect(group).not.toBeNull();
    expect(
      document.body.classList.contains(SEARCH_TOOLS_AI_ROW_BODY_CLASS),
    ).toBe(true);
    expect(aiPostsRadio("Show").getAttribute("aria-checked")).toBe("true");
    expect(aiPostsRadio("Hide").getAttribute("aria-checked")).toBe("false");
  });

  it("selects Hide when the native AI filter checkbox is checked", () => {
    mountFilterAiCheckbox(true);
    buildSearchForm("cat");
    mountFeature();
    expect(aiPostsRadio("Hide").getAttribute("aria-checked")).toBe("true");
    expect(aiPostsRadio("Show").getAttribute("aria-checked")).toBe("false");
  });

  it("clicks the native checkbox when toggling AI posts Show/Hide", () => {
    const checkbox = mountFilterAiCheckbox(false);
    const clickSpy = vi.spyOn(checkbox, "click");
    buildSearchForm("cat");
    mountFeature();

    click(aiPostsRadio("Hide"));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(checkbox.checked).toBe(true);
    expect(aiPostsRadio("Hide").getAttribute("aria-checked")).toBe("true");

    clickSpy.mockClear();
    click(aiPostsRadio("Show"));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(checkbox.checked).toBe(false);
    expect(aiPostsRadio("Show").getAttribute("aria-checked")).toBe("true");
  });

  it("does not click the native checkbox when the AI option already matches", () => {
    const checkbox = mountFilterAiCheckbox(false);
    const clickSpy = vi.spyOn(checkbox, "click");
    buildSearchForm("cat");
    mountFeature();

    click(aiPostsRadio("Show"));
    expect(clickSpy).not.toHaveBeenCalled();
    expect(checkbox.checked).toBe(false);
  });

  it("syncs AI posts Segmented when the native checkbox changes", () => {
    const checkbox = mountFilterAiCheckbox(false);
    buildSearchForm("cat");
    mountFeature();
    expect(aiPostsRadio("Show").getAttribute("aria-checked")).toBe("true");

    act(() => {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(aiPostsRadio("Hide").getAttribute("aria-checked")).toBe("true");
  });

  it("never reads or writes a filter_ai cookie when toggling AI posts", () => {
    const checkbox = mountFilterAiCheckbox(false);
    buildSearchForm("cat");
    mountFeature();

    const cookieBefore = document.cookie;
    expect(cookieBefore).not.toContain("filter_ai");

    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
    const setSpy =
      descriptor?.set !== undefined
        ? vi.spyOn(document, "cookie", "set")
        : null;

    click(aiPostsRadio("Hide"));
    expect(checkbox.checked).toBe(true);
    expect(document.cookie).not.toContain("filter_ai");
    if (setSpy !== null) {
      for (const call of setSpy.mock.calls) {
        expect(String(call[0] ?? "")).not.toContain("filter_ai");
      }
    }
  });

  it("exposes filter AI and tags-heading selectors for site-skin HANDOFF", () => {
    expect(SITE_SELECTORS.filterAiCheckbox).toBe(
      "input.toggleSwitch#chkFilterAI",
    );
    expect(SITE_SELECTORS.filterAiRow).toContain("#chkFilterAI");
    expect(SITE_SELECTORS.tagsHeadingAfterSearchTools).toBe(
      "#rdw-search-tools + h5",
    );
  });
});
