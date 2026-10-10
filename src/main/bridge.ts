import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { invokeIpc } from "../preload/invoke-ipc";
import { IPC_CHANNELS } from "./ipc/channels";
import type {
  GetPostsRequestInput,
  GetPostsCountRequest,
} from "../shared/schemas/post";
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
import type { ShadowInsertRequest } from "../shared/schemas/shadow-insert";
import type {
  IpcBridge,
  UpdateStatusData,
  DownloadProgressData,
} from "../shared/types/ipc-bridge";

export type {
  IpcBridge,
  UpdateStatusData,
  UpdateStatusCallback,
  SyncErrorCallback,
  AutoBackupInterval,
  BackupResponse,
  DownloadProgressCallback,
  DownloadProgressData,
  TrackedArtist,
  PlaylistWithStats,
  PostQueryFilters,
} from "../shared/types/ipc-bridge";

// Re-export IPC DTOs for callers that historically imported from bridge.ts
export type { GetPostsRequest, AddArtistRequest, PostFilterRequest } from "./types/ipc";

const ipcBridge: IpcBridge = {
  getAppInfo: () => invokeIpc(IPC_CHANNELS.APP.GET_APP_INFO),
  getDatabaseLocation: () => invokeIpc(IPC_CHANNELS.APP.GET_DB_LOCATION),
  openLogsFolder: () => invokeIpc(IPC_CHANNELS.APP.OPEN_LOGS_FOLDER),
  getDiagnostics: () => invokeIpc(IPC_CHANNELS.APP.GET_DIAGNOSTICS),
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

  getArtistPosts: (params: GetPostsRequestInput) =>
    invokeIpc(IPC_CHANNELS.DB.GET_POSTS, params),
  getArtistPostsCount: (params: GetPostsCountRequest) =>
    invokeIpc(IPC_CHANNELS.DB.GET_POSTS_COUNT, params),
  getDownloadItems: (params: GetPostsRequestInput) =>
    invokeIpc(IPC_CHANNELS.DB.GET_DOWNLOAD_ITEMS, params),
  getPostsCountWithFilters: (
    params: Pick<GetPostsRequestInput, "artistId" | "filters">
  ) => invokeIpc(IPC_CHANNELS.DB.GET_POSTS_COUNT_WITH_FILTERS, params),
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
  markAllUpdatesSeen: (params) =>
    invokeIpc(IPC_CHANNELS.UPDATES.MARK_ALL_SEEN, params ?? {}),
  markUpdatesSeenByIds: (ids) =>
    invokeIpc(IPC_CHANNELS.UPDATES.MARK_SEEN_BY_IDS, ids),
  getUpdatesLastSyncAt: () =>
    invokeIpc(IPC_CHANNELS.UPDATES.GET_LAST_SYNC_AT),

  resetPostCache: (postId) => invokeIpc(IPC_CHANNELS.DB.RESET_POST_CACHE, postId),

  downloadFile: (url: string, filename: string) => {
    return invokeIpc(IPC_CHANNELS.FILES.DOWNLOAD, url, filename);
  },

  downloadAll: (request) =>
    invokeIpc(IPC_CHANNELS.FILES.DOWNLOAD_ALL, request),
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
  openReleasePage: () => invokeIpc(IPC_CHANNELS.APP.OPEN_RELEASE_PAGE),

  onUpdateStatus: (callback) => {
    const channel = IPC_CHANNELS.UPDATER.STATUS;
    const subscription = (_: IpcRendererEvent, data: UpdateStatusData) =>
      callback(data);
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
  getPlaylistsContainingPost: (
    postId: number,
    externalPostId?: number,
    provider?: "rule34" | "gelbooru"
  ) =>
    invokeIpc(
      IPC_CHANNELS.DB.GET_PLAYLISTS_CONTAINING_POST,
      postId,
      externalPostId,
      provider
    ),
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
