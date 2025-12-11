import type { Artist } from "./main/db/schema";

export interface IpcApi {
  getAppVersion: () => Promise<string>;
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: any) => Promise<any>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
