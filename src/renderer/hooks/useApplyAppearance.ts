import { useEffect } from "react";
import { useAppearanceStore } from "../store/appearanceStore";

const COMPACT_CARD_PADDING = "8px";
const DEFAULT_CARD_PADDING = "16px";
const COMPACT_CARD_META_SIZE = "11px";
const DEFAULT_CARD_META_SIZE = "13px";
const SHARP_CARD_RADIUS = "4px";
const ROUNDED_CARD_RADIUS = "var(--border-radius-lg)";
const GRID_AUTO_FILL = "auto-fill";

export const useApplyAppearance = (): void => {
  const compactMode = useAppearanceStore((state) => state.compactMode);
  const cardBorderStyle = useAppearanceStore((state) => state.cardBorderStyle);
  const gridColumns = useAppearanceStore((state) => state.gridColumns);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty(
      "--card-padding",
      compactMode ? COMPACT_CARD_PADDING : DEFAULT_CARD_PADDING
    );
    root.style.setProperty(
      "--card-meta-size",
      compactMode ? COMPACT_CARD_META_SIZE : DEFAULT_CARD_META_SIZE
    );
    root.style.setProperty(
      "--card-radius",
      cardBorderStyle === "sharp" ? SHARP_CARD_RADIUS : ROUNDED_CARD_RADIUS
    );
    root.style.setProperty(
      "--grid-cols",
      gridColumns === "auto" ? GRID_AUTO_FILL : String(gridColumns)
    );
  }, [compactMode, cardBorderStyle, gridColumns]);
};
