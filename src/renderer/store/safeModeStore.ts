import { create } from "zustand";
import { persist } from "zustand/middleware";
import log from "electron-log/renderer";

interface SafeModeState {
  safeMode: boolean;
  blurAmount: number; // 0-100, where 100 is maximum blur
  panicMode: boolean; // Instant maximum privacy

  setSafeMode: (enabled: boolean) => void;
  setBlurAmount: (amount: number) => void;
  togglePanicMode: () => void;
  enablePanicMode: () => void;
  disablePanicMode: () => void;
}

const DEFAULT_BLUR_AMOUNT = 20; // Default blur when safe mode is on
const PANIC_BLUR_AMOUNT = 100; // Maximum blur for panic mode

export const useSafeModeStore = create<SafeModeState>()(
  persist(
    (set) => ({
      safeMode: false,
      blurAmount: DEFAULT_BLUR_AMOUNT,
      panicMode: false,

      setSafeMode: (enabled) =>
        set((state) => ({
          safeMode: enabled,
          // When disabling safe mode, also disable panic mode
          panicMode: enabled ? state.panicMode : false,
        })),

      setBlurAmount: (amount) =>
        set({
          blurAmount: Math.max(0, Math.min(100, amount)),
        }),

      togglePanicMode: () =>
        set((state) => ({
          panicMode: !state.panicMode,
          // When enabling panic mode, also enable safe mode
          safeMode: !state.panicMode ? true : state.safeMode,
        })),

      enablePanicMode: () =>
        set({
          panicMode: true,
          safeMode: true,
        }),

      disablePanicMode: () =>
        set({
          panicMode: false,
        }),
    }),
    {
      name: "safe-mode-storage",
    }
  )
);

/**
 * When Show panic button is off there is no UI to exit blur. Call only with a
 * loaded settings value (`undefined` = settings still loading — no-op).
 * `setSafeMode(false)` also clears panicMode.
 */
export function clearSafeModeWhenPanicButtonHidden(
  showPanicButton: boolean | undefined
): void {
  if (showPanicButton === undefined || showPanicButton === true) {
    return;
  }
  const { safeMode, panicMode, setSafeMode } = useSafeModeStore.getState();
  if (!safeMode && !panicMode) {
    return;
  }
  setSafeMode(false);
  log.info(
    "[SafeMode] Cleared because Show panic button is off (no UI to exit blur)"
  );
}

/**
 * Helper function to get effective blur amount
 * Returns blur amount based on safe mode and panic mode state
 */
export const getEffectiveBlurAmount = (
  safeMode: boolean,
  panicMode: boolean,
  blurAmount: number
): number => {
  if (panicMode) return PANIC_BLUR_AMOUNT;
  if (safeMode) return blurAmount;
  return 0;
};

/**
 * Helper function to determine if a post should be blurred
 * Based on rating and safe mode state
 */
export const shouldBlurPost = (
  rating: "s" | "q" | "e",
  safeMode: boolean,
  panicMode: boolean
): boolean => {
  if (panicMode) return true; // Always blur in panic mode
  if (!safeMode) return false; // No blur if safe mode is off
  // Blur explicit and questionable content when safe mode is on
  return rating === "e" || rating === "q";
};

