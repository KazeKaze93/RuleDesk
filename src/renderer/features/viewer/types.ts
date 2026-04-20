import type { ReactNode } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import type { Post } from "../../../main/db/schema";
import type { ViewerQueue } from "../../store/viewerStore";

export type PostNotFoundFallbackProps = {
  currentPostId: number;
  queue: ViewerQueue;
  infiniteData?: InfiniteData<Post[]>;
  onPostFound: (post: Post) => ReactNode;
  onClose: () => void;
};

/** Filled by the post layer so dialog-level keyboard shortcuts can call into the controller. */
export type ViewerKeyboardActionsRef = {
  onToggleFavorite?: () => void | Promise<void>;
  onMarkViewed?: () => void;
};
