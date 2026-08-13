# API Guide (IPC usage & narrative)

> **Note:** Machine-readable IPC channel tables are generated into [`api.md`](./api.md) via `npm run docs:api`. Do not hand-edit that file. This guide keeps usage patterns, examples, and security narrative. Optional per-channel notes: [`api-notes/`](./api-notes/).

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [IPC Bridge Interface](#ipc-bridge-interface)
- [API Methods](#api-methods)
- [Playlists IPC Methods](#playlists-ipc-methods)
- [Event Listeners](#event-listeners)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Implementation Details](#implementation-details)
- [API Evolution Notes](#api-evolution-notes)
- [External API Integration](#external-api-integration)

---

## Overview

This document is a maintainer-focused reference for the IPC (Inter-Process Communication) API between the Electron Main Process and Renderer Process. All communication is strictly typed using TypeScript interfaces and follows security best practices.

**📖 Related Documentation:**

- [User Guide](./user-guide.md) - End-user behavior and UI-level workflows
- [Architecture Documentation](./architecture.md) - System architecture and IPC design
- [Database Documentation](./database.md) - Database operations and schema
- [Glossary](./glossary.md) - Key terms (IPC, Main Process, Renderer Process)

---

## 🚀 How to Use This API

This section provides practical guidance on using the IPC API in real-world scenarios.

### Basic Usage Pattern

All IPC methods are accessed via `window.api` in the Renderer process. They return Promises and should be used with async/await or Promise chains.

```typescript
// Basic pattern
const result = await window.api.someMethod(params);
```

### Integration with React Query

The recommended way to use IPC methods in React components is with **TanStack Query (React Query)**. This provides automatic caching, loading states, error handling, and cache invalidation.

**Example: Fetching data:**

```typescript
import { useQuery } from "@tanstack/react-query";
import type { Artist } from "@shared/types/db";

const { data, isLoading, error } = useQuery<Artist[]>({
  queryKey: ["artists"],
  queryFn: () => window.api.getTrackedArtists(),
});
```

**Example: Mutations (create/update/delete):**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Artist, NewArtist } from "@shared/types/db";

const queryClient = useQueryClient();

const mutation = useMutation<Artist | undefined, Error, NewArtist>({
  mutationFn: (artistData: NewArtist) => window.api.addArtist(artistData),
  onSuccess: () => {
    // Invalidate cache to refresh the list
    queryClient.invalidateQueries({ queryKey: ["artists"] });
  },
});
```

### Common Patterns

#### Pattern 1: Loading Initial Data

**Scenario:** Component needs to load data when it mounts.

```typescript
import type { Artist } from "@shared/types/db";

const MyComponent = () => {
  const { data, isLoading } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return <div>{/* Render data with full type safety */}</div>;
};
```

#### Pattern 2: Infinite Scroll

**Scenario:** Load paginated data with infinite scroll.

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Post } from "@shared/types/db";

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery<Post[]>({
  queryKey: ["posts", artistId],
  queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
    window.api.getArtistPosts({ artistId, page: pageParam }),
  getNextPageParam: (lastPage: Post[], allPages: Post[][]) =>
    lastPage.length === 50 ? allPages.length + 1 : undefined,
  initialPageParam: 1,
});

const allPosts: Post[] = data?.pages.flatMap((page: Post[]) => page) || [];
```

#### Pattern 2b: Browse remote search (offset + cursor)

**Scenario:** Infinite scroll on the Browse page against the live booru API (`searchBooru`). Rule34 offset pagination is capped at four pages; deeper scroll uses cursor pagination via `beforePostId` / `nextBeforePostId`.

Browse **Favorites** / **Subscriptions** do not use this remote helper: they call `getArtistPosts` with `isFavorited` / `sinceTracking` and pass `aiFilter` / `mediaType` / `sortOrder` into SQL so filters apply before `LIMIT`/`OFFSET`. The React Query key is `buildBrowseSearchQueryKey({ tags, source, aiFilter, mediaType, sortOrder })` (chip tags + `aiFilter`; injected AI tokens are request-only).

On **Source: All** with provider **Rule34**, Browse appends AI filter tags to the `searchBooru` request via `buildRemoteBooruTagListForIpc` (`hide` → exclude tokens; `only` → OR-group). Conflict with the user's own AI chips skips injection and keeps worker AI filtering. **Gelbooru** does not inject (worker-only) until separately verified.

Prefer `useGalleryInfiniteScroll` + `getSearchBrowseNextPageParam` (see `src/renderer/components/pages/Browse.tsx`) instead of hand-rolling page numbers:

```typescript
import { getSearchBrowseNextPageParam } from "@/renderer/utils/react-query-cache";
import type { BrowseSearchPageParam } from "@/shared/schemas/search";

// pageParam: number (pages 1–4) | { beforePostId: number } (page 5+)
getNextPageParam: (lastPage, allPages) =>
  getSearchBrowseNextPageParam(lastPage, allPages, 50);
```

Pagination decisions use **`apiFetchedCount`** (raw API batch size before blacklist), not filtered `posts.length`.

#### Pattern 3: Event Listeners

**Scenario:** Listen to real-time events (sync progress, downloads, etc.).

```typescript
useEffect(() => {
  const unsubscribe = window.api.onSyncProgress((message) => {
    console.log("Sync:", message);
    // Update UI with progress
  });

  return () => unsubscribe(); // Cleanup on unmount
}, []);
```

#### Pattern 4: Error Handling

**Scenario:** Handle errors gracefully with user feedback.

```typescript
import { useMutation } from "@tanstack/react-query";
import type { Artist, NewArtist } from "@shared/types/db";

const mutation = useMutation<Artist | undefined, Error, NewArtist>({
  mutationFn: (data: NewArtist) => window.api.addArtist(data),
  onError: (error: Error) => {
    log.error("Operation failed:", error);
    // Show error toast/notification to user
  },
  onSuccess: (data: Artist | undefined) => {
    // Show success message
    // data contains the created artist with full type safety
  },
});
```

### When to Use Which Method

- **Reading data:** Use `useQuery` with appropriate `queryKey`
- **Creating/updating/deleting:** Use `useMutation` with cache invalidation
- **Real-time updates:** Use event listeners (`onSyncProgress`, `onDownloadProgress`, etc.)
- **One-time operations:** Use direct `await window.api.method()` calls

### Type Safety

All IPC methods are fully typed. TypeScript will provide autocomplete and type checking:

```typescript
// TypeScript knows the return type
const artists: Artist[] = await window.api.getTrackedArtists();

// TypeScript validates parameters
await window.api.addArtist({
  name: "artist", // ✅ Valid
  tag: "tag",
  // ❌ TypeScript error if missing required fields
});
```

---

## Architecture

The application uses Electron's IPC (Inter-Process Communication) with Context Isolation enabled. The Renderer process cannot directly access Node.js APIs. Instead, it communicates with the Main process through a secure bridge defined in `src/main/bridge.ts`.

**IPC Architecture:**

- **Controller-based:** All IPC handlers are organized in controllers that extend `BaseController`
- **Dependency Injection:** Services are registered in DI Container and resolved via tokens
- **Type Safety:** All IPC communication is strictly typed using TypeScript interfaces
- **Input Validation:** All inputs are validated using Zod schemas in `BaseController`
- **Error Handling:** Centralized error handling via `BaseController`

## IPC Bridge Interface

The IPC bridge is exposed to the Renderer process via `window.api`. All methods return Promises and are fully typed.

### Type Definitions

```typescript
interface IpcBridge {
  // App
  getAppVersion: () => Promise<string>;
  writeToClipboard: (text: string) => Promise<boolean>;
  verifyCredentials: () => Promise<boolean>;
  logout: () => Promise<void>;

  // Settings
  getSettings: () => Promise<IpcSettings | null>;
  saveSettings: (creds: {
    userId?: string;
    apiKey?: string;
    proxyUrl?: string | null;
    autoSyncOnStartup?: boolean;
    autoSyncOnArtistAdd?: boolean;
    syncIntervalMinutes?: number;
  }) => Promise<boolean>;
  confirmLegal: () => Promise<IpcSettings>;

  // Artists
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: NewArtist) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<void>;
  searchArtists: (query: string) => Promise<{ id: number; label: string }[]>;

  // Posts
  getArtistPosts: (params: {
    artistId: number;
    page?: number;
  }) => Promise<Post[]>;
  getArtistPostsCount: (params: GetPostsCountRequest) => Promise<number>;
  getStats: () => Promise<ExtendedStats>; // backward-compatible alias
  getExtendedStats: () => Promise<ExtendedStats>;
  markPostAsViewed: (postId: number, postData?: PostData) => Promise<boolean>;
  togglePostViewed: (postId: number) => Promise<boolean>;
  togglePostFavorite: (postId: number, postData?: PostData) => Promise<boolean>;
  getUpdatesUnreadCount: () => Promise<number>;
  markAllUpdatesSeen: () => Promise<boolean>;
  resetPostCache: (postId: number) => Promise<boolean>;

  // External
  openExternal: (url: string) => Promise<void>;
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
  }) => Promise<{
    posts: Post[];
    hasMore: boolean;
    apiFetchedCount?: number;
    nextBeforePostId?: number;
  }>;
  resolveTags: (tags: string[]) => Promise<string[]>;
  resolveCharacterTags: (tags: string[]) => Promise<string[]>;
  resolveCopyrightTags: (tags: string[]) => Promise<string[]>;
  resolveTagsByType: (tags: string[], type: number) => Promise<string[]>;
  getBlacklistedTags: () => Promise<string[]>;
  addTagToBlacklist: (tag: string) => Promise<void>;
  removeTagFromBlacklist: (tag: string) => Promise<void>;

  // Sync
  syncAll: () => Promise<boolean>;
  repairArtist: (
    artistId: number
  ) => Promise<{ success: boolean; error?: string }>;

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

  // Backup
  createBackup: () => Promise<BackupResponse>;
  restoreBackup: () => Promise<BackupResponse>;
  getVacuumStatus: () => Promise<{
    lastVacuumAt: number | null;
    lastRunStatus: "never" | "success" | "error";
    lastError: string | null;
    isRunning: boolean;
  }>;
  runVacuum: () => Promise<{
    success: boolean;
    startedAt: number;
    finishedAt?: number;
    durationMs?: number;
    error?: string;
  }>;
  getVacuumSchedule: () => Promise<"manual" | "weekly" | "monthly">;
  setVacuumSchedule: (args: {
    schedule: "manual" | "weekly" | "monthly";
  }) => Promise<boolean>;

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
  getPlaylistsContainingPost: (postId: number, rule34PostId?: number) => Promise<number[]>;
  exportPlaylist: (playlistId: number) => Promise<{ success: boolean; path?: string; error?: string }>;
  importPlaylist: () => Promise<{ success: boolean; playlistId?: number; error?: string }>;

  // Video (localhost proxy; see architecture docs for cache and host allowlist)
  getVideoProxyUrl: (fileUrl: string) => Promise<string>;

  // Updater
  checkForUpdates: () => Promise<void>;
  quitAndInstall: () => Promise<void>;
  startDownload: () => Promise<void>;

  // Event Listeners
  onUpdateStatus: (callback: UpdateStatusCallback) => () => void;
  onUpdateProgress: (callback: UpdateProgressCallback) => () => void;
  onSyncStart: (callback: () => void) => () => void;
  onSyncEnd: (callback: () => void) => () => void;
  onSyncProgress: (callback: (message: string) => void) => () => void;
  onSyncError: (callback: SyncErrorCallback) => () => void;
  onSyncArtist: (callback: () => void) => () => void;
  onRepairStart: (callback: (artistName: string) => void) => () => void;
  onRepairEnd: (callback: () => void) => () => void;
}
```

## API Methods

### `getAppVersion()`

Returns the current application version.

**When to use:** Display the app version in About dialog, update notifications, or debug information.

**Typical scenario:** Show version number in Settings page or About dialog.

**Returns:** `Promise<string>`

**Example:**

```typescript
const version = await window.api.getAppVersion();
console.log(version); // "1.0.0"
```

**Real-world usage in React component:**

```typescript
// In Settings or About component
const { data: version } = useQuery<string>({
  queryKey: ["app-version"],
  queryFn: () => window.api.getAppVersion(),
});
```

### `wipeAllData()`

Deletes all application data under `userData` (`.rdcache`), then exits the process.

**IPC Channel:** `system:wipe-all-data`  
**Args:** none (`z.tuple([])`)  
**Order:** `closeDatabase()` → stop video proxy → delete children of `userData` (paths validated with `isResolvedPathWithinBase`) → `app.exit(0)`.

Does **not** delete the user's media download folder outside `.rdcache`. On partial delete failure, throws a user-facing error and does not exit.

**Returns:** `Promise<void>` (normally does not resolve — process exits)

```typescript
await window.api.wipeAllData();
```

---

### `getVideoProxyUrl(fileUrl: string)`

Returns a `http://127.0.0.1` URL served by the main-process `VideoProxyServer` that forwards Range requests to the original HTTPS CDN and writes complete responses under `{userData}/video-cache/` via **atomic tmp + rename** (incomplete/aborted downloads never become cache hits). Cache size is bounded by `VIDEO_CACHE_MAX_BYTES` with eviction from the maintenance scheduler and a deferred sweep after proxy `start()`. The renderer should use the returned value as the `<video src>` (with a temporary fallback to the direct CDN URL while this promise resolves). Input is validated with `z.string().url()`. The proxy allowlist is the exact media-CDN hostnames from `provider.cdnDomains` (via `getAllProviderCdnDomains()`); API/apex hosts remain in CSP via `getAllProviderDomains()` but are rejected with HTTP 400 if passed through the proxy.

**Returns:** `Promise<string>`

**IPC Channel:** `video-proxy:get-url`

---

### `getTrackedArtists()`

Retrieves tracked artists from the local database (newest activity first).

**Limit:** Returns at most `MAX_TRACKED_ARTISTS` (5000). If the user has more subscriptions, the list is truncated and Main logs a warning — UI should not assume a complete unbounded list.

**When to use:** Load the list of tracked artists for display in the Tracked page, sidebar, or artist selection dropdown.

**Typical scenario:** User opens the Tracked page → component fetches all artists → displays them in a grid/list.

**Why this method:** Provides a complete list of all artists the user is tracking. Use this for initial page load or after adding/removing artists.

**Returns:** `Promise<Artist[]>`

**Example:**

```typescript
const artists = await window.api.getTrackedArtists();
artists.forEach((artist) => {
  console.log(artist.name, artist.tag, artist.apiEndpoint);
});
```

**Real-world usage in React component:**

```typescript
// In Tracked.tsx component
import type { Artist } from "@shared/types/db";

const {
  data: artists,
  isLoading,
  error,
} = useQuery<Artist[]>({
  queryKey: ["artists"],
  queryFn: () => window.api.getTrackedArtists(),
});

if (isLoading) return <div>Loading artists...</div>;
if (error) return <div>Error loading artists</div>;

return (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {artists?.map((artist) => (
      <ArtistListRow key={artist.id} artist={artist} />
    ))}
  </div>
);
```

**IPC Channel:** `db:get-artists`

**Artist Type:**

```typescript
type Artist = {
  id: number;
  name: string;
  tag: string;
  type: "tag" | "uploader";
  apiEndpoint: string;
  lastPostId: number;
  newPostsCount: number;
  lastSyncIncomplete: boolean;
  lastChecked: number | null;
  createdAt: number;
};
```

**Post Type:**

```typescript
type Post = {
  id: number;
  artistId: number;
  fileUrl: string;
  previewUrl: string | null;
  title: string;
  rating: string | null; // "s", "q", or "e"
  tags: string | null;
  publishedAt: number;
  createdAt: number;
  isViewed: boolean;
};
```

**IpcSettings Type (Safe IPC Format):**

```typescript
// ⚠️ SECURITY: This is the ONLY format Renderer receives
// API Key is NEVER included in this type
type IpcSettings = {
  userId: string;
  hasApiKey: boolean; // ← Boolean flag, NOT the actual API key
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
  isAdultVerified: boolean;
  tosAcceptedAt: number | null; // Timestamp in milliseconds
};
```

**ExtendedStats Type:**

```typescript
type ExtendedStats = {
  totalArtists: number;
  totalPosts: number;
  totalFavorites: number;
  totalUnviewed: number;
  ratingCounts: { safe: number; questionable: number; explicit: number };
  mediaCounts: { images: number; videos: number };
  providerCounts: { rule34: number; gelbooru: number };
  topArtists: Array<{ name: string; postCount: number }>;
  topTags: Array<{ tag: string; count: number }>;
  postsTimeline: Array<{ month: string; count: number }>;
  dbSizeBytes: number;
};
```

**Note:** The actual database `Settings` type contains `encryptedApiKey`, but this is **never** sent to Renderer. The `IpcSettings` type is the safe IPC contract.

---

### `getSettings()`

Retrieves stored settings. **⚠️ SECURITY: API Key is NEVER returned to Renderer process.**

**When to use:** Check if user has completed onboarding, display current user ID in Settings page, or verify authentication status.

**Typical scenario:** App starts → check if settings exist → show onboarding if missing, or main app if present.

**Why this method:** The Renderer process **NEVER** receives the API key, even in decrypted form. This method returns only safe metadata:

- `userId` - User ID (safe to expose)
- `hasApiKey` - Boolean flag indicating if API key is configured (safe to expose)
- Other settings flags (safe mode, adult confirmation, etc.)

**Security Contract:**

- ✅ **Renderer receives:** `userId`, `hasApiKey` (boolean), other non-sensitive settings
- ❌ **Renderer NEVER receives:** `apiKey` (encrypted or decrypted)
- 🔒 **API Key lifecycle:**
  - Entered in Renderer → Sent to Main via `saveSettings()` → Encrypted in Main → Stored encrypted
  - Never decrypted for Renderer
  - Only decrypted in Main Process when needed for API calls (in SyncService)

**Returns:** `Promise<IpcSettings | null>`

**IpcSettings Type:**

```typescript
type IpcSettings = {
  userId: string;
  hasApiKey: boolean; // ← Boolean flag, NOT the actual key
  proxyUrl: string | null;
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
  isAdultVerified: boolean;
  tosAcceptedAt: number | null;
  downloadFolder: string | null;
  duplicateFileBehavior: "skip" | "overwrite";
  downloadFolderStructure: "flat" | "{artist_id}";
  theme: "system" | "light" | "dark";
  autoSyncOnStartup: boolean;
  autoSyncOnArtistAdd: boolean;
  syncIntervalMinutes: number;
  backupRetention: number;
};
```

**Example:**

```typescript
import log from "electron-log/renderer";

const settings = await window.api.getSettings();
if (settings) {
  log.info("[Settings] Loaded", {
    userId: settings.userId,
    hasApiKey: settings.hasApiKey,
  });
  // ❌ settings.apiKey does NOT exist - API key is never sent to Renderer
}
```

**Real-world usage in React component:**

```typescript
// In App.tsx - check if user needs onboarding
import type { IpcSettings } from "../../../shared/schemas/settings";

const { data: settings } = useQuery<IpcSettings | null>({
  queryKey: ["settings"],
  queryFn: () => window.api.getSettings(),
});

if (!settings || !settings.hasApiKey) {
  // No settings or no API key configured - show onboarding
  return (
    <Onboarding
      onComplete={() => queryClient.invalidateQueries(["settings"])}
    />
  );
}

// Settings exist and API key is configured - show main app
return <MainApp />;
```

**IPC Channel:** `app:get-settings-status`

---

### `saveSettings(creds)`

Saves settings to the database. Supports partial updates (credentials, sync options, proxy URL). API key is encrypted at rest using Electron's `safeStorage` API before storage.

**⚠️ SECURITY CONTRACT:**

- **Input:** API key is sent from Renderer in **plaintext** (unavoidable during onboarding)
- **Processing:** API key is **immediately encrypted** in Main Process using `safeStorage` API
- **Storage:** Only **encrypted** key is stored in database
- **Output:** API key is **NEVER** returned to Renderer (see `getSettings()` which returns `hasApiKey: boolean`)

**When to use:** During onboarding flow when user enters their credentials, or when updating credentials in Settings.

**Typical scenario:** User pastes credentials from Rule34.xxx account page → form validates → calls `saveSettings` → credentials encrypted and stored → user proceeds to main app.

**Why this method:** Security is critical. The API key is encrypted in Main Process using platform keychain (Windows Credential Manager, macOS Keychain, Linux libsecret) before storage. The encrypted key is never exposed to Renderer process.

**Security Flow:**

1. User enters API key in Renderer (plaintext, unavoidable)
2. `saveSettings()` called → API key sent via IPC to Main Process
3. Main Process encrypts using `safeStorage.encryptString()`
4. Encrypted key stored in database
5. **API key is NEVER returned to Renderer** - `getSettings()` only returns `hasApiKey: boolean`

**Parameters:**

- `creds.userId?: string` - Rule34.xxx User ID
- `creds.apiKey?: string` - Rule34.xxx API Key (encrypted before storage)
- `creds.proxyUrl?: string | null` - Optional outbound proxy URL
- `creds.autoSyncOnStartup?: boolean` - Auto-sync startup toggle
- `creds.autoSyncOnArtistAdd?: boolean` - Auto-sync newly added artists (default off)
- `creds.syncIntervalMinutes?: number` - Periodic sync interval in minutes
- `creds.backupRetention?: number` - Number of backups to keep (1..20)

**Returns:** `Promise<boolean>`

**Throws:**

- `Error("Data is required")` - If userId or apiKey is missing

**Example:**

```typescript
import log from "electron-log/renderer";

try {
  await window.api.saveSettings({
    userId: "123456",
    apiKey: "your-api-key-here",
  });
  log.info("[Settings] Credentials saved");
} catch (error) {
  log.error("[Settings] Failed to save settings:", error);
}
```

**Real-world usage in React component:**

```typescript
// In SettingsAccountTab (AccountGate / Settings → Account)
import type { Settings } from "@shared/types/db";

const onSubmit = async (data: CredsFormValues) => {
  try {
    const success: boolean = await window.api.saveSettings({
      userId: data.userId,
      apiKey: data.apiKey,
    });
    // Credentials are now encrypted and stored
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown save error.";
    log.error(`[Settings] Authorization error: ${message}`);
    // Show error to user
  }
};
```

**Security Note:** The API key is encrypted using Electron's `safeStorage` API in the Main Process. Even if the database file is stolen, the API key cannot be decrypted without access to the platform keychain.

**IPC Channel:** `app:save-settings`

---

### `confirmLegal()`

Confirms legal age verification and terms of service acceptance. Updates the `isAdultVerified` and `tosAcceptedAt` fields in settings.

**When to use:** During onboarding flow when user confirms they are 18+ and accepts terms of service.

**Typical scenario:** User sees age gate dialog → clicks "I am 18+" → `confirmLegal` is called → settings updated with verification timestamp → user proceeds to main app.

**Why this method:** Separates legal confirmation from credential saving. This ensures legal compliance is tracked separately from API credentials.

**Returns:** `Promise<IpcSettings>`

**Example:**

```typescript
const settings = await window.api.confirmLegal();
if (settings.isAdultVerified) {
  console.log("Legal confirmation completed");
}
```

**Real-world usage in React component:**

```typescript
// In AgeGate.tsx component
const handleConfirm = async () => {
  try {
    const settings = await window.api.confirmLegal();
    onComplete(settings);
  } catch (error) {
    log.error("Failed to confirm legal:", error);
  }
};
```

**IPC Channel:** `settings:confirm-legal`

---

### `addArtist(artist: NewArtist)`

Adds a new artist to track. Validates the input before insertion.

**When to use:** User wants to start tracking a new artist/tag. Called from the "Add Artist" modal or form.

**Typical scenario:** User clicks "Add Artist" → enters name and tag → selects type (tag/uploader) → clicks "Add" → `addArtist` is called → artist saved to database → UI refreshes to show new artist.

**Why this method:** Validates input (name, tag, API endpoint) before saving. Automatically normalizes tags (strips metadata like "(123)"). Returns the saved artist with generated ID for immediate UI update.

**Parameters:**

- `artist: NewArtist` - Artist data to add

**Returns:** `Promise<Artist | undefined>`

**Throws:**

- `Error("Username is required")` - If name is empty or whitespace
- `Error("Invalid API Endpoint URL")` - If apiEndpoint is not a valid URL

**Example:**

```typescript
const newArtist: NewArtist = {
  name: "example_artist",
  tag: "tag_name",
  type: "tag", // or "uploader" or "query"
  provider: "rule34", // or "gelbooru"
  apiEndpoint: "https://api.rule34.xxx",
};

try {
  const savedArtist = await window.api.addArtist(newArtist);
  if (savedArtist) {
    console.log("Artist added:", savedArtist.id);
  }
} catch (error) {
  console.error("Failed to add artist:", error);
}
```

**Real-world usage in React component:**

```typescript
// In Tracked.tsx component
import type { Artist, NewArtist } from "@shared/types/db";
import type { ProviderId } from "@shared/constants";

const handleAddArtist = async (
  name: string,
  tag: string,
  type: "tag" | "uploader" | "query",
  provider: ProviderId
) => {
  try {
    const newArtist: NewArtist = {
      name,
      tag,
      type,
      provider,
      apiEndpoint: getDefaultApiEndpoint(provider),
    };

    const savedArtist: Artist | undefined = await window.api.addArtist(
      newArtist
    );

    if (savedArtist) {
      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      setIsAddModalOpen(false);
    }
  } catch (err: unknown) {
    log.error("[Tracked] Failed to add artist:", err);
    // Show error notification to user
  }
};
```

**IPC Channel:** `db:add-artist`

**NewArtist Type:**

```typescript
type NewArtist = {
  name: string;
  tag: string;
  type?: "tag" | "uploader"; // Defaults to "tag"
  apiEndpoint: string;
  lastPostId?: number; // Defaults to 0
  newPostsCount?: number; // Defaults to 0
};
```

---

### `deleteArtist(id: number)`

Removes an artist from tracking. Also deletes all associated posts (cascade delete).

**Parameters:**

- `id: number` - Artist ID to delete

**Returns:** `Promise<void>`

**Example:**

```typescript
try {
  await window.api.deleteArtist(123);
  console.log("Artist deleted");
} catch (error) {
  console.error("Failed to delete artist:", error);
}
```

**IPC Channel:** `db:delete-artist`

---

### `getArtistPosts(params: { artistId: number; page?: number })`

Retrieves posts for a specific artist with pagination.

**When to use:** Display posts in an artist's gallery view. Supports infinite scroll or traditional pagination.

**Typical scenario:** User clicks on an artist card → navigates to artist gallery → component fetches first page of posts → user scrolls down → fetches next page automatically.

**Why this method:** Efficiently loads posts in chunks (50 per page) to avoid loading thousands of posts at once. Works perfectly with React Query's `useInfiniteQuery` for infinite scroll.

**Parameters:**

- `params.artistId: number` - Artist ID
- `params.page?: number` - Page number (defaults to 1)

**Returns:** `Promise<Post[]>`

**Example:**

```typescript
const posts = await window.api.getArtistPosts({ artistId: 123, page: 1 });
console.log(`Found ${posts.length} posts`);
```

**Real-world usage in React component with infinite scroll:**

```typescript
// In ArtistGallery.tsx component
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Post } from "@shared/types/db";

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery<Post[]>({
    queryKey: ["posts", artist.id],
    queryFn: async ({
      pageParam = 1,
    }: {
      pageParam: number;
    }): Promise<Post[]> => {
      return await window.api.getArtistPosts({
        artistId: artist.id,
        page: pageParam,
      });
    },
    getNextPageParam: (
      lastPage: Post[],
      allPages: Post[][]
    ): number | undefined => {
      // If last page has 50 posts, there might be more
      return lastPage.length === 50 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

// Flatten all pages into single array with type safety
const allPosts: Post[] = useMemo(() => {
  return data?.pages.flatMap((page: Post[]) => page) || [];
}, [data]);

// Render posts with infinite scroll
return (
  <VirtuosoGrid
    data={allPosts}
    endReached={() => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }}
    // ... other props
  />
);
```

**IPC Channel:** `db:get-posts`

**Note:** Each page returns up to 50 posts (limit). Use pagination to retrieve more posts. Perfect for infinite scroll implementations.

---

### `openExternal(url: string)`

Opens a URL in the default external browser. Only allows rule34.xxx URLs for security.

**Parameters:**

- `url: string` - URL to open

**Returns:** `Promise<void>`

**Example:**

```typescript
await window.api.openExternal(
  "https://rule34.xxx/index.php?page=post&s=list&tags=tag_name"
);
```

**IPC Channel:** `app:open-external`

**Security:** Only HTTPS URLs from rule34.xxx domain are allowed.

---

### `syncAll()`

Initiates background synchronization of all tracked artists. Fetches new posts from Rule34.xxx API.

**Returns:** `Promise<boolean>`

**Example:**

```typescript
const success = await window.api.syncAll();
if (success) {
  console.log("Sync started");
}
```

**IPC Channel:** `db:sync-all`

**Note:** This is an asynchronous operation. The method returns immediately, and synchronization runs in the background. Use event listeners (`onSyncStart`, `onSyncEnd`, `onSyncProgress`, `onSyncError`, `onSyncArtist`, `onRepairStart`, `onRepairEnd`) to track progress. Check artist `newPostsCount` / `syncStatus` to see results.

---

### `repairArtist(artistId: number)`

Repairs/resynchronizes an artist by resetting their `lastPostId` to 0 and re-fetching initial pages. Useful for updating low-quality previews or fixing synchronization issues.

**Parameters:**

- `artistId: number` - Artist ID to repair

**Returns:** `Promise<{ success: boolean; error?: string }>`

**Example:**

```typescript
try {
  const success = await window.api.repairArtist(123);
  if (success) {
    console.log("Artist repair completed");
  }
} catch (error) {
  console.error("Failed to repair artist:", error);
}
```

**IPC Channel:** `sync:repair-artist`

**Note:** This operation may take time depending on the number of pages to sync. The artist's `lastPostId` is reset to 0, and initial pages are re-fetched.

---

### `checkForUpdates()`

Checks for available application updates from the GitHub releases.

**Returns:** `Promise<void>`

**Example:**

```typescript
await window.api.checkForUpdates();
```

**IPC Channel:** `app:check-for-updates`

**Note:** Use `onUpdateStatus` event listener to receive update status notifications.

---

### `startDownload()`

Starts downloading an available update. Must be called after `checkForUpdates()` indicates an update is available.

**Returns:** `Promise<void>`

**Example:**

```typescript
await window.api.startDownload();
```

**IPC Channel:** `app:start-download`

**Note:** Use `onUpdateProgress` event listener to track download progress.

---

### `quitAndInstall()`

Quits the application and installs the downloaded update. Should only be called after the update has been fully downloaded.

**Returns:** `Promise<void>`

**Example:**

```typescript
await window.api.quitAndInstall();
```

**IPC Channel:** `app:quit-and-install`

**Warning:** This will immediately quit the application. Ensure all user data is saved before calling.

---

### `markPostAsViewed(postId: number, postData?: PostData)`

Marks a post as viewed in the database. Optionally accepts post data for optimization.

**Parameters:**

- `postId: number` - Post ID to mark as viewed
- `postData?: PostData` - Optional post data to avoid additional database query

**Returns:** `Promise<boolean>`

**Example:**

```typescript
const success = await window.api.markPostAsViewed(123);
if (success) {
  console.log("Post marked as viewed");
}
```

**IPC Channel:** `db:mark-post-viewed`

---

### `getUpdatesUnreadCount()`

Returns the number of unread posts for the **Updates** sidebar badge.

**When to use:** Poll unread count in navigation UI (for example, via TanStack Query with periodic refetch).

**Returns:** `Promise<number>`

**Example:**

```typescript
const unreadCount = await window.api.getUpdatesUnreadCount();
if (unreadCount > 0) {
  log.info(`[Updates] Unread: ${unreadCount}`);
}
```

**IPC Channel:** `updates:getUnreadCount`

**Query semantics:** Reads `COUNT(*)` from `posts` where `is_viewed = 0`.

---

### `markAllUpdatesSeen()`

Marks all posts as seen when user explicitly opens the **Updates** page.

**When to use:** On Updates page mount, then invalidate unread-count query key to refresh sidebar badge.

**Returns:** `Promise<boolean>`

**Example:**

```typescript
await window.api.markAllUpdatesSeen();
await queryClient.invalidateQueries({ queryKey: ["updates", "unreadCount"] });
```

**IPC Channel:** `updates:markAllSeen`

**Important:** This method should be triggered by explicit user navigation to Updates, not by background sync.

---

### `searchArtists(query: string)`

Searches for artists in the local database by name or tag.

**Parameters:**

- `query: string` - Search query string

**Returns:** `Promise<{ id: number; label: string }[]>`

**Example:**

```typescript
const results = await window.api.searchArtists("artist");
results.forEach((result) => {
  console.log(result.id, result.label);
});
```

**IPC Channel:** `db:search-tags`

---

### `searchRemoteTags(query: string, provider?: ProviderId, artistOnly?: boolean)`

Searches for tags using booru autocomplete API (multi-provider support).

**Parameters:**

- `query: string` - Search query string (minimum 2 characters)
- `provider?: ProviderId` - Provider ID ("rule34" or "gelbooru"), defaults to "rule34"
- `artistOnly?: boolean` - When `true` (Add Artist modal), return artist tags only. Gelbooru filters `SearchResults.type === "artist"` (from autocomplete2 `category`). Rule34 autocomplete.php has no category field — second-pass resolves the top 5 results by post_count via `tag_metadata` / DAPI `s=tag` (`TAG_TYPES.ARTIST`, `user` throttle priority). A newer `artistOnly` call aborts the previous Main wave (throttle waiters leave the queue). Empty list if none match (no unfiltered fallback). Browse, blacklist, and playlist autocomplete omit this flag.

**Returns:** `Promise<SearchResults[]>`

**Example:**

```typescript
const results = await window.api.searchRemoteTags("wlop", "rule34", true);
results.forEach((result) => {
  console.log(result.id, result.label);
});
```

**IPC Channel:** `api:search-remote-tags`

**Note:** Requires at least 2 characters. Returns empty array if query is too short or API call fails. Supports multiple booru providers via provider pattern. Default `artistOnly=false` keeps general tag search unchanged.

---

### `searchBooru(params: { tags: string[]; page: number; isRandom?: boolean; limit?: number; beforePostId?: number })`

Searches for posts on the booru API using specified tags and page number.

**When to use:** Search for posts directly from the booru API without tracking an artist. Used in Browse page for direct search functionality.

**Typical scenario:** User enters tags in Browse page search → clicks search → `searchBooru` is called → posts fetched from API → displayed in gallery.

**Parameters:**

- `params.tags: string[]` - Array of tags to search for
- `params.page: number` - Page number for pagination (1-based). Ignored when `beforePostId` is set (cursor mode uses `pid=0`).
- `params.isRandom?: boolean` - Use pseudo-random page selection (default: `false`)
- `params.limit?: number` - Posts per page (default: `50`, max: `100`)
- `params.beforePostId?: number` - Rule34 cursor: append meta-tag `id:<N>` and fetch with `pid=0` for posts older than the offset cap (Browse uses this after four offset pages).

**Returns:** `Promise<{ posts: Post[]; hasMore: boolean; apiFetchedCount?: number; nextBeforePostId?: number }>` — `hasMore` and `apiFetchedCount` reflect the raw API page size before blacklist filtering. Pagination must use `apiFetchedCount`, not filtered `posts.length`. `nextBeforePostId` is the minimum post id in the raw API batch (cursor for the next page).

**Browse pagination (Rule34):**

| Phase | `pageParam` / IPC | API behavior |
| ----- | ----------------- | ------------ |
| Pages 1–4 | `page: 1` … `page: 4` | Normal offset (`pid` 0–3), 50 posts per page |
| Page 5+ | `beforePostId: N`, `page: 1` | Appends `id:<N>` to tags, `pid=0` |

Client helper: `getSearchBrowseNextPageParam()` in `src/renderer/utils/react-query-cache.ts`.

**Example (first page):**

```typescript
const { posts, hasMore, apiFetchedCount, nextBeforePostId } =
  await window.api.searchBooru({
    tags: ["blue_hair", "solo"],
    page: 1,
    limit: 50,
  });
console.log(
  `Visible ${posts.length}, API batch ${apiFetchedCount}, hasMore=${hasMore}, cursor=${nextBeforePostId}`
);
```

**Example (cursor page):**

```typescript
await window.api.searchBooru({
  tags: ["blue_hair", "solo"],
  page: 1,
  beforePostId: nextBeforePostId,
  limit: 50,
});
```

**IPC Channel:** `booru:search`

**Errors:** On provider failures `SearchController` calls `throwProviderSearchIpcError()` — an `Error` whose `message` is user-safe and whose enumerable fields match `ProviderSearchErrorPayload` (`name`, `code`, `providerKind`, optional `retryAfterMs`). **No** `stack`, `originalError`, or raw API body crosses IPC. Preload does not parse or reshape these errors.

Renderer flow:

1. React Query `queryFn` rejects with Electron’s wrapped invoke error.
2. `parseProviderSearchErrorPayload()` in `src/shared/utils/provider-search-ipc.ts` strips the IPC prefix, tolerates JSON bodies and `[object Object]` messages, and validates via `ProviderSearchErrorPayloadSchema`.
3. `BrowseErrorState` maps `providerKind` to title, icon, and actions (`auth` → **Open Settings**; others → **Retry** when applicable).

Only a successful `{ posts: [] }` shows the empty-state screen. Raw API bodies are logged in main only (truncated).

---

### `resolveTags(tags: string[])`

Resolves tags to their canonical form using the booru API. Returns artist tags (type=1) from the provided tag list.

**When to use:** When you need to identify which tags in a post are artist tags. Used in viewer to highlight artist names.

**Typical scenario:** User opens a post in viewer → component calls `resolveTags` with all post tags → receives list of artist tags → highlights artist names in UI.

**Parameters:**

- `tags: string[]` - Array of tags to resolve

**Returns:** `Promise<string[]>` - Array of resolved artist tag names

**Example:**

```typescript
const artistTags = await window.api.resolveTags(["tag1", "tag2", "tag3"]);
```

**IPC Channel:** `booru:resolve-tags`

**Main-process behavior (tag resolve storm mitigation):**

- Reads/writes persistent cache table `tag_metadata` before calling Rule34 tag DAPI.
- Missing tags are fetched one at a time via `name=` (not batched `names=`).
- All tag lookups share the same `ProviderThrottle` instance as `fetchPosts`.
- Concurrent IPC calls for the same tag share one in-flight promise (cross-call dedup).
- HTTP 429 is retried with `Retry-After` or exponential backoff; rate-limited / network failures are **unresolved** — not written to `tag_metadata` (must not be confused with `not_found`).
- Confirmed empty API responses (`not_found`) are persisted in `tag_metadata` with `status='not_found'` and `resolved_at` in **milliseconds** (`mode: "timestamp_ms"`, TTL `TAG_RESOLVE_NOT_FOUND_TTL_MS`, 7 days). Expired rows are cache-misses; maintenance DELETEs them via `deleteExpiredNotFoundTagMetadata`.


---

### `resolveCharacterTags(tags: string[])`

Resolves tags to their canonical form, returning only character tags (type=4).

**When to use:** When you need to identify which tags are character names. Similar to `resolveTags` but filters for character tags only.

**Parameters:**

- `tags: string[]` - Array of tags to resolve

**Returns:** `Promise<string[]>` - Array of resolved character tag names

**Example:**

```typescript
const characterTags = await window.api.resolveCharacterTags(["tag1", "tag2"]);
```

**IPC Channel:** `booru:resolve-character-tags`

---

### `resolveCopyrightTags(tags: string[])`

Resolves tags to their canonical form, returning only copyright tags (type=3).

**When to use:** When you need to identify which tags are copyright/series names.

**Parameters:**

- `tags: string[]` - Array of tags to resolve

**Returns:** `Promise<string[]>` - Array of resolved copyright tag names

**Example:**

```typescript
const copyrightTags = await window.api.resolveCopyrightTags(["tag1", "tag2"]);
```

**IPC Channel:** `booru:resolve-copyright-tags`

---

### `resolveTagsByType(tags: string[], type: number)`

Resolves tags to their canonical form, filtering by a specific tag type.

**When to use:** When you need tags of a specific type. More flexible than the specific resolve methods above.

**Parameters:**

- `tags: string[]` - Array of tags to resolve
- `type: number` - Tag type to filter by:
  - `0` - General
  - `1` - Artist
  - `3` - Copyright
  - `4` - Character
  - `5` - Meta

**Returns:** `Promise<string[]>` - Array of resolved tag names of the specified type

**Example:**

```typescript
// Get artist tags (type=1)
const artistTags = await window.api.resolveTagsByType(tags, 1);

// Get character tags (type=4)
const characterTags = await window.api.resolveTagsByType(tags, 4);
```

**IPC Channel:** `booru:resolve-tags-by-type`

---

### `createBackup()`

Creates a timestamped backup of the database.

**Returns:** `Promise<BackupResponse>`

**BackupResponse Type:**

```typescript
type BackupResponse = {
  success: boolean;
  path?: string;
  error?: string;
};
```

**Example:**

```typescript
const result = await window.api.createBackup();
if (result.success) {
  console.log(`Backup created at: ${result.path}`);
} else {
  console.error(`Backup failed: ${result.error}`);
}
```

**IPC Channel:** `db:create-backup`

**Note:** The backup file is created in the user data directory. The file explorer will open to show the backup location.
After each successful backup, old backup files are pruned and only the most recent `backupRetention` files are kept.

---

### `restoreBackup()`

Restores the database from a backup file. Opens a file dialog to select the backup file.

**Returns:** `Promise<BackupResponse>`

**Example:**

```typescript
const result = await window.api.restoreBackup();
if (result.success) {
  console.log("Backup restored successfully");
  // Application will restart automatically
} else if (result.error !== "Canceled by user") {
  console.error(`Restore failed: ${result.error}`);
}
```

**IPC Channel:** `db:restore-backup`

**Warning:** This will overwrite the current database. The application will restart automatically after restore. User confirmation is required before restore.

---

### `getBackupSchedule()`

Returns the current automatic backup schedule.

**Returns:** `Promise<"never" | "daily" | "weekly">`

**IPC Channel:** `backup:getSchedule`

---

### `setBackupSchedule(interval: "never" | "daily" | "weekly")`

Sets automatic backup schedule used by startup auto-backup check.

**Parameters:**

- `interval: "never" | "daily" | "weekly"`

**Returns:** `Promise<boolean>`

**IPC Channel:** `backup:setSchedule`

---

### `getVacuumStatus()`

Returns the current user-visible VACUUM telemetry from Settings state.

**Returns:**
`Promise<{ lastVacuumAt: number | null; lastRunStatus: "never" | "success" | "error"; lastError: string | null; isRunning: boolean }>`

**IPC Channel:** `maintenance:get-vacuum-status`

---

### `runVacuum()`

Runs SQLite `VACUUM;` in Main Process (blocking operation) and updates last-run metadata in `settings`.

**Returns:**
`Promise<{ success: boolean; startedAt: number; finishedAt?: number; durationMs?: number; error?: string }>`

**IPC Channel:** `maintenance:run-vacuum`

---

### `getVacuumSchedule()`

Returns the VACUUM schedule policy.

**Returns:** `Promise<"manual" | "weekly" | "monthly">`

**IPC Channel:** `maintenance:get-vacuum-schedule`

---

### `setVacuumSchedule(args: { schedule: "manual" | "weekly" | "monthly" })`

Sets the VACUUM schedule policy.

**Returns:** `Promise<boolean>`

**IPC Channel:** `maintenance:set-vacuum-schedule`

---

### `writeToClipboard(text: string)`

Writes text to the system clipboard.

**Parameters:**

- `text: string` - Text to copy to clipboard

**Returns:** `Promise<boolean>`

**Example:**

```typescript
await window.api.writeToClipboard("Copied text");
```

**IPC Channel:** `app:write-to-clipboard`

---

### `verifyCredentials()`

Verifies API credentials by making a test API call.

**Returns:** `Promise<boolean>`

**Example:**

```typescript
const isValid = await window.api.verifyCredentials();
if (isValid) {
  console.log("Credentials are valid");
} else {
  console.log("Credentials are invalid or expired");
}
```

**IPC Channel:** `app:verify-creds`

---

### `logout()`

Clears stored API credentials from the database.

**Returns:** `Promise<void>`

**Example:**

```typescript
await window.api.logout();
// User will be redirected to onboarding screen
```

**IPC Channel:** `app:logout`

---

### `getArtistPostsCount(params: GetPostsCountRequest)`

Gets the total count of posts for an artist (or all posts when `artistId` is omitted), optionally filtered.

**Parameters:**

- `params.artistId?: number` - Optional artist ID. If omitted, counts across posts in scope.
- `params.filters?: PostFilter` - Optional post filters.

**Returns:** `Promise<number>`

**Example:**

```typescript
const count = await window.api.getArtistPostsCount({ artistId: 123 });
console.log(`Artist has ${count} posts`);
```

**IPC Channel:** `db:get-posts-count`

---

### `getExtendedStats()`

Returns extended read-only statistics for the Statistics page (`/stats`).

**Returns:** `Promise<ExtendedStats>`

**Example:**

```typescript
const stats = await window.api.getExtendedStats();
console.log(stats.totalPosts, stats.ratingCounts.explicit, stats.dbSizeBytes);
```

**IPC Channel:** `stats:get-extended`

---

### `getStats()`

Backward-compatible alias for `getExtendedStats()`.

**Returns:** `Promise<ExtendedStats>`

**IPC Channel:** `db:get-stats`

---

### `togglePostViewed(postId: number)`

Toggles the viewed status of a post.

**Parameters:**

- `postId: number` - Post ID to toggle

**Returns:** `Promise<boolean>`

**Example:**

```typescript
const success = await window.api.togglePostViewed(123);
```

**IPC Channel:** `db:toggle-post-viewed`

---

### `togglePostFavorite(postId: number, postData?: PostData)`

Toggles the favorite status of a post. Optionally accepts post data for optimization.

**Parameters:**

- `postId: number` - Post ID to toggle
- `postData?: PostData` - Optional post data to avoid additional database query

**Returns:** `Promise<boolean>`

**Example:**

```typescript
const success = await window.api.togglePostFavorite(123);
if (success) {
  console.log("Post favorite status toggled");
}
```

**IPC Channel:** `db:toggle-post-favorite`

---

### `resetPostCache(postId: number)`

Resets the cache for a specific post (clears viewed/favorite status).

**Parameters:**

- `postId: number` - Post ID to reset

**Returns:** `Promise<boolean>`

**Example:**

```typescript
const success = await window.api.resetPostCache(123);
```

**IPC Channel:** `db:reset-post-cache`

---

### `downloadFile(url: string, filename: string)`

Downloads a file from a URL to the local file system. Opens a save dialog for the user to choose the download location.

**Parameters:**

- `url: string` - URL of the file to download
- `filename: string` - Suggested filename for the download

**Returns:** `Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>`

**Example:**

```typescript
const result = await window.api.downloadFile(
  "https://example.com/image.jpg",
  "image.jpg"
);
if (result.success && result.path) {
  console.log(`File downloaded to: ${result.path}`);
} else if (result.canceled) {
  console.log("Download canceled by user");
} else {
  console.error(`Download failed: ${result.error}`);
}
```

**IPC Channel:** `files:download`

**Note:** Downloads run in the Main Process with progress tracking via `onDownloadProgress` event.

---

### `openFileInFolder(path: string)`

Opens the file system folder containing the specified file and highlights the file.

**Parameters:**

- `path: string` - Full path to the file

**Returns:** `Promise<boolean>`

**Example:**

```typescript
const success = await window.api.openFileInFolder("/path/to/file.jpg");
```

**IPC Channel:** `files:open-folder`

---

## Playlists IPC Methods

Playlist APIs are handled by `PlaylistController` and use shared Zod schemas from `src/shared/schemas/playlist.ts`.

- `createPlaylist(data)` -> Create manual or smart playlist
- `getPlaylists()` / `getPlaylist(playlistId)` -> Read playlists
- `updatePlaylist(playlistId, data)` / `deletePlaylist(playlistId)` -> Update or delete playlist
- `addPostsToPlaylist(data)` / `removePostsFromPlaylist(data)` -> Manage manual playlist entries
- `reorderPlaylistEntries(params)` -> Persist drag-and-drop order for manual playlists
- `getPlaylistPosts(params)` -> Fetch static playlist posts with filters/sort
- `resolvePlaylistPosts(params)` -> Resolve static or smart playlist posts
- `getPlaylistsContainingPost(postId, rule34PostId?)` -> Check membership for local/external posts
- `exportPlaylist(playlistId)` / `importPlaylist()` -> JSON transfer via native file dialogs

### Smart Playlist Resolution Model

Smart playlists use a hybrid flow:

1. Build include/exclude tag conditions from `queryJson`
2. Query local cache (FTS5)
3. Query provider API (Rule34/Gelbooru)
4. Merge and deduplicate by `postId` (local entries have priority)

This gives fast local results while still surfacing posts not yet cached locally.

**Key channels:**

- `db:create-playlist`
- `db:get-playlists`
- `db:get-playlist`
- `db:update-playlist`
- `db:delete-playlist`
- `db:add-posts-to-playlist`
- `db:remove-posts-from-playlist`
- `db:reorder-playlist-entries`
- `db:get-playlist-posts`
- `db:resolve-playlist-posts`
- `db:get-playlists-containing-post`
- `db:export-playlist`
- `db:import-playlist`

---

### Event Listeners

The IPC bridge provides several event listeners for real-time updates:

#### `onUpdateStatus(callback: UpdateStatusCallback)`

Listens for update status changes.

**Callback Type:**

```typescript
type UpdateStatusCallback = (data: UpdateStatusData) => void;

type UpdateStatusData = {
  status: string; // "checking" | "available" | "not-available" | "downloaded" | "error"
  message?: string;
  version?: string; // Available when status is "available"
};
```

**Returns:** `() => void` - Unsubscribe function

**Example:**

```typescript
const unsubscribe = window.api.onUpdateStatus((data) => {
  if (data.status === "available") {
    console.log(`Update ${data.version} is available!`);
  }
});

// Later, to unsubscribe:
unsubscribe();
```

**IPC Channel:** `updater:status`

---

#### `onUpdateProgress(callback: UpdateProgressCallback)`

Listens for download progress updates.

**Callback Type:**

```typescript
type UpdateProgressCallback = (percent: number) => void;
```

**Returns:** `() => void` - Unsubscribe function

**Example:**

```typescript
const unsubscribe = window.api.onUpdateProgress((percent) => {
  console.log(`Download progress: ${percent}%`);
});

// Later, to unsubscribe:
unsubscribe();
```

**IPC Channel:** `updater:progress`

---

#### `onSyncStart(callback: () => void)`

Listens for sync start events.

**Returns:** `() => void` - Unsubscribe function

**Example:**

```typescript
const unsubscribe = window.api.onSyncStart(() => {
  console.log("Sync started");
});
```

**IPC Channel:** `sync:start`

---

#### `onSyncEnd(callback: () => void)`

Listens for sync completion events.

**Returns:** `() => void` - Unsubscribe function

**Example:**

```typescript
const unsubscribe = window.api.onSyncEnd(() => {
  console.log("Sync completed");
});
```

**IPC Channel:** `sync:end`

---

#### `onSyncProgress(callback: (message: string) => void)`

Listens for sync progress messages.

**Returns:** `() => void` - Unsubscribe function

**Example:**

```typescript
const unsubscribe = window.api.onSyncProgress((message) => {
  console.log(`Sync: ${message}`);
});
```

**IPC Channel:** `sync:progress`

Payload is always a **string** (human-readable progress). Do not change this shape — Sidebar / `SyncStatusBadge` use it only to toggle global `isSyncing`. Per-artist `syncStatus` uses `onSyncArtist` / repair events + DB refetch.

---

#### `onSyncArtist(callback: () => void)`

Fired after per-artist `syncStatus` is written (start **and** end of `syncArtist`). Void payload — renderer invalidates `["artists"]` and refetches from DB (source of truth). Not a substitute for `onSyncProgress`.

**Returns:** `() => void` - Unsubscribe function

**Example:**

```typescript
const unsubscribe = window.api.onSyncArtist(() => {
  void queryClient.invalidateQueries({ queryKey: ["artists"] });
});
```

**IPC Channel:** `sync:artist`

---

#### `onRepairStart(callback: (artistName: string) => void)`

Fired when a repair/auto-sync-on-add run starts, **after** `syncStatus` is `"syncing"`.

**Returns:** `() => void` - Unsubscribe function

**IPC Channel:** `sync:repair:start`

---

#### `onRepairEnd(callback: () => void)`

Fired when repair/auto-sync-on-add finishes (`idle` or `error` already persisted).

**Returns:** `() => void` - Unsubscribe function

**IPC Channel:** `sync:repair:end`

---

#### `onSyncError(callback: SyncErrorCallback)`

Listens for sync error events.

**Callback Type:**

```typescript
type SyncErrorCallback = (message: string) => void;
```

**Returns:** `() => void` - Unsubscribe function

**Example:**

```typescript
const unsubscribe = window.api.onSyncError((message) => {
  console.error(`Sync error: ${message}`);
});
```

**IPC Channel:** `sync:error`

---

#### `onDownloadProgress(callback: DownloadProgressCallback)`

Listens for file download progress updates.

**Callback Type:**

```typescript
type DownloadProgressCallback = (data: DownloadProgressData) => void;

type DownloadProgressData = {
  id: string;
  percent: number;
};
```

**Returns:** `() => void` - Unsubscribe function

**Example:**

```typescript
const unsubscribe = window.api.onDownloadProgress((data) => {
  console.log(`Download ${data.id}: ${data.percent}%`);
});

// Later, to unsubscribe:
unsubscribe();
```

**IPC Channel:** `files:download-progress`

---

## Error Handling

All IPC methods can throw errors. Always wrap calls in try-catch blocks or let React Query surface `error` from `queryFn`.

### Provider search (`booru:search`)

| Layer | Responsibility |
|-------|----------------|
| `Rule34Provider.fetchPosts` | Throws `ProviderSearchError` with `kind` (`auth`, `rate_limit`, `network`, `parse`); XML fallback only on `parse`, never on auth/429 |
| `GelbooruProvider.fetchPosts` | On HTTP 429 throws `ProviderSearchError("rate_limit")` after `notifyRateLimited(retryAfterMs)` (shared host gate); other failures still log + return `[]`. Non-JSON content-type on 200 remains `[]` with a warn (unchanged) |
| `throwProviderSearchIpcError` (main) | Serializes to IPC-safe `Error` + enumerable payload fields |
| `parseProviderSearchErrorPayload` (shared) | Normalizes Electron invoke wrapper → typed payload for UI |
| `BrowseErrorState` (renderer) | User-facing centered error state (not a destructive banner) |

Sync pagination uses the same provider errors: `auth` / `rate_limit` abort sync with `SYNC.ERROR`; `network` / `parse` stop the current artist without failing the whole job.

### General IPC errors

```typescript
try {
  const result = await window.api.addArtist(artistData);
} catch (error) {
  // Prefer shared parsers per domain; never assume error.stack is available in renderer
  if (error instanceof Error) {
    log.error(error.message);
  }
}
```

## Security Considerations

1. **Context Isolation:** The Renderer process runs in a sandboxed environment with no direct Node.js access.

2. **Type Safety:** All IPC communication is strictly typed. The bridge interface ensures type safety at compile time.

3. **Input Validation:** All inputs are validated in the Main process using Zod schemas before processing.

4. **Error Propagation:** Errors are properly propagated from Main to Renderer, but sensitive information is not exposed.

5. **Secure Credentials:** API keys are encrypted at rest using Electron's `safeStorage` API. Decryption only occurs in Main Process when needed for API calls.

6. **Direct Database Access:** Database operations run directly in Main Process via `better-sqlite3` with WAL mode for concurrent reads. Use Drizzle ORM for CRUD on application tables; use raw SQL only for PRAGMAs, FTS5/trigger management, schema introspection, and performance-critical batch operations.

## Implementation Details

### Main Process (IPC Controllers)

IPC handlers are registered via controllers in `src/main/ipc/index.ts`:

**Controller Architecture:**

All IPC operations are handled through domain-specific controllers that extend `BaseController`:

- **BaseController** provides:
  - Centralized error handling
  - Automatic input validation using Zod schemas
  - Type-safe handler registration
  - Prevents duplicate handler registration errors
  - Request collapsing for idempotent handlers (key = channel + hash of full stable-serialized args)
  - Soft throttle for mutating handlers (delay spacing, never `Rate limit exceeded` reject)
  - Type assertion policy: `as` only at documented boundaries (see `.cursorrules` / LESSONS 3b); ESLint enforces via `no-unsafe-type-assertion` on `src/**`

**Controller Setup:**

```typescript
// Example: ArtistsController
export class ArtistsController extends BaseController {
  setup() {
    this.handle(
      IPC_CHANNELS.DB.ADD_ARTIST,
      AddArtistSchema,
      this.addArtist.bind(this)
    );
  }

  private async addArtist(_event: IpcMainInvokeEvent, data: AddArtistRequest) {
    const db = container.resolve(DI_TOKENS.DB);
    // Business logic here
  }
}
```

**Dependency Injection:**

Controllers use the DI Container to resolve dependencies:

```typescript
const db = container.resolve(DI_TOKENS.DB);
const syncService = container.resolve(DI_TOKENS.SYNC_SERVICE);
```

**Controller Registration:**

Controllers are registered in `setupIpc()` function:

```typescript
export function setupIpc(
  videoProxyServer: VideoProxyServer,
): {
  maintenanceController: MaintenanceController;
  fileController: FileController;
  playlistController: PlaylistController;
} {
  // Controllers registered here (System, Artists, Posts, Settings, Auth,
  // Maintenance, Viewer, File, Search, Playlist, Stats, Blacklist, VideoProxy, …)

  return { maintenanceController, fileController, playlistController };
}
```

**Available Controllers:**

- `SystemController` - System-level operations (version, clipboard, wipe-all-data, etc.)
- `ArtistsController` - Artist management operations
- `PostsController` - Post-related operations
- `SettingsController` - Settings management
- `AuthController` - Authentication and credential verification
- `MaintenanceController` - Database backup/restore operations
- `ViewerController` - Viewer-related operations
- `FileController` - File download and management
- `SearchController` - Booru search and tag resolution
- `PlaylistController` - Playlist CRUD, smart resolve, reorder, import/export
- `StatsController` - Statistics aggregates for dashboard cards/charts
- `BlacklistController` - Tag blacklist CRUD
- `VideoProxyController` - Local video proxy / cache control

**Channel Constants:**

All IPC channels are defined in `src/main/ipc/channels.ts`:

```typescript
export const IPC_CHANNELS = {
  APP: {
    GET_VERSION: "app:get-version",
    OPEN_EXTERNAL: "app:open-external",
    // ... other channels
  },
  DB: {
    GET_ARTISTS: "db:get-artists",
    ADD_ARTIST: "db:add-artist",
    // ... other channels
  },
  // ... other channel groups
} as const;
```

### Handler/Bridge Source of Truth

To avoid drift, this document no longer keeps long legacy snippets for handler registration or preload wiring.

- **IPC handler registration:** `src/main/ipc/index.ts`
- **Maintenance (VACUUM):** `src/main/ipc/controllers/MaintenanceController.ts`
- **Channel constants:** `src/main/ipc/channels.ts`
- **Renderer bridge (`window.api`):** `src/main/bridge.ts`

Use these files as the canonical implementation reference for exact BaseController registration and `ipcRenderer.invoke` wiring.

## API Evolution Notes

Potential next additions (not committed to a release):

- `updateArtist(artistId: number, data: Partial<Artist>)` - Update artist settings
- `getSubscriptions()` / `addSubscription(...)` / `deleteSubscription(...)` - Subscription management
- `getBackupList()` / `deleteBackup(...)` - Backup lifecycle management

## External API Integration

The application integrates with **Rule34.xxx API**. Integration is handled in the Main process via `SyncService` and `SearchController`, and is not directly exposed as raw HTTP from the Renderer (Browse uses IPC `searchBooru`).

**SyncService (tracked artists):**

- **Rate Limiting:** Shared `ProviderThrottle` (~1200ms minimum + 0–400ms jitter per request); sync retries use exponential backoff (base ~2000ms) on rate limits
- **Pagination:** Incremental fetch by `lastPostId` (not deep offset scroll)
- **Error Handling:** Graceful handling of API errors and network failures
- **Authentication:** Uses User ID and API Key from settings

**Browse (`searchBooru`):**

- **Page size:** 50 posts per IPC call (`limit`, max 100)
- **Rule34 deep scroll:** offset pages 1–4, then cursor via meta-tag `id:<postId>` (`beforePostId` / `nextBeforePostId`)
- **Blacklist:** Tag blacklist applied in Main after API fetch; pagination uses raw `apiFetchedCount`

**API Endpoint:** `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index`

See [Rule34 API Reference](./rule34-api-reference.md) for detailed API documentation.
