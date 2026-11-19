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
  POST_ACTIONS_ID,
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

/** The row of the post: the media and, on a wide window, the panel beside it. */
const POST_ROW_SELECTOR = "div.flexi";
const PANEL_BESIDE_POSITION = "sticky";

function pixels(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * The room the player has. With the panel beside it, the block the player is
 * in is as wide as the player itself, so its width says nothing: the player
 * was then sized by its own size of the moment, and when the panel was there
 * first it stayed as small as the site had drawn it (Kaze, 19.11.2026: a
 * player of 264 px on a wide window, after 0.72 made the start quicker). The
 * room is what the row has left beside the panel.
 *
 * That alone was too much (0.72.2: a player of 1210 px in a block of 1000,
 * its right side under the panel): the block of the player does not grow past
 * a width of its own, set by the site, which the script does not know. So the
 * page is asked: the player is made as wide as the row could give, and the
 * width its block then really has is the room.
 */
export function measureMediaColumnWidthPx(wrapper: HTMLElement): number {
  const parent = wrapper.parentElement;
  const row = wrapper.closest(POST_ROW_SELECTOR);
  if (parent !== null && row instanceof HTMLElement && row.clientWidth > 0) {
    let offered = row.clientWidth;
    const panel = document.getElementById(POST_ACTIONS_ID);
    if (panel !== null && panel.parentElement === row) {
      const panelStyle = window.getComputedStyle(panel);
      if (panelStyle.position === PANEL_BESIDE_POSITION) {
        offered -=
          panel.offsetWidth +
          pixels(panelStyle.marginLeft) +
          pixels(window.getComputedStyle(row).columnGap);
      }
    }
    offered = Math.floor(offered);
    if (offered > 0) {
      const before = wrapper.style.width;
      wrapper.style.width = `${String(offered)}px`;
      // Reading the width lays the page out with the player that wide.
      const given = parent.clientWidth;
      wrapper.style.width = before;
      return given > 0 ? Math.min(offered, given) : offered;
    }
  }
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
 * Apply persisted volume/mute/rate. The site's player may not show a volume
 * set from here in its own volume control.
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

/** After the last change of volume or speed, before it is written. */
const PERSIST_PAUSE_MS = 400;
let persistTimer: number | undefined;
let persistNow: (() => void) | null = null;

/**
 * Keeps the volume and the speed. Dragging the volume fires the event many
 * times a second, and each write is of the whole storage: the last value is
 * written once the dragging has paused, or as the page is left.
 */
function persistFromVideo(
  ctx: FeatureContext,
  video: HTMLVideoElement,
): void {
  persistNow = (): void => {
    persistNow = null;
    window.clearTimeout(persistTimer);
    persistTimer = undefined;
    writeStoredState(ctx, {
      volume: clampVolume(video.volume),
      muted: video.muted,
      playbackRate: video.playbackRate,
    });
  };
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    persistNow?.();
  }, PERSIST_PAUSE_MS);
}

function flushPersist(): void {
  persistNow?.();
}

/** How long the site's player is waited for after the script has started. */
const WRAPPER_WAIT_MS = 15000;

function bindPlayer(ctx: FeatureContext, video: HTMLVideoElement): void {
  const state = readStoredState(ctx);

  // The site's player puts its block around the video some time after the
  // page has loaded. It was looked for once, as the script started: since
  // 0.72 the script starts before the player has done that, found no block
  // and never sized the player, which stayed as the site drew it, 264 px wide
  // for one video and taller than the window for another (Kaze, 19.11.2026).
  // The block is looked for each time the size is set, and waited for.
  const applyLayout = (): void => {
    const wrapper = findWrapper();
    if (wrapper !== null) {
      applyWrapperSize(wrapper, video);
    }
  };

  if (findWrapper() === null) {
    const waiting = new MutationObserver(() => {
      if (findWrapper() !== null) {
        waiting.disconnect();
        applyLayout();
      }
    });
    waiting.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => {
      waiting.disconnect();
    }, WRAPPER_WAIT_MS);
  }

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
  window.addEventListener("pagehide", flushPersist);

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

/**
 * A click on the picture of the player plays and pauses, every time. The
 * site's player does that only through its own play mark, which is gone once
 * playback has started. The controls keep their own clicks: only a click that
 * lands on the video itself is taken.
 */
export function bindClickToToggle(video: HTMLVideoElement): void {
  video.addEventListener(
    "click",
    (event) => {
      if (!document.body.classList.contains(BODY_CLASS) || event.button !== 0) {
        return;
      }
      // Taken here so that the player's own handler does not toggle a second time.
      event.preventDefault();
      event.stopImmediatePropagation();
      if (video.paused) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    },
    true,
  );
}

function mountVideoPlayer(ctx: FeatureContext): void {
  scheduleAfterFirstPaint(() => {
    const video = findVideo();
    // A post with an image has no player: nothing to do, nothing to report.
    if (video === null) {
      return;
    }
    bindPlayer(ctx, video);
    bindClickToToggle(video);
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
