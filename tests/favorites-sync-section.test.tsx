import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

const { runFavoritesSync } = vi.hoisted(() => ({
  runFavoritesSync: vi.fn(),
}));

vi.mock("../src/site/favorites-sync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/site/favorites-sync")>();
  return {
    ...actual,
    runFavoritesSync: (...args: Parameters<typeof actual.runFavoritesSync>) =>
      runFavoritesSync(...args),
  };
});

import { FavoritesSyncSection } from "../src/pages/favorites-sync-section";
import {
  FAVORITES_SYNC_PAGE_PAUSE_MS,
  FAVORITES_SYNC_PID_STEP,
  type FavoritesSyncResult,
  type RunFavoritesSyncOptions,
} from "../src/site/favorites-sync";
import { addFavs, clearFavsCache, setSyncState } from "../src/storage/favs";
import type { FavsSyncState } from "../src/storage/schema";
import { clearStorageCache } from "../src/storage/store";
import { cleanupKit, fireClick, renderKit } from "./kit/render";

const PAGES = 262;
const LAST_PID = (PAGES - 1) * FAVORITES_SYNC_PID_STEP;
const FAVORITES = 11961;
const STARTED_AT = "2026-11-17T11:00:00";
const FINISHED_AT = "2026-11-17T11:12:00";

const memory = new Map<string, unknown>();
const hosts: HTMLElement[] = [];

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  clearFavsCache();
  vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : defaultValue,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function seedFavorites(count: number): void {
  addFavs(Array.from({ length: count }, (_, index) => index + 1));
}

function finished(mode: FavsSyncState["mode"]): FavsSyncState {
  return {
    nextPid: LAST_PID + FAVORITES_SYNC_PID_STEP,
    lastPid: LAST_PID,
    startedAt: STARTED_AT,
    finishedAt: FINISHED_AT,
    running: false,
    mode,
  };
}

async function mount(): Promise<HTMLElement> {
  let host: HTMLElement | undefined;
  await act(async () => {
    host = renderKit(<FavoritesSyncSection />);
  });
  if (host === undefined) {
    throw new Error("the section did not mount");
  }
  hosts.push(host);
  return host;
}

function buttonLabels(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll("button")).map((node) => node.textContent ?? "");
}

function button(host: HTMLElement, label: string): HTMLButtonElement {
  const found = Array.from(host.querySelectorAll("button")).find(
    (node) => node.textContent === label,
  );
  if (found === undefined) {
    throw new Error(`no button "${label}"`);
  }
  return found;
}

type Run = {
  readonly options: RunFavoritesSyncOptions;
  readonly finish: (result: FavoritesSyncResult) => Promise<void>;
};

/** Lets a test hold a run open, report its pages and end it. */
function holdRun(): () => Run {
  let options: RunFavoritesSyncOptions | undefined;
  let resolve: ((result: FavoritesSyncResult) => void) | undefined;
  runFavoritesSync.mockImplementation((given: RunFavoritesSyncOptions) => {
    options = given;
    return new Promise<FavoritesSyncResult>((done) => {
      resolve = done;
    });
  });
  return () => {
    if (options === undefined || resolve === undefined) {
      throw new Error("the sync was not started");
    }
    const end = resolve;
    return {
      options,
      finish: async (result) => {
        await act(async () => {
          end(result);
        });
      },
    };
  };
}

describe("FavoritesSyncSection", () => {
  beforeEach(() => {
    installGmMocks();
    runFavoritesSync.mockReset();
  });

  afterEach(() => {
    while (hosts.length > 0) {
      const host = hosts.pop();
      if (host !== undefined) {
        cleanupKit(host);
      }
    }
    vi.unstubAllGlobals();
  });

  it("at rest shows the count, the last full sync and the two ways to start, and nothing of a run", async () => {
    seedFavorites(FAVORITES);
    setSyncState(finished("full"));
    const host = await mount();
    expect(host.querySelector(".rdw-favs-sync-status")?.textContent).toBe(
      "11,961 favorites · last full sync 17 Nov 2026, 11:12",
    );
    expect(buttonLabels(host)).toEqual(["Sync favorites", "Full resync"]);
    expect(host.querySelector("[role='progressbar']")).toBeNull();
    expect(host.querySelector("button:disabled")).toBeNull();
  });

  it("does not call a run that stopped at the first known page a full sync", async () => {
    seedFavorites(1);
    setSyncState(finished("incremental"));
    const host = await mount();
    expect(host.querySelector(".rdw-favs-sync-status")?.textContent).toBe(
      "1 favorite · last sync 17 Nov 2026, 11:12",
    );
  });

  it("explains both buttons once, with the pages and the time of a full resync", async () => {
    setSyncState(finished("full"));
    const host = await mount();
    const minutes = Math.ceil(((PAGES - 1) * FAVORITES_SYNC_PAGE_PAUSE_MS) / 60_000);
    expect(host.querySelector(".rdw-favs-sync-note")?.textContent).toBe(
      `Sync adds new favorites and stops at the first page where every favorite is already known. Full resync re-reads all 262 pages (about ${String(minutes)} min) to refresh tags. Posts you removed on the site stay here.`,
    );
    expect(host.textContent).not.toContain("Pause between pages");
    expect(host.textContent).not.toContain("One request per");
  });

  it("leaves the number of pages out while it is not known", async () => {
    const host = await mount();
    expect(host.querySelector(".rdw-favs-sync-status")?.textContent).toBe("0 favorites");
    expect(host.querySelector(".rdw-favs-sync-note")?.textContent).toContain(
      "Full resync re-reads every page to refresh tags.",
    );
    expect(host.querySelector(".rdw-favs-sync-note")?.textContent).not.toMatch(/\d/);
  });

  it("while running shows the bar, the page and one Stop", async () => {
    const run = holdRun();
    const host = await mount();
    fireClick(button(host, "Full resync"));
    expect(buttonLabels(host)).toEqual(["Stop"]);
    expect(host.querySelector("[role='progressbar']")).not.toBeNull();

    act(() => {
      run().options.onProgress({ page: 1, pages: PAGES, total: FAVORITES });
    });
    expect(host.querySelector(".rdw-favs-sync-status")?.textContent).toBe("Page 1 of 262");
    expect(host.textContent).not.toContain("ids");
    expect(buttonLabels(host)).toEqual(["Stop"]);

    fireClick(button(host, "Stop"));
    expect(run().options.signal.aborted).toBe(true);
    await run().finish({ status: "completed", total: FAVORITES, pages: PAGES });
  });

  it("after a stop offers Resume alone and says where the run stands", async () => {
    seedFavorites(FAVORITES_SYNC_PID_STEP);
    const run = holdRun();
    const host = await mount();
    fireClick(button(host, "Full resync"));
    setSyncState({
      nextPid: FAVORITES_SYNC_PID_STEP,
      lastPid: LAST_PID,
      startedAt: STARTED_AT,
      running: false,
      mode: "full",
    });
    await run().finish({ status: "aborted", total: FAVORITES_SYNC_PID_STEP, page: 1, pages: PAGES });

    expect(host.querySelector(".rdw-favs-sync-status")?.textContent).toBe(
      "50 favorites · paused at page 2 of 262",
    );
    expect(buttonLabels(host)).toEqual(["Resume"]);
    expect(host.querySelector("[role='progressbar']")).toBeNull();
    expect(host.querySelector("button:disabled")).toBeNull();
  });

  it("returns to rest when a run is finished", async () => {
    const run = holdRun();
    const host = await mount();
    fireClick(button(host, "Sync favorites"));
    seedFavorites(FAVORITES);
    setSyncState(finished("incremental"));
    await run().finish({ status: "completed", total: FAVORITES, pages: PAGES });

    expect(host.querySelector(".rdw-favs-sync-status")?.textContent).toBe(
      "11,961 favorites · last sync 17 Nov 2026, 11:12",
    );
    expect(buttonLabels(host)).toEqual(["Sync favorites", "Full resync"]);
    expect(host.querySelector("[role='progressbar']")).toBeNull();
  });
});
