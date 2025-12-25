import type { Artist, Post } from "./main/db/schema";
import {
  IpcBridge,
  UpdateStatusCallback,
  UpdateProgressCallback,
  AddArtistPayload,
} from "./main/bridge";
import type { TagResult } from "./main/services/providers/IBooruProvider";
import type { ProviderId } from "./main/providers";

export type SyncErrorCallback = (message: string) => void;

export interface BackupResponse {
  success: boolean;
  path?: string;
  error?: string;
}

export interface PostQueryFilters {
  rating?: "s" | "q" | "e";
  tags?: string;
  sortBy?: "date" | "id" | "rating";
  isViewed?: boolean;
}

export interface IpcSettings {
  userId: string;
  hasApiKey: boolean;
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
}

export interface IpcApi extends IpcBridge {
  // App
  getAppVersion: () => Promise<string>;

  // Settings
  getSettings: () => Promise<IpcSettings | undefined>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;

  // Artists
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: AddArtistPayload) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<void>;

  // Search
  searchArtists: (query: string) => Promise<{ id: number; label: string }[]>;

  // Posts
  getArtistPosts: (params: {
    artistId: number;
    page?: number;
    filters?: PostQueryFilters;
  }) => Promise<Post[]>;
  getArtistPostsCount: (artistId?: number) => Promise<number>;

  togglePostViewed: (postId: number) => Promise<boolean>;

  resetPostCache: (postId: number) => Promise<boolean>;

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

  searchRemoteTags: (query: string, provider?: ProviderId) => Promise<TagResult[]>;

  createBackup: () => Promise<BackupResponse>;
  restoreBackup: () => Promise<BackupResponse>;
  writeToClipboard: (text: string) => Promise<boolean>;

  verifyCredentials: () => Promise<boolean>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
