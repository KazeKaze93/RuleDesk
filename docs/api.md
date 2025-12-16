# API Documentation

## Overview

This document describes the IPC (Inter-Process Communication) API between the Electron Main Process and Renderer Process. All communication is strictly typed using TypeScript interfaces and follows security best practices.

## Architecture

The application uses Electron's IPC (Inter-Process Communication) with Context Isolation enabled. The Renderer process cannot directly access Node.js APIs. Instead, it communicates with the Main process through a secure bridge defined in `src/main/bridge.ts`.

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
  searchRemoteTags: (query: string) => Promise<{ id: string; label: string }[]>;

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

**Returns:** `Promise<string>`

**Example:**

```typescript
const version = await window.api.getAppVersion();
console.log(version); // "1.0.0"
```

**IPC Channel:** `app:get-version`

---

### `getTrackedArtists()`

Retrieves all tracked artists from the local database.

**Returns:** `Promise<Artist[]>`

**Example:**

```typescript
const artists = await window.api.getTrackedArtists();
artists.forEach((artist) => {
  console.log(artist.name, artist.tag, artist.apiEndpoint);
});
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

**Settings Type:**

```typescript
type Settings = {
  id: number;
  userId: string;
  apiKey: string;
};
```

---

### `getSettings()`

Retrieves stored API credentials (User ID and API Key).

**Returns:** `Promise<Settings | undefined>`

**Example:**

```typescript
const settings = await window.api.getSettings();
if (settings) {
  console.log("User ID:", settings.userId);
}
```

**IPC Channel:** `app:get-settings`

---

### `saveSettings(creds: { userId: string; apiKey: string })`

Saves API credentials to the database.

**Parameters:**

- `creds.userId: string` - Rule34.xxx User ID
- `creds.apiKey: string` - Rule34.xxx API Key

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

**IPC Channel:** `app:save-settings`

---

### `addArtist(artist: NewArtist)`

Adds a new artist to track. Validates the input before insertion.

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
  type: "tag", // or "uploader"
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

**Parameters:**

- `params.artistId: number` - Artist ID
- `params.page?: number` - Page number (defaults to 1)

**Returns:** `Promise<Post[]>`

**Example:**

```typescript
const posts = await window.api.getArtistPosts({ artistId: 123, page: 1 });
console.log(`Found ${posts.length} posts`);
```

**IPC Channel:** `db:get-posts`

**Note:** Each page returns up to 50 posts (limit). Use pagination to retrieve more posts.

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

### `searchRemoteTags(query: string)`

Searches for tags using Rule34.xxx autocomplete API.

**Parameters:**

- `query: string` - Search query string (minimum 2 characters)

**Returns:** `Promise<{ id: string; label: string }[]>`

**Example:**

```typescript
const results = await window.api.searchRemoteTags("tag");
results.forEach((result) => {
  console.log(result.id, result.label);
});
```

**IPC Channel:** `api:search-remote-tags`

**Note:** Requires at least 2 characters. Returns empty array if query is too short or API call fails.

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

6. **Worker Thread Isolation:** Database operations run in a dedicated worker thread, providing additional isolation.

## Implementation Details

### Main Process (IPC Handlers)

IPC handlers are registered in `src/main/ipc/index.ts`:

```typescript
export const registerIpcHandlers = (
  dbWorkerClient: DbWorkerClient,
  syncService: SyncService,
  updaterService: UpdaterService,
  mainWindow: BrowserWindow
) => {
  // App handlers
  ipcMain.handle("app:get-version", handleGetAppVersion);
  ipcMain.handle("app:get-settings", async () => {
    // Decrypts API key using SecureStorage
    const settings = await dbWorkerClient.call("getApiKeyDecrypted");
    // ... decryption logic
  });
  ipcMain.handle("app:save-settings", async (_event, { userId, apiKey }) => {
    // Encrypts API key using SecureStorage before saving
    const encryptedKey = SecureStorage.encrypt(apiKey);
    await dbWorkerClient.call("saveSettings", { userId, apiKey: encryptedKey });
  });
  ipcMain.handle("app:open-external", async (_event, urlString: string) => {
    // Security validation and shell.openExternal
  });

  // Database handlers (via worker thread)
  ipcMain.handle("db:get-artists", async () => {
    return dbWorkerClient.call("getTrackedArtists");
  });
  ipcMain.handle("db:add-artist", async (_event, payload: unknown) => {
    // Zod validation
    const artistData = AddArtistSchema.parse(payload);
    return dbWorkerClient.call("addArtist", artistData);
  });
  ipcMain.handle("db:delete-artist", async (_event, id: unknown) => {
    const validId = DeleteArtistSchema.parse(id);
    return dbWorkerClient.call("deleteArtist", { id: validId });
  });
  ipcMain.handle("db:get-posts", async (_event, payload: unknown) => {
    // Zod validation
    const { artistId, page, limit } = GetPostsSchema.parse(payload);
    const offset = (page - 1) * limit;
    return dbWorkerClient.call("getPostsByArtist", { artistId, limit, offset });
  });
  ipcMain.handle("db:mark-post-viewed", async (_event, postId: unknown) => {
    const validId = MarkViewedSchema.parse(postId);
    return dbWorkerClient.call("markPostAsViewed", { postId: validId });
  });
  ipcMain.handle("db:search-tags", async (_event, query: unknown) => {
    const validQuery = SearchTagsSchema.parse(query);
    return dbWorkerClient.call("searchArtists", { query: validQuery });
  });

  // Backup handlers
  ipcMain.handle("db:create-backup", async () => {
    const result = await dbWorkerClient.call("backup");
    shell.showItemInFolder(result.backupPath);
    return { success: true, path: result.backupPath };
  });
  ipcMain.handle("db:restore-backup", async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: "SQLite DB", extensions: ["db", "sqlite"] }],
    });
    await dbWorkerClient.restore(filePaths[0]);
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
