import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

const { importBackupJson, exportBackupDownload } = vi.hoisted(() => ({
  importBackupJson: vi.fn(),
  exportBackupDownload: vi.fn(),
}));

vi.mock("../src/storage/backup", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/storage/backup")>();
  return {
    ...actual,
    importBackupJson: (...args: Parameters<typeof actual.importBackupJson>) =>
      importBackupJson(...args),
    exportBackupDownload: (...args: Parameters<typeof actual.exportBackupDownload>) =>
      exportBackupDownload(...args),
  };
});

import { DataSection } from "../src/pages/data-section";
import { PANEL_UI_CLASS } from "../src/pages/constants";
import { clearFavsCache } from "../src/storage/favs";
import { BACKUP_DUE_DAYS, rememberBackup } from "../src/storage/history";
import { createDefaultStorage } from "../src/storage/schema";
import { clearStorageCache, load, save } from "../src/storage/store";
import { cleanupKit, fireClick, flushEffects, renderKit } from "./kit/render";

const MS_PER_DAY = 86_400_000;
const FILE_TEXT = '{"format":"ruledesk-web-backup"}';
const PLATE = ".rdw-data-backup-plate";

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

async function mount(): Promise<HTMLElement> {
  let host: HTMLElement | undefined;
  await act(async () => {
    host = renderKit(<DataSection />);
  });
  if (host === undefined) {
    throw new Error("the section did not mount");
  }
  hosts.push(host);
  return host;
}

function buttonsNamed(root: ParentNode, label: string): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll("button")).filter(
    (node) => node.textContent === label,
  );
}

function button(root: ParentNode, label: string): HTMLButtonElement {
  const found = buttonsNamed(root, label)[0];
  if (found === undefined) {
    throw new Error(`no button "${label}"`);
  }
  return found;
}

function dialog(): HTMLElement {
  const found = document.querySelector("[role='dialog']");
  if (!(found instanceof HTMLElement)) {
    throw new Error("no dialog");
  }
  return found;
}

/** Picks a file in Import and waits until it is read. */
async function chooseFile(host: HTMLElement): Promise<void> {
  const input = host.querySelector("input[type='file']");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("no file input");
  }
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [new File([FILE_TEXT], "backup.json", { type: "application/json" })],
  });
  act(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await vi.waitFor(() => {
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
  });
  await flushEffects();
}

describe("DataSection", () => {
  beforeEach(() => {
    installGmMocks();
    save(createDefaultStorage());
    importBackupJson.mockReset();
    importBackupJson.mockResolvedValue({
      ok: true,
      summary: { artistCount: 1, collectionCount: 2, favCount: 3 },
    });
    exportBackupDownload.mockReset();
    exportBackupDownload.mockImplementation(() => {
      rememberBackup();
      return Promise.resolve({});
    });
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

  it("shows Include favorites off by default with sync restore note", async () => {
    const host = await mount();
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

  it("has one export and one import, with artists named as part of the file", async () => {
    const host = await mount();
    expect(buttonsNamed(host, "Export")).toHaveLength(1);
    expect(buttonsNamed(host, "Import")).toHaveLength(1);
    expect(host.textContent).not.toContain("Export artists");
    expect(host.textContent).toContain("followed artists (with covers and post counts)");
  });

  it("warns of no backup on a plate with Export in it, until one is made", async () => {
    const host = await mount();
    const plate = host.querySelector(PLATE);
    expect(plate?.textContent).toContain("No backup yet.");
    expect(plate === null ? [] : buttonsNamed(plate, "Export")).toHaveLength(1);

    await act(async () => {
      button(host, "Export").click();
    });
    expect(exportBackupDownload).toHaveBeenCalledWith({
      includeBackground: false,
      includeFavorites: false,
    });
    expect(host.querySelector(PLATE)).toBeNull();
    expect(host.textContent).toContain("Last backup: today.");
    expect(buttonsNamed(host, "Export")).toHaveLength(1);
  });

  it("warns on the same plate when the last backup is old", async () => {
    const data = load();
    save({ ...data, artists: [{ tag: "someone" }] });
    rememberBackup(Date.now() - (BACKUP_DUE_DAYS + 1) * MS_PER_DAY);
    const host = await mount();
    expect(host.querySelector(PLATE)?.textContent).toContain("Time to export one.");
  });

  it("puts the switches into rows of the settings page, where a switch is at the right", async () => {
    const host = await mount();
    for (const id of ["#rdw-backup-include-bg", "#rdw-backup-include-favs"]) {
      expect(host.querySelector(id)?.closest(`.${PANEL_UI_CLASS.settingsRow}`)).not.toBeNull();
    }
  });

  it("has no Merge or Replace in the block before a file is chosen", async () => {
    const host = await mount();
    expect(host.querySelector(".rdw-seg, [role='radiogroup']")).toBeNull();
    expect(host.textContent).not.toContain("Import mode");
    expect(host.textContent).not.toContain("Merge");
    expect(document.querySelector("[role='dialog']")).toBeNull();
  });

  it("asks what to do with a chosen file and merges on Merge", async () => {
    const host = await mount();
    await chooseFile(host);
    expect(importBackupJson).not.toHaveBeenCalled();

    await act(async () => {
      button(dialog(), "Merge into current data").click();
    });
    expect(importBackupJson).toHaveBeenCalledTimes(1);
    expect(importBackupJson).toHaveBeenCalledWith(FILE_TEXT, "merge");
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(host.textContent).toContain("Imported 1 artists, 2 collections, 3 favorites.");
  });

  it("asks once more before Replace erases anything", async () => {
    const host = await mount();
    await chooseFile(host);
    fireClick(button(dialog(), "Replace current data"));
    await flushEffects();
    expect(importBackupJson).not.toHaveBeenCalled();
    expect(dialog().textContent).toContain("Replace everything?");

    await act(async () => {
      button(dialog(), "Replace").click();
    });
    expect(importBackupJson).toHaveBeenCalledWith(FILE_TEXT, "replace");
  });

  it("imports nothing when the question is cancelled", async () => {
    const host = await mount();
    await chooseFile(host);
    fireClick(button(dialog(), "Cancel"));
    await flushEffects();
    expect(document.querySelector("[role='dialog']")).toBeNull();

    await chooseFile(host);
    fireClick(button(dialog(), "Replace current data"));
    await flushEffects();
    fireClick(button(dialog(), "Cancel"));
    await flushEffects();
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(importBackupJson).not.toHaveBeenCalled();
  });
});
