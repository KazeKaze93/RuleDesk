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

  async markAsViewed(postId: number) {
    return this.db.call("markPostAsViewed", { postId });
  }

  async toggleFavorite(postId: number) {
    return this.db.call("togglePostFavorite", { postId });
  }
}
