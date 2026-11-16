import type { ComponentChildren, JSX, RefObject } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useLayoutEffect, useRef } from "preact/hooks";

import { KIT_FOCUS_CSS } from "./shared";

export type PopoverProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children?: ComponentChildren;
  readonly className?: string;
  readonly "aria-label"?: string;
  /** Trigger (and optional extra roots) excluded from outside-click close; focus returns here. */
  readonly anchorRef?: RefObject<HTMLElement | null>;
  /**
   * When set, the popover is portaled to document.body with position:fixed
   * so a scrollport (post column) cannot clip it. Width is this many pixels.
   */
  readonly widthPx?: number;
  /** "menu" for a list of actions. Default "dialog". */
  readonly role?: "dialog" | "menu";
  /** Line the popover up with the right edge of the anchor instead of the left. */
  readonly alignEnd?: boolean;
};

const KEY_ESCAPE = "Escape";
const EVENT_KEYDOWN = "keydown";
const EVENT_MOUSEDOWN = "mousedown";
const EVENT_SCROLL = "scroll";
const EVENT_RESIZE = "resize";
const POPOVER_FIXED_CLASS = "rdw-popover--fixed";
/** Above the post panel host (z-index 100 in post-actions.ts). */
const POPOVER_FIXED_Z_INDEX = 120;
const POPOVER_ANCHOR_GAP_PX = 4;
/** Collections list width. */
export const ANCHORED_POPOVER_WIDTH_PX = 260;

export const POPOVER_CSS = `
${KIT_FOCUS_CSS}
.rdw-popover {
  position: absolute;
  z-index: 30;
  min-width: 180px;
  padding: 8px;
  display: grid;
  gap: 4px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
.rdw-popover.${POPOVER_FIXED_CLASS} {
  position: fixed;
  z-index: ${String(POPOVER_FIXED_Z_INDEX)};
  min-width: 0;
  margin: 0;
  box-sizing: border-box;
}
`;

export function computeAnchoredPopoverPosition(
  anchorLeft: number,
  anchorBottom: number,
  widthPx: number,
  viewportWidthPx: number,
): { top: number; left: number } {
  let left = anchorLeft;
  if (left + widthPx > viewportWidthPx) {
    left = viewportWidthPx - widthPx;
  }
  return {
    top: anchorBottom + POPOVER_ANCHOR_GAP_PX,
    left,
  };
}

function pathIncludesNode(
  path: readonly EventTarget[],
  node: Node | null,
): boolean {
  if (node === null) {
    return false;
  }
  for (const entry of path) {
    if (entry === node) {
      return true;
    }
  }
  return false;
}

export function Popover(props: PopoverProps): JSX.Element | null {
  const rootRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!props.open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        const anchor = props.anchorRef?.current ?? null;
        if (anchor !== null && typeof anchor.focus === "function") {
          anchor.focus();
        }
      }
      return;
    }
    wasOpenRef.current = true;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === KEY_ESCAPE) {
        event.preventDefault();
        props.onClose();
      }
    };
    const onPointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (root === null) {
        return;
      }
      // Shadow DOM retargets event.target to the host; composedPath keeps the real nodes.
      const path = event.composedPath();
      if (pathIncludesNode(path, root)) {
        return;
      }
      if (pathIncludesNode(path, props.anchorRef?.current ?? null)) {
        return;
      }
      props.onClose();
    };
    document.addEventListener(EVENT_KEYDOWN, onKeyDown);
    document.addEventListener(EVENT_MOUSEDOWN, onPointerDown);
    return () => {
      document.removeEventListener(EVENT_KEYDOWN, onKeyDown);
      document.removeEventListener(EVENT_MOUSEDOWN, onPointerDown);
    };
  }, [props.open, props.onClose, props.anchorRef]);

  const widthPx = props.widthPx;
  const anchored = widthPx !== undefined;

  useLayoutEffect(() => {
    if (!props.open || widthPx === undefined) {
      return;
    }
    const apply = (): void => {
      const anchor = props.anchorRef?.current ?? null;
      const root = rootRef.current;
      if (anchor === null || root === null) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const position = computeAnchoredPopoverPosition(
        props.alignEnd === true ? Math.max(0, rect.right - widthPx) : rect.left,
        rect.bottom,
        widthPx,
        window.innerWidth,
      );
      root.style.position = "fixed";
      root.style.top = `${String(position.top)}px`;
      root.style.left = `${String(position.left)}px`;
      root.style.width = `${String(widthPx)}px`;
    };
    apply();
    const onScrollOrResize = (): void => {
      apply();
    };
    window.addEventListener(EVENT_SCROLL, onScrollOrResize, true);
    window.addEventListener(EVENT_RESIZE, onScrollOrResize);
    return () => {
      window.removeEventListener(EVENT_SCROLL, onScrollOrResize, true);
      window.removeEventListener(EVENT_RESIZE, onScrollOrResize);
    };
  }, [props.open, props.anchorRef, props.alignEnd, widthPx]);

  if (!props.open) {
    return null;
  }

  const className = [
    "rdw-popover",
    anchored ? POPOVER_FIXED_CLASS : undefined,
    props.className,
  ]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  const body = (
    <>
      <style>{POPOVER_CSS}</style>
      <div
        ref={rootRef}
        className={className}
        role={props.role ?? "dialog"}
        aria-label={props["aria-label"]}
      >
        {props.children}
      </div>
    </>
  );

  if (anchored && document.body !== null) {
    return createPortal(body, document.body);
  }
  return body;
}
