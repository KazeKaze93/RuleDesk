import React from "react";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Post } from "@shared/types/db";
import { PostCard } from "../../features/artists/components/PostCard";

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
