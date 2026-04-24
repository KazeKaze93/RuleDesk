import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { Artist, Post, Playlist } from "./db/schema";
import { IPC_CHANNELS } from "./ipc/channels";
import type {
  GetPostsRequest,
  GetPostsCountRequest,
  AddArtistRequest,
} from "./types/ipc";
import type { IpcSettings, SaveSettings } from "../shared/schemas/settings";
import type { ThemePreference } from "../shared/schemas/settings";
import type { PostData, PostFilterRequest } from "../shared/schemas/post";
import type { ShadowInsertRequest } from "../shared/schemas/shadow-insert";
import type { ProviderId, SearchResults } from "./providers";
import type {
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  AddPostsToPlaylistRequest,
  RemovePostsFromPlaylistRequest,
  GetPlaylistPostsRequest,
  ResolvePlaylistPostsRequest,
  ReorderPlaylistEntriesRequest,
} from "../shared/schemas/playlist";
import type { ExtendedStats } from "../shared/schemas/stats";

export type UpdateStatusData = {
  status: string;
  message?: string;
  version?: string;
};

export type UpdateStatusCallback = (data: UpdateStatusData) => void;
export type UpdateProgressCallback = (percent: number) => void;
export type SyncErrorCallback = (message: string) => void;
export type AutoBackupInterval = "never" | "daily" | "weekly";

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
export type TrackedArtist = Artist & {
  postsCount: number;
  lastPostAt: number | null;
};
export type PlaylistWithStats = Playlist & {
  postCount: number;
};

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
  getDatabaseLocation: () => Promise<string>;
  getIconPath: (theme?: "light" | "dark") => Promise<string>;

  writeToClipboard: (text: string) => Promise<boolean>;

  // Settings
  getSettings: () => Promise<IpcSettings | null>;
  saveSettings: (creds: SaveSettings) => Promise<boolean>;
  saveTheme: (theme: ThemePreference) => Promise<boolean>;
  saveDownloadFolder: (path: string | null) => Promise<boolean>;
  confirmLegal: () => Promise<IpcSettings>;
  logout: () => Promise<void>;

  // Artists
  getTrackedArtists: () => Promise<TrackedArtist[]>;
  addArtist: (artist: AddArtistRequest) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<void>;

  // --- NEW: SEARCH ---
  searchArtists: (query: string) => Promise<{ id: number; label: string }[]>;

  // Posts
  getArtistPosts: (params: GetPostsRequest) => Promise<Post[]>;
  getArtistPostsCount: (params: GetPostsCountRequest) => Promise<number>;
  getDownloadItems: (params: GetPostsRequest & { limit?: number }) => Promise<{ items: Array<{ url: string; filename: string }> }>;
  getPostsCountWithFilters: (params: Pick<GetPostsRequest, "artistId" | "filters">) => Promise<number>;
  getStats: () => Promise<ExtendedStats>;
  getExtendedStats: () => Promise<ExtendedStats>;

  togglePostViewed: (postId: number) => Promise<boolean>;
  markAllPostsAsViewed: () => Promise<{ updatedCount: number }>;
  getUpdatesUnreadCount: () => Promise<number>;
  getUpdatesTotalUnreadCount: (params: { filters?: PostFilterRequest }) => Promise<number>;
  markAllUpdatesSeen: () => Promise<boolean>;

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
  getBlacklistedTags: () => Promise<string[]>;
  addTagToBlacklist: (tag: string) => Promise<void>;
  removeTagFromBlacklist: (tag: string) => Promise<void>;

  createBackup: () => Promise<BackupResponse>;
  restoreBackup: () => Promise<BackupResponse>;
  checkDatabaseIntegrity: () => Promise<{ ok: boolean; details: string }>;
  getBackupSchedule: () => Promise<AutoBackupInterval>;
  setBackupSchedule: (interval: AutoBackupInterval) => Promise<boolean>;

  verifyCredentials: (providerId?: ProviderId) => Promise<boolean>;

  // Playlists
  createPlaylist: (data: CreatePlaylistRequest) => Promise<Playlist>;
  getPlaylists: () => Promise<PlaylistWithStats[]>;
  getPlaylist: (playlistId: number) => Promise<Playlist | null>;
  updatePlaylist: (playlistId: number, data: UpdatePlaylistRequest) => Promise<Playlist>;
  deletePlaylist: (playlistId: number) => Promise<boolean>;
  addPostsToPlaylist: (data: AddPostsToPlaylistRequest) => Promise<number>;
  removePostsFromPlaylist: (data: RemovePostsFromPlaylistRequest) => Promise<number>;
  reorderPlaylistEntries: (params: ReorderPlaylistEntriesRequest) => Promise<void>;
  getPlaylistPosts: (params: GetPlaylistPostsRequest) => Promise<Post[]>;
  resolvePlaylistPosts: (params: ResolvePlaylistPostsRequest) => Promise<Post[]>;
  getPlaylistsContainingPost: (postId: number, rule34PostId?: number) => Promise<number[]>;
  exportPlaylist: (playlistId: number) => Promise<{ success: boolean; path?: string; error?: string }>;
  importPlaylist: () => Promise<{ success: boolean; playlistId?: number; error?: string }>;

  getVideoProxyUrl: (fileUrl: string) => Promise<string>;
}

const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP.GET_VERSION),
  getDatabaseLocation: () => ipcRenderer.invoke(IPC_CHANNELS.APP.GET_DB_LOCATION),
  getIconPath: (theme) => {
    return ipcRenderer.invoke(IPC_CHANNELS.APP.GET_ICON_PATH, theme);
  },

  writeToClipboard: (text) =>
    ipcRenderer.invoke(IPC_CHANNELS.APP.WRITE_CLIPBOARD, text),

  // Search remote tags via specified provider (defaults to rule34)
  searchRemoteTags: (query, provider = "rule34") =>
    ipcRenderer.invoke(IPC_CHANNELS.API.SEARCH_REMOTE, query, provider),

  searchBooru: (params) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.SEARCH_POSTS, params),

  resolveTags: (tags) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.RESOLVE_TAGS, tags),

  resolveCharacterTags: (tags) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.RESOLVE_CHARACTER_TAGS, tags),

  resolveCopyrightTags: (tags) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.RESOLVE_COPYRIGHT_TAGS, tags),

  resolveTagsByType: (tags, type) =>
    ipcRenderer.invoke(IPC_CHANNELS.API.RESOLVE_TAGS_BY_TYPE, tags, type),
  getBlacklistedTags: () =>
    ipcRenderer.invoke(IPC_CHANNELS.BLACKLIST.GET_ALL),
  addTagToBlacklist: (tag) =>
    ipcRenderer.invoke(IPC_CHANNELS.BLACKLIST.ADD, tag),
  removeTagFromBlacklist: (tag) =>
    ipcRenderer.invoke(IPC_CHANNELS.BLACKLIST.REMOVE, tag),

  verifyCredentials: (providerId) =>
    ipcRenderer.invoke(IPC_CHANNELS.APP.VERIFY_CREDS, providerId),

  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.GET),
  saveDownloadFolder: (path) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_FOLDER, path),
  saveSettings: (creds) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SAVE, creds),
  saveTheme: (theme) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SAVE_THEME, theme),
  confirmLegal: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.CONFIRM_LEGAL),
  logout: () => ipcRenderer.invoke(IPC_CHANNELS.APP.LOGOUT),

  getTrackedArtists: () => ipcRenderer.invoke(IPC_CHANNELS.DB.GET_ARTISTS),
  addArtist: (artist) => ipcRenderer.invoke(IPC_CHANNELS.DB.ADD_ARTIST, artist),
  deleteArtist: (id) => ipcRenderer.invoke(IPC_CHANNELS.DB.DELETE_ARTIST, id),

  searchArtists: (query) => ipcRenderer.invoke(IPC_CHANNELS.DB.SEARCH_TAGS, query),

  getArtistPosts: (params: GetPostsRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_POSTS, params),
  getArtistPostsCount: (params: GetPostsCountRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_POSTS_COUNT, params),
  getDownloadItems: (params: GetPostsRequest & { limit?: number }) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_DOWNLOAD_ITEMS, params),
  getPostsCountWithFilters: (params: Pick<GetPostsRequest, "artistId" | "filters">) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_POSTS_COUNT_WITH_FILTERS, params),
  getStats: () => ipcRenderer.invoke(IPC_CHANNELS.DB.GET_STATS),
  getExtendedStats: () => ipcRenderer.invoke(IPC_CHANNELS.STATS.GET_EXTENDED),

  openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.APP.OPEN_EXTERNAL, url),

  syncAll: () => ipcRenderer.invoke(IPC_CHANNELS.DB.SYNC_ALL),

  markPostAsViewed: (postId, postData) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.MARK_VIEWED, postId, postData),

  togglePostFavorite: (postId, postData) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.TOGGLE_FAVORITE, postId, postData),

  shadowInsertPost: (request: ShadowInsertRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.SHADOW_INSERT_POST, request),

  togglePostViewed: (postId) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.TOGGLE_POST_VIEWED, postId),
  markAllPostsAsViewed: () =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.MARK_ALL_VIEWED),
  getUpdatesUnreadCount: () =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATES.GET_UNREAD_COUNT),
  getUpdatesTotalUnreadCount: (params) =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATES.GET_TOTAL_UNREAD_COUNT, params),
  markAllUpdatesSeen: () =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATES.MARK_ALL_SEEN),

  resetPostCache: (postId) => ipcRenderer.invoke(IPC_CHANNELS.DB.RESET_POST_CACHE, postId),

  downloadFile: (url: string, filename: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.FILES.DOWNLOAD, url, filename);
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
    ipcRenderer.invoke(IPC_CHANNELS.FILES.OPEN_FOLDER, path),

  selectDownloadFolder: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES.SELECT_DOWNLOAD_FOLDER),

  onDownloadProgress: (callback) => {
    const channel = IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS;
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
    ipcRenderer.invoke(IPC_CHANNELS.SYNC.REPAIR, artistId),

  // Updater Implementation
  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.APP.CHECK_FOR_UPDATES),
  quitAndInstall: () => ipcRenderer.invoke(IPC_CHANNELS.APP.QUIT_AND_INSTALL),
  startDownload: () => ipcRenderer.invoke(IPC_CHANNELS.APP.START_UPDATE_DOWNLOAD),

  onUpdateStatus: (callback) => {
    const channel = IPC_CHANNELS.UPDATER.STATUS;
    const subscription = (_: IpcRendererEvent, data: UpdateStatusData) =>
      callback(data);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  onUpdateProgress: (callback) => {
    const channel = IPC_CHANNELS.UPDATER.PROGRESS;
    const subscription = (_: IpcRendererEvent, percent: number) =>
      callback(percent);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  onSyncStart: (callback) => {
    const sub = () => callback();
    const channel = IPC_CHANNELS.SYNC.START;
    ipcRenderer.on(channel, sub);
    return () => ipcRenderer.removeListener(channel, sub);
  },

  onSyncEnd: (callback) => {
    const sub = () => callback();
    const channel = IPC_CHANNELS.SYNC.END;
    ipcRenderer.on(channel, sub);
    return () => ipcRenderer.removeListener(channel, sub);
  },

  onSyncError: (callback) => {
    const channel = IPC_CHANNELS.SYNC.ERROR;
    const subscription = (_: IpcRendererEvent, msg: string) => callback(msg);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  onSyncProgress: (callback) => {
    const sub = (_: IpcRendererEvent, msg: string) => callback(msg);
    const channel = IPC_CHANNELS.SYNC.PROGRESS;
    ipcRenderer.on(channel, sub);
    return () => ipcRenderer.removeListener(channel, sub);
  },

  createBackup: () => ipcRenderer.invoke(IPC_CHANNELS.BACKUP.CREATE),
  restoreBackup: () => ipcRenderer.invoke(IPC_CHANNELS.BACKUP.RESTORE),
  checkDatabaseIntegrity: () =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP.INTEGRITY_CHECK),
  getBackupSchedule: () =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP.GET_SCHEDULE),
  setBackupSchedule: (interval) =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP.SET_SCHEDULE, interval),

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
  reorderPlaylistEntries: (params: ReorderPlaylistEntriesRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.REORDER_PLAYLIST_ENTRIES, params),
  getPlaylistPosts: (params: GetPlaylistPostsRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_PLAYLIST_POSTS, params),
  resolvePlaylistPosts: (params: ResolvePlaylistPostsRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.RESOLVE_PLAYLIST_POSTS, params),
  getPlaylistsContainingPost: (postId: number, rule34PostId?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.GET_PLAYLISTS_CONTAINING_POST, postId, rule34PostId),
  exportPlaylist: (playlistId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.EXPORT_PLAYLIST, playlistId),
  importPlaylist: () =>
    ipcRenderer.invoke(IPC_CHANNELS.DB.IMPORT_PLAYLIST),

  getVideoProxyUrl: (fileUrl: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.VIDEO_PROXY.GET_URL, fileUrl),
};

contextBridge.exposeInMainWorld("api", ipcBridge);
