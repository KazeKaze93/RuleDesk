import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { accountAge, profileTiles } from "../../src/pages/stats-section";
import {
  NOT_LOGGED_IN_ERROR,
  PROFILE_REQUEST_PAUSE_MS,
  readProfileStats,
  readProfileUrl,
  readStoredProfileStats,
  refreshProfileStats,
} from "../../src/site/profile";
import { clearStorageCache } from "../../src/storage/store";

const BASE = "https://rule34.xxx/index.php?page=post&s=list";
const NOW = Date.UTC(2026, 10, 15);

const ACCOUNT_HTML = `
<div id="content"><div id="user-index">
  <form><h4><button type="submit">» Logout</button></h4></form>
  <h4><a href="index.php?page=account&amp;s=profile&amp;id=5559">» My Profile</a></h4>
  <h4><a href="index.php?page=gmail&amp;s=list">» My Mail</a></h4>
</div></div>`;

const PROFILE_HTML = `
<div><table class="highlightable">
  <tr><td>Contact</td><td><a href="#">Send Mail</a></td></tr>
  <tr><td>Join Date</td><td>2019-08-23</td></tr>
  <tr><td>Level</td><td>Members</td></tr>
  <tr><td>Favorite Tags</td><td>None</td></tr>
  <tr><td>Posts</td><td><a href="#">2753</a></td></tr>
  <tr><td>Deleted Posts</td><td>37</td></tr>
  <tr><td>Favorites</td><td><a href="#">11962</a></td></tr>
  <tr><td>Comments</td><td><a href="#">0</a></td></tr>
  <tr><td>Tag Edits</td><td><a href="#">666</a></td></tr>
  <tr><td>Note Edits</td><td>0</td></tr>
  <tr><td>Forum Posts</td><td>0</td></tr>
  <tr><td>Record</td><td><a href="#">(add)</a></td></tr>
</table></div>`;

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

const memory = new Map<string, unknown>();

describe("site profile", () => {
  beforeEach(() => {
    memory.clear();
    clearStorageCache();
    vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown =>
      memory.has(key) ? memory.get(key) : fallback,
    );
    vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
      memory.set(key, value);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("finds the profile address on My Account and refuses any other link", () => {
    expect(readProfileUrl(parse(ACCOUNT_HTML), BASE)).toBe(
      "https://rule34.xxx/index.php?page=account&s=profile&id=5559",
    );
    expect(readProfileUrl(parse("<div id='user-index'></div>"), BASE)).toBeNull();
    const foreign = ACCOUNT_HTML.replace(
      "index.php?page=account&amp;s=profile&amp;id=5559",
      "https://example.test/index.php?page=account&amp;s=profile&amp;id=5559",
    );
    expect(readProfileUrl(parse(foreign), BASE)).toBeNull();
  });

  it("reads the numbers of the profile table", () => {
    expect(readProfileStats(parse(PROFILE_HTML), NOW)).toEqual({
      joinDate: "2019-08-23",
      level: "Members",
      posts: 2753,
      deletedPosts: 37,
      comments: 0,
      tagEdits: 666,
      noteEdits: 0,
      forumPosts: 0,
      readAt: NOW,
    });
    expect(readProfileStats(parse("<p>nothing</p>"), NOW)).toBeNull();
  });

  it("makes two requests with a pause and stores only the numbers", async () => {
    vi.useFakeTimers();
    // A fixed clock: the stored time must not hold the digits of the id by chance.
    vi.setSystemTime(NOW);
    const urls: string[] = [];
    vi.stubGlobal("fetch", (url: string): Promise<Response> => {
      urls.push(url);
      return Promise.resolve(new Response(urls.length === 1 ? ACCOUNT_HTML : PROFILE_HTML));
    });

    const run = refreshProfileStats();
    await vi.advanceTimersByTimeAsync(PROFILE_REQUEST_PAUSE_MS - 1);
    expect(urls).toEqual(["/index.php?page=account&s=home"]);
    await vi.advanceTimersByTimeAsync(1);
    const stats = await run;

    expect(urls).toHaveLength(2);
    expect(urls[1]).toContain("page=account&s=profile&id=5559");
    expect(stats.posts).toBe(2753);
    expect(readStoredProfileStats()?.tagEdits).toBe(666);
    // The id from the profile address is kept nowhere.
    expect(JSON.stringify([...memory.values()])).not.toContain("5559");
  });

  it("says so when the account page has no profile link", async () => {
    vi.stubGlobal("fetch", (): Promise<Response> =>
      Promise.resolve(new Response("<div id='content'></div>")),
    );
    await expect(refreshProfileStats()).rejects.toThrow(NOT_LOGGED_IN_ERROR);
    expect(readStoredProfileStats()).toBeNull();
  });

  it("words the account age and leaves out numbers the page did not give", () => {
    expect(accountAge("2019-08-23", NOW)).toBe("7 years 2 months");
    expect(accountAge("2026-06-10", NOW)).toBe("5 months");
    expect(accountAge("2026-11-10", NOW)).toBe("under a month");
    expect(accountAge("nonsense", NOW)).toBeNull();

    const tiles = profileTiles({ level: "Members", posts: 2753, readAt: NOW }, NOW);
    expect(tiles).toEqual([
      { label: "Level", text: "Members" },
      { label: "Posts uploaded", text: "2,753" },
    ]);
  });
});
