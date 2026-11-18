import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import { DownloadsSection } from "../src/pages/downloads-section";
import { readFileMask } from "../src/storage/download-name";
import { createDefaultStorage } from "../src/storage/schema";
import { clearStorageCache, save } from "../src/storage/store";
import { cleanupKit, fireClick, renderKit } from "./kit/render";

const KEY_FIELD = "#rdw-api-credentials";
const MASK_FIELD = "#rdw-download-name";
const PREVIEW_PREFIX = "Files are saved as:";

const memory = new Map<string, unknown>();
const hosts: HTMLElement[] = [];

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : defaultValue,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

async function mount(): Promise<HTMLElement> {
  let host: HTMLElement | undefined;
  await act(async () => {
    host = renderKit(<DownloadsSection />);
  });
  if (host === undefined) {
    throw new Error("the section did not mount");
  }
  hosts.push(host);
  return host;
}

function saveKeyButton(host: HTMLElement): HTMLButtonElement {
  const found = host.querySelector(`form:has(${KEY_FIELD}) button[type='submit']`);
  if (!(found instanceof HTMLButtonElement)) {
    throw new Error("no Save button by the key field");
  }
  return found;
}

function typeInto(host: HTMLElement, selector: string, text: string): void {
  const input = host.querySelector(selector);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`no input ${selector}`);
  }
  act(() => {
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

/** Opens the list of masks and returns its rows. */
function openMasks(host: HTMLElement): HTMLElement[] {
  const trigger = host.querySelector(".rdw-select__trigger");
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error("no list of masks");
  }
  fireClick(trigger);
  return Array.from(document.querySelectorAll<HTMLElement>("[role='option']"));
}

describe("DownloadsSection", () => {
  beforeEach(() => {
    installGmMocks();
    save(createDefaultStorage());
  });

  afterEach(() => {
    while (hosts.length > 0) {
      const host = hosts.pop();
      if (host !== undefined) {
        cleanupKit(host);
      }
    }
    document.querySelectorAll("[role='listbox']").forEach((node) => {
      node.remove();
    });
    vi.unstubAllGlobals();
  });

  it("keeps Save off until something is typed into the key field", async () => {
    const host = await mount();
    expect(saveKeyButton(host).disabled).toBe(true);
    typeInto(host, KEY_FIELD, "   ");
    expect(saveKeyButton(host).disabled).toBe(true);
    typeInto(host, KEY_FIELD, "&api_key=abc&user_id=1");
    expect(saveKeyButton(host).disabled).toBe(false);
  });

  it("explains the key under the key field and the folder under File name", async () => {
    const host = await mount();
    const keyForm = host.querySelector(`form:has(${KEY_FIELD})`);
    const nameForm = host.querySelector("form:has(.rdw-select)");
    expect(keyForm?.textContent).toContain("Generate it on the account options page");
    expect(keyForm?.querySelector("a")?.getAttribute("href")).toContain("page=account");
    expect(keyForm?.textContent).not.toContain("download folder");
    expect(nameForm?.textContent).toContain("Files go to the browser's download folder");
    expect(nameForm?.textContent).not.toContain("Generate it");
  });

  it("names every mask in the list, with its example after the name, Custom first", async () => {
    const host = await mount();
    const labels = openMasks(host).map((row) => row.textContent ?? "");
    const today = new Date().toISOString().slice(0, "2026-11-18".length);
    expect(labels).toEqual([
      "Custom…",
      "Site + ID — rule34-19374686.jpg",
      "ID — 19374686.jpg",
      "MD5 hash — 0f3a…2b3c.jpg",
      `Date + ID — ${today} 19374686.jpg`,
      "ID + size — 19374686 1080x1632.jpg",
      "Rating + ID — explicit 19374686.jpg",
      "Uploader + ID — uploader 19374686.jpg",
    ]);
  });

  it("shows the chosen mask by its name and repeats no example under the field", async () => {
    const host = await mount();
    expect(host.querySelector(".rdw-select__trigger")?.textContent).toBe(
      "Site + ID — rule34-19374686.jpg",
    );
    expect(host.textContent).not.toContain(PREVIEW_PREFIX);

    const rating = openMasks(host).find((row) => row.textContent?.startsWith("Rating + ID"));
    if (rating === undefined) {
      throw new Error("no Rating + ID mask");
    }
    fireClick(rating);
    expect(readFileMask()).toBe("[rating] [id]");
    expect(host.querySelector("[role='status']")?.textContent).toBe("Saved.");
    expect(host.textContent).not.toContain(PREVIEW_PREFIX);
  });

  it("shows what a custom name gives, as it is built from parts", async () => {
    const host = await mount();
    const custom = openMasks(host)[0];
    if (custom === undefined) {
      throw new Error("no Custom row");
    }
    fireClick(custom);
    typeInto(host, MASK_FIELD, "my [id]");
    expect(host.querySelector("[role='status']")?.textContent).toBe(
      `${PREVIEW_PREFIX} my 19374686.jpg`,
    );
  });
});
