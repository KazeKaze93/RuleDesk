import type { Post } from "../../main/db/schema";

/** Stable React `key` for list / virtualized PostCard (remote posts use `id === 0`). */
export function getPostCardKey(post: Pick<Post, "id" | "postId">): string {
  if (post.id === 0 && post.postId != null) {
    return `remote-${post.postId}`;
  }
  return `local-${post.id}`;
}
