import type { Post } from "../../main/db/schema";

export const getBulkSelectId = (post: Post): number => {
  if (post.id > 0) {
    return post.id;
  }
  return -post.postId;
};
