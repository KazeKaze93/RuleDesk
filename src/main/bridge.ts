import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { Artist, Post, Playlist } from "./db/schema";
import { invokeIpc } from "../preload/invoke-ipc";
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
import type { SearchBooruPageResult } from "../shared/schemas/search";
import type { ProviderId, SearchResults } from "./providers";
import type {
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  AddPostsToPlaylistRequest,
  RemovePostsFromPlaylistRequest,
  GetPlaylistPostsRequest,
  ResolvePlaylistPostsRequest,
  ReorderPlaylistEntriesRequest,
  GetManualPlaylistMembershipForPostsRequest,
  SyncManualPlaylistMembershipRequest,
  ClearManualPlaylistRequest,
  MovePostsBetweenManualPlaylistsRequest,
} from "../shared/schemas/playlist";
import type { ExtendedStats } from "../shared/schemas/stats";
import type {
  OrphanDetectionReport,
  RunVacuumResponse,
  SetVacuumScheduleArgs,
  VacuumSchedule,
  VacuumStatusResponse,
} from "../shared/schemas/maintenance";

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
  tags?: string;
  sortBy?: "date" | "id" | "rating";
  isViewed?: boolean;
}

export interface IpcBridge {
  // App
  getAppVersion: () => Promise<string>;
  getDatabaseLocation: () => Promise<string>;
  getIconPath: (theme?: "light" | "dark") => Promise<string>;
  wipeAllData: () => Promise<void>;

  writeToClipboard: (text: string) => Promise<boolean>;

  // Settings
  getSettings: () => Promise<IpcSettings | null>;
  saveSettings: (creds: SaveSettings) => Promise<boolean>;
  saveTheme: (theme: ThemePreference) => Promise<boolean>;
  saveDownloadFolder: (path: string | null) => Promise<boolean>;
  confirmLegal: () => Promise<IpcSettings>;
  resetOnboarding: () => Promise<boolean>;
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
  /** Per-artist syncStatus was persisted (start or end). Void payload — refetch DB. */
  onSyncArtist: (callback: () => void) => () => void;
  onRepairStart: (callback: (artistName: string) => void) => () => void;
  onRepairEnd: (callback: () => void) => () => void;

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

  searchRemoteTags: (
    query: string,
    provider?: ProviderId,
    artistOnly?: boolean
  ) => Promise<SearchResults[]>;

  searchBooru: (params: {
    tags: string[];
    page: number;
    isRandom?: boolean;
    limit?: number;
    beforePostId?: number;
  }) => Promise<SearchBooruPageResult<Post>>;

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
  shouldShowBackupPrompt: () => Promise<boolean>;
  markBackupPromptSeen: () => Promise<boolean>;
  getVacuumStatus: () => Promise<VacuumStatusResponse>;
  runVacuum: () => Promise<RunVacuumResponse>;
  getVacuumSchedule: () => Promise<VacuumSchedule>;
  setVacuumSchedule: (args: SetVacuumScheduleArgs) => Promise<boolean>;
  detectOrphans: () => Promise<OrphanDetectionReport>;

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
  getManualPlaylistMembershipForPosts: (
    data: GetManualPlaylistMembershipForPostsRequest
  ) => Promise<{ playlistId: number; matchCount: number }[]>;
  syncManualPlaylistMembership: (data: SyncManualPlaylistMembershipRequest) => Promise<void>;
  clearManualPlaylist: (data: ClearManualPlaylistRequest) => Promise<void>;
  movePostsBetweenManualPlaylists: (
    data: MovePostsBetweenManualPlaylistsRequest
  ) => Promise<void>;
  exportPlaylist: (playlistId: number) => Promise<{ success: boolean; path?: string; error?: string }>;
  importPlaylist: () => Promise<{ success: boolean; playlistId?: number; error?: string }>;

  getVideoProxyUrl: (fileUrl: string) => Promise<string>;
}

const ipcBridge: IpcBridge = {
  getAppVersion: () => invokeIpc(IPC_CHANNELS.APP.GET_VERSION),
  getDatabaseLocation: () => invokeIpc(IPC_CHANNELS.APP.GET_DB_LOCATION),
  getIconPath: (theme) => {
    return invokeIpc(IPC_CHANNELS.APP.GET_ICON_PATH, theme);
  },
  wipeAllData: () => invokeIpc(IPC_CHANNELS.APP.WIPE_ALL_DATA),

  writeToClipboard: (text) =>
    invokeIpc(IPC_CHANNELS.APP.WRITE_CLIPBOARD, text),

  // Search remote tags via specified provider (defaults to rule34)
  searchRemoteTags: (query, provider = "rule34", artistOnly = false) =>
    invokeIpc(
      IPC_CHANNELS.API.SEARCH_REMOTE,
      query,
      provider,
      artistOnly
    ),

  searchBooru: (params) =>
    invokeIpc(IPC_CHANNELS.API.SEARCH_POSTS, params),

  resolveTags: (tags) =>
    invokeIpc(IPC_CHANNELS.API.RESOLVE_TAGS, tags),

  resolveCharacterTags: (tags) =>
    invokeIpc(IPC_CHANNELS.API.RESOLVE_CHARACTER_TAGS, tags),

  resolveCopyrightTags: (tags) =>
    invokeIpc(IPC_CHANNELS.API.RESOLVE_COPYRIGHT_TAGS, tags),

  resolveTagsByType: (tags, type) =>
    invokeIpc(IPC_CHANNELS.API.RESOLVE_TAGS_BY_TYPE, tags, type),
  getBlacklistedTags: () =>
    invokeIpc(IPC_CHANNELS.BLACKLIST.GET_ALL),
  addTagToBlacklist: (tag) =>
    invokeIpc(IPC_CHANNELS.BLACKLIST.ADD, tag),
  removeTagFromBlacklist: (tag) =>
    invokeIpc(IPC_CHANNELS.BLACKLIST.REMOVE, tag),

  verifyCredentials: (providerId) =>
    invokeIpc(IPC_CHANNELS.APP.VERIFY_CREDS, providerId),

  getSettings: () => invokeIpc(IPC_CHANNELS.SETTINGS.GET),
  saveDownloadFolder: (path) =>
    invokeIpc(IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_FOLDER, path),
  saveSettings: (creds) =>
    invokeIpc(IPC_CHANNELS.SETTINGS.SAVE, creds),
  saveTheme: (theme) =>
    invokeIpc(IPC_CHANNELS.SETTINGS.SAVE_THEME, theme),
  confirmLegal: () => invokeIpc(IPC_CHANNELS.SETTINGS.CONFIRM_LEGAL),
  resetOnboarding: () =>
    invokeIpc(IPC_CHANNELS.SETTINGS.RESET_ONBOARDING),
  logout: () => invokeIpc(IPC_CHANNELS.APP.LOGOUT),

  getTrackedArtists: () => invokeIpc(IPC_CHANNELS.DB.GET_ARTISTS),
  addArtist: (artist) => invokeIpc(IPC_CHANNELS.DB.ADD_ARTIST, artist),
  deleteArtist: (id) => invokeIpc(IPC_CHANNELS.DB.DELETE_ARTIST, id),

  searchArtists: (query) => invokeIpc(IPC_CHANNELS.DB.SEARCH_TAGS, query),

  getArtistPosts: (params: GetPostsRequest) =>
    invokeIpc(IPC_CHANNELS.DB.GET_POSTS, params),
  getArtistPostsCount: (params: GetPostsCountRequest) =>
    invokeIpc(IPC_CHANNELS.DB.GET_POSTS_COUNT, params),
  getDownloadItems: (params: GetPostsRequest & { limit?: number }) =>
    invokeIpc(IPC_CHANNELS.DB.GET_DOWNLOAD_ITEMS, params),
  getPostsCountWithFilters: (params: Pick<GetPostsRequest, "artistId" | "filters">) =>
    invokeIpc(IPC_CHANNELS.DB.GET_POSTS_COUNT_WITH_FILTERS, params),
  getStats: () => invokeIpc(IPC_CHANNELS.DB.GET_STATS),
  getExtendedStats: () => invokeIpc(IPC_CHANNELS.STATS.GET_EXTENDED),

  openExternal: (url) => invokeIpc(IPC_CHANNELS.APP.OPEN_EXTERNAL, url),

  syncAll: () => invokeIpc(IPC_CHANNELS.DB.SYNC_ALL),

  markPostAsViewed: (postId, postData) =>
    invokeIpc(IPC_CHANNELS.DB.MARK_VIEWED, postId, postData),

  togglePostFavorite: (postId, postData) =>
    invokeIpc(IPC_CHANNELS.DB.TOGGLE_FAVORITE, postId, postData),

  shadowInsertPost: (request: ShadowInsertRequest) =>
    invokeIpc(IPC_CHANNELS.DB.SHADOW_INSERT_POST, request),

  togglePostViewed: (postId) =>
    invokeIpc(IPC_CHANNELS.DB.TOGGLE_POST_VIEWED, postId),
  markAllPostsAsViewed: () =>
    invokeIpc(IPC_CHANNELS.DB.MARK_ALL_VIEWED),
  getUpdatesUnreadCount: () =>
    invokeIpc(IPC_CHANNELS.UPDATES.GET_UNREAD_COUNT),
  getUpdatesTotalUnreadCount: (params) =>
    invokeIpc(IPC_CHANNELS.UPDATES.GET_TOTAL_UNREAD_COUNT, params),
  markAllUpdatesSeen: () =>
    invokeIpc(IPC_CHANNELS.UPDATES.MARK_ALL_SEEN),

  resetPostCache: (postId) => invokeIpc(IPC_CHANNELS.DB.RESET_POST_CACHE, postId),

  downloadFile: (url: string, filename: string) => {
    return invokeIpc(IPC_CHANNELS.FILES.DOWNLOAD, url, filename);
  },

  downloadAll: (items: Array<{ url: string; filename: string }>) =>
    invokeIpc(IPC_CHANNELS.FILES.DOWNLOAD_ALL, items),
  cancelDownloadAll: () =>
    invokeIpc(IPC_CHANNELS.FILES.CANCEL_DOWNLOAD_ALL),
  pauseDownloadAll: () =>
    invokeIpc(IPC_CHANNELS.FILES.PAUSE_DOWNLOAD_ALL),
  resumeDownloadAll: () =>
    invokeIpc(IPC_CHANNELS.FILES.RESUME_DOWNLOAD_ALL),
  getPendingDownload: () =>
    invokeIpc(IPC_CHANNELS.FILES.GET_PENDING_DOWNLOAD),
  resumePendingDownload: () =>
    invokeIpc(IPC_CHANNELS.FILES.RESUME_PENDING_DOWNLOAD),
  dismissPendingDownload: () =>
    invokeIpc(IPC_CHANNELS.FILES.DISMISS_PENDING_DOWNLOAD),
  saveDownloadSettings: (data) =>
    invokeIpc(IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_SETTINGS, data),
  openFileInFolder: (path: string) =>
    invokeIpc(IPC_CHANNELS.FILES.OPEN_FOLDER, path),

  selectDownloadFolder: () =>
    invokeIpc(IPC_CHANNELS.FILES.SELECT_DOWNLOAD_FOLDER),

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
    invokeIpc(IPC_CHANNELS.SYNC.REPAIR, artistId),

  // Updater Implementation
  checkForUpdates: () => invokeIpc(IPC_CHANNELS.APP.CHECK_FOR_UPDATES),
  quitAndInstall: () => invokeIpc(IPC_CHANNELS.APP.QUIT_AND_INSTALL),
  startDownload: () => invokeIpc(IPC_CHANNELS.APP.START_UPDATE_DOWNLOAD),

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

  onSyncArtist: (callback) => {
    const sub = () => callback();
    const channel = IPC_CHANNELS.SYNC.ARTIST;
    ipcRenderer.on(channel, sub);
    return () => ipcRenderer.removeListener(channel, sub);
  },

  onRepairStart: (callback) => {
    const channel = IPC_CHANNELS.SYNC.REPAIR_START;
    const subscription = (_: IpcRendererEvent, artistName: string) =>
      callback(artistName);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  onRepairEnd: (callback) => {
    const sub = () => callback();
    const channel = IPC_CHANNELS.SYNC.REPAIR_END;
    ipcRenderer.on(channel, sub);
    return () => ipcRenderer.removeListener(channel, sub);
  },

  createBackup: () => invokeIpc(IPC_CHANNELS.BACKUP.CREATE),
  restoreBackup: () => invokeIpc(IPC_CHANNELS.BACKUP.RESTORE),
  checkDatabaseIntegrity: () =>
    invokeIpc(IPC_CHANNELS.BACKUP.INTEGRITY_CHECK),
  getBackupSchedule: () =>
    invokeIpc(IPC_CHANNELS.BACKUP.GET_SCHEDULE),
  setBackupSchedule: (interval) =>
    invokeIpc(IPC_CHANNELS.BACKUP.SET_SCHEDULE, interval),
  shouldShowBackupPrompt: () =>
    invokeIpc(IPC_CHANNELS.MAINTENANCE.SHOULD_SHOW_BACKUP_PROMPT),
  markBackupPromptSeen: () =>
    invokeIpc(IPC_CHANNELS.MAINTENANCE.MARK_BACKUP_PROMPT_SEEN),
  getVacuumStatus: () =>
    invokeIpc(IPC_CHANNELS.MAINTENANCE.GET_VACUUM_STATUS),
  runVacuum: () => invokeIpc(IPC_CHANNELS.MAINTENANCE.RUN_VACUUM),
  getVacuumSchedule: () =>
    invokeIpc(IPC_CHANNELS.MAINTENANCE.GET_VACUUM_SCHEDULE),
  setVacuumSchedule: (args) =>
    invokeIpc(IPC_CHANNELS.MAINTENANCE.SET_VACUUM_SCHEDULE, args),
  detectOrphans: () =>
    invokeIpc(IPC_CHANNELS.MAINTENANCE.DETECT_ORPHANS),

  // Playlists
  createPlaylist: (data: CreatePlaylistRequest) =>
    invokeIpc(IPC_CHANNELS.DB.CREATE_PLAYLIST, data),
  getPlaylists: () => invokeIpc(IPC_CHANNELS.DB.GET_PLAYLISTS),
  getPlaylist: (playlistId: number) =>
    invokeIpc(IPC_CHANNELS.DB.GET_PLAYLIST, playlistId),
  updatePlaylist: (playlistId: number, data: UpdatePlaylistRequest) =>
    invokeIpc(IPC_CHANNELS.DB.UPDATE_PLAYLIST, playlistId, data),
  deletePlaylist: (playlistId: number) =>
    invokeIpc(IPC_CHANNELS.DB.DELETE_PLAYLIST, playlistId),
  addPostsToPlaylist: (data: AddPostsToPlaylistRequest) =>
    invokeIpc(IPC_CHANNELS.DB.ADD_POSTS_TO_PLAYLIST, data),
  removePostsFromPlaylist: (data: RemovePostsFromPlaylistRequest) =>
    invokeIpc(IPC_CHANNELS.DB.REMOVE_POSTS_FROM_PLAYLIST, data),
  reorderPlaylistEntries: (params: ReorderPlaylistEntriesRequest) =>
    invokeIpc(IPC_CHANNELS.DB.REORDER_PLAYLIST_ENTRIES, params),
  getPlaylistPosts: (params: GetPlaylistPostsRequest) =>
    invokeIpc(IPC_CHANNELS.DB.GET_PLAYLIST_POSTS, params),
  resolvePlaylistPosts: (params: ResolvePlaylistPostsRequest) =>
    invokeIpc(IPC_CHANNELS.DB.RESOLVE_PLAYLIST_POSTS, params),
  getPlaylistsContainingPost: (postId: number, rule34PostId?: number) =>
    invokeIpc(IPC_CHANNELS.DB.GET_PLAYLISTS_CONTAINING_POST, postId, rule34PostId),
  getManualPlaylistMembershipForPosts: (data: GetManualPlaylistMembershipForPostsRequest) =>
    invokeIpc(IPC_CHANNELS.DB.GET_MANUAL_PLAYLIST_MEMBERSHIP_FOR_POSTS, data),
  syncManualPlaylistMembership: (data: SyncManualPlaylistMembershipRequest) =>
    invokeIpc(IPC_CHANNELS.DB.SYNC_MANUAL_PLAYLIST_MEMBERSHIP, data),
  clearManualPlaylist: (data: ClearManualPlaylistRequest) =>
    invokeIpc(IPC_CHANNELS.DB.CLEAR_MANUAL_PLAYLIST, data),
  movePostsBetweenManualPlaylists: (data: MovePostsBetweenManualPlaylistsRequest) =>
    invokeIpc(IPC_CHANNELS.DB.MOVE_POSTS_BETWEEN_MANUAL_PLAYLISTS, data),
  exportPlaylist: (playlistId: number) =>
    invokeIpc(IPC_CHANNELS.DB.EXPORT_PLAYLIST, playlistId),
  importPlaylist: () =>
    invokeIpc(IPC_CHANNELS.DB.IMPORT_PLAYLIST),

  getVideoProxyUrl: (fileUrl: string) =>
    invokeIpc(IPC_CHANNELS.VIDEO_PROXY.GET_URL, fileUrl),
};

contextBridge.exposeInMainWorld("api", ipcBridge);
