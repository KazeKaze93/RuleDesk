import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  rememberArtistsFromPage,
  resetArtistSnapshotsState,
} from "../../src/features/artist-snapshots";
import { addArtist, clearStorageCache, load } from "../../src/storage/store";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : fallback,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function thumb(id: number, tags: string): string {
  return `<span class="thumb" id="s${String(id)}"><a href="index.php?page=post&amp;s=view&amp;id=${String(id)}"><img class="preview" src="https://example.test/${String(id)}.jpg" title="${tags} score:3 rating:explicit"></a></span>`;
}

function buildPage(thumbs: string, sidebar = ""): void {
  document.body.innerHTML = `<ul id="tag-sidebar">${sidebar}</ul><div id="content"><div class="image-list">${thumbs}</div></div>`;
}

function search(tags: string, extra = ""): string {
  return `?page=post&s=list&tags=${encodeURIComponent(tags)}${extra}`;
}

describe("rememberArtistsFromPage", () => {
  beforeEach(() => {
    installGmMocks();
    resetArtistSnapshotsState();
    document.body.replaceChildren();
  });

  afterEach(() => {
    resetArtistSnapshotsState();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it("takes cover, exact count and newest post from the artist's own first page", () => {
    addArtist("nyx_x");
    buildPage(
      thumb(90, "nyx_x 1girl") + thumb(80, "nyx_x"),
      '<li class="tag-type-artist"><a href="index.php?page=post&amp;s=list&amp;tags=nyx_x">nyx x</a> <span class="tag-count">2711</span></li>',
    );

    rememberArtistsFromPage(search("nyx_x"));

    const stored = load().artists[0];
    expect(stored?.cover).toEqual([
      "https://example.test/90.jpg",
      "https://example.test/80.jpg",
    ]);
    expect(stored?.postCount).toEqual({ value: 2711, exact: true });
    expect(stored?.lastPostId).toBe(90);
  });

  it("takes only the newest post per followed artist from any other results page", () => {
    addArtist("nyx_x");
    addArtist("nero100");
    buildPage(thumb(70, "nero100 cat") + thumb(60, "nyx_x") + thumb(50, "someone_else"));

    rememberArtistsFromPage(search("cat", "&pid=42"));

    const stored = load().artists;
    expect(stored[0]?.lastPostId).toBe(60);
    expect(stored[0]?.cover).toBeUndefined();
    expect(stored[1]?.lastPostId).toBe(70);
  });

  it("writes nothing while no artist is followed", () => {
    buildPage(thumb(70, "nero100"));
    rememberArtistsFromPage(search("nero100"));
    expect(memory.size).toBe(0);
  });
});
