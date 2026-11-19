import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FLUID_WRAPPER_CLASS,
  FLUID_WRAPPER_ID,
  VIDEO_ELEMENT_ID,
  VIDEO_PLAYER_ID,
  VIDEO_PLAYER_SETTING_CAPTION,
  computeVideoPlayerSize,
  measureMediaColumnWidthPx,
  videoPlayerFeature,
} from "../../src/features/video-player";
import {
  featureBodyClass,
  featureChoiceBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import {
  DEFAULT_VIDEO_MUTED,
  DEFAULT_VIDEO_PLAYBACK_RATE,
  DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED,
  DEFAULT_VIDEO_PREVIEW_ON_HOVER,
  DEFAULT_VIDEO_SIZE,
  DEFAULT_VIDEO_VOLUME,
  VIDEO_PLAYER_FEATURE_ID,
  VIDEO_PREVIEW_FEATURE_ID,
  VIDEO_SIZE_FIT_HEIGHT,
  VIDEO_SIZE_FIT_WIDTH,
  VIDEO_SIZE_ORIGINAL,
  parseVideoPlayerState,
  resolveVideoSize,
} from "../../src/storage/schema";

const BODY_CLASS = featureBodyClass(VIDEO_PLAYER_FEATURE_ID);
const BODY_SELECTOR_HINT = `body.${BODY_CLASS}`;

const SIZE_FIXTURE_COLUMN_PX = 900;
const SIZE_FIXTURE_AVAILABLE_HEIGHT_PX = 800;
const SIZE_FIXTURE_SMALL_WIDTH = 496;
const SIZE_FIXTURE_SMALL_HEIGHT = 608;
const SIZE_FIXTURE_WIDE_WIDTH = 2560;
const SIZE_FIXTURE_WIDE_HEIGHT = 1440;

type StoredState = {
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
};

function makeCtx(initial?: StoredState): {
  ctx: FeatureContext;
  writes: unknown[];
} {
  let current: unknown = initial;
  const writes: unknown[] = [];
  const ctx: FeatureContext = {
    pageKind: "post",
    search: "?page=post&s=view&id=1",
    getState: <T>(parse: (raw: unknown) => T): T => parse(current),
    setState: (value: unknown): void => {
      current = value;
      writes.push(value);
    },
  };
  return { ctx, writes };
}

function buildPlayerDom(options?: {
  readonly inlineSize?: boolean;
  readonly videoWidth?: number;
  readonly videoHeight?: number;
  readonly columnWidthPx?: number;
}): {
  video: HTMLVideoElement;
  wrapper: HTMLDivElement;
  column: HTMLDivElement;
} {
  document.body.innerHTML = "";
  document.body.classList.add(BODY_CLASS);
  document.body.classList.add(
    featureChoiceBodyClass(VIDEO_PLAYER_FEATURE_ID, VIDEO_SIZE_FIT_HEIGHT),
  );

  const header = document.createElement("div");
  header.id = "header";
  Object.defineProperty(header, "getBoundingClientRect", {
    value: (): DOMRect =>
      ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 48,
        right: 800,
        width: 800,
        height: 48,
        toJSON: (): Record<string, never> => ({}),
      }) satisfies DOMRect,
  });
  document.body.append(header);

  const column = document.createElement("div");
  const columnWidth = options?.columnWidthPx ?? SIZE_FIXTURE_COLUMN_PX;
  Object.defineProperty(column, "clientWidth", {
    configurable: true,
    get: () => columnWidth,
  });

  const wrapper = document.createElement("div");
  wrapper.id = FLUID_WRAPPER_ID;
  wrapper.className = FLUID_WRAPPER_CLASS;
  if (options?.inlineSize === true) {
    wrapper.style.width = "1280px";
    wrapper.style.height = "720px";
  }

  const video = document.createElement("video");
  video.id = VIDEO_ELEMENT_ID;
  video.loop = true;
  video.preload = "auto";
  const source = document.createElement("source");
  source.src = "https://example.com/clip.mp4";
  video.append(source);

  const width = options?.videoWidth ?? 1280;
  const height = options?.videoHeight ?? 720;
  Object.defineProperty(video, "videoWidth", { configurable: true, get: () => width });
  Object.defineProperty(video, "videoHeight", { configurable: true, get: () => height });
  Object.defineProperty(video, "readyState", {
    configurable: true,
    get: () => HTMLMediaElement.HAVE_METADATA,
  });

  wrapper.append(video);
  column.append(wrapper);
  document.body.append(column);
  return { video, wrapper, column };
}

function flushFirstPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

describe("video player schema (Package B + C HANDOFF)", () => {
  it("exports B/C feature ids and defaults", () => {
    expect(VIDEO_PLAYER_FEATURE_ID).toBe("video-player");
    expect(VIDEO_PREVIEW_FEATURE_ID).toBe("video-preview");
    expect(DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED).toBe(true);
    expect(DEFAULT_VIDEO_PREVIEW_ON_HOVER).toBe(false);
    expect(DEFAULT_VIDEO_SIZE).toBe(VIDEO_SIZE_FIT_HEIGHT);
    expect(DEFAULT_VIDEO_VOLUME).toBe(1);
    expect(DEFAULT_VIDEO_MUTED).toBe(false);
    expect(DEFAULT_VIDEO_PLAYBACK_RATE).toBe(1);
  });

  it("parseVideoPlayerState fills defaults and clamps volume", () => {
    expect(parseVideoPlayerState(undefined)).toEqual({
      volume: 1,
      muted: false,
      playbackRate: 1,
    });
    expect(parseVideoPlayerState({ volume: 2, muted: true, playbackRate: 1.5 })).toEqual({
      volume: 1,
      muted: true,
      playbackRate: 1.5,
    });
    expect(parseVideoPlayerState({ volume: -0.2 })).toEqual({
      volume: 0,
      muted: false,
      playbackRate: 1,
    });
  });

  it("resolveVideoSize accepts Fit height / width / Original", () => {
    expect(resolveVideoSize(undefined)).toBe(VIDEO_SIZE_FIT_HEIGHT);
    expect(resolveVideoSize(VIDEO_SIZE_FIT_WIDTH)).toBe(VIDEO_SIZE_FIT_WIDTH);
    expect(resolveVideoSize(VIDEO_SIZE_ORIGINAL)).toBe(VIDEO_SIZE_ORIGINAL);
    expect(resolveVideoSize("nope")).toBe(VIDEO_SIZE_FIT_HEIGHT);
  });
});

describe("computeVideoPlayerSize", () => {
  it("small 496×608: Original is pixel-perfect", () => {
    expect(
      computeVideoPlayerSize({
        mode: VIDEO_SIZE_ORIGINAL,
        videoWidth: SIZE_FIXTURE_SMALL_WIDTH,
        videoHeight: SIZE_FIXTURE_SMALL_HEIGHT,
        columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
        availableHeightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
      }),
    ).toEqual({
      widthPx: SIZE_FIXTURE_SMALL_WIDTH,
      heightPx: SIZE_FIXTURE_SMALL_HEIGHT,
    });
  });

  it("small 496×608: Fit width uses full column width", () => {
    const heightPx = Math.round(
      (SIZE_FIXTURE_COLUMN_PX * SIZE_FIXTURE_SMALL_HEIGHT) /
        SIZE_FIXTURE_SMALL_WIDTH,
    );
    expect(
      computeVideoPlayerSize({
        mode: VIDEO_SIZE_FIT_WIDTH,
        videoWidth: SIZE_FIXTURE_SMALL_WIDTH,
        videoHeight: SIZE_FIXTURE_SMALL_HEIGHT,
        columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
        availableHeightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
      }),
    ).toEqual({ widthPx: SIZE_FIXTURE_COLUMN_PX, heightPx });
    expect(heightPx).toBeGreaterThan(SIZE_FIXTURE_SMALL_HEIGHT);
  });

  it("small 496×608: Fit height upscales to available height", () => {
    const widthPx = Math.round(
      (SIZE_FIXTURE_AVAILABLE_HEIGHT_PX * SIZE_FIXTURE_SMALL_WIDTH) /
        SIZE_FIXTURE_SMALL_HEIGHT,
    );
    expect(widthPx).toBeLessThanOrEqual(SIZE_FIXTURE_COLUMN_PX);
    expect(
      computeVideoPlayerSize({
        mode: VIDEO_SIZE_FIT_HEIGHT,
        videoWidth: SIZE_FIXTURE_SMALL_WIDTH,
        videoHeight: SIZE_FIXTURE_SMALL_HEIGHT,
        columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
        availableHeightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
      }),
    ).toEqual({
      widthPx,
      heightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
    });
    expect(widthPx).toBeGreaterThan(SIZE_FIXTURE_SMALL_WIDTH);
  });

  it("wide 2560×1440: Original is pixel-perfect", () => {
    expect(
      computeVideoPlayerSize({
        mode: VIDEO_SIZE_ORIGINAL,
        videoWidth: SIZE_FIXTURE_WIDE_WIDTH,
        videoHeight: SIZE_FIXTURE_WIDE_HEIGHT,
        columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
        availableHeightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
      }),
    ).toEqual({
      widthPx: SIZE_FIXTURE_WIDE_WIDTH,
      heightPx: SIZE_FIXTURE_WIDE_HEIGHT,
    });
  });

  it("wide 2560×1440: Fit width uses full column width", () => {
    const heightPx = Math.round(
      (SIZE_FIXTURE_COLUMN_PX * SIZE_FIXTURE_WIDE_HEIGHT) /
        SIZE_FIXTURE_WIDE_WIDTH,
    );
    expect(
      computeVideoPlayerSize({
        mode: VIDEO_SIZE_FIT_WIDTH,
        videoWidth: SIZE_FIXTURE_WIDE_WIDTH,
        videoHeight: SIZE_FIXTURE_WIDE_HEIGHT,
        columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
        availableHeightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
      }),
    ).toEqual({ widthPx: SIZE_FIXTURE_COLUMN_PX, heightPx });
    expect(heightPx).toBeLessThan(SIZE_FIXTURE_WIDE_HEIGHT);
  });

  it("wide 2560×1440: Fit height clamps to column when too wide", () => {
    const widthIfFullHeight = Math.round(
      (SIZE_FIXTURE_AVAILABLE_HEIGHT_PX * SIZE_FIXTURE_WIDE_WIDTH) /
        SIZE_FIXTURE_WIDE_HEIGHT,
    );
    expect(widthIfFullHeight).toBeGreaterThan(SIZE_FIXTURE_COLUMN_PX);
    const heightPx = Math.round(
      (SIZE_FIXTURE_COLUMN_PX * SIZE_FIXTURE_WIDE_HEIGHT) /
        SIZE_FIXTURE_WIDE_WIDTH,
    );
    expect(
      computeVideoPlayerSize({
        mode: VIDEO_SIZE_FIT_HEIGHT,
        videoWidth: SIZE_FIXTURE_WIDE_WIDTH,
        videoHeight: SIZE_FIXTURE_WIDE_HEIGHT,
        columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
        availableHeightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
      }),
    ).toEqual({ widthPx: SIZE_FIXTURE_COLUMN_PX, heightPx });
  });
});

describe("videoPlayerFeature contract", () => {
  it("exports Feature for Phase 2 registry HANDOFF", () => {
    expect(videoPlayerFeature.id).toBe(VIDEO_PLAYER_ID);
    expect(videoPlayerFeature.id).toBe("video-player");
    expect(videoPlayerFeature.label).toBe("Video player tweaks");
    expect(videoPlayerFeature.pages).toEqual(["post"]);
    expect(videoPlayerFeature.defaultEnabled).toBe(true);
    expect(videoPlayerFeature.cssOnly).toBe(true);
    expect(videoPlayerFeature.settingsCaption).toBe(VIDEO_PLAYER_SETTING_CAPTION);
    expect(videoPlayerFeature.choice?.defaultValue).toBe(VIDEO_SIZE_FIT_HEIGHT);
    expect(videoPlayerFeature.choice?.options.map((o) => o.value)).toEqual([
      VIDEO_SIZE_FIT_HEIGHT,
      VIDEO_SIZE_FIT_WIDTH,
      VIDEO_SIZE_ORIGINAL,
    ]);
    expect(videoPlayerFeature.choice?.options.map((o) => o.label)).toEqual([
      "Fit height",
      "Fit width",
      "Original",
    ]);
  });

  it("css keeps Fluid wrapper box-sizing without !important width/height", () => {
    const css = videoPlayerFeature.css;
    expect(css).toContain(`${BODY_SELECTOR_HINT} #${FLUID_WRAPPER_ID}`);
    expect(css).toContain("box-sizing: border-box");
    expect(css).not.toMatch(/width\s*:\s*[^;]+!important/);
    expect(css).not.toMatch(/height\s*:\s*[^;]+!important/);
  });
});

describe("videoPlayerFeature mount behavior", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX + 48 + 12,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    vi.restoreAllMocks();
  });

  it("applies persisted volume/mute/rate on loadedmetadata path", async () => {
    const { video } = buildPlayerDom();
    const { ctx, writes } = makeCtx({
      volume: 0.4,
      muted: true,
      playbackRate: 1.25,
    });

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    expect(video.volume).toBeCloseTo(0.4);
    expect(video.muted).toBe(true);
    expect(video.playbackRate).toBe(1.25);
    expect(writes.length).toBe(0);
  });

  it("persists volumechange and ratechange into feature state", async () => {
    const { video } = buildPlayerDom();
    const { ctx, writes } = makeCtx({
      volume: 1,
      muted: false,
      playbackRate: 1,
    });

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    // Dragging the volume fires many events: the last value is written once,
    // as the page is left or after a pause, not the whole storage for each.
    const before = writes.length;
    video.volume = 0.3;
    video.dispatchEvent(new Event("volumechange"));
    video.volume = 0.55;
    video.dispatchEvent(new Event("volumechange"));
    video.playbackRate = 0.75;
    video.dispatchEvent(new Event("ratechange"));
    expect(writes.length).toBe(before);

    window.dispatchEvent(new Event("pagehide"));
    expect(writes.length).toBe(before + 1);
    expect(writes.at(-1)).toEqual({
      volume: 0.55,
      muted: false,
      playbackRate: 0.75,
    });

    // And after a pause with no page left.
    video.volume = 0.2;
    video.dispatchEvent(new Event("volumechange"));
    await vi.waitFor(() => {
      expect(writes.at(-1)).toEqual({ volume: 0.2, muted: false, playbackRate: 0.75 });
    });
    expect(writes.length).toBe(before + 2);
  });

  it("does not bind wheel volume handlers", async () => {
    const { video, wrapper } = buildPlayerDom();
    const { ctx } = makeCtx({
      volume: 0.5,
      muted: false,
      playbackRate: 1,
    });

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    const upEvent = new WheelEvent("wheel", {
      deltaY: -100,
      shiftKey: false,
      bubbles: true,
      cancelable: true,
    });
    const prevented = !wrapper.dispatchEvent(upEvent);
    expect(prevented).toBe(false);
    expect(video.volume).toBeCloseTo(0.5);
  });

  it("applies Fit height size that upscales a small clip", async () => {
    const { wrapper } = buildPlayerDom({
      videoWidth: SIZE_FIXTURE_SMALL_WIDTH,
      videoHeight: SIZE_FIXTURE_SMALL_HEIGHT,
      columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
    });
    const { ctx } = makeCtx();

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    const expected = computeVideoPlayerSize({
      mode: VIDEO_SIZE_FIT_HEIGHT,
      videoWidth: SIZE_FIXTURE_SMALL_WIDTH,
      videoHeight: SIZE_FIXTURE_SMALL_HEIGHT,
      columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
      availableHeightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
    });
    expect(wrapper.style.width).toBe(`${String(expected.widthPx)}px`);
    expect(wrapper.style.height).toBe(`${String(expected.heightPx)}px`);
    expect(expected.widthPx).toBeGreaterThan(SIZE_FIXTURE_SMALL_WIDTH);
  });

  it("sizes a player whose block the site makes after the script has started", async () => {
    const { wrapper, column, video } = buildPlayerDom({
      videoWidth: SIZE_FIXTURE_SMALL_WIDTH,
      videoHeight: SIZE_FIXTURE_SMALL_HEIGHT,
      columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
    });
    // The page as the script finds it since 0.72: the video is there, the
    // player's block around it is not yet.
    column.append(video);
    wrapper.remove();
    const { ctx } = makeCtx();

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();
    expect(wrapper.style.width).toBe("");

    // The site's player puts its block around the video.
    wrapper.append(video);
    column.append(wrapper);
    await vi.waitFor(() => {
      expect(wrapper.style.width).not.toBe("");
    });

    const expected = computeVideoPlayerSize({
      mode: VIDEO_SIZE_FIT_HEIGHT,
      videoWidth: SIZE_FIXTURE_SMALL_WIDTH,
      videoHeight: SIZE_FIXTURE_SMALL_HEIGHT,
      columnWidthPx: SIZE_FIXTURE_COLUMN_PX,
      availableHeightPx: SIZE_FIXTURE_AVAILABLE_HEIGHT_PX,
    });
    expect(wrapper.style.width).toBe(`${String(expected.widthPx)}px`);
    expect(wrapper.style.height).toBe(`${String(expected.heightPx)}px`);
  });

  it("does not strip Fluid wrapper class or replace the wrapper element", async () => {
    const { wrapper } = buildPlayerDom({ inlineSize: true });
    const { ctx } = makeCtx();
    const beforeId = wrapper.id;
    const beforeClass = wrapper.className;

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    const after = document.getElementById(FLUID_WRAPPER_ID);
    expect(after).toBe(wrapper);
    expect(after?.id).toBe(beforeId);
    expect(after?.classList.contains(FLUID_WRAPPER_CLASS)).toBe(true);
    expect(after?.className).toBe(beforeClass);
    expect(document.getElementById(VIDEO_ELEMENT_ID)).not.toBeNull();
  });
});

describe("the room of the player beside the panel", () => {
  function width(element: HTMLElement, name: "clientWidth" | "offsetWidth", value: number): void {
    Object.defineProperty(element, name, { value, configurable: true });
  }

  it("is what the row has left beside the panel, not the width of the player's own block", () => {
    document.body.replaceChildren();
    const row = document.createElement("div");
    row.className = "flexi";
    row.style.columnGap = "12px";
    const media = document.createElement("div");
    const wrapper = document.createElement("div");
    media.append(wrapper);
    const panel = document.createElement("div");
    panel.id = "rdw-post-actions";
    panel.style.position = "sticky";
    panel.style.marginLeft = "12px";
    row.append(media, panel);
    document.body.append(row);
    width(row, "clientWidth", 1640);
    // The block of the player is as wide as the small player the site drew.
    width(media, "clientWidth", 264);
    width(panel, "offsetWidth", 360);

    expect(measureMediaColumnWidthPx(wrapper)).toBe(1640 - 360 - 12 - 12);

    // On a narrow window the panel is under the player: the block's own width, as before.
    panel.style.position = "static";
    expect(measureMediaColumnWidthPx(wrapper)).toBe(264);

    // With no panel on the page, the same.
    panel.remove();
    expect(measureMediaColumnWidthPx(wrapper)).toBe(264);
  });
});

