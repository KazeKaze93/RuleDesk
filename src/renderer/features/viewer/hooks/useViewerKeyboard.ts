import { useCallback, useEffect, type MutableRefObject } from "react";
import type { ViewerKeyboardActionsRef } from "../types";

export type UseViewerKeyboardOptions = {
  enabled: boolean;
  next: () => void;
  prev: () => void;
  close: () => void;
  isTagsDrawerOpen: boolean;
  toggleTagsDrawer: () => void;
  actionsRef: MutableRefObject<ViewerKeyboardActionsRef>;
};

/**
 * Global keydown handler for the image viewer: arrows, Escape, T, F, V.
 * F/V invoke callbacks supplied via `actionsRef` (registered by the post content layer).
 */
export function useViewerKeyboard({
  enabled,
  next,
  prev,
  close,
  isTagsDrawerOpen,
  toggleTagsDrawer,
  actionsRef,
}: UseViewerKeyboardOptions): void {
  const handleNavigationKeys = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "Escape":
          e.preventDefault();
          if (isTagsDrawerOpen) {
            toggleTagsDrawer();
          } else {
            close();
          }
          break;
        case "f":
        case "F": {
          e.preventDefault();
          const fn = actionsRef.current.onToggleFavorite;
          if (fn) void fn();
          break;
        }
        case "v":
        case "V": {
          e.preventDefault();
          const fn = actionsRef.current.onMarkViewed;
          if (fn) fn();
          break;
        }
        case "t":
        case "T":
          e.preventDefault();
          toggleTagsDrawer();
          break;
      }
    },
    [enabled, next, prev, close, isTagsDrawerOpen, toggleTagsDrawer, actionsRef]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleNavigationKeys);
    return () => window.removeEventListener("keydown", handleNavigationKeys);
  }, [handleNavigationKeys]);
}
