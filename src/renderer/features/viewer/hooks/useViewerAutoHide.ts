import { useEffect } from "react";

/** Hide viewer chrome after this idle period (mousemove resets the timer). */
export const VIEWER_AUTO_HIDE_MS = 2000;

export function useViewerAutoHide(
  isOpen: boolean,
  setControlsVisible: (visible: boolean) => void
): void {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setControlsVisible(false);
      }, VIEWER_AUTO_HIDE_MS);
    };

    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      setControlsVisible(true);
      timeout = setTimeout(() => setControlsVisible(false), VIEWER_AUTO_HIDE_MS);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isOpen, setControlsVisible]);
}
