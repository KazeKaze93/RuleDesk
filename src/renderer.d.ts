import type { Artist, NewArtist } from "./main/db/schema";

export interface IpcApi {
  getAppVersion: () => Promise<string>;
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: NewArtist) => Promise<Artist | undefined>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
