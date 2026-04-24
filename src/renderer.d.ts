import type { Artist, Post, Playlist } from "./main/db/schema";
import {
  IpcBridge,
  UpdateStatusCallback,
  UpdateProgressCallback,
  AddArtistPayload,
} from "./main/bridge";
import type { ShadowInsertRequest } from "./shared/schemas/shadow-insert";
import type { SearchResults, ProviderId } from "./main/providers";
import type { PostData, GetPostsCountRequest } from "./shared/schemas/post";
import type {
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  AddPostsToPlaylistRequest,
  RemovePostsFromPlaylistRequest,
  GetPlaylistPostsRequest,
  ResolvePlaylistPostsRequest,
  ReorderPlaylistEntriesRequest,
} from "./shared/schemas/playlist";
import type { ExtendedStats } from "./shared/schemas/stats";

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
  isFavorited?: boolean;
  sinceTracking?: boolean;
  aiFilter?: "all" | "hide" | "only";
  mediaType?: "all" | "images" | "videos";
}

export interface IpcSettings {
  userId: string;
  hasApiKey: boolean;
  proxyUrl: string | null;
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
  isAdultVerified: boolean;
  tosAcceptedAt: number | null; // Timestamp in milliseconds (Date.getTime())
  downloadFolder: string | null; // Custom folder for downloads
  duplicateFileBehavior: "skip" | "overwrite";
  downloadFolderStructure: "flat" | "{artist_id}";
  theme: "system" | "light" | "dark";
  autoSyncOnStartup: boolean;
  syncIntervalMinutes: number;
  backupRetention: number;
}

export interface IpcApi extends IpcBridge {
  // App
  getAppVersion: () => Promise<string>;
  getDatabaseLocation: () => Promise<string>;
  getIconPath: (theme?: "light" | "dark") => Promise<string>;

  // Settings
  getSettings: () => Promise<IpcSettings | undefined>;
  saveSettings: (creds: {
    userId?: string;
    apiKey?: string;
    proxyUrl?: string | null;
    autoSyncOnStartup?: boolean;
    syncIntervalMinutes?: number;
    backupRetention?: number;
  }) => Promise<boolean>;
  saveTheme: (theme: "system" | "light" | "dark") => Promise<boolean>;
  saveDownloadFolder: (path: string | null) => Promise<boolean>;
  confirmLegal: () => Promise<IpcSettings>;
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
    artistId?: number;
    page?: number;
    sortOrder?: "asc" | "desc";
    filters?: PostQueryFilters;
    isRandom?: boolean;
  }) => Promise<Post[]>;
  getArtistPostsCount: (params: GetPostsCountRequest) => Promise<number>;
  getStats: () => Promise<ExtendedStats>;
  getExtendedStats: () => Promise<ExtendedStats>;

  togglePostViewed: (postId: number) => Promise<boolean>;
  markAllPostsAsViewed: () => Promise<{ updatedCount: number }>;
  getUpdatesUnreadCount: () => Promise<number>;
  markAllUpdatesSeen: () => Promise<boolean>;

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

  markPostAsViewed: (postId: number, postData?: PostData) => Promise<boolean>;

  togglePostFavorite: (postId: number, postData?: PostData) => Promise<boolean>;

  shadowInsertPost: (request: ShadowInsertRequest) => Promise<Post>;

  searchRemoteTags: (query: string, provider?: ProviderId) => Promise<SearchResults[]>;

  searchBooru: (params: { tags: string[]; page: number }) => Promise<Post[]>;

  resolveCharacterTags: (tags: string[]) => Promise<string[]>;
  resolveCopyrightTags: (tags: string[]) => Promise<string[]>;
  resolveTagsByType: (tags: string[], type: number) => Promise<string[]>;

  createBackup: () => Promise<BackupResponse>;
  restoreBackup: () => Promise<BackupResponse>;
  checkDatabaseIntegrity: () => Promise<{ ok: boolean; details: string }>;
  writeToClipboard: (text: string) => Promise<boolean>;

  verifyCredentials: (providerId?: ProviderId) => Promise<boolean>;

  // Playlists
  createPlaylist: (data: CreatePlaylistRequest) => Promise<Playlist>;
  getPlaylists: () => Promise<Playlist[]>;
  getPlaylist: (playlistId: number) => Promise<Playlist | null>;
  updatePlaylist: (playlistId: number, data: UpdatePlaylistRequest) => Promise<Playlist>;
  deletePlaylist: (playlistId: number) => Promise<boolean>;
  addPostsToPlaylist: (data: AddPostsToPlaylistRequest) => Promise<number>;
  removePostsFromPlaylist: (data: RemovePostsFromPlaylistRequest) => Promise<number>;
  reorderPlaylistEntries: (params: ReorderPlaylistEntriesRequest) => Promise<void>;
  getPlaylistPosts: (params: GetPlaylistPostsRequest) => Promise<Post[]>;
  resolvePlaylistPosts: (params: ResolvePlaylistPostsRequest) => Promise<Post[]>;
  getPlaylistsContainingPost: (postId: number) => Promise<number[]>;
  exportPlaylist: (playlistId: number) => Promise<{ success: boolean; path?: string; error?: string }>;
  importPlaylist: () => Promise<{ success: boolean; playlistId?: number; error?: string }>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
