import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

type VirtuosoListProps = React.HTMLAttributes<HTMLDivElement> & {
  "aria-busy"?: boolean;
};

type GridContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  viewType?: "grid" | "masonry";
};

/**
 * Shared VirtuosoGrid List/Item factories for feed galleries that use the
 * flex-width masonry item pattern (Browse / Favorites / Updates).
 * Display-name prefix is the only intentional per-page difference.
 */
export function createVirtuosoGridFactories(displayNamePrefix: string) {
  const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
    ({ className, viewType = "grid", ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          viewType === "grid"
            ? "grid gap-4 p-4 pb-44 [grid-template-columns:repeat(var(--grid-cols,auto-fill),minmax(188px,1fr))]"
            : "columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 p-4 pb-44",
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
    <div ref={ref} className={cn("w-full aspect-[2/3]", className)} {...props} />
  ));
  GridItemContainer.displayName = `${displayNamePrefix}GridItemContainer`;

  const MasonryItemContainer = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-shrink-0 w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)] xl:w-[calc(20%-1rem)]",
        className
      )}
      {...props}
    />
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
