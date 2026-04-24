import { useEffect } from "react";
import { useAppearanceStore } from "../store/appearanceStore";

const SHARP_CARD_RADIUS = "4px";
const ROUNDED_CARD_RADIUS = "var(--border-radius-lg)";
const GRID_AUTO_FILL = "auto-fill";

export const useApplyAppearance = (): void => {
  const cardBorderStyle = useAppearanceStore((state) => state.cardBorderStyle);
  const gridColumns = useAppearanceStore((state) => state.gridColumns);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty(
      "--card-radius",
      cardBorderStyle === "sharp" ? SHARP_CARD_RADIUS : ROUNDED_CARD_RADIUS
    );
    root.style.setProperty(
      "--grid-cols",
      gridColumns === "auto" ? GRID_AUTO_FILL : String(gridColumns)
    );
  }, [cardBorderStyle, gridColumns]);
};
