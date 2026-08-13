import React, { forwardRef } from "react";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Post } from "@shared/types/db";
import { cn } from "../../lib/utils";
import { PostCard } from "../../features/artists/components/PostCard";

// Virtualization components (reused from ArtistGallery pattern)
export const GridContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { viewType?: "grid" | "masonry" }
>(({ className, viewType = "grid", ...props }, ref) => (
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
));
GridContainer.displayName = "GridContainer";

export const GridItemContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full aspect-[2/3]", className)} {...props} />
  )
);
GridItemContainer.displayName = "PlaylistGridItemContainer";

export const MasonryItemContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full mb-4 break-inside-avoid", className)} {...props} />
  )
);
MasonryItemContainer.displayName = "PlaylistMasonryItemContainer";

export const GridVirtuosoList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { "aria-busy"?: boolean }
>(({ className, "aria-busy": ariaBusy, ...props }, ref) => (
  <GridContainer
    {...props}
    ref={ref}
    className={className}
    aria-busy={ariaBusy}
    viewType="grid"
  />
));
GridVirtuosoList.displayName = "PlaylistGridVirtuosoList";

export const MasonryVirtuosoList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { "aria-busy"?: boolean }
>(({ className, "aria-busy": ariaBusy, ...props }, ref) => (
  <GridContainer
    {...props}
    ref={ref}
    className={className}
    aria-busy={ariaBusy}
    viewType="masonry"
  />
));
MasonryVirtuosoList.displayName = "PlaylistMasonryVirtuosoList";

interface SortablePostCardProps {
  post: Post;
  onClick: () => void;
  onRemove?: () => void;
  preserveAspect?: boolean;
}

export function SortablePostCard({ post, onClick, onRemove, preserveAspect }: SortablePostCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PostCard
        post={post}
        onClick={onClick}
        preserveAspect={preserveAspect}
        context="playlist"
        onRemoveFromPlaylist={onRemove}
      />
    </div>
  );
}
