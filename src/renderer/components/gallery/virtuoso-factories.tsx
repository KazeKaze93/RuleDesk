import React, { Children, forwardRef } from "react";
import { cn } from "../../lib/utils";
import { useMasonryColumnCount } from "../../hooks/useMasonryColumnCount";

type VirtuosoListProps = React.HTMLAttributes<HTMLDivElement> & {
  "aria-busy"?: boolean;
};

type GridContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  viewType?: "grid" | "masonry";
};

const GRID_LIST_CLASS =
  "grid gap-4 p-4 pb-44 [grid-template-columns:repeat(var(--grid-cols,auto-fill),minmax(188px,1fr))]";
/** Flex row of equal columns; gap/padding match the former CSS-columns shell. */
const MASONRY_ROW_CLASS = "flex gap-4 p-4 pb-44";
const MASONRY_COLUMN_CLASS = "flex min-w-0 flex-1 flex-col";
const GRID_ITEM_CLASS = "w-full aspect-[2/3]";
/** Vertical rhythm via mb-4 (no column gap — avoids double spacing). */
const MASONRY_ITEM_CLASS = "w-full mb-4";

/**
 * Shared VirtuosoGrid List/Item factories for all feed galleries
 * (Browse / Favorites / Updates / Artist / Playlist).
 * Display-name prefix is the only intentional per-page difference.
 *
 * Masonry is JS round-robin into flex columns (item i → column i mod N),
 * not CSS multi-column: posts have no stored width/height for shortest-column
 * packing, and round-robin keeps append order stable (no reshuffle across
 * columns when the list grows). Item width must be `w-full` of its flex
 * column — percentage `w-[calc(...)]` is relative to the column, not the
 * gallery, and shrinks cards.
 */
export function createVirtuosoGridFactories(displayNamePrefix: string) {
  const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
    ({ className, viewType = "grid", children, ...props }, ref) => {
      const columnCount = useMasonryColumnCount();

      if (viewType === "masonry") {
        const items = Children.toArray(children);
        const masonryColumns: React.ReactNode[][] = Array.from(
          { length: columnCount },
          () => []
        );
        for (let index = 0; index < items.length; index += 1) {
          const column = masonryColumns[index % columnCount];
          if (column === undefined) {
            continue;
          }
          column.push(items[index]);
        }

        return (
          <div
            ref={ref}
            className={cn(MASONRY_ROW_CLASS, className)}
            {...props}
          >
            {masonryColumns.map((columnItems, columnIndex) => (
              <div
                key={`masonry-column-${columnIndex}`}
                className={MASONRY_COLUMN_CLASS}
              >
                {columnItems}
              </div>
            ))}
          </div>
        );
      }

      return (
        <div
          ref={ref}
          className={cn(GRID_LIST_CLASS, className)}
          {...props}
        >
          {children}
        </div>
      );
    }
  );
  GridContainer.displayName = "GridContainer";

  const GridItemContainer = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div ref={ref} className={cn(GRID_ITEM_CLASS, className)} {...props} />
  ));
  GridItemContainer.displayName = `${displayNamePrefix}GridItemContainer`;

  const MasonryItemContainer = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div ref={ref} className={cn(MASONRY_ITEM_CLASS, className)} {...props} />
  ));
  MasonryItemContainer.displayName = `${displayNamePrefix}MasonryItemContainer`;

  const GridVirtuosoList = forwardRef<HTMLDivElement, VirtuosoListProps>(
    ({ className, "aria-busy": ariaBusy, ...props }, ref) => (
      <GridContainer
        {...props}
        ref={ref}
        className={className}
        aria-busy={ariaBusy}
        viewType="grid"
      />
    )
  );
  GridVirtuosoList.displayName = `${displayNamePrefix}GridVirtuosoList`;

  const MasonryVirtuosoList = forwardRef<HTMLDivElement, VirtuosoListProps>(
    ({ className, "aria-busy": ariaBusy, ...props }, ref) => (
      <GridContainer
        {...props}
        ref={ref}
        className={className}
        aria-busy={ariaBusy}
        viewType="masonry"
      />
    )
  );
  MasonryVirtuosoList.displayName = `${displayNamePrefix}MasonryVirtuosoList`;

  return {
    GridContainer,
    GridItemContainer,
    MasonryItemContainer,
    GridVirtuosoList,
    MasonryVirtuosoList,
  };
}
