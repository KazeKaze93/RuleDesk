import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CardBorderStyle = "rounded" | "sharp";
export type GridColumns = 2 | 3 | 4 | "auto";

interface AppearanceState {
  compactMode: boolean;
  cardBorderStyle: CardBorderStyle;
  gridColumns: GridColumns;
  setCompactMode: (enabled: boolean) => void;
  setCardBorderStyle: (style: CardBorderStyle) => void;
  setGridColumns: (columns: GridColumns) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      compactMode: false,
      cardBorderStyle: "rounded",
      gridColumns: "auto",
      setCompactMode: (enabled) => set({ compactMode: enabled }),
      setCardBorderStyle: (style) => set({ cardBorderStyle: style }),
      setGridColumns: (columns) => set({ gridColumns: columns }),
    }),
    {
      name: "appearance-settings-storage",
    }
  )
);
