import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FEED_COUNT_TTL_MS,
  countNewThumbs,
  feedCountText,
  isFreshCount,
} from "../../src/features/feed-counter";
import { MAX_SCALE, clampScale, fitScale, zoomAt } from "../../src/features/image-zoom";
import {
  checkableCollections,
  hasDefaultOrder,
  newestPostIdOf,
} from "../../src/pages/collections-check";
import { followCaption, matchesKindAndGroup } from "../../src/pages/following-page";
import { changeText, sparklinePoints } from "../../src/pages/stats-history";
import {
  FORUM_MEMORY_MAX,
  artistRowTag,
  forumBadge,
  forumTopicKey,
  rowSignature,
  rowTag,
  rowTagKind,
  withForumEntries,
} from "../../src/site/list-pages";
import {
  BACKUP_DUE_DAYS,
  BACKUP_FIRST_DUE_DAYS,
  backupStatus,
  dayOf,
  withStatsPoint,
  type StatsPoint,
} from "../../src/storage/history";
import {
  addArtists,
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  dynamicHasNew,
  followKindOf,
  listFollowGroups,
  load,
  setDynamicNewest,
  setFollowGroup,
} from "../../src/storage/store";

const memory = new Map<string, unknown>();
const DAY_MS = 86_400_000;
const NOW = Date.parse("2026-11-16T12:00:00Z");

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

function thumbs(ids: readonly number[]): Element[] {
  const list = document.createElement("div");
  list.innerHTML = ids
    .map((id) => `<span class="thumb" id="s${String(id)}"><a id="p${String(id)}"></a></span>`)
    .join("");
  return [...list.children];
}

describe("the picture viewer", () => {
  it("fits a large picture into the window and never enlarges a small one", () => {
    expect(fitScale(4000, 2000, 1048, 848)).toBe(0.25);
    expect(fitScale(200, 100, 1000, 800)).toBe(1);
  });

  it("keeps the scale between the fitted size and the limit", () => {
    expect(clampScale(0.01, 0.25)).toBe(0.25);
    expect(clampScale(100, 0.25)).toBe(MAX_SCALE);
  });

  it("zooms about the pointer: the point under it stays under it", () => {
    const next = zoomAt({ scale: 1, x: 0, y: 0 }, 2, 100, 50, 0.25);
    expect(next.scale).toBe(2);
    // The point 100 px right of the centre was 100 image px from it; at 2x it is 200.
    expect(next.x).toBe(-100);
    expect(next.y).toBe(-50);
  });

  it("centres the picture again once it is back at the fitted size", () => {
    expect(zoomAt({ scale: 0.5, x: 80, y: -30 }, 0.1, 10, 10, 0.25)).toEqual({
      scale: 0.25,
      x: 0,
      y: 0,
    });
  });
});

describe("forum marks", () => {
  it("calls a topic new, updated or read by its row", () => {
    const memoryOf = { "7": "Topic 3 replies" };
    expect(forumBadge(memoryOf, "8", "Other 0 replies")).toBe("new");
    expect(forumBadge(memoryOf, "7", "Topic 4 replies")).toBe("updated");
    expect(forumBadge(memoryOf, "7", "Topic 3 replies")).toBeNull();
  });

  it("forgets the oldest topics first", () => {
    let kept: Record<string, string> = {};
    for (let index = 0; index < FORUM_MEMORY_MAX + 5; index += 1) {
      kept = withForumEntries(kept, [[String(index), "x"]]);
    }
    expect(Object.keys(kept)).toHaveLength(FORUM_MEMORY_MAX);
    expect(kept["0"]).toBeUndefined();
    expect(kept[String(FORUM_MEMORY_MAX + 4)]).toBe("x");
  });

  it("reads the topic and the text of a row", () => {
    const table = document.createElement("table");
    table.innerHTML = `<tr class="odd"><td><span class="forum-topic"><a href="index.php?page=forum&s=view&id=42">Hello</a></span></td><td> 3 </td></tr>`;
    const row = table.querySelector("tr");
    expect(row).not.toBeNull();
    if (row !== null) {
      expect(forumTopicKey(row)).toBe("42");
      expect(rowSignature(row)).toBe("Hello 3");
    }
  });
});

describe("rows of the Tags and Artists pages", () => {
  function row(html: string): Element {
    const table = document.createElement("table");
    table.innerHTML = `<tr class="even">${html}</tr>`;
    const found = table.querySelector("tr");
    if (found === null) {
      throw new Error("no row");
    }
    return found;
  }

  it("reads the tag from the row's search link", () => {
    expect(rowTag(row('<td><a href="index.php?page=post&s=list&tags=some_artist">some artist</a></td>'))).toBe(
      "some_artist",
    );
    expect(rowTag(row("<td>no link</td>"))).toBeNull();
  });

  it("knows the kind from a class or from the Type cell, whatever follows the type", () => {
    expect(rowTagKind(row('<td><span class="tag-type-character"><a href="?tags=x">x</a></span></td>'))).toBe(
      "character",
    );
    expect(rowTagKind(row('<td>1</td><td><a href="?tags=x">x</a></td><td>Copyright, ambiguous (<a href="#">edit</a>)</td>'))).toBe(
      "copyright",
    );
    expect(rowTagKind(row('<td>2</td><td><a href="?tags=x">x</a></td><td>Artist (<a href="#">edit</a>)</td>'))).toBe("artist");
    expect(rowTagKind(row('<td><a href="?tags=x">x</a></td><td>General (edit)</td>'))).toBeNull();
    // A tag whose own name begins with a type word is not that type.
    expect(rowTagKind(row('<td><a href="?tags=artist_request">artist request</a></td><td>General</td>'))).toBeNull();
  });

  it("reads the tag of an Artists row from its name link", () => {
    const artist = row(
      '<td>P <a href="index.php?page=artist&amp;s=update&amp;id=7" title="Edit artist">E</a></td><td><a href="index.php?page=artist&amp;s=show&amp;id=7">Sandy_Dust</a></td><td>Someone</td>',
    );
    expect(artistRowTag(artist)).toBe("sandy_dust");
    expect(artistRowTag(row("<td>nothing</td>"))).toBeNull();
  });
});

describe("history and the backup reminder", () => {
  const point = (day: string, favorites: number): StatsPoint => ({
    day,
    favorites,
    followed: 1,
    collections: 1,
  });

  it("keeps one point a day, the latest", () => {
    const history = withStatsPoint([point("2026-11-15", 10), point("2026-11-16", 11)], point("2026-11-16", 12));
    expect(history.map((item) => item.favorites)).toEqual([10, 12]);
    expect(dayOf(NOW)).toBe("2026-11-16");
  });

  it("reminds after a month without a backup, and not before", () => {
    expect(backupStatus(NOW - BACKUP_DUE_DAYS * DAY_MS, null, true, NOW).due).toBe(false);
    const late = backupStatus(NOW - (BACKUP_DUE_DAYS + 1) * DAY_MS, null, true, NOW);
    expect(late.due).toBe(true);
    expect(late.text).toBe("Last backup: 31 days ago.");
    expect(backupStatus(NOW, null, true, NOW).text).toBe("Last backup: today.");
  });

  it("reminds about a first backup only once the script has been used for a while", () => {
    const early = dayOf(NOW - (BACKUP_FIRST_DUE_DAYS - 1) * DAY_MS);
    const old = dayOf(NOW - BACKUP_FIRST_DUE_DAYS * DAY_MS);
    expect(backupStatus(null, early, true, NOW).due).toBe(false);
    expect(backupStatus(null, old, true, NOW).due).toBe(true);
    expect(backupStatus(null, old, false, NOW).due).toBe(false);
  });

  it("draws a line through the points and says the change", () => {
    expect(sparklinePoints([0, 10], 100, 20)).toBe("3.0,17.0 97.0,3.0");
    expect(sparklinePoints([5, 5, 5], 100, 20)).toBe("3.0,10.0 50.0,10.0 97.0,10.0");
    expect(changeText(point("2026-10-03", 0), 100, 220)).toBe("+120 since 3 Oct 2026");
    expect(changeText(point("2026-10-03", 0), 10, 6)).toBe("−4 since 3 Oct 2026");
    expect(changeText(point("2026-10-03", 0), 7, 7)).toBe("no change since 3 Oct 2026");
  });
});

describe("the counter beside Feed", () => {
  it("counts the posts newer than the newest seen", () => {
    expect(countNewThumbs(thumbs([50, 40, 30]), 35)).toEqual({ count: 2, more: false });
    expect(countNewThumbs(thumbs([50, 40]), 10)).toEqual({ count: 2, more: true });
    expect(countNewThumbs([], 10)).toEqual({ count: 0, more: false });
  });

  it("shows a plus when the whole page is new, and nothing for none", () => {
    expect(feedCountText({ count: 12, more: false })).toBe("12");
    expect(feedCountText({ count: 42, more: true })).toBe("42+");
    expect(feedCountText({ count: 0, more: false })).toBe("");
  });

  it("uses a kept answer only for the same feed, the same mark and a short while", () => {
    const cached = { at: NOW, seen: 100, href: "a" };
    expect(isFreshCount(cached, NOW + 1000, 100, "a")).toBe(true);
    expect(isFreshCount(cached, NOW + FEED_COUNT_TTL_MS, 100, "a")).toBe(false);
    expect(isFreshCount(cached, NOW + 1000, 101, "a")).toBe(false);
    expect(isFreshCount(cached, NOW + 1000, 100, "b")).toBe(false);
    expect(isFreshCount(null, NOW, 100, "a")).toBe(false);
  });
});

describe("groups and kinds of followed tags, new posts of saved searches", () => {
  beforeEach(() => {
    installGmMocks();
  });

  it("puts followed tags into a group and takes them out", () => {
    addArtists(["alpha", "beta", "gamma"]);
    expect(setFollowGroup(["alpha", "beta"], " Favourites ")).toBe(2);
    expect(listFollowGroups()).toEqual(["Favourites"]);
    expect(setFollowGroup(["alpha"], "Favourites")).toBe(0);
    expect(setFollowGroup(["alpha", "beta"], null)).toBe(2);
    expect(listFollowGroups()).toEqual([]);
    expect(load().artists.every((entry) => entry.group === undefined)).toBe(true);
  });

  it("treats an entry without a kind as an artist, and filters by kind and group", () => {
    const artist = { tag: "alpha" };
    const character = { tag: "hero", kind: "character" as const, group: "Team" };
    expect(followKindOf(artist)).toBe("artist");
    expect(followCaption(artist)).toBe("");
    expect(followCaption(character)).toBe("character · Team");
    expect(matchesKindAndGroup(character, "all", "")).toBe(true);
    expect(matchesKindAndGroup(character, "artist", "")).toBe(false);
    expect(matchesKindAndGroup(character, "character", "Team")).toBe(true);
    expect(matchesKindAndGroup(artist, "all", "Team")).toBe(false);
    expect(matchesKindAndGroup(artist, "all", "\u0000none")).toBe(true);
  });

  it("marks a saved search new only after a check finds a newer post than the last seen", () => {
    const saved = createDynamicCollection("Cats", "cat");
    const read = (): ReturnType<typeof load>["collections"][number] | undefined =>
      load().collections.find((item) => item.id === saved.id);
    // A check before the search was ever opened has nothing to compare with.
    setDynamicNewest(saved.id, 500, false);
    expect(dynamicHasNew(read() ?? saved)).toBe(false);
    setDynamicNewest(saved.id, 500, true);
    expect(dynamicHasNew(read() ?? saved)).toBe(false);
    setDynamicNewest(saved.id, 620, false);
    expect(dynamicHasNew(read() ?? saved)).toBe(true);
    // Opening the search clears the mark.
    setDynamicNewest(saved.id, 620, true);
    expect(dynamicHasNew(read() ?? saved)).toBe(false);
  });

  it("reads every saved search, and looks for new posts in the default order only", () => {
    createPlaylist("Custom");
    createDynamicCollection("Cats", "cat");
    createDynamicCollection("Top", "cat sort:score");
    const checked = checkableCollections(load().collections);
    expect(checked.map((item) => item.name)).toEqual(["Cats", "Top"]);
    expect(checked.map(hasDefaultOrder)).toEqual([true, false]);
    expect(newestPostIdOf(thumbs([5, 90, 12]))).toBe(90);
    expect(newestPostIdOf([])).toBe(0);
  });
});
