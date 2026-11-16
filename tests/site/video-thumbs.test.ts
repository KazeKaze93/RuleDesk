import { afterEach, describe, expect, it, vi } from "vitest";

import { favoritesCountLabel } from "../../src/features/favorites-bulk";
import {
  playlistMenuFeature,
  resetPlaylistMenuRuntimeState,
} from "../../src/features/playlist-menu";
import { videoPreviewFeature } from "../../src/features/video-preview";
import {
  VIDEO_THUMB_CLASS,
  GIF_THUMB_CLASS,
  GIF_THUMB_CSS,
  markGifThumbs,
  markVideoThumbs,
  titleSaysGif,
  titleSaysVideo,
} from "../../src/site/video-thumbs";
import { extractPostIdFromThumbLink } from "../../src/site/selectors";
import { buildVideoUrlFromThumbUrl } from "../../src/site/thumb";
import { SITE_SKIN_CSS } from "../../src/skin/site-skin";

function favoriteThumb(postId: string, title: string): HTMLElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  const link = document.createElement("a");
  link.id = `p${postId}`;
  link.href = `index.php?page=post&s=view&id=${postId}`;
  const img = document.createElement("img");
  img.src = `https://wimg.rule34.xxx/thumbnails//231/thumbnail_abc.jpg?${postId}`;
  img.title = title;
  img.alt = "image_thumb";
  link.append(img);
  thumb.append(link);
  return thumb;
}

describe("favorites video marks", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("reads video from the tag list, also when the site cut the last character", () => {
    expect(titleSaysVideo("boy 3d animated sound tagme video video_game")).toBe(true);
    expect(titleSaysVideo("i_generated animated no_sound tagme vide")).toBe(true);
    expect(titleSaysVideo("girls animated breasts white_shirt")).toBe(false);
    expect(titleSaysVideo("girls long_video video_game")).toBe(false);
    expect(titleSaysVideo("")).toBe(false);
  });

  it("marks the thumb, not anything inside its link", () => {
    const video = favoriteThumb("5", "boy sound video");
    const still = favoriteThumb("6", "girls breasts");
    document.body.append(video, still);
    const before = video.querySelector("a")?.outerHTML;

    expect(markVideoThumbs(document, "span.thumb")).toBe(1);
    expect(video.classList.contains(VIDEO_THUMB_CLASS)).toBe(true);
    expect(still.classList.contains(VIDEO_THUMB_CLASS)).toBe(false);
    expect(video.querySelector("a")?.outerHTML).toBe(before);
  });

  it("finds the post id and the video address of a favorites thumb", () => {
    const thumb = favoriteThumb("19337851", "vide");
    expect(extractPostIdFromThumbLink(thumb)).toBe("19337851");
    expect(
      buildVideoUrlFromThumbUrl(
        "https://wimg.rule34.xxx/thumbnails//231/thumbnail_abc.jpg?19337851",
      ),
    ).toBe("https://ws-cdn-video.rule34.xxx//images/231/abc.mp4?19337851");
  });

  it("brings the grid rules the hover preview is positioned by", () => {
    // Nothing else adds them on the favorites page.
    expect(videoPreviewFeature.css).toContain(".rdw-thumb {\n  position: relative;");
    expect(videoPreviewFeature.css).toContain(".rdw-thumb > a > img {\n  anchor-name: --rdw-img;");
  });

  it("gets the collections button on a favorites thumb and keeps its link untouched", () => {
    vi.stubGlobal("GM_getValue", (_key: string, fallback?: unknown): unknown => fallback);
    vi.stubGlobal("GM_setValue", (): void => {});
    const thumb = favoriteThumb("19337851", "boy sound video");
    const cell = document.createElement("span");
    const list = document.createElement("div");
    list.className = "image-list";
    cell.append(thumb);
    list.append(cell);
    document.body.append(list);
    const before = thumb.querySelector("a")?.outerHTML;

    playlistMenuFeature.mount({
      pageKind: "favorites",
      search: "?page=favorites&s=view&id=1",
      getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
      setState: (): void => {},
    });

    const button = thumb.querySelector("button.rdw-playlist-add");
    expect(button?.textContent).toBe("+");
    expect(button?.getAttribute("data-rdw-post-id")).toBe("19337851");
    expect(thumb.querySelector("a")?.outerHTML).toBe(before);
    resetPlaylistMenuRuntimeState();
    vi.unstubAllGlobals();
  });

  it("keeps the shape of a favorites picture and turns Remove into a bin button", () => {
    // The cell keeps the site's own size: no width or height of ours.
    expect(SITE_SKIN_CSS).not.toContain("width: fit-content");
    const at = SITE_SKIN_CSS.indexOf("div.image-list > span > a[onclick] {\n    position: absolute");
    const rule = SITE_SKIN_CSS.slice(at, SITE_SKIN_CSS.indexOf("}", at));
    expect(rule).toContain("width: 28px");
    expect(rule).toContain("font-size: 0");
    expect(SITE_SKIN_CSS).toContain("a[onclick]::before {");
    expect(playlistMenuFeature.css).toContain("position-anchor: --rdw-fav-img;");
    expect(favoritesCountLabel(11962)).toBe("11,962 posts");
    expect(favoritesCountLabel(1)).toBe("1 post");
    expect(favoritesCountLabel(0)).toBe("");
  });

  it("hides an emptied favorites cell but never a thumb of a search page", () => {
    expect(SITE_SKIN_CSS).toContain(
      "div.image-list > span:not(.thumb):not(:has(span.thumb)) {",
    );
    // The rule that hid every search thumb in 0.32.0.
    expect(SITE_SKIN_CSS).not.toContain("div.image-list > span:not(:has(span.thumb)) {");

    document.body.innerHTML =
      '<div class="image-list"><span class="thumb" id="s1"><a id="p1"><img class="preview"></a></span>' +
      '<span id="emptied"><br></span><span id="cell"><span class="thumb"><a id="p2"><img></a></span></span></div>';
    const hidden = "div.image-list > span:not(.thumb):not(:has(span.thumb))";
    expect([...document.querySelectorAll(hidden)].map((node) => node.id)).toEqual(["emptied"]);
  });

  it("keeps the favorites cell rules off other pages, such as a pool", () => {
    // On a pool page the link of every thumb carries an onclick; in 0.32.x it
    // was taken for the Remove link and turned into a 28px bin button.
    expect(SITE_SKIN_CSS).not.toContain("html.rdw-skin div.image-list > span");
    expect(SITE_SKIN_CSS).toContain(
      "html.rdw-skin.rdw-page-favorites div.image-list > span > a[onclick] {",
    );
  });

  it("labels animated GIFs, also where the site cut the tag", () => {
    expect(titleSaysGif("1girl animated animated_gif solo score:5 rating:e")).toBe(true);
    expect(titleSaysGif("nimated_gif girls solo")).toBe(true);
    expect(titleSaysGif("girls solo animated_gi")).toBe(true);
    expect(titleSaysGif("1girl animated video sound")).toBe(false);
    expect(titleSaysGif("")).toBe(false);

    const gif = favoriteThumb("7", "girls animated animated_gif");
    const still = favoriteThumb("8", "girls solo");
    document.body.append(gif, still);
    const before = gif.querySelector("a")?.outerHTML;
    expect(markGifThumbs(document, "span.thumb")).toBe(1);
    expect(gif.classList.contains(GIF_THUMB_CLASS)).toBe(true);
    expect(still.classList.contains(GIF_THUMB_CLASS)).toBe(false);
    // The label is a pseudo-element: nothing is put into the link or the thumb.
    expect(gif.querySelector("a")?.outerHTML).toBe(before);
    expect(gif.children).toHaveLength(1);
    expect(GIF_THUMB_CSS).toContain('content: "GIF"');
  });

  it("gives a marked thumb the outline of a video", () => {
    expect(SITE_SKIN_CSS).toContain(`.${VIDEO_THUMB_CLASS} > a > img,`);
  });
});
