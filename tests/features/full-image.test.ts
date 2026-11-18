import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FULL_IMAGE_ATTRIBUTE,
  fullImageFeature,
  fullImageUrl,
  loadFullImage,
} from "../../src/features/full-image";

const SAMPLE = "https://example.test/samples/12/sample_abc.jpg";
const ORIGINAL = "https://example.test/images/12/abc.png";

function pageImage(): HTMLImageElement {
  document.body.innerHTML = `<div class="flexi"><div><img id="image" src="${SAMPLE}" width="850" height="600"></div></div>`;
  const image = document.querySelector("img#image");
  if (!(image instanceof HTMLImageElement)) {
    throw new Error("no image");
  }
  return image;
}

describe("the full-size image of a post", () => {
  const loaders: HTMLImageElement[] = [];

  beforeEach(() => {
    loaders.length = 0;
    const RealImage = window.Image;
    vi.stubGlobal(
      "Image",
      function FakeImage(): HTMLImageElement {
        const image = new RealImage();
        loaders.push(image);
        return image;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is off unless turned on, and says what it costs", () => {
    expect(fullImageFeature.defaultEnabled).toBe(false);
    expect(fullImageFeature.pages).toEqual(["post"]);
    expect(fullImageFeature.label).toBe("Load full-size image");
    expect(fullImageFeature.settingsCaption).toContain("originals are often several MB");
  });

  it("takes a still original that is not shown yet, and leaves a GIF and a video alone", () => {
    const image = pageImage();
    expect(fullImageUrl(image, ORIGINAL)).toBe(ORIGINAL);
    expect(fullImageUrl(image, `${ORIGINAL}?12345`)).toBe(`${ORIGINAL}?12345`);
    expect(fullImageUrl(image, "https://example.test/images/12/abc.gif")).toBeNull();
    expect(fullImageUrl(image, "https://example.test/images/12/abc.mp4")).toBeNull();
    expect(fullImageUrl(image, "")).toBeNull();
    expect(fullImageUrl(image, SAMPLE)).toBeNull();
  });

  it("keeps the copy until the original has come, then shows the original", () => {
    const image = pageImage();
    expect(loadFullImage(document, ORIGINAL)).toBe(true);
    expect(loaders).toHaveLength(1);
    expect(loaders[0]?.src).toBe(ORIGINAL);
    expect(image.src).toBe(SAMPLE);
    expect(image.hasAttribute(FULL_IMAGE_ATTRIBUTE)).toBe(false);

    loaders[0]?.dispatchEvent(new Event("load"));
    expect(image.src).toBe(ORIGINAL);
    expect(image.hasAttribute(FULL_IMAGE_ATTRIBUTE)).toBe(true);
  });

  it("leaves the copy when the original does not load", () => {
    const image = pageImage();
    loadFullImage(document, ORIGINAL);
    loaders[0]?.dispatchEvent(new Event("error"));
    expect(image.src).toBe(SAMPLE);
    expect(image.hasAttribute(FULL_IMAGE_ATTRIBUTE)).toBe(false);
  });

  it("asks for nothing on a page without a picture or without an original", () => {
    document.body.innerHTML = `<div class="flexi"><div><video></video></div></div>`;
    expect(loadFullImage(document, ORIGINAL)).toBe(false);
    pageImage();
    expect(loadFullImage(document, "")).toBe(false);
    expect(loaders).toHaveLength(0);
  });

  it("lets the picture be as wide as the room, never wider than it is", () => {
    expect(fullImageFeature.css).toContain(`img#image[${FULL_IMAGE_ATTRIBUTE}]`);
    expect(fullImageFeature.css).toContain("max-width: 100%");
    expect(fullImageFeature.css).toContain("width: auto !important");
  });
});
