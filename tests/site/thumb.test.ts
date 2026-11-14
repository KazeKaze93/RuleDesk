import { describe, expect, it } from "vitest";

import {
  THUMB_IMAGE_HOST,
  VIDEO_CDN_ORIGIN,
  buildVideoUrlFromThumbUrl,
  deriveThumbUrlFromMedia,
} from "../../src/site/thumb";

const SAMPLE_DIR = "4227";
const SAMPLE_HASH = "a1b2c3d4e5f6";
const SAMPLE_ID = "987654";

const SAMPLE_THUMB_URL =
  `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.jpg?${SAMPLE_ID}`;
const SAMPLE_VIDEO_URL =
  `${VIDEO_CDN_ORIGIN}//images/${SAMPLE_DIR}/${SAMPLE_HASH}.mp4?${SAMPLE_ID}`;

describe("buildVideoUrlFromThumbUrl", () => {
  it("maps wimg thumbnail URL to ws-cdn-video mp4 with double-slash path", () => {
    expect(buildVideoUrlFromThumbUrl(SAMPLE_THUMB_URL)).toBe(SAMPLE_VIDEO_URL);
  });

  it("preserves empty query when thumb has none", () => {
    const thumb =
      `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.jpg`;
    expect(buildVideoUrlFromThumbUrl(thumb)).toBe(
      `${VIDEO_CDN_ORIGIN}//images/${SAMPLE_DIR}/${SAMPLE_HASH}.mp4`,
    );
  });

  it("accepts uppercase .JPG extension in path", () => {
    const thumb =
      `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.JPG?1`;
    expect(buildVideoUrlFromThumbUrl(thumb)).toBe(
      `${VIDEO_CDN_ORIGIN}//images/${SAMPLE_DIR}/${SAMPLE_HASH}.mp4?1`,
    );
  });

  it("returns null for unparseable input", () => {
    expect(buildVideoUrlFromThumbUrl("")).toBeNull();
    expect(buildVideoUrlFromThumbUrl("not-a-url")).toBeNull();
    expect(
      buildVideoUrlFromThumbUrl(
        `https://example.com/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.jpg`,
      ),
    ).toBeNull();
    expect(
      buildVideoUrlFromThumbUrl(
        `https://${THUMB_IMAGE_HOST}/images/${SAMPLE_DIR}/${SAMPLE_HASH}.jpg`,
      ),
    ).toBeNull();
    expect(
      buildVideoUrlFromThumbUrl(
        `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/${SAMPLE_HASH}.jpg`,
      ),
    ).toBeNull();
    expect(
      buildVideoUrlFromThumbUrl(
        `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.png`,
      ),
    ).toBeNull();
  });
});

const SAMPLE_MEDIA_DIR = "2539";
const SAMPLE_MEDIA_HASH = "abcd1234ef";
const SAMPLE_MEDIA_POST_ID = 111;
const VIDEO_MEDIA_DIR = "3561";
const VIDEO_MEDIA_HASH = "ef987654ab";
const VIDEO_MEDIA_POST_ID = 222;

describe("deriveThumbUrlFromMedia", () => {
  it("maps a sample URL with a repeated slash to the wimg thumbnail", () => {
    const media =
      `https://${THUMB_IMAGE_HOST}//samples/${SAMPLE_MEDIA_DIR}/sample_${SAMPLE_MEDIA_HASH}.jpg?${String(SAMPLE_MEDIA_POST_ID)}`;
    expect(deriveThumbUrlFromMedia(media, SAMPLE_MEDIA_POST_ID)).toBe(
      `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_MEDIA_DIR}/thumbnail_${SAMPLE_MEDIA_HASH}.jpg?${String(SAMPLE_MEDIA_POST_ID)}`,
    );
  });

  it("maps a video CDN image URL with a repeated slash to the wimg thumbnail", () => {
    const media =
      `${VIDEO_CDN_ORIGIN}//images/${VIDEO_MEDIA_DIR}/${VIDEO_MEDIA_HASH}.mp4?${String(VIDEO_MEDIA_POST_ID)}`;
    expect(deriveThumbUrlFromMedia(media, VIDEO_MEDIA_POST_ID)).toBe(
      `https://${THUMB_IMAGE_HOST}/thumbnails/${VIDEO_MEDIA_DIR}/thumbnail_${VIDEO_MEDIA_HASH}.jpg?${String(VIDEO_MEDIA_POST_ID)}`,
    );
  });

  it("accepts extra repeated slashes and uses the post id as the query", () => {
    const media =
      `https://${THUMB_IMAGE_HOST}//samples//${SAMPLE_MEDIA_DIR}//sample_${SAMPLE_MEDIA_HASH}.png`;
    expect(deriveThumbUrlFromMedia(media, SAMPLE_MEDIA_POST_ID)).toBe(
      `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_MEDIA_DIR}/thumbnail_${SAMPLE_MEDIA_HASH}.jpg?${String(SAMPLE_MEDIA_POST_ID)}`,
    );
  });

  it("returns null for unparseable input", () => {
    expect(deriveThumbUrlFromMedia("", SAMPLE_MEDIA_POST_ID)).toBeNull();
    expect(deriveThumbUrlFromMedia("not-a-url", SAMPLE_MEDIA_POST_ID)).toBeNull();
    expect(
      deriveThumbUrlFromMedia(
        `https://example.com/samples/${SAMPLE_MEDIA_DIR}/sample_${SAMPLE_MEDIA_HASH}.jpg`,
        SAMPLE_MEDIA_POST_ID,
      ),
    ).toBeNull();
    expect(
      deriveThumbUrlFromMedia(
        `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_MEDIA_DIR}/thumbnail_${SAMPLE_MEDIA_HASH}.jpg?1`,
        SAMPLE_MEDIA_POST_ID,
      ),
    ).toBeNull();
    expect(
      deriveThumbUrlFromMedia(
        `http://${THUMB_IMAGE_HOST}//samples/${SAMPLE_MEDIA_DIR}/sample_${SAMPLE_MEDIA_HASH}.jpg`,
        SAMPLE_MEDIA_POST_ID,
      ),
    ).toBeNull();
    expect(
      deriveThumbUrlFromMedia(
        `https://${THUMB_IMAGE_HOST}//samples/${SAMPLE_MEDIA_DIR}/sample_${SAMPLE_MEDIA_HASH}.jpg`,
        -1,
      ),
    ).toBeNull();
  });
});
