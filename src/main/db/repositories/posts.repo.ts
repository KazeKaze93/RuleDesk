import { DbWorkerClient } from "../db-worker-client";

export class PostsRepository {
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

  async markAsViewed(postId: number) {
    return this.db.call("markPostAsViewed", { postId });
  }

  async toggleFavorite(postId: number) {
    return this.db.call("togglePostFavorite", { postId });
  }

  async togglePostViewed(postId: number): Promise<boolean> {
    return this.db.call("togglePostViewed", { postId });
  }

  async resetPostCache(postId: number): Promise<boolean> {
    return this.db.call("resetPostCache", { postId });
  }
}
