import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DataSection } from "../src/pages/data-section";
import { clearFavsCache } from "../src/storage/favs";
import { createDefaultStorage } from "../src/storage/schema";
import { clearStorageCache, save } from "../src/storage/store";
import { cleanupKit, renderKit } from "./kit/render";

const memory = new Map<string, unknown>();
const hosts: HTMLElement[] = [];

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  clearFavsCache();
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

describe("DataSection", () => {
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
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows Include favorites off by default with sync restore note", () => {
    const host = renderKit(<DataSection />);
    hosts.push(host);
    const text = host.textContent ?? "";
    expect(text).toContain("Include favorites");
    expect(text).toContain("Favorites restore via Favorites sync");
    const favSwitch = host.querySelector("#rdw-backup-include-favs");
    expect(favSwitch).not.toBeNull();
    if (!(favSwitch instanceof HTMLButtonElement)) {
      throw new Error("expected favorites switch button");
    }
    expect(favSwitch.getAttribute("aria-checked")).toBe("false");
  });

  it("has one export and one import, with artists named as part of the file", () => {
    const host = renderKit(<DataSection />);
    hosts.push(host);
    const labels = Array.from(host.querySelectorAll("button"))
      .map((node) => node.textContent)
      .filter((text) => text === "Export" || text === "Import");
    expect(labels).toEqual(["Export", "Import"]);
    expect(host.textContent).not.toContain("Export artists");
    expect(host.textContent).toContain("followed artists (with covers and post counts)");
  });
});
