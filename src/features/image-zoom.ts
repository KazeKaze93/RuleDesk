import { findOriginalAnchor, IMAGE_ID } from "./post-panel/site-reads";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

/**
 * A click on the picture of a post opens it over the page, where it can be
 * zoomed with the wheel and dragged. Pictures and GIFs only: a video post has
 * no `img#image`, and its player is left alone.
 *
 * The viewer shows the original file (the site's own "Original image" link),
 * so the one thing it asks the site for is that file, and only on the click.
 */

const FEATURE_ID = "image-zoom";
const FEATURE_LABEL = "Zoom the picture on click";
const BODY_CLASS = featureBodyClass(FEATURE_ID);

export const VIEWER_ID = "rdw-image-viewer";
const STAGE_CLASS = "rdw-image-viewer-stage";
const IMAGE_CLASS = "rdw-image-viewer-image";
const BAR_CLASS = "rdw-image-viewer-bar";
const BUTTON_CLASS = "rdw-image-viewer-button";
const SCALE_CLASS = "rdw-image-viewer-scale";
const DRAGGING_CLASS = "rdw-image-viewer--dragging";

const VIEWER_Z_INDEX = 2147483000;
/** Space kept around a picture fitted to the window. */
const FIT_MARGIN_PX = 24;
export const MAX_SCALE = 8;
/** One step of the wheel or of the buttons. */
export const ZOOM_STEP = 1.2;
/** A press that moves less than this is a click, not a drag. */
const DRAG_SLOP_PX = 4;

const LABEL_VIEWER = "Picture viewer";
const LABEL_ZOOM_IN = "Zoom in";
const LABEL_ZOOM_OUT = "Zoom out";
const LABEL_FIT = "Fit to window";
const LABEL_ACTUAL = "Actual size";
const LABEL_CLOSE = "Close";
const TEXT_ZOOM_IN = "+";
const TEXT_ZOOM_OUT = "−";
const TEXT_FIT = "Fit";
const TEXT_ACTUAL = "1:1";
const TEXT_CLOSE = "✕";

const FEATURE_CSS = `
body.${BODY_CLASS} img#${IMAGE_ID} {
  cursor: zoom-in;
}
#${VIEWER_ID} {
  position: fixed;
  inset: 0;
  z-index: ${String(VIEWER_Z_INDEX)};
  background: rgba(0, 0, 0, 0.88);
  overflow: hidden;
  touch-action: none;
  cursor: grab;
}
#${VIEWER_ID}.${DRAGGING_CLASS} {
  cursor: grabbing;
}
#${VIEWER_ID} .${STAGE_CLASS} {
  position: absolute;
  inset: 0;
}
#${VIEWER_ID} .${IMAGE_CLASS} {
  position: absolute;
  left: 50%;
  top: 50%;
  max-width: none;
  max-height: none;
  transform-origin: center;
  user-select: none;
  -webkit-user-drag: none;
}
#${VIEWER_ID} .${BAR_CLASS} {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 12px var(--rdw-font);
  cursor: default;
}
#${VIEWER_ID} .${BUTTON_CLASS} {
  min-width: 30px;
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: 600 12px var(--rdw-font);
  cursor: pointer;
}
#${VIEWER_ID} .${BUTTON_CLASS}:hover,
#${VIEWER_ID} .${BUTTON_CLASS}:focus-visible {
  background: var(--rdw-surface-2);
}
#${VIEWER_ID} .${BUTTON_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
#${VIEWER_ID} .${SCALE_CLASS} {
  min-width: 44px;
  text-align: center;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
`.trim();

/** Where the picture is: its scale and how far its centre is from the window's. */
export type ViewState = {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
};

/** The scale at which a picture of this size fits the window, never above 1. */
export function fitScale(
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
): number {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return 1;
  }
  const roomWidth = Math.max(1, viewWidth - FIT_MARGIN_PX * 2);
  const roomHeight = Math.max(1, viewHeight - FIT_MARGIN_PX * 2);
  return Math.min(1, roomWidth / imageWidth, roomHeight / imageHeight);
}

/** The least scale: the fitted one, so a picture cannot be lost by zooming out. */
export function clampScale(scale: number, fit: number): number {
  return Math.min(MAX_SCALE, Math.max(fit, scale));
}

/**
 * Zooms by `factor` so that the point of the picture under (`px`, `py`),
 * given from the window's centre, stays under it.
 */
export function zoomAt(
  state: ViewState,
  factor: number,
  px: number,
  py: number,
  fit: number,
): ViewState {
  const scale = clampScale(state.scale * factor, fit);
  const ratio = scale / state.scale;
  if (scale === fit) {
    // Back at the fitted size the picture is centred again.
    return { scale, x: 0, y: 0 };
  }
  return {
    scale,
    x: px - (px - state.x) * ratio,
    y: py - (py - state.y) * ratio,
  };
}

type Viewer = {
  readonly root: HTMLElement;
  readonly image: HTMLImageElement;
  readonly scaleLabel: HTMLElement;
  readonly opener: HTMLElement | null;
  state: ViewState;
  fit: number;
};

let viewer: Viewer | null = null;

function render(target: Viewer): void {
  const { state } = target;
  target.image.style.transform = `translate(-50%, -50%) translate(${String(state.x)}px, ${String(state.y)}px) scale(${String(state.scale)})`;
  target.scaleLabel.textContent = `${String(Math.round(state.scale * 100))}%`;
}

function refit(target: Viewer, reset: boolean): void {
  target.fit = fitScale(
    target.image.naturalWidth,
    target.image.naturalHeight,
    window.innerWidth,
    window.innerHeight,
  );
  target.state = reset
    ? { scale: target.fit, x: 0, y: 0 }
    : { ...target.state, scale: clampScale(target.state.scale, target.fit) };
  render(target);
}

function zoomBy(target: Viewer, factor: number, px: number, py: number): void {
  target.state = zoomAt(target.state, factor, px, py, target.fit);
  render(target);
}

export function closeImageViewer(): void {
  if (viewer === null) {
    return;
  }
  const { root, opener } = viewer;
  viewer = null;
  root.remove();
  document.removeEventListener("keydown", onKeyDown, true);
  window.removeEventListener("resize", onResize);
  opener?.focus();
}

function onKeyDown(event: KeyboardEvent): void {
  if (viewer === null) {
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeImageViewer();
  } else if (event.key === "+" || event.key === "=") {
    zoomBy(viewer, ZOOM_STEP, 0, 0);
  } else if (event.key === "-") {
    zoomBy(viewer, 1 / ZOOM_STEP, 0, 0);
  } else if (event.key === "0") {
    refit(viewer, true);
  }
}

function onResize(): void {
  if (viewer !== null) {
    refit(viewer, false);
  }
}

function barButton(text: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = BUTTON_CLASS;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

/** Opens the viewer on `url`. `opener` gets the focus back when it closes. */
export function openImageViewer(url: string, opener: HTMLElement | null): void {
  closeImageViewer();

  const root = document.createElement("div");
  root.id = VIEWER_ID;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", LABEL_VIEWER);
  root.tabIndex = -1;

  const stage = document.createElement("div");
  stage.className = STAGE_CLASS;
  const image = document.createElement("img");
  image.className = IMAGE_CLASS;
  image.alt = "";
  image.draggable = false;
  stage.append(image);

  const scaleLabel = document.createElement("span");
  scaleLabel.className = SCALE_CLASS;
  const bar = document.createElement("div");
  bar.className = BAR_CLASS;

  const created: Viewer = {
    root,
    image,
    scaleLabel,
    opener,
    state: { scale: 1, x: 0, y: 0 },
    fit: 1,
  };

  bar.append(
    barButton(TEXT_ZOOM_OUT, LABEL_ZOOM_OUT, () => {
      zoomBy(created, 1 / ZOOM_STEP, 0, 0);
    }),
    scaleLabel,
    barButton(TEXT_ZOOM_IN, LABEL_ZOOM_IN, () => {
      zoomBy(created, ZOOM_STEP, 0, 0);
    }),
    barButton(TEXT_FIT, LABEL_FIT, () => {
      refit(created, true);
    }),
    barButton(TEXT_ACTUAL, LABEL_ACTUAL, () => {
      created.state = { scale: clampScale(1, created.fit), x: 0, y: 0 };
      render(created);
    }),
    barButton(TEXT_CLOSE, LABEL_CLOSE, closeImageViewer),
  );
  bar.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  root.append(stage, bar);

  image.addEventListener("load", () => {
    refit(created, true);
  });
  image.src = url;

  root.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const px = event.clientX - window.innerWidth / 2;
      const py = event.clientY - window.innerHeight / 2;
      zoomBy(created, event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, px, py);
    },
    { passive: false },
  );

  let drag: { startX: number; startY: number; x: number; y: number; moved: boolean } | null = null;
  root.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    drag = {
      startX: event.clientX,
      startY: event.clientY,
      x: created.state.x,
      y: created.state.y,
      moved: false,
    };
    root.setPointerCapture?.(event.pointerId);
  });
  root.addEventListener("pointermove", (event) => {
    if (drag === null) {
      return;
    }
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_SLOP_PX) {
      return;
    }
    drag.moved = true;
    root.classList.add(DRAGGING_CLASS);
    created.state = { ...created.state, x: drag.x + dx, y: drag.y + dy };
    render(created);
  });
  root.addEventListener("pointerup", (event) => {
    const ended = drag;
    drag = null;
    root.classList.remove(DRAGGING_CLASS);
    // A plain click outside the picture closes the viewer; a drag does not.
    if (ended !== null && !ended.moved && event.target !== image) {
      closeImageViewer();
    }
  });
  root.addEventListener("dblclick", (event) => {
    if (event.target !== image) {
      return;
    }
    if (created.state.scale > created.fit) {
      refit(created, true);
    } else {
      const px = event.clientX - window.innerWidth / 2;
      const py = event.clientY - window.innerHeight / 2;
      zoomBy(created, 1 / created.state.scale, px, py);
    }
  });

  viewer = created;
  document.body.append(root);
  document.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("resize", onResize);
  render(created);
  root.focus();
}

function onImageClick(event: MouseEvent): void {
  if (!document.body.classList.contains(BODY_CLASS)) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLImageElement) || target.id !== IMAGE_ID) {
    return;
  }
  // A click with a modifier is the browser's (open in a new tab and the like).
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const original = findOriginalAnchor()?.href ?? "";
  openImageViewer(original.length > 0 ? original : target.currentSrc || target.src, target);
}

let bound = false;

function mountImageZoom(_ctx: FeatureContext): void {
  if (bound) {
    return;
  }
  bound = true;
  document.addEventListener("click", onImageClick, true);
}

export const imageZoomFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: ["post"],
  defaultEnabled: true,
  cssOnly: true,
  settingsCaption: "Pictures and GIFs. Scroll to zoom, drag to move, Esc to close.",
  css: FEATURE_CSS,
  mount: mountImageZoom,
};
