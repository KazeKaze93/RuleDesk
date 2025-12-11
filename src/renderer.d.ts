import type { Artist } from "./main/db/schema";

export interface IpcApi {
  getAppVersion: () => Promise<string>;
  getTrackedArtists: () => Promise<Artist[]>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
