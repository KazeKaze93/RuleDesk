import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  THUMB_TOOLTIP_INLINE_CLASS,
  thumbTooltipFeature,
} from "../../src/features/thumb-tooltip";
import type { FeatureContext } from "../../src/features/types";

const TITLE = "1girl cat score:3 rating:explicit";

function ctx(): FeatureContext {
  return {
    pageKind: "list",
    search: "?page=post&s=list&tags=cat",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildThumb(linkDisplay: string): HTMLImageElement {
  document.body.innerHTML = `<div class="image-list"><span class="thumb" id="s1"><a id="p1" href="index.php?page=post&amp;s=view&amp;id=1" style="display:${linkDisplay}"><img class="preview" src="t.jpg" alt="1girl cat" title="${TITLE}"></a></span></div>`;
  const image = document.querySelector("img.preview");
  if (!(image instanceof HTMLImageElement)) {
    throw new Error("preview missing");
  }
  return image;
}

describe("thumbTooltipFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
  });

  afterEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    vi.restoreAllMocks();
  });

  it("is on by default, toggles without a reload, and takes the pointer off the image by CSS", () => {
    expect(thumbTooltipFeature.defaultEnabled).toBe(true);
    expect(thumbTooltipFeature.cssOnly).toBe(true);
    expect(thumbTooltipFeature.css).toMatch(
      /body\.rdw-f-thumb-tooltip span\.thumb > a > img\.preview \{\s*pointer-events: none;/,
    );
  });

  it("leaves the title and everything inside the link untouched", () => {
    const image = buildThumb("block");
    const before = document.querySelector("a#p1")?.outerHTML;

    thumbTooltipFeature.mount(ctx());

    expect(image.getAttribute("title")).toBe(TITLE);
    expect(document.querySelector("a#p1")?.outerHTML).toBe(before);
    expect(document.body.classList.contains(THUMB_TOOLTIP_INLINE_CLASS)).toBe(false);
  });

  it("marks the page when the site lays the link out inline, so it can wrap the image", () => {
    buildThumb("inline");
    thumbTooltipFeature.mount(ctx());
    expect(document.body.classList.contains(THUMB_TOOLTIP_INLINE_CLASS)).toBe(true);
    expect(thumbTooltipFeature.css).toContain("display: inline-block;");
  });
});
