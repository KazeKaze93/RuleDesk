/**
 * Shared IPC bridge contract (`window.api` / preload expose).
 *
 * Source of truth for the renderer-facing API surface. Runtime wiring lives in
 * `src/main/bridge.ts`; ambient `Window.api` is declared in `src/bridge.d.ts`.
 * Do not duplicate method signatures in ambient `.d.ts` files.
 */
import type { Artist, Post, Playlist } from "./db";
import type { DownloadAllResult } from "./download";
import type { DownloadAllRequest } from "../schemas/download";
import type { ProviderId } from "../constants";
import type { SearchResults } from "./providers";
import type { AddArtistRequest, DeleteArtistResult } from "../schemas/artist";
import type {
  GetPostsRequestInput,
  GetPostsCountRequest,
  PostData,
  PostFilterRequest,
} from "../schemas/post";
import type { ShadowInsertRequest } from "../schemas/shadow-insert";
import type { SearchBooruPageResult } from "../schemas/search";
import type { IpcSettings, SaveSettings, ThemePreference } from "../schemas/settings";
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
} from "../schemas/playlist";
import type { ExtendedStats } from "../schemas/stats";
import type {
  OrphanDetectionReport,
  RunVacuumResponse,
  SetVacuumScheduleArgs,
  VacuumSchedule,
  VacuumStatusResponse,
} from "../schemas/maintenance";
import type {
  AppInfo,
  Diagnostics,
  OpenLogsFolderResult,
} from "../schemas/system";
import type { ErrorCode } from "./error-codes";

export type UpdateStatusData = {
  status: string;
  message?: string;
  version?: string;
};

export type UpdateStatusCallback = (data: UpdateStatusData) => void;
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

/** @deprecated Prefer GetPostsRequest filters from shared post schemas. */
export interface PostQueryFilters {
  tags?: string;
  sortBy?: "date" | "id" | "rating";
  isViewed?: boolean;
}

export interface IpcBridge {
  getAppInfo: () => Promise<AppInfo>;
  getDatabaseLocation: () => Promise<string>;
  openLogsFolder: () => Promise<OpenLogsFolderResult>;
  getDiagnostics: () => Promise<Diagnostics>;
  getIconPath: (theme?: "light" | "dark") => Promise<string>;
  wipeAllData: () => Promise<void>;

  writeToClipboard: (text: string) => Promise<boolean>;

  getSettings: () => Promise<IpcSettings | null>;
  saveSettings: (creds: SaveSettings) => Promise<boolean>;
  saveTheme: (theme: ThemePreference) => Promise<boolean>;
  saveDownloadFolder: (path: string | null) => Promise<boolean>;
  confirmLegal: () => Promise<IpcSettings>;
  resetOnboarding: () => Promise<boolean>;
  logout: () => Promise<void>;

  getTrackedArtists: () => Promise<TrackedArtist[]>;
  addArtist: (artist: AddArtistRequest) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<DeleteArtistResult>;

  searchArtists: (query: string) => Promise<{ id: number; label: string }[]>;

  getArtistPosts: (params: GetPostsRequestInput) => Promise<Post[]>;
  getArtistPostsCount: (params: GetPostsCountRequest) => Promise<number>;
  getDownloadItems: (
    params: GetPostsRequestInput
  ) => Promise<{ items: Array<{ url: string; filename: string }> }>;
  getPostsCountWithFilters: (
    params: Pick<GetPostsRequestInput, "artistId" | "filters">
  ) => Promise<number>;
  getStats: () => Promise<ExtendedStats>;
  getExtendedStats: () => Promise<ExtendedStats>;

  togglePostViewed: (postId: number) => Promise<boolean>;
  markAllPostsAsViewed: () => Promise<{ updatedCount: number }>;
  getUpdatesUnreadCount: () => Promise<number>;
  getUpdatesTotalUnreadCount: (params: {
    filters?: PostFilterRequest;
  }) => Promise<number>;
  markAllUpdatesSeen: (params?: {
    filters?: PostFilterRequest;
  }) => Promise<{ updatedCount: number }>;
  markUpdatesSeenByIds: (
    ids: number[]
  ) => Promise<{ updatedCount: number }>;
  getUpdatesLastSyncAt: () => Promise<number | null>;

  resetPostCache: (postId: number) => Promise<boolean>;

  openExternal: (url: string) => Promise<void>;

  syncAll: () => Promise<boolean>;
  repairArtist: (
    artistId: number
  ) => Promise<{ success: boolean; error?: string }>;

  checkForUpdates: () => Promise<void>;
  /** Opens GitHub Releases for the last update-available version (or /latest). */
  openReleasePage: () => Promise<void>;

  onUpdateStatus: (callback: UpdateStatusCallback) => () => void;

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

  downloadFile: (
    url: string,
    filename: string
  ) => Promise<{
    success: boolean;
    path?: string;
    error?: string;
    canceled?: boolean;
  }>;
  downloadAll: (request: DownloadAllRequest) => Promise<DownloadAllResult>;
  cancelDownloadAll: () => Promise<boolean>;
  pauseDownloadAll: () => Promise<void>;
  resumeDownloadAll: () => Promise<void>;
  getPendingDownload: () => Promise<{
    hasPending: boolean;
    total: number;
    done: number;
    folder: string;
  } | null>;
  resumePendingDownload: () => Promise<DownloadAllResult>;
  dismissPendingDownload: () => Promise<void>;
  saveDownloadSettings: (data: {
    duplicateFileBehavior?: "skip" | "overwrite";
    downloadFolderStructure?: "flat" | "{artist_id}";
  }) => Promise<boolean>;
  openFileInFolder: (path: string) => Promise<boolean>;
  selectDownloadFolder: () => Promise<string | null>;

  onDownloadProgress: (callback: DownloadProgressCallback) => () => void;
  onDownloadAllProgress: (
    callback: (data: {
      id: string;
      percent: number;
      done: number;
      total: number;
    }) => void
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

  createPlaylist: (data: CreatePlaylistRequest) => Promise<Playlist>;
  getPlaylists: () => Promise<PlaylistWithStats[]>;
  getPlaylist: (playlistId: number) => Promise<Playlist | null>;
  updatePlaylist: (
    playlistId: number,
    data: UpdatePlaylistRequest
  ) => Promise<Playlist>;
  deletePlaylist: (playlistId: number) => Promise<boolean>;
  addPostsToPlaylist: (data: AddPostsToPlaylistRequest) => Promise<number>;
  removePostsFromPlaylist: (
    data: RemovePostsFromPlaylistRequest
  ) => Promise<number>;
  reorderPlaylistEntries: (
    params: ReorderPlaylistEntriesRequest
  ) => Promise<void>;
  getPlaylistPosts: (params: GetPlaylistPostsRequest) => Promise<Post[]>;
  resolvePlaylistPosts: (params: ResolvePlaylistPostsRequest) => Promise<Post[]>;
  getPlaylistsContainingPost: (
    postId: number,
    externalPostId?: number,
    provider?: "rule34" | "gelbooru"
  ) => Promise<number[]>;
  getManualPlaylistMembershipForPosts: (
    data: GetManualPlaylistMembershipForPostsRequest
  ) => Promise<{ playlistId: number; matchCount: number }[]>;
  syncManualPlaylistMembership: (
    data: SyncManualPlaylistMembershipRequest
  ) => Promise<void>;
  clearManualPlaylist: (data: ClearManualPlaylistRequest) => Promise<void>;
  movePostsBetweenManualPlaylists: (
    data: MovePostsBetweenManualPlaylistsRequest
  ) => Promise<void>;
  exportPlaylist: (
    playlistId: number
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  importPlaylist: () => Promise<{
    success: boolean;
    playlistId?: number;
    error?: string;
    code?: ErrorCode;
  }>;

  getVideoProxyUrl: (fileUrl: string) => Promise<string>;
}
