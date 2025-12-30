# API Documentation

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [IPC Bridge Interface](#ipc-bridge-interface)
- [API Methods](#api-methods)
- [Event Listeners](#event-listeners)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Implementation Details](#implementation-details)
- [Future API Extensions](#future-api-extensions)
- [External API Integration](#external-api-integration)

---

## Overview

This document describes the IPC (Inter-Process Communication) API between the Electron Main Process and Renderer Process. All communication is strictly typed using TypeScript interfaces and follows security best practices.

**📖 Related Documentation:**
- [Architecture Documentation](./architecture.md) - System architecture and IPC design
- [Database Documentation](./database.md) - Database operations and schema
- [Development Guide](./development.md) - Adding new IPC methods
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
import type { Artist } from "../../../main/db/schema";

const { data, isLoading, error } = useQuery<Artist[]>({
  queryKey: ["artists"],
  queryFn: () => window.api.getTrackedArtists(),
});
```

**Example: Mutations (create/update/delete):**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Artist, NewArtist } from "../../../main/db/schema";

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
import type { Artist } from "../../../main/db/schema";

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
import type { Post } from "../../../main/db/schema";

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
import type { Artist, NewArtist } from "../../../main/db/schema";

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
  getSettings: () => Promise<Settings | undefined>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;

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
  getArtistPostsCount: (artistId?: number) => Promise<number>;
  markPostAsViewed: (postId: number) => Promise<boolean>;
  togglePostViewed: (postId: number) => Promise<boolean>;
  togglePostFavorite: (postId: number) => Promise<boolean>;
  resetPostCache: (postId: number) => Promise<boolean>;

  // External
  openExternal: (url: string) => Promise<void>;
  searchRemoteTags: (query: string, provider?: ProviderId) => Promise<SearchResults[]>;

  // Sync
  syncAll: () => Promise<boolean>;
  repairArtist: (artistId: number) => Promise<boolean>;

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

return <div>Version: {version}</div>;
```

**IPC Channel:** `app:get-version`

---

### `getTrackedArtists()`

Retrieves all tracked artists from the local database.

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
import type { Artist } from "../../../main/db/schema";

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
      <ArtistCard key={artist.id} artist={artist} />
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

**Returns:** `Promise<IpcSettings | undefined>`

**IpcSettings Type:**

```typescript
type IpcSettings = {
  userId: string;
  hasApiKey: boolean; // ← Boolean flag, NOT the actual key
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
  isAdultVerified: boolean;
  tosAcceptedAt: number | null;
};
```

**Example:**

```typescript
import type { IpcSettings } from "../../../shared/schemas/settings";

const settings = await window.api.getSettings();
if (settings) {
  console.log("User ID:", settings.userId);
  console.log("Has API Key:", settings.hasApiKey); // ← Boolean, not the key itself
  // ❌ settings.apiKey does NOT exist - API key is never sent to Renderer
}
```

**Real-world usage in React component:**

```typescript
// In App.tsx - check if user needs onboarding
import type { IpcSettings } from "../../../shared/schemas/settings";

const { data: settings } = useQuery<IpcSettings | undefined>({
  queryKey: ["settings"],
  queryFn: () => window.api.getSettings(),
});

if (!settings || !settings.hasApiKey) {
  // No settings or no API key configured - show onboarding
  return <Onboarding onComplete={() => queryClient.invalidateQueries(["settings"])} />;
}

// Settings exist and API key is configured - show main app
return <MainApp />;
```

**IPC Channel:** `app:get-settings`

---

### `saveSettings(creds: { userId: string; apiKey: string })`

Saves API credentials to the database. The API key is encrypted at rest using Electron's `safeStorage` API before being stored.

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

- `creds.userId: string` - Rule34.xxx User ID
- `creds.apiKey: string` - Rule34.xxx API Key (will be encrypted before storage)

**Returns:** `Promise<boolean>`

**Throws:**

- `Error("Data is required")` - If userId or apiKey is missing

**Example:**

```typescript
try {
  await window.api.saveSettings({
    userId: "123456",
    apiKey: "your-api-key-here",
  });
  console.log("Settings saved");
} catch (error) {
  console.error("Failed to save settings:", error);
}
```

**Real-world usage in React component:**

```typescript
// In Onboarding.tsx component
import type { Settings } from "../../../main/db/schema";

const onSubmit = async (data: CredsFormValues) => {
  try {
    const success: boolean = await window.api.saveSettings({
      userId: data.userId,
      apiKey: data.apiKey,
    });
    // Credentials are now encrypted and stored
    onComplete(); // Navigate to main app
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown save error.";
    log.error(`[Onboarding] Authorization error: ${message}`);
    // Show error to user
  }
};
```

**Security Note:** The API key is encrypted using Electron's `safeStorage` API in the Main Process. Even if the database file is stolen, the API key cannot be decrypted without access to the platform keychain.

**IPC Channel:** `app:save-settings`

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
import type { Artist, NewArtist } from "../../../main/db/schema";
import type { ProviderId } from "../../../main/providers";

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
    
    const savedArtist: Artist | undefined = await window.api.addArtist(newArtist);
    
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
import type { Post } from "../../../main/db/schema";

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery<Post[]>({
    queryKey: ["posts", artist.id],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }): Promise<Post[]> => {
      return await window.api.getArtistPosts({
        artistId: artist.id,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage: Post[], allPages: Post[][]): number | undefined => {
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

**Note:** This is an asynchronous operation. The method returns immediately, and synchronization runs in the background. Use event listeners (`onSyncStart`, `onSyncEnd`, `onSyncProgress`, `onSyncError`) to track progress. Check artist `newPostsCount` to see results.

---

### `repairArtist(artistId: number)`

Repairs/resynchronizes an artist by resetting their `lastPostId` to 0 and re-fetching initial pages. Useful for updating low-quality previews or fixing synchronization issues.

**Parameters:**

- `artistId: number` - Artist ID to repair

**Returns:** `Promise<boolean>`

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

### `markPostAsViewed(postId: number)`

Marks a post as viewed in the database.

**Parameters:**

- `postId: number` - Post ID to mark as viewed

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

### `searchRemoteTags(query: string, provider?: ProviderId)`

Searches for tags using booru autocomplete API (multi-provider support).

**Parameters:**

- `query: string` - Search query string (minimum 2 characters)
- `provider?: ProviderId` - Provider ID ("rule34" or "gelbooru"), defaults to "rule34"

**Returns:** `Promise<SearchResults[]>`

**Example:**

```typescript
const results = await window.api.searchRemoteTags("tag", "rule34");
results.forEach((result) => {
  console.log(result.id, result.label);
});
```

**IPC Channel:** `api:search-remote-tags`

**Note:** Requires at least 2 characters. Returns empty array if query is too short or API call fails. Supports multiple booru providers via provider pattern.

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

### `getArtistPostsCount(artistId?: number)`

Gets the total count of posts for an artist or all posts if no artistId is provided.

**Parameters:**

- `artistId?: number` - Optional artist ID. If omitted, returns count of all posts.

**Returns:** `Promise<number>`

**Example:**

```typescript
const count = await window.api.getArtistPostsCount(123);
console.log(`Artist has ${count} posts`);
```

**IPC Channel:** `db:get-posts-count`

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

### `togglePostFavorite(postId: number)`

Toggles the favorite status of a post.

**Parameters:**

- `postId: number` - Post ID to toggle

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

All IPC methods can throw errors. Always wrap calls in try-catch blocks:

```typescript
try {
  const result = await window.api.addArtist(artistData);
} catch (error) {
  // Handle error appropriately
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

## Security Considerations

1. **Context Isolation:** The Renderer process runs in a sandboxed environment with no direct Node.js access.

2. **Type Safety:** All IPC communication is strictly typed. The bridge interface ensures type safety at compile time.

3. **Input Validation:** All inputs are validated in the Main process using Zod schemas before processing.

4. **Error Propagation:** Errors are properly propagated from Main to Renderer, but sensitive information is not exposed.

5. **Secure Credentials:** API keys are encrypted at rest using Electron's `safeStorage` API. Decryption only occurs in Main Process when needed for API calls.

6. **Direct Database Access:** Database operations run directly in Main Process via `better-sqlite3` with WAL mode for concurrent reads.

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

  private async addArtist(
    _event: IpcMainInvokeEvent,
    data: AddArtistRequest
  ) {
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
export function setupIpc(): { maintenanceController: MaintenanceController; fileController: FileController } {
  const systemController = new SystemController();
  systemController.setup();
  
  const artistsController = new ArtistsController();
  artistsController.setup();
  
  // ... other controllers
  
  return { maintenanceController, fileController };
}
```

**Available Controllers:**

- `SystemController` - System-level operations (version, clipboard, etc.)
- `ArtistsController` - Artist management operations
- `PostsController` - Post-related operations
- `SettingsController` - Settings management
- `AuthController` - Authentication and credential verification
- `MaintenanceController` - Database backup/restore operations
- `ViewerController` - Viewer-related operations
- `FileController` - File download and management

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

**Legacy Handler Registration (Deprecated):**

The old handler-based approach has been migrated to controllers. This example shows the deprecated pattern for reference only:

```typescript
// ⚠️ DEPRECATED: This code is for reference only. Current implementation uses controllers.
export const registerIpcHandlers = (
  syncService: SyncService,
  updaterService: UpdaterService,
  mainWindow: BrowserWindow
) => {
  // App handlers
  ipcMain.handle("app:get-version", handleGetAppVersion);
  ipcMain.handle("app:get-settings", async () => {
    // Gets settings and decrypts API key using SecureStorage
    const db = getDb();
    const settings = await db.query.settings.findFirst();
    // ... decryption logic using SecureStorage.decrypt()
  });
  ipcMain.handle("app:save-settings", async (_event, { userId, apiKey }) => {
    // Encrypts API key using SecureStorage before saving
    const encryptedKey = SecureStorage.encrypt(apiKey);
    const db = getDb();
    await db.insert(settings).values({ userId, encryptedApiKey: encryptedKey })
      .onConflictDoUpdate({ target: settings.id, set: { userId, encryptedApiKey: encryptedKey } });
  });
  ipcMain.handle("app:open-external", async (_event, urlString: string) => {
    // Security validation and shell.openExternal
  });

  // Database handlers (direct access in Main Process)
  ipcMain.handle("db:get-artists", async () => {
    const db = getDb();
    return await db.query.artists.findMany({
      orderBy: [asc(artists.name)],
    });
  });
  ipcMain.handle("db:add-artist", async (_event, payload: unknown) => {
    // Zod validation
    const artistData = AddArtistSchema.parse(payload);
    const db = getDb();
    const result = await db.insert(artists).values(artistData).returning();
    return result[0];
  });
  ipcMain.handle("db:delete-artist", async (_event, id: unknown) => {
    const validId = DeleteArtistSchema.parse(id);
    const db = getDb();
    await db.delete(artists).where(eq(artists.id, validId));
  });
  ipcMain.handle("db:get-posts", async (_event, payload: unknown) => {
    // Zod validation
    const { artistId, page, limit } = GetPostsSchema.parse(payload);
    const offset = (page - 1) * limit;
    const db = getDb();
    return await db.query.posts.findMany({
      where: eq(posts.artistId, artistId),
      orderBy: [desc(posts.postId)],
      limit,
      offset,
    });
  });
  ipcMain.handle("db:mark-post-viewed", async (_event, postId: unknown) => {
    const validId = MarkViewedSchema.parse(postId);
    const db = getDb();
    await db.update(posts).set({ isViewed: true }).where(eq(posts.id, validId));
  });
  ipcMain.handle("db:search-tags", async (_event, query: unknown) => {
    const validQuery = SearchTagsSchema.parse(query);
    const db = getDb();
    // Search implementation using Drizzle queries
  });

  // Backup handlers
  ipcMain.handle("db:create-backup", async () => {
    // Backup implementation using VACUUM INTO
    const sqlite = getSqliteInstance();
    const backupPath = path.join(app.getPath("userData"), `metadata-backup-${timestamp}.db`);
    const stmt = sqlite.prepare("VACUUM INTO ?");
    stmt.run(backupPath);
    shell.showItemInFolder(backupPath);
    return { success: true, path: backupPath };
  });
  ipcMain.handle("db:restore-backup", async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: "SQLite DB", extensions: ["db", "sqlite"] }],
    });
    // Restore implementation with integrity checks
    mainWindow.reload();
    return { success: true };
  });

  // Remote search
  ipcMain.handle("api:search-remote-tags", async (_event, query: unknown) => {
    // Calls Rule34.xxx autocomplete API
  });

  // Sync handlers
  ipcMain.handle("db:sync-all", async () => {
    syncService.syncAllArtists();
  });
  ipcMain.handle("sync:repair-artist", async (_event, artistId: number) => {
    await syncService.repairArtist(artistId);
    return { success: true };
  });

  // Updater handlers
  ipcMain.handle("app:check-for-updates", () => {
    updaterService.checkForUpdates();
  });
  // ... other updater handlers
};
```

### Preload Script (Bridge)

The bridge is exposed in `src/main/bridge.ts`:

```typescript
const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),

  getSettings: () => ipcRenderer.invoke("app:get-settings"),
  saveSettings: (creds) => ipcRenderer.invoke("app:save-settings", creds),

  getTrackedArtists: () => ipcRenderer.invoke("db:get-artists"),
  addArtist: (artist) => ipcRenderer.invoke("db:add-artist", artist),
  deleteArtist: (id) => ipcRenderer.invoke("db:delete-artist", id),
  searchArtists: (query) => ipcRenderer.invoke("db:search-tags", query),

  getArtistPosts: ({ artistId, page }) =>
    ipcRenderer.invoke("db:get-posts", { artistId, page }),
  markPostAsViewed: (postId) =>
    ipcRenderer.invoke("db:mark-post-viewed", postId),

  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),
  searchRemoteTags: (query) =>
    ipcRenderer.invoke("api:search-remote-tags", query),

  syncAll: () => ipcRenderer.invoke("db:sync-all"),
  repairArtist: (artistId) =>
    ipcRenderer.invoke("sync:repair-artist", artistId),

  createBackup: () => ipcRenderer.invoke("db:create-backup"),
  restoreBackup: () => ipcRenderer.invoke("db:restore-backup"),

  // Updater methods
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
  quitAndInstall: () => ipcRenderer.invoke("app:quit-and-install"),
  startDownload: () => ipcRenderer.invoke("app:start-download"),

  // Event listeners
  onUpdateStatus: (callback) => {
    const subscription = (_: IpcRendererEvent, data: UpdateStatusData) =>
      callback(data);
    ipcRenderer.on("updater:status", subscription);
    return () => ipcRenderer.removeListener("updater:status", subscription);
  },
  onUpdateProgress: (callback) => {
    const subscription = (_: IpcRendererEvent, percent: number) =>
      callback(percent);
    ipcRenderer.on("updater:progress", subscription);
    return () => ipcRenderer.removeListener("updater:progress", subscription);
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
  onSyncProgress: (callback) => {
    const sub = (_: IpcRendererEvent, msg: string) => callback(msg);
    ipcRenderer.on("sync:progress", sub);
    return () => ipcRenderer.removeListener("sync:progress", sub);
  },
  onSyncError: (callback) => {
    const subscription = (_: IpcRendererEvent, msg: string) => callback(msg);
    ipcRenderer.on("sync:error", subscription);
    return () => ipcRenderer.removeListener("sync:error", subscription);
  },
};

contextBridge.exposeInMainWorld("api", ipcBridge);
```

## Future API Extensions

Planned API methods (not yet implemented):

- `updateArtist(artistId: number, data: Partial<Artist>)` - Update artist settings
- `downloadPost(postId: number)` - Download a post's media file
- `getSubscriptions()` - Get tag subscriptions
- `addSubscription(tagString: string)` - Subscribe to a tag combination
- `deleteSubscription(id: number)` - Remove a subscription
- `getBackupList()` - List available backup files
- `deleteBackup(backupPath: string)` - Delete a backup file

## External API Integration

The application integrates with **Rule34.xxx API**. Integration is handled in the Main process via `SyncService` (`src/main/services/sync-service.ts`) and is not directly exposed via IPC for security reasons.

**Features:**

- **Rate Limiting:** 1.5 second delay between artists, 0.5 second between pages
- **Pagination:** Handles Rule34.xxx pagination (up to 1000 posts per page)
- **Error Handling:** Graceful handling of API errors and network failures
- **Incremental Sync:** Only fetches posts newer than `lastPostId`
- **Authentication:** Uses User ID and API Key from settings

**API Endpoint:** `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index`

See [Rule34 API Reference](./rule34-api-reference.md) for detailed API documentation.
