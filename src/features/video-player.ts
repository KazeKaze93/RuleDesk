/**
 * Post-page Fluid Player tweaks: persist volume/mute/rate, and CSS/JS size
 * modes (Fit height / Fit width / Original).
 *
 * Does not replace the Fluid wrapper or rename its classes — only the
 * wrapper size via explicit width/height (overrides Fluid's intrinsic px).
 */

import { scheduleAfterFirstPaint } from "../boot/ready";
import {
  DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED,
  DEFAULT_VIDEO_SIZE,
  VIDEO_PLAYER_FEATURE_ID,
  VIDEO_SIZE_FIT_HEIGHT,
  VIDEO_SIZE_FIT_WIDTH,
  VIDEO_SIZE_ORIGINAL,
  parseVideoPlayerState,
  resolveVideoSize,
  type VideoPlayerState,
  type VideoSize,
} from "../storage/schema";
import { measureHeaderOffsetPx } from "./post-panel/site-reads";
import {
  featureBodyClass,
  featureChoiceBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

export const VIDEO_PLAYER_ID = VIDEO_PLAYER_FEATURE_ID;
const FEATURE_ID = VIDEO_PLAYER_FEATURE_ID;
const FEATURE_LABEL = "Video player tweaks";
const FEATURE_PAGES = ["post"] as const;

export const VIDEO_ELEMENT_ID = "gelcomVideoPlayer";
export const FLUID_WRAPPER_ID = "fluid_video_wrapper_gelcomVideoPlayer";
export const FLUID_WRAPPER_CLASS = "fluid_video_wrapper";

const VOLUME_MIN = 0;
const VOLUME_MAX = 1;
const CHROME_GAP_PX = 12;

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_CLASS}`;
const WRAPPER_SELECTOR = `#${FLUID_WRAPPER_ID}.${FLUID_WRAPPER_CLASS}`;

const SIZE_LABEL_FIT_HEIGHT = "Fit height";
const SIZE_LABEL_FIT_WIDTH = "Fit width";
const SIZE_LABEL_ORIGINAL = "Original";

const SIZE_MODE_VALUES = [
  VIDEO_SIZE_FIT_HEIGHT,
  VIDEO_SIZE_FIT_WIDTH,
  VIDEO_SIZE_ORIGINAL,
] as const;

/** Settings caption under the Video player tweaks switch. */
export const VIDEO_PLAYER_SETTING_CAPTION =
  "Fit height fills under the header (may upscale). Fit width uses the media column. Original is native pixels.";

const FEATURE_CSS = [
  `${BODY_SELECTOR} ${WRAPPER_SELECTOR} {`,
  `  box-sizing: border-box;`,
  `}`,
].join("\n");

export type VideoPlayerSizeInput = {
  readonly mode: VideoSize;
  readonly videoWidth: number;
  readonly videoHeight: number;
  readonly columnWidthPx: number;
  readonly availableHeightPx: number;
};

export type VideoPlayerSizeResult = {
  readonly widthPx: number;
  readonly heightPx: number;
};

/**
 * Pure size calculator for the three Video size modes.
 * Fit height may upscale; Fit width always uses full column width;
 * Original is videoWidth × videoHeight with no scaling.
 */
export function computeVideoPlayerSize(
  input: VideoPlayerSizeInput,
): VideoPlayerSizeResult {
  const {
    mode,
    videoWidth,
    videoHeight,
    columnWidthPx,
    availableHeightPx,
  } = input;

  if (
    videoWidth <= 0 ||
    videoHeight <= 0 ||
    columnWidthPx <= 0 ||
    availableHeightPx <= 0
  ) {
    return { widthPx: 0, heightPx: 0 };
  }

  if (mode === VIDEO_SIZE_ORIGINAL) {
    return { widthPx: videoWidth, heightPx: videoHeight };
  }

  if (mode === VIDEO_SIZE_FIT_WIDTH) {
    return sizeForColumnWidth(videoWidth, videoHeight, columnWidthPx);
  }

  // Fit height: fill available height, then clamp to column width.
  const widthIfFullHeight = Math.round(
    (availableHeightPx * videoWidth) / videoHeight,
  );
  if (widthIfFullHeight <= columnWidthPx) {
    return { widthPx: widthIfFullHeight, heightPx: availableHeightPx };
  }
  return sizeForColumnWidth(videoWidth, videoHeight, columnWidthPx);
}

function sizeForColumnWidth(
  videoWidth: number,
  videoHeight: number,
  columnWidthPx: number,
): VideoPlayerSizeResult {
  return {
    widthPx: columnWidthPx,
    heightPx: Math.round((columnWidthPx * videoHeight) / videoWidth),
  };
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return VOLUME_MIN;
  }
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, value));
}

function readStoredState(ctx: FeatureContext): VideoPlayerState {
  return ctx.getState(parseVideoPlayerState);
}

function writeStoredState(ctx: FeatureContext, state: VideoPlayerState): void {
  ctx.setState({
    volume: state.volume,
    muted: state.muted,
    playbackRate: state.playbackRate,
  });
}

function findVideo(): HTMLVideoElement | null {
  const node = document.getElementById(VIDEO_ELEMENT_ID);
  return node instanceof HTMLVideoElement ? node : null;
}

function findWrapper(): HTMLElement | null {
  const node = document.getElementById(FLUID_WRAPPER_ID);
  if (!(node instanceof HTMLElement)) {
    return null;
  }
  if (!node.classList.contains(FLUID_WRAPPER_CLASS)) {
    return null;
  }
  return node;
}

function readSizeModeFromBody(): VideoSize {
  for (const value of SIZE_MODE_VALUES) {
    if (
      document.body.classList.contains(featureChoiceBodyClass(FEATURE_ID, value))
    ) {
      return value;
    }
  }
  return resolveVideoSize(DEFAULT_VIDEO_SIZE);
}

function measureMediaColumnWidthPx(wrapper: HTMLElement): number {
  const parent = wrapper.parentElement;
  if (parent !== null && parent.clientWidth > 0) {
    return parent.clientWidth;
  }
  return wrapper.clientWidth;
}

function measureAvailableHeightPx(): number {
  const chromeOffsetPx = measureHeaderOffsetPx(CHROME_GAP_PX);
  return Math.max(0, window.innerHeight - chromeOffsetPx);
}

function clearWrapperSize(wrapper: HTMLElement): void {
  wrapper.style.removeProperty("width");
  wrapper.style.removeProperty("height");
}

function applyWrapperSize(wrapper: HTMLElement, video: HTMLVideoElement): void {
  if (!document.body.classList.contains(BODY_CLASS)) {
    clearWrapperSize(wrapper);
    return;
  }

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  if (videoWidth <= 0 || videoHeight <= 0) {
    return;
  }

  const size = computeVideoPlayerSize({
    mode: readSizeModeFromBody(),
    videoWidth,
    videoHeight,
    columnWidthPx: measureMediaColumnWidthPx(wrapper),
    availableHeightPx: measureAvailableHeightPx(),
  });
  if (size.widthPx <= 0 || size.heightPx <= 0) {
    return;
  }
  wrapper.style.width = `${String(size.widthPx)}px`;
  wrapper.style.height = `${String(size.heightPx)}px`;
}

/**
 * Apply persisted volume/mute/rate. Fluid's own volume UI may not mirror
 * programmatic `video.volume` / `video.muted` — see LIVE-CHECK note.
 */
function applyPersistedPlayback(
  video: HTMLVideoElement,
  state: VideoPlayerState,
): void {
  const volume = state.volume ?? VOLUME_MAX;
  const muted = state.muted ?? false;
  const playbackRate = state.playbackRate ?? 1;
  video.volume = clampVolume(volume);
  video.muted = muted;
  video.playbackRate = playbackRate;
}

function persistFromVideo(
  ctx: FeatureContext,
  video: HTMLVideoElement,
): void {
  writeStoredState(ctx, {
    volume: clampVolume(video.volume),
    muted: video.muted,
    playbackRate: video.playbackRate,
  });
}

function bindPlayer(ctx: FeatureContext, video: HTMLVideoElement): void {
  const wrapper = findWrapper();
  const state = readStoredState(ctx);

  const applyLayout = (): void => {
    if (wrapper !== null) {
      applyWrapperSize(wrapper, video);
    }
  };

  const onLoadedMetadata = (): void => {
    applyPersistedPlayback(video, readStoredState(ctx));
    applyLayout();
  };

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    applyPersistedPlayback(video, state);
    applyLayout();
  }
  video.addEventListener("loadedmetadata", onLoadedMetadata);

  video.addEventListener("volumechange", () => {
    persistFromVideo(ctx, video);
  });
  video.addEventListener("ratechange", () => {
    persistFromVideo(ctx, video);
  });

  const onResize = (): void => {
    applyLayout();
  };
  window.addEventListener("resize", onResize);

  const bodyObserver = new MutationObserver(() => {
    applyLayout();
  });
  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

function mountVideoPlayer(ctx: FeatureContext): void {
  scheduleAfterFirstPaint(() => {
    const video = findVideo();
    // A post with an image has no player: nothing to do, nothing to report.
    if (video === null) {
      return;
    }
    bindPlayer(ctx, video);
  });
}

export const videoPlayerFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED,
  cssOnly: true,
  settingsCaption: VIDEO_PLAYER_SETTING_CAPTION,
  choice: {
    label: "Video size",
    options: [
      { value: VIDEO_SIZE_FIT_HEIGHT, label: SIZE_LABEL_FIT_HEIGHT },
      { value: VIDEO_SIZE_FIT_WIDTH, label: SIZE_LABEL_FIT_WIDTH },
      { value: VIDEO_SIZE_ORIGINAL, label: SIZE_LABEL_ORIGINAL },
    ],
    defaultValue: DEFAULT_VIDEO_SIZE,
  },
  css: FEATURE_CSS,
  mount: mountVideoPlayer,
};

export { FEATURE_CSS };
