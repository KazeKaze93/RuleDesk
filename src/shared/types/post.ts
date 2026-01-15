/**
 * Post type for Web Worker context
 * 
 * Minimal Post interface that can be safely used in Web Workers.
 * Workers cannot import from main/db/schema, so we define a compatible type here.
 * 
 * This type matches the structure of Post from main/db/schema but is defined
 * in shared to be accessible from both Renderer and Worker contexts.
 */

export interface WorkerPost {
  id: number;
  postId: number;
  artistId: number;
  fileUrl: string;
  previewUrl: string;
  sampleUrl: string;
  title: string | null;
  rating: string | null;
  tags: string;
  publishedAt: Date | number | null;
  createdAt: Date | number | null;
  isViewed: boolean;
  isFavorited: boolean;
}
