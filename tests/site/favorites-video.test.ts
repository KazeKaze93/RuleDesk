import { afterEach, describe, expect, it } from "vitest";

import { videoPreviewFeature } from "../../src/features/video-preview";
import {
  VIDEO_THUMB_CLASS,
  markFavoriteVideoThumbs,
  titleSaysVideo,
} from "../../src/site/favorites-video";
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

    expect(markFavoriteVideoThumbs(document)).toBe(1);
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

  it("gives a marked thumb the outline of a video", () => {
    expect(SITE_SKIN_CSS).toContain(`span.thumb.${VIDEO_THUMB_CLASS} > a > img,`);
  });
});
