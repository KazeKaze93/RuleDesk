import type { Artist, NewArtist, Settings, Post } from "./main/db/schema";
import {
  IpcBridge,
  UpdateStatusCallback,
  UpdateProgressCallback,
} from "./main/bridge";

export type SyncErrorCallback = (message: string) => void;

export interface IpcApi extends IpcBridge {
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
  getArtistPosts: (params: {
    artistId: number;
    page: number;
  }) => Promise<Post[]>;

  // Sync
  syncAll: () => Promise<boolean>;

  // UPDATER
  checkForUpdates: () => Promise<void>;
  quitAndInstall: () => Promise<void>;

  // Start download
  startDownload: () => Promise<void>;

  // Update status
  onUpdateStatus: (callback: UpdateStatusCallback) => () => void;
  onUpdateProgress: (callback: UpdateProgressCallback) => () => void;

  onSyncStart: (callback: () => void) => () => void;
  onSyncEnd: (callback: () => void) => () => void;
  onSyncProgress: (callback: (message: string) => void) => () => void;
  onSyncError: (callback: SyncErrorCallback) => () => void;

  markPostAsViewed: (postId: number) => Promise<boolean>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
