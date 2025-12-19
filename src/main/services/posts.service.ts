import { DbWorkerClient } from "../db/db-worker-client";

export type PostUpdateChanges = {
  rating?: string;
  tags?: string;
  title?: string;
  isViewed?: boolean;
  isFavorited?: boolean;
  fileUrl?: string;
  previewUrl?: string;
  sampleUrl?: string;
};

export class PostsService {
  constructor(private db: DbWorkerClient) {}

  async getByArtist(params: {
    artistId: number;
    limit: number;
    offset: number;
  }) {
    return this.db.call("getPostsByArtist", params);
  }

  async getCountByArtist(artistId?: number): Promise<number> {
    return this.db.call("getPostsCountByArtist", { artistId });
  }

  async getPostById(postId: number) {
    return this.db.call("getPostById", { postId });
  }

  /**
   * Unified method for updating post fields.
   * All write operations for posts should use this method.
   */
  async updatePost(
    postId: number,
    changes: PostUpdateChanges
  ): Promise<boolean> {
    return this.db.call<boolean>("updatePost", { postId, changes });
  }

  async markAsViewed(postId: number) {
    return this.updatePost(postId, { isViewed: true });
  }

  async toggleFavorite(postId: number): Promise<boolean> {
    const post = await this.getPostById(postId);
    if (!post) return false;

    const newState = !post.isFavorited;
    return this.updatePost(postId, { isFavorited: newState });
  }

  async togglePostViewed(postId: number): Promise<boolean> {
    const post = await this.getPostById(postId);
    if (!post) return false;

    const newState = !post.isViewed;
    return this.updatePost(postId, { isViewed: newState });
  }

  async resetPostCache(postId: number): Promise<boolean> {
    return this.updatePost(postId, { isViewed: false });
  }
}
