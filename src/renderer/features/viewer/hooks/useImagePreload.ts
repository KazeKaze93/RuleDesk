import { useEffect } from "react";
import type { Post } from "../../../../main/db/schema";
import { isVideoPost } from "../../../lib/filter-utils";

function pickStillImageUrl(post: Post | undefined): string | undefined {
  if (!post) return undefined;
  if (isVideoPost(post.fileUrl)) {
    return undefined;
  }
  return post.sampleUrl || post.fileUrl;
}

/**
 * Warm the browser image cache for adjacent posts to reduce flash on next/prev.
 */
export function useImagePreload(prevPost: Post | undefined, nextPost: Post | undefined): void {
  useEffect(() => {
    const urls = [pickStillImageUrl(prevPost), pickStillImageUrl(nextPost)].filter(
      (u): u is string => typeof u === "string" && u.length > 0
    );
    const images = urls.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });
    return () => {
      void images;
    };
  }, [prevPost, nextPost]);
}
