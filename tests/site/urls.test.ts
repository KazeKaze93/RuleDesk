import { describe, expect, it } from "vitest";

import { parseApiPosts } from "../../src/site/api";
import { isSiteUrl } from "../../src/site/urls";
import { keepSiteMedia } from "../../src/storage/backup";
import { createDefaultStorage } from "../../src/storage/schema";

const SITE_THUMB = "https://wimg.rule34.xxx/thumbnails/1/thumbnail_a.jpg?5";
const FOREIGN = "https://evil.example/pixel.gif";

describe("site addresses", () => {
  it("accepts only https addresses on the site's domain", () => {
    expect(isSiteUrl(SITE_THUMB)).toBe(true);
    expect(isSiteUrl("https://rule34.xxx/index.php")).toBe(true);
    expect(isSiteUrl("https://ws-cdn-video.rule34.xxx//images/1/a.mp4?5")).toBe(true);
    expect(isSiteUrl("http://wimg.rule34.xxx/a.jpg")).toBe(false);
    expect(isSiteUrl("https://rule34.xxx.evil.example/a.jpg")).toBe(false);
    expect(isSiteUrl("https://notrule34.xxx/a.jpg")).toBe(false);
    expect(isSiteUrl(FOREIGN)).toBe(false);
    expect(isSiteUrl("javascript:alert(1)")).toBe(false);
    expect(isSiteUrl("not an address")).toBe(false);
  });

  it("takes files from an API answer only when they are on the site", () => {
    const body = JSON.stringify([
      { id: 5, file_url: "https://wimg.rule34.xxx//images/1/5.jpg" },
      { id: 6, file_url: "https://evil.example/6.exe" },
    ]);
    expect(parseApiPosts(body)).toEqual([
      { postId: 5, url: "https://wimg.rule34.xxx//images/1/5.jpg" },
    ]);
  });

  it("drops foreign picture addresses from an imported file", () => {
    const storage = createDefaultStorage();
    storage.collections = [
      {
        id: "c1",
        name: "Pics",
        tags: [],
        kind: "posts",
        postIds: [1, 2],
        thumbs: { "1": SITE_THUMB, "2": FOREIGN },
      },
      { id: "d1", name: "Cats", tags: [], kind: "search", query: "cat", cover: [FOREIGN, SITE_THUMB] },
    ];
    storage.artists = [{ tag: "a", cover: [SITE_THUMB, FOREIGN] }, { tag: "b" }];

    const cleaned = keepSiteMedia(storage);

    expect(cleaned.collections[0]?.thumbs).toEqual({ "1": SITE_THUMB });
    expect(cleaned.collections[0]?.postIds).toEqual([1, 2]);
    expect(cleaned.collections[1]?.cover).toEqual([SITE_THUMB]);
    expect(cleaned.artists[0]?.cover).toEqual([SITE_THUMB]);
    expect(cleaned.artists[1]).toEqual({ tag: "b" });
  });
});
