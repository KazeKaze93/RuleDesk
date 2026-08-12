import type { Post } from "@shared/types/db";

export const getBulkSelectId = (post: Post): number => {
  if (post.id > 0) {
    return post.id;
  }
  return -post.postId;
};
