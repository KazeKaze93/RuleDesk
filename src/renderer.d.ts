import type { Artist, NewArtist, Settings, Post } from "./main/db/schema";

export interface IpcApi {
  // App
  getAppVersion: () => Promise<string>;

  // Settings
  getSettings: () => Promise<Settings | undefined>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;

  // Artists
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: NewArtist) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<void>;

  // Posts
  getArtistPosts: (artistId: number, page?: number) => Promise<Post[]>;

  // Sync
  syncAll: () => Promise<boolean>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
