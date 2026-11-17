import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolvePostFileUrl } from "../../src/features/post-panel/download-one";
import { fileNameInfo } from "../../src/features/post-panel/post-panel";
import { SITE_SEARCH_HELP, mountSiteSearchTools } from "../../src/features/site-search-tools";
import { isGifUrl, playGifOnPage } from "../../src/features/gif-post";
import { bindClickToToggle } from "../../src/features/video-player";
import { MASK_PRESETS } from "../../src/pages/downloads-section";
import { featureBodyClass } from "../../src/features/types";
import {
  DEFAULT_FILE_MASK,
  buildFileName,
  isMediaFileUrl,
  maskHasToken,
  toggleMaskToken,
} from "../../src/site/download";

const NOW = Date.parse("2026-11-16T12:00:00Z");
const FILE = "https://wimg.rule34.xxx/images/1234/0f3a9c7b2d1e.png?19374686";
const INFO = {
  postId: 19374686,
  url: FILE,
  rating: "explicit",
  score: 42,
  width: 1080,
  height: 1632,
  owner: "some one",
};

describe("the file name mask", () => {
  it("names a file by the default mask, with the file's own extension", () => {
    expect(buildFileName(DEFAULT_FILE_MASK, INFO, NOW)).toBe("rule34-19374686.png");
  });

  it("fills every token", () => {
    expect(
      buildFileName("[date] [rating] [id] [md5] [width]x[height] s[score] [owner]", INFO, NOW),
    ).toBe("2026-11-16 explicit 19374686 0f3a9c7b2d1e 1080x1632 s42 some one.png");
  });

  it("leaves no stray separators where a token has no value", () => {
    const bare = { postId: 7, url: "https://x.rule34.xxx/a/b/hash.webm" };
    expect(buildFileName("[rating]_[id]_[score]", bare, NOW)).toBe("7.webm");
    expect(buildFileName("[owner] - [id]", bare, NOW)).toBe("7.webm");
  });

  it("drops unknown tokens and what a file system does not take", () => {
    expect(buildFileName('[artist] my:file/[id]?', INFO, NOW)).toBe("my file 19374686.png");
  });

  it("falls back to the default name when the mask comes out empty", () => {
    expect(buildFileName("[score]", { postId: 9, url: "https://x.rule34.xxx/f.jpg" }, NOW)).toBe(
      "rule34-9.jpg",
    );
    expect(buildFileName("   ", INFO, NOW)).toBe("rule34-19374686.png");
  });

  it("takes token names in any case", () => {
    expect(buildFileName("[ID]-[Md5]", INFO, NOW)).toBe("19374686-0f3a9c7b2d1e.png");
  });
});

describe("tokens of the file name mask as switches", () => {
  it("adds a token that is not there, at the end", () => {
    expect(toggleMaskToken("", "id")).toBe("[id]");
    expect(toggleMaskToken("rule34-[id]", "date")).toBe("rule34-[id] [date]");
  });

  it("takes a token out when it is there, every copy of it, and closes the gap", () => {
    expect(toggleMaskToken("[date] [id] [date] [owner] [id]", "date")).toBe("[id] [owner] [id]");
    expect(toggleMaskToken("[id] [owner] [id]", "id")).toBe("[owner]");
    expect(toggleMaskToken("[ID]", "id")).toBe("");
  });

  it("never leaves two of the same token by clicking", () => {
    let mask = "";
    for (const token of ["date", "id", "date", "date", "owner"] as const) {
      mask = toggleMaskToken(mask, token);
    }
    expect(mask).toBe("[id] [date] [owner]");
    expect(maskHasToken(mask, "date")).toBe(true);
    expect(maskHasToken(mask, "md5")).toBe(false);
  });
});

describe("the file of a post", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("tells a file from a page", () => {
    expect(isMediaFileUrl(FILE)).toBe(true);
    expect(isMediaFileUrl("https://ws-cdn-video.rule34.xxx/images/1/x.mp4?5")).toBe(true);
    expect(isMediaFileUrl("https://rule34.xxx/index.php?page=post&s=view&id=5")).toBe(false);
    expect(isMediaFileUrl("https://rule34.xxx/some/page.htm")).toBe(false);
  });

  it("takes a video post from its player, whatever the Original link says", () => {
    document.body.innerHTML = `<video id="gelcomVideoPlayer"><source src="https://v.rule34.xxx/images/1/clip.mp4"></video>`;
    expect(resolvePostFileUrl("https://rule34.xxx/index.php?page=post&s=view&id=5")).toBe(
      "https://v.rule34.xxx/images/1/clip.mp4",
    );
  });

  it("takes a picture from the Original link, then from the picture on the page", () => {
    document.body.innerHTML = `<img id="image" src="https://wimg.rule34.xxx/samples/1/sample_a.jpg">`;
    expect(resolvePostFileUrl(FILE)).toBe(FILE);
    expect(resolvePostFileUrl("https://rule34.xxx/index.php?page=x")).toBe(
      "https://wimg.rule34.xxx/samples/1/sample_a.jpg",
    );
  });

  it("offers nothing when no candidate is a file", () => {
    expect(resolvePostFileUrl("https://rule34.xxx/index.php?page=x")).toBeNull();
    expect(resolvePostFileUrl(null)).toBeNull();
  });

  it("reads what the panel knows for the mask", () => {
    const stats = [
      { label: "Size", value: "1080x1632", href: null },
      { label: "Rating", value: "Explicit", href: null },
      { label: "By", value: "DigiW", href: "#" },
    ] as const;
    expect(fileNameInfo(5, stats, "15")).toEqual({
      postId: 5,
      rating: "explicit",
      score: 15,
      width: 1080,
      height: 1632,
      owner: "DigiW",
    });
    expect(fileNameInfo(5, [], "—")).toEqual({ postId: 5 });
  });
});

describe("the player", () => {
  const BODY_CLASS = featureBodyClass("video-player");

  function makeVideo(): { video: HTMLVideoElement; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> } {
    const video = document.createElement("video");
    let paused = true;
    const play = vi.fn(async () => {
      paused = false;
    });
    const pause = vi.fn(() => {
      paused = true;
    });
    Object.defineProperty(video, "paused", { get: () => paused });
    video.play = play;
    video.pause = pause;
    document.body.append(video);
    return { video, play, pause };
  }

  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.className = BODY_CLASS;
  });

  it("plays and pauses on a click on the picture, every time", () => {
    const { video, play, pause } = makeVideo();
    bindClickToToggle(video);
    video.click();
    expect(play).toHaveBeenCalledTimes(1);
    video.click();
    expect(pause).toHaveBeenCalledTimes(1);
    video.click();
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("keeps the click from the site's own handler, so it does not toggle twice", () => {
    const { video } = makeVideo();
    bindClickToToggle(video);
    const site = vi.fn();
    video.addEventListener("click", site);
    video.click();
    expect(site).not.toHaveBeenCalled();
  });

  it("leaves the click alone while the tweaks are switched off", () => {
    document.body.className = "";
    const { video, play } = makeVideo();
    bindClickToToggle(video);
    const site = vi.fn();
    video.addEventListener("click", site);
    video.click();
    expect(play).not.toHaveBeenCalled();
    expect(site).toHaveBeenCalledTimes(1);
  });
});

describe("ready file name masks", () => {
  it("each gives a name of its own, and the first is the default", () => {
    const names = MASK_PRESETS.map((mask) => buildFileName(mask, INFO, NOW));
    expect(new Set(names).size).toBe(names.length);
    expect(MASK_PRESETS[0]).toBe(DEFAULT_FILE_MASK);
  });
});

describe("a GIF post", () => {
  const SAMPLE = "https://wimg.rule34.xxx//samples/480/sample_5e049d.jpg?19374463";
  const ORIGINAL = "https://wimg.rule34.xxx//images/480/5e049d.gif?19374463";

  beforeEach(() => {
    document.body.innerHTML = `<img id="image" src="${SAMPLE}" width="850" height="944" onclick="Note.toggle();">`;
  });

  it("tells a GIF by the end of its address", () => {
    expect(isGifUrl(ORIGINAL)).toBe(true);
    expect(isGifUrl(SAMPLE)).toBe(false);
    expect(isGifUrl("https://x.rule34.xxx/a/gif.png")).toBe(false);
  });

  it("puts the original in place of the still copy and keeps the picture's size", () => {
    expect(playGifOnPage(document, ORIGINAL)).toBe(true);
    const image = document.getElementById("image");
    expect(image?.getAttribute("src")).toBe(ORIGINAL);
    expect(image?.getAttribute("width")).toBe("850");
    expect(image?.getAttribute("height")).toBe("944");
    // Once is enough: the picture already shows the GIF.
    expect(playGifOnPage(document, ORIGINAL)).toBe(false);
  });

  it("leaves a post alone whose original is not a GIF", () => {
    expect(playGifOnPage(document, "https://wimg.rule34.xxx//images/480/5e049d.png?1")).toBe(false);
    expect(document.getElementById("image")?.getAttribute("src")).toBe(SAMPLE);
  });

  it("does nothing on a post without a picture", () => {
    document.body.innerHTML = `<video id="gelcomVideoPlayer"></video>`;
    expect(playGifOnPage(document, ORIGINAL)).toBe(false);
  });
});

describe("the site's search field", () => {
  it("adds its buttons to the field's own box and moves nothing", () => {
    document.body.innerHTML = `<div class="tag-search"><form><div class="awesomplete"><input name="tags" value=""></div><input type="submit"></form></div>`;
    const input = document.querySelector('input[name="tags"]');
    const box = document.querySelector("div.awesomplete");
    if (!(input instanceof HTMLInputElement) || box === null) {
      throw new Error("no field");
    }
    mountSiteSearchTools(input);
    mountSiteSearchTools(input);
    expect(input.parentElement).toBe(box);
    expect(box.firstElementChild).toBe(input);
    expect(box.querySelectorAll(".rdw-site-search-tools")).toHaveLength(1);
    expect(box.querySelector('button[aria-label="Search syntax"]')).not.toBeNull();
    // Nothing to clear in an empty field.
    expect(box.querySelector('button[aria-label="Clear search"]')).toBeNull();
  });

  it("does not repeat in its help what the panel under the field has a control for", () => {
    const examples = SITE_SEARCH_HELP.rows.map(([example]) => example).join(" ");
    expect(examples).not.toContain("sort:");
    expect(examples).not.toContain("score:");
    expect(examples).toContain("( cat ~ dog )");
  });
});
