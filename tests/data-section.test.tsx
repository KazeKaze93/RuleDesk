import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act } from "preact/test-utils";

import { artistsExportText, DataSection } from "../src/pages/data-section";
import { clearFavsCache } from "../src/storage/favs";
import { createDefaultStorage } from "../src/storage/schema";
import { addArtist, clearStorageCache, load, save } from "../src/storage/store";
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

  it("writes followed artists as one tag per line, in name order", () => {
    expect(artistsExportText(["nyx_x", "0zmann", "nero100"])).toBe(
      "0zmann\nnero100\nnyx_x\n",
    );
  });

  it("refuses to export an empty artist list", () => {
    const host = renderKit(<DataSection />);
    hosts.push(host);
    const exportButton = Array.from(host.querySelectorAll("button")).find(
      (node) => node.textContent === "Export artists",
    );
    if (exportButton === undefined) {
      throw new Error("Export artists button missing");
    }
    act(() => {
      exportButton.click();
    });
    expect(host.textContent).toContain("No followed artists to export.");
  });

  it("follows the tags of an imported text file and counts the rest", async () => {
    addArtist("nyx_x");
    const host = renderKit(<DataSection />);
    hosts.push(host);
    const input = host.querySelector('input[type="file"][accept="text/plain,.txt"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("artists file input missing");
    }
    const file = new File(["nyx_x\nnero100\n(\n0zmann\n"], "artists.txt", {
      type: "text/plain",
    });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    act(() => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(host.textContent).toContain(
        "Followed 2 new artists, already followed 1, invalid 1.",
      );
    });
    expect(load().artists.map((entry) => entry.tag)).toEqual([
      "nyx_x",
      "nero100",
      "0zmann",
    ]);
  });
});
