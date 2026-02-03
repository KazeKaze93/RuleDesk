import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { Artist, Post, Playlist } from "./db/schema";
import { IPC_CHANNELS } from "./ipc/channels";
import type { GetPostsRequest, AddArtistRequest } from "./types/ipc";
import type { IpcSettings } from "../shared/schemas/settings";
import type { PostData } from "../shared/schemas/post";
import type { ShadowInsertRequest } from "../shared/schemas/shadow-insert";
import type { ProviderId, SearchResults } from "./providers";
import type {
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  AddPostsToPlaylistRequest,
  RemovePostsFromPlaylistRequest,
  GetPlaylistPostsRequest,
  ResolvePlaylistPostsRequest,
} from "../shared/schemas/playlist";

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

// Re-export IPC DTOs for use in renderer
// Re-export types from controllers (single source of truth)
export type { GetPostsRequest, AddArtistRequest, PostFilterRequest } from "./types/ipc";

// Legacy interface for backward compatibility (can be removed if not used)
export interface PostQueryFilters {
  rating?: "s" | "q" | "e";
  tags?: string;
  sortBy?: "date" | "id" | "rating";
  isViewed?: boolean;
}

export interface IpcBridge {
  // App
  getAppVersion: () => Promise<string>;
  getIconPath: () => Promise<string>;

  writeToClipboard: (text: string) => Promise<boolean>;

  // Settings
  getSettings: () => Promise<IpcSettings | null>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;
  saveDownloadFolder: (path: string | null) => Promise<boolean>;
  confirmLegal: () => Promise<IpcSettings>;
  logout: () => Promise<void>;

  // Artists
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: AddArtistRequest) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<void>;

  // --- NEW: SEARCH ---
  searchArtists: (query: string) => Promise<{ id: number; label: string }[]>;

  // Posts
  getArtistPosts: (params: GetPostsRequest) => Promise<Post[]>;
  getArtistPostsCount: (artistId?: number) => Promise<number>;
  getDownloadItems: (params: GetPostsRequest & { limit?: number }) => Promise<{ items: Array<{ url: string; filename: string }> }>;
  getPostsCountWithFilters: (params: Pick<GetPostsRequest, "artistId" | "filters">) => Promise<number>;

  togglePostViewed: (postId: number) => Promise<boolean>;

  resetPostCache: (postId: number) => Promise<boolean>;

  // External
  openExternal: (url: string) => Promise<void>;

  // Sync
  syncAll: () => Promise<boolean>;
  repairArtist: (artistId: number) => Promise<{ success: boolean; error?: string }>;

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

  markPostAsViewed: (postId: number, postData?: PostData) => Promise<boolean>;

  togglePostFavorite: (postId: number, postData?: PostData) => Promise<boolean>;

  shadowInsertPost: (request: ShadowInsertRequest) => Promise<Post>;

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
  downloadAll: (
    items: Array<{ url: string; filename: string }>
  ) => Promise<{
    success: boolean;
    downloaded: number;
    failed: number;
    canceled: boolean;
    error?: string;
  }>;
  cancelDownloadAll: () => Promise<boolean>;
  pauseDownloadAll: () => Promise<void>;
  resumeDownloadAll: () => Promise<void>;
  getPendingDownload: () => Promise<{
    hasPending: boolean;
    total: number;
    done: number;
    folder: string;
  } | null>;
  resumePendingDownload: () => Promise<{ success: boolean; error?: string }>;
  dismissPendingDownload: () => Promise<void>;
  saveDownloadSettings: (data: {
    duplicateFileBehavior?: "skip" | "overwrite";
    downloadFolderStructure?: "flat" | "{artist_id}";
  }) => Promise<boolean>;
  openFileInFolder: (path: string) => Promise<boolean>;
  selectDownloadFolder: () => Promise<string | null>;

  onDownloadProgress: (callback: DownloadProgressCallback) => () => void;
  onDownloadAllProgress: (
    callback: (data: { id: string; percent: number; done: number; total: number }) => void
  ) => () => void;
  onPendingDownloadStateChanged: (callback: () => void) => () => void;

  searchRemoteTags: (query: string, provider?: ProviderId) => Promise<SearchResults[]>;

  searchBooru: (params: { tags: string[]; page: number; isRandom?: boolean }) => Promise<Post[]>;

  resolveTags: (tags: string[]) => Promise<string[]>;
  resolveCharacterTags: (tags: string[]) => Promise<string[]>;
  resolveCopyrightTags: (tags: string[]) => Promise<string[]>;
  resolveTagsByType: (tags: string[], type: number) => Promise<string[]>;

  createBackup: () => Promise<BackupResponse>;
  restoreBackup: () => Promise<BackupResponse>;

  verifyCredentials: () => Promise<boolean>;

  // Playlists
  createPlaylist: (data: CreatePlaylistRequest) => Promise<Playlist>;
  getPlaylists: () => Promise<Playlist[]>;
  getPlaylist: (playlistId: number) => Promise<Playlist | null>;
  updatePlaylist: (playlistId: number, data: UpdatePlaylistRequest) => Promise<Playlist>;
  deletePlaylist: (playlistId: number) => Promise<boolean>;
  addPostsToPlaylist: (data: AddPostsToPlaylistRequest) => Promise<number>;
  removePostsFromPlaylist: (data: RemovePostsFromPlaylistRequest) => Promise<number>;
  getPlaylistPosts: (params: GetPlaylistPostsRequest) => Promise<Post[]>;
  resolvePlaylistPosts: (params: ResolvePlaylistPostsRequest) => Promise<Post[]>;
  getPlaylistsContainingPost: (postId: number, rule34PostId?: number) => Promise<number[]>;
}

const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  getIconPath: () => {
    return ipcRenderer.invoke("app:get-icon-path");
  },

  writeToClipboard: (text) =>
    ipcRenderer.invoke("app:write-to-clipboard", text),

  // Search remote tags via specified provider (defaults to rule34)
  searchRemoteTags: (query, provider = "rule34") =>
    ipcRenderer.invoke("api:search-remote-tags", query, provider),

  searchBooru: (params) =>
    ipcRenderer.invoke("booru:search", params),

  resolveTags: (tags) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.RESOLVE_TAGS, tags),

  resolveCharacterTags: (tags) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.RESOLVE_CHARACTER_TAGS, tags),

  resolveCopyrightTags: (tags) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.RESOLVE_COPYRIGHT_TAGS, tags),

  resolveTagsByType: (tags, type) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.RESOLVE_TAGS_BY_TYPE, tags, type),

  verifyCredentials: () => ipcRenderer.invoke("app:verify-creds"),

  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.GET),
  saveDownloadFolder: (path) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_FOLDER, path),
  saveSettings: (creds) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SAVE, creds),
  confirmLegal: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.CONFIRM_LEGAL),
  logout: () => ipcRenderer.invoke("app:logout"),

  getTrackedArtists: () => ipcRenderer.invoke("db:get-artists"),
  addArtist: (artist) => ipcRenderer.invoke("db:add-artist", artist),
  deleteArtist: (id) => ipcRenderer.invoke("db:delete-artist", id),

  searchArtists: (query) => ipcRenderer.invoke("db:search-tags", query),

  getArtistPosts: (params: GetPostsRequest) =>
    ipcRenderer.invoke("db:get-posts", params),
  getArtistPostsCount: (artistId?: number) =>
    ipcRenderer.invoke("db:get-posts-count", artistId),
  getDownloadItems: (params: GetPostsRequest & { limit?: number }) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_DOWNLOAD_ITEMS, params),
  getPostsCountWithFilters: (params: Pick<GetPostsRequest, "artistId" | "filters">) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_POSTS_COUNT_WITH_FILTERS, params),

  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),

  syncAll: () => ipcRenderer.invoke("db:sync-all"),

  markPostAsViewed: (postId, postData) =>
    ipcRenderer.invoke("db:mark-post-viewed", postId, postData),

  togglePostFavorite: (postId, postData) =>
    ipcRenderer.invoke("db:toggle-post-favorite", postId, postData),

  shadowInsertPost: (request: ShadowInsertRequest) =>
    ipcRenderer.invoke("db:shadow-insert-post", request),

  togglePostViewed: (postId) =>
    ipcRenderer.invoke("db:toggle-post-viewed", postId),

  resetPostCache: (postId) => ipcRenderer.invoke("db:reset-post-cache", postId),

  downloadFile: (url: string, filename: string) => {
    return ipcRenderer.invoke("files:download", url, filename);
  },

  downloadAll: (items: Array<{ url: string; filename: string }>) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.DOWNLOAD_ALL, items),
  cancelDownloadAll: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.CANCEL_DOWNLOAD_ALL),
  pauseDownloadAll: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.PAUSE_DOWNLOAD_ALL),
  resumeDownloadAll: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.RESUME_DOWNLOAD_ALL),
  getPendingDownload: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.GET_PENDING_DOWNLOAD),
  resumePendingDownload: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.RESUME_PENDING_DOWNLOAD),
  dismissPendingDownload: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.DISMISS_PENDING_DOWNLOAD),
  saveDownloadSettings: (data) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_SETTINGS, data),
  openFileInFolder: (path: string) =>
    ipcRenderer.invoke("files:open-folder", path),

  selectDownloadFolder: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.SELECT_DOWNLOAD_FOLDER),

  onDownloadProgress: (callback) => {
    const channel = "files:download-progress";
    const subscription = (_: IpcRendererEvent, data: DownloadProgressData) =>
      callback(data);

    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  onDownloadAllProgress: (callback) => {
    const channel = IPC_CHANNELS.FILES.DOWNLOAD_ALL_PROGRESS;
    const subscription = (
      _: IpcRendererEvent,
      data: { id: string; percent: number; done: number; total: number }
    ) => callback(data);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  onPendingDownloadStateChanged: (callback) => {
    const channel = IPC_CHANNELS.FILES.PENDING_DOWNLOAD_STATE_CHANGED;
    const subscription = () => callback();
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
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

  // Playlists
  createPlaylist: (data: CreatePlaylistRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.CREATE_PLAYLIST, data),
  getPlaylists: () => ipcRenderer.invoke(IPC_CHANNELS.DB.GET_PLAYLISTS),
  getPlaylist: (playlistId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_PLAYLIST, playlistId),
  updatePlaylist: (playlistId: number, data: UpdatePlaylistRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.UPDATE_PLAYLIST, playlistId, data),
  deletePlaylist: (playlistId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.DELETE_PLAYLIST, playlistId),
  addPostsToPlaylist: (data: AddPostsToPlaylistRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.ADD_POSTS_TO_PLAYLIST, data),
  removePostsFromPlaylist: (data: RemovePostsFromPlaylistRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.REMOVE_POSTS_FROM_PLAYLIST, data),
  getPlaylistPosts: (params: GetPlaylistPostsRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_PLAYLIST_POSTS, params),
  resolvePlaylistPosts: (params: ResolvePlaylistPostsRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.RESOLVE_PLAYLIST_POSTS, params),
  getPlaylistsContainingPost: (postId: number, rule34PostId?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_PLAYLISTS_CONTAINING_POST, postId, rule34PostId),
};

contextBridge.exposeInMainWorld("api", ipcBridge);
