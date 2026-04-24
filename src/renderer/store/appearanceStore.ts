import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CardBorderStyle = "rounded" | "sharp";
export type GridColumns = 2 | 3 | 4 | "auto";

interface AppearanceState {
  cardBorderStyle: CardBorderStyle;
  gridColumns: GridColumns;
  setCardBorderStyle: (style: CardBorderStyle) => void;
  setGridColumns: (columns: GridColumns) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      cardBorderStyle: "rounded",
      gridColumns: "auto",
      setCardBorderStyle: (style) => set({ cardBorderStyle: style }),
      setGridColumns: (columns) => set({ gridColumns: columns }),
    }),
    {
      name: "appearance-settings-storage",
    }
  )
);
