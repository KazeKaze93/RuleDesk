import { cn } from "../../lib/utils";

/** Fullscreen viewer shell (above sidebar z-[200]). */
export const VIEWER_SHELL_Z = "z-[300]";

/** Portaled UI inside viewer: Sheet, Dropdown, nested Dialog. */
export const VIEWER_OVERLAY_Z = "z-[400]";

export const viewerShellClass = (...extra: (string | undefined)[]) =>
  cn(VIEWER_SHELL_Z, ...extra);

export const viewerOverlayClass = (...extra: (string | undefined)[]) =>
  cn(VIEWER_OVERLAY_Z, ...extra);
