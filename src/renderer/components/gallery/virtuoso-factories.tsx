import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

type VirtuosoListProps = React.HTMLAttributes<HTMLDivElement> & {
  "aria-busy"?: boolean;
};

type GridContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  viewType?: "grid" | "masonry";
};

const GRID_LIST_CLASS =
  "grid gap-4 p-4 pb-44 [grid-template-columns:repeat(var(--grid-cols,auto-fill),minmax(188px,1fr))]";
const MASONRY_LIST_CLASS =
  "columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 p-4 pb-44";
const GRID_ITEM_CLASS = "w-full aspect-[2/3]";
const MASONRY_ITEM_CLASS = "w-full mb-4 break-inside-avoid";

/**
 * Shared VirtuosoGrid List/Item factories for all feed galleries
 * (Browse / Favorites / Updates / Artist / Playlist).
 * Display-name prefix is the only intentional per-page difference.
 *
 * Masonry parent is CSS multi-column (`columns-N`). Item width must be
 * `w-full` of the column box — percentage `w-[calc(...)]` is relative to
 * the column, not the gallery, and shrinks cards. `flex-shrink-*` has no
 * effect unless the parent is a flex container.
 */
export function createVirtuosoGridFactories(displayNamePrefix: string) {
  const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
    ({ className, viewType = "grid", ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          viewType === "grid" ? GRID_LIST_CLASS : MASONRY_LIST_CLASS,
          className
        )}
        {...props}
      />
    )
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
