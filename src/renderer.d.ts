export interface IpcApi {
  getAppVersion: () => Promise<string>;
  getTrackedArtists: () => Promise<any[]>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
