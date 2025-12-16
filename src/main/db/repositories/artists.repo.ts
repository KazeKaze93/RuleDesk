import { DbWorkerClient } from "../db-worker-client";
import { NewArtist } from "../schema";

export class ArtistsRepository {
  constructor(private db: DbWorkerClient) {}

  async getAll() {
    return this.db.call("getTrackedArtists");
  }

  async add(artist: NewArtist) {
    return this.db.call("addArtist", artist);
  }

  async delete(id: number) {
    return this.db.call("deleteArtist", { id });
  }

  async searchTags(query: string) {
    return this.db.call("searchArtists", { query });
  }
}



