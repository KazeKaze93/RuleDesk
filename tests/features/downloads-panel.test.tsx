import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import {
  DOWNLOADS_MINIMISED_CLASS,
  DOWNLOADS_MINIMISED_KEY,
  downloadChipText,
  downloadStatusText,
  downloadTitle,
  downloadsFeature,
} from "../../src/features/downloads/panel";
import {
  DOWNLOADS_JOB_KEY,
  DOWNLOADS_POSITION_KEY,
  PAUSED_ELSEWHERE,
  resetDownloadsState,
  type DownloadState,
} from "../../src/features/downloads/queue";
import type { FeatureContext } from "../../src/features/types";
import { RDW_DOWNLOADS_PANEL_ID } from "../../src/pages/constants";
import { clearStorageCache } from "../../src/storage/store";

const RUNNING_TAB_KEY = "ruledesk-web.downloads.running";
const memory = new Map<string, unknown>();

const BASE: DownloadState = {
  phase: "running",
  label: "test",
  selected: null,
  expected: null,
  total: 3,
  done: 2,
  failed: 0,
  message: "",
};

function installGm(): void {
  memory.clear();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : fallback,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function storeJob(extra: Record<string, unknown> = {}): void {
  memory.set(DOWNLOADS_JOB_KEY, {
    label: "Pics",
    folder: "Pics",
    files: [
      { postId: 3, url: "https://wimg.rule34.xxx//images/1/3.png" },
      { postId: 2, url: "https://wimg.rule34.xxx//images/1/2.png" },
    ],
    ...extra,
  });
  memory.set(DOWNLOADS_POSITION_KEY, { next: 1, failed: [] });
}

const CTX: FeatureContext = {
  pageKind: "list",
  search: "",
  getState: <T,>(parse: (raw: unknown) => T): T => parse(undefined),
  setState: (): void => {},
};

async function mountPanel(): Promise<HTMLElement> {
  await act(async () => {
    downloadsFeature.mount(CTX);
  });
  const host = document.getElementById(RDW_DOWNLOADS_PANEL_ID);
  if (host === null) {
    throw new Error("panel host not found");
  }
  return host;
}

function button(host: HTMLElement, text: string): HTMLButtonElement {
  for (const node of host.querySelectorAll("button")) {
    if (node.textContent === text || node.getAttribute("aria-label") === text) {
      return node;
    }
  }
  throw new Error(`button not found: ${text}`);
}

async function click(el: Element): Promise<void> {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("downloads panel texts", () => {
  it("names the job with a verb, and a selection by its number of posts", () => {
    expect(downloadTitle(BASE)).toBe("Downloading “test”");
    expect(downloadTitle({ ...BASE, label: "all (selected)", selected: 1 })).toBe(
      "Downloading 1 selected post",
    );
    expect(downloadTitle({ ...BASE, label: "all (selected)", selected: 4 })).toBe(
      "Downloading 4 selected posts",
    );
    expect(downloadTitle({ ...BASE, phase: "done" })).toBe("Downloaded “test”");
    expect(downloadTitle({ ...BASE, phase: "error", selected: 2 })).toBe(
      "Couldn’t download 2 selected posts",
    );
  });

  it("says the stage in plain words, with the total only when it is known", () => {
    expect(
      downloadStatusText({ ...BASE, phase: "collecting", total: 1, done: 0, expected: 3 }),
    ).toBe("Looking up files… 1 of 3");
    expect(downloadStatusText({ ...BASE, phase: "collecting", total: 40, done: 0 })).toBe(
      "Looking up files… 40 found",
    );
    expect(downloadStatusText(BASE)).toBe("2 of 3 files");
    expect(downloadStatusText({ ...BASE, total: 1, done: 0 })).toBe("0 of 1 file");
    expect(downloadStatusText({ ...BASE, phase: "done", done: 2, failed: 1 })).toBe(
      "Finished · 2 of 3 files, 1 failed",
    );
  });

  it("gives the reason of a pause the user did not make, and none for a manual one", () => {
    expect(downloadStatusText({ ...BASE, phase: "paused" })).toBe("Paused · 2 of 3 files");
    expect(downloadStatusText({ ...BASE, phase: "paused", message: PAUSED_ELSEWHERE })).toBe(
      "Paused: started in another tab or session · 2 of 3 files",
    );
  });

  it("shows the percent on the chip while there is one", () => {
    expect(downloadChipText(BASE)).toBe("67%");
    expect(downloadChipText({ ...BASE, phase: "paused" })).toBe("Paused · 67%");
    expect(downloadChipText({ ...BASE, phase: "collecting" })).toBe("Looking up…");
    expect(downloadChipText({ ...BASE, phase: "done" })).toBe("Done");
    expect(downloadChipText({ ...BASE, phase: "error" })).toBe("Failed");
  });

  it("keeps its rules under the panel and stops the running bar for reduced motion", () => {
    const css = downloadsFeature.css;
    expect(css).toContain("text-transform: none");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*#rdw-[\w-]+ \.rdw-progress__fill--indeterminate \{\s*animation: none;/,
    );
  });
});

describe("downloads panel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.replaceChildren();
    installGm();
    resetDownloadsState();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    resetDownloadsState();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows a job of another tab paused with the reason, Resume being the primary button", async () => {
    storeJob();
    const host = await mountPanel();

    expect(host.querySelector(".rdw-downloads-title")?.textContent).toBe("Downloading “Pics”");
    expect(host.querySelector(".rdw-progress__label")?.textContent).toBe(
      "Paused: started in another tab or session · 1 of 2 files",
    );
    expect(button(host, "Resume").className).toContain("rdw-btn--primary");
    expect(host.textContent).not.toContain("Pause ");
  });

  it("titles a stored selection by its number of posts", async () => {
    storeJob({ label: "all (selected)", selected: 2 });
    const host = await mountPanel();
    expect(host.querySelector(".rdw-downloads-title")?.textContent).toBe(
      "Downloading 2 selected posts",
    );
  });

  it("has Pause while running, and a pause made with it gives no reason", async () => {
    storeJob();
    window.sessionStorage.setItem(RUNNING_TAB_KEY, "1");
    // The file in flight never lands: the job stays running.
    vi.stubGlobal("GM_download", (): void => {});
    const host = await mountPanel();

    expect(host.querySelector(".rdw-progress__label")?.textContent).toBe("1 of 2 files");
    await click(button(host, "Pause"));
    expect(host.querySelector(".rdw-progress__label")?.textContent).toBe(
      "Paused · 1 of 2 files",
    );
    expect(button(host, "Resume").className).toContain("rdw-btn--primary");
  });

  it("minimises into a chip with the percent, opens again, and remembers it in the tab", async () => {
    storeJob();
    const host = await mountPanel();

    await click(button(host, "Minimize"));
    expect(host.classList.contains(DOWNLOADS_MINIMISED_CLASS)).toBe(true);
    expect(window.sessionStorage.getItem(DOWNLOADS_MINIMISED_KEY)).toBe("1");
    const buttons = Array.from(host.querySelectorAll("button"));
    expect(buttons.map((node) => node.textContent)).toEqual(["Paused · 50%"]);

    const chip = buttons[0];
    if (chip === undefined) {
      throw new Error("chip not found");
    }
    await click(chip);
    expect(host.classList.contains(DOWNLOADS_MINIMISED_CLASS)).toBe(false);
    expect(window.sessionStorage.getItem(DOWNLOADS_MINIMISED_KEY)).toBeNull();
    expect(button(host, "Resume")).toBeDefined();
  });

  it("comes up minimised on the next page of the tab", async () => {
    storeJob();
    window.sessionStorage.setItem(DOWNLOADS_MINIMISED_KEY, "1");
    const host = await mountPanel();
    expect(host.classList.contains(DOWNLOADS_MINIMISED_CLASS)).toBe(true);
    expect(host.querySelector(".rdw-downloads-title")).toBeNull();
  });
});
