import { describe, expect, it } from "vitest";

import { feedFeature } from "../../src/features/feed";
import { videoMarkFeature } from "../../src/features/video-mark";
import { GIF_THUMB_CSS } from "../../src/site/video-thumbs";

/**
 * A thumb has two pseudo-elements, and three labels want one: NEW of the
 * feed, the play sign of a video, GIF. A thumb can be new and a video at
 * once, so NEW has one of its own. When it shared ::after with the play sign,
 * a new video had one element with its top from one rule and its bottom from
 * the other: a blue bar as tall as the thumbnail (Kaze, 19.11.2026).
 */
describe("the labels on a thumbnail", () => {
  it("NEW is the ::before; the play sign and GIF are the ::after", () => {
    expect(feedFeature.css).toMatch(/span\.thumb\.new\.rdw-thumb::before \{\s*content: "NEW";/);
    expect(feedFeature.css).not.toContain("::after");
    expect(videoMarkFeature.css).toContain(".rdw-video-thumb::after {");
    expect(videoMarkFeature.css).not.toContain("::before");
    expect(GIF_THUMB_CSS).toContain(".rdw-gif-thumb::after {");
    expect(GIF_THUMB_CSS).not.toContain("::before");
  });
});
