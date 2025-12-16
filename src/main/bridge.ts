import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { Artist, NewArtist, Post, Settings } from "./db/schema";
import { IPC_CHANNELS } from "./ipc/channels";

export type UpdateStatusData = {
  status: string;
  message?: string;
  version?: string;
};

export type UpdateStatusCallback = (data: UpdateStatusData) => void;
export type UpdateProgressCallback = (percent: number) => void;
export type SyncErrorCallback = (message: string) => void;

export type BackupResponse = {
  success: boolean;
  path?: string;
  error?: string;
};

export type DownloadProgressData = {
  id: string;
  percent: number;
};
export type DownloadProgressCallback = (data: DownloadProgressData) => void;

export interface PostQueryFilters {
  rating?: "s" | "q" | "e";
  tags?: string;
  sortBy?: "date" | "id" | "rating";
  isViewed?: boolean;
}

export interface GetPostsParams {
  artistId: number;
  page?: number;
  filters?: PostQueryFilters;
}

export interface IpcBridge {
  // App
  getAppVersion: () => Promise<string>;

  // 🔥 FIX: Добавлен метод для работы с буфером обмена (System)
  writeToClipboard: (text: string) => Promise<boolean>;

  // Settings
  getSettings: () => Promise<Settings | undefined>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;
  logout: () => Promise<void>;

  // Artists
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: NewArtist) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<void>;

  // --- NEW: SEARCH ---
  searchArtists: (query: string) => Promise<{ id: number; label: string }[]>;

  // Posts
  getArtistPosts: (params: {
    artistId: number;
    page?: number;
  }) => Promise<Post[]>;
  getArtistPostsCount: (artistId?: number) => Promise<number>;

  togglePostViewed: (postId: number) => Promise<boolean>;

  resetPostCache: (postId: number) => Promise<boolean>;

  // External
  openExternal: (url: string) => Promise<void>;

  // Sync
  syncAll: () => Promise<boolean>;
  repairArtist: (artistId: number) => Promise<boolean>;

  // Updater
  checkForUpdates: () => Promise<void>;
  quitAndInstall: () => Promise<void>;
  startDownload: () => Promise<void>;

  onUpdateStatus: (callback: UpdateStatusCallback) => () => void;
  onUpdateProgress: (callback: UpdateProgressCallback) => () => void;

  onSyncStart: (callback: () => void) => () => void;
  onSyncEnd: (callback: () => void) => () => void;
  onSyncProgress: (callback: (message: string) => void) => () => void;
  onSyncError: (callback: SyncErrorCallback) => () => void;

  markPostAsViewed: (postId: number) => Promise<boolean>;

  togglePostFavorite: (postId: number) => Promise<boolean>;

  // Downloads
  downloadFile: (
    url: string,
    filename: string
  ) => Promise<{
    success: boolean;
    path?: string;
    error?: string;
    canceled?: boolean;
  }>;
  openFileInFolder: (path: string) => Promise<boolean>;

  onDownloadProgress: (callback: DownloadProgressCallback) => () => void;

  searchRemoteTags: (query: string) => Promise<{ id: string; label: string }[]>;

  createBackup: () => Promise<BackupResponse>;
  restoreBackup: () => Promise<BackupResponse>;

  verifyCredentials: () => Promise<boolean>;
}

const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),

  // 🔥 FIX: Реализация метода writeToClipboard
  writeToClipboard: (text) =>
    ipcRenderer.invoke("app:write-to-clipboard", text),

  searchRemoteTags: (query) =>
    ipcRenderer.invoke("api:search-remote-tags", query),

  verifyCredentials: () => ipcRenderer.invoke("app:verify-creds"),

  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.GET),
  saveSettings: (creds) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SAVE, creds),
  logout: () => ipcRenderer.invoke("app:logout"),

  getTrackedArtists: () => ipcRenderer.invoke("db:get-artists"),
  addArtist: (artist) => ipcRenderer.invoke("db:add-artist", artist),
  deleteArtist: (id) => ipcRenderer.invoke("db:delete-artist", id),

  searchArtists: (query) => ipcRenderer.invoke("db:search-tags", query),

  getArtistPosts: (params: GetPostsParams) =>
    ipcRenderer.invoke("db:get-posts", params),
  getArtistPostsCount: (artistId?: number) =>
    ipcRenderer.invoke("db:get-posts-count", artistId),

  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),

  syncAll: () => ipcRenderer.invoke("db:sync-all"),

  markPostAsViewed: (postId) =>
    ipcRenderer.invoke("db:mark-post-viewed", postId),

  togglePostFavorite: (postId) =>
    ipcRenderer.invoke("db:toggle-post-favorite", postId),

  togglePostViewed: (postId) =>
    ipcRenderer.invoke("db:toggle-post-viewed", postId),

  resetPostCache: (postId) => ipcRenderer.invoke("db:reset-post-cache", postId),

  downloadFile: (url: string, filename: string) => {
    // console.log("Bridge: Sending download request...", url); // Можно убрать лог
    return ipcRenderer.invoke("files:download", url, filename);
  },

  openFileInFolder: (path: string) =>
    ipcRenderer.invoke("files:open-folder", path),

  onDownloadProgress: (callback) => {
    const channel = "files:download-progress";
    const subscription = (_: IpcRendererEvent, data: DownloadProgressData) =>
      callback(data);

    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  repairArtist: (artistId) =>
    ipcRenderer.invoke("sync:repair-artist", artistId),

  // Updater Implementation
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
  quitAndInstall: () => ipcRenderer.invoke("app:quit-and-install"),
  startDownload: () => ipcRenderer.invoke("app:start-download"),

  onUpdateStatus: (callback) => {
    const subscription = (_: IpcRendererEvent, data: UpdateStatusData) =>
      callback(data);
    ipcRenderer.on("updater:status", subscription);
    return () => {
      ipcRenderer.removeListener("updater:status", subscription);
    };
  },

  onUpdateProgress: (callback) => {
    const subscription = (_: IpcRendererEvent, percent: number) =>
      callback(percent);
    ipcRenderer.on("updater:progress", subscription);
    return () => {
      ipcRenderer.removeListener("updater:progress", subscription);
    };
  },

  onSyncStart: (callback) => {
    const sub = () => callback();
    ipcRenderer.on("sync:start", sub);
    return () => ipcRenderer.removeListener("sync:start", sub);
  },

  onSyncEnd: (callback) => {
    const sub = () => callback();
    ipcRenderer.on("sync:end", sub);
    return () => ipcRenderer.removeListener("sync:end", sub);
  },

  onSyncError: (callback) => {
    const subscription = (_: IpcRendererEvent, msg: string) => callback(msg);
    ipcRenderer.on("sync:error", subscription);
    return () => {
      ipcRenderer.removeListener("sync:error", subscription);
    };
  },

  onSyncProgress: (callback) => {
    const sub = (_: IpcRendererEvent, msg: string) => callback(msg);
    ipcRenderer.on("sync:progress", sub);
    return () => ipcRenderer.removeListener("sync:progress", sub);
  },

  createBackup: () => ipcRenderer.invoke("db:create-backup"),
  restoreBackup: () => ipcRenderer.invoke("db:restore-backup"),
};

contextBridge.exposeInMainWorld("api", ipcBridge);
