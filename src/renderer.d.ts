import type { Artist, Post, Playlist } from "./main/db/schema";
import {
  IpcBridge,
  UpdateStatusCallback,
  UpdateProgressCallback,
  AddArtistPayload,
} from "./main/bridge";
import type { PostData } from "./shared/schemas/post";
import type { SearchResults, ProviderId } from "./main/providers";
import type {
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  AddPostsToPlaylistRequest,
  RemovePostsFromPlaylistRequest,
  GetPlaylistPostsRequest,
  ResolvePlaylistPostsRequest,
} from "./shared/schemas/playlist";

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
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
  isAdultVerified: boolean;
  tosAcceptedAt: number | null; // Timestamp in milliseconds (Date.getTime())
}

export interface IpcApi extends IpcBridge {
  // App
  getAppVersion: () => Promise<string>;

  // Settings
  getSettings: () => Promise<IpcSettings | undefined>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;
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
    filters?: PostQueryFilters;
    isRandom?: boolean;
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

  markPostAsViewed: (postId: number, postData?: PostData) => Promise<boolean>;

  togglePostFavorite: (postId: number, postData?: PostData) => Promise<boolean>;

  shadowInsertPost: (postData: PostData) => Promise<number>;

  searchRemoteTags: (query: string, provider?: ProviderId) => Promise<SearchResults[]>;

  searchBooru: (params: { tags: string[]; page: number }) => Promise<Post[]>;

  resolveCharacterTags: (tags: string[]) => Promise<string[]>;
  resolveCopyrightTags: (tags: string[]) => Promise<string[]>;
  resolveTagsByType: (tags: string[], type: number) => Promise<string[]>;

  createBackup: () => Promise<BackupResponse>;
  restoreBackup: () => Promise<BackupResponse>;
  writeToClipboard: (text: string) => Promise<boolean>;

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
  getPlaylistsContainingPost: (postId: number) => Promise<number[]>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
