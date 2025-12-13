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

  // Settings
  getSettings: () => Promise<Settings | undefined>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;

  // Artists
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: NewArtist) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<void>;

  // Posts
  getArtistPosts: (artistId: number, page?: number) => Promise<Post[]>;

  // External
  openExternal: (url: string) => Promise<void>;

  // Sync
  syncAll: () => Promise<boolean>;
  repairArtist: (artistId: number) => Promise<boolean>;

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

- `Error("Данные обязательны")` - If userId or apiKey is missing

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

3. **Input Validation:** All inputs are validated in the Main process before processing.

4. **Error Propagation:** Errors are properly propagated from Main to Renderer, but sensitive information is not exposed.

## Implementation Details

### Main Process (IPC Handlers)

IPC handlers are registered in `src/main/ipc.ts`:

```typescript
export const registerIpcHandlers = (
  dbService: DbService,
  syncService: SyncService
) => {
  // App handlers
  ipcMain.handle("app:get-version", handleGetAppVersion);
  ipcMain.handle("app:get-settings", async () => {
    return dbService.getSettings();
  });
  ipcMain.handle("app:save-settings", async (_event, data: unknown) => {
    // Validation with Zod schema
    return dbService.saveSettings(userId, apiKey);
  });
  ipcMain.handle("app:open-external", async (_event, urlString: string) => {
    // Security validation and shell.openExternal
  });

  // Updater handlers (registered in UpdaterService)
  ipcMain.handle("app:check-for-updates", async () => {
    return updaterService.checkForUpdates();
  });
  ipcMain.handle("app:start-download", () => {
    // Starts update download
  });
  ipcMain.handle("app:quit-and-install", () => {
    // Quits and installs update
  });

  // Database handlers
  ipcMain.handle("db:get-artists", async () => {
    return dbService.getTrackedArtists();
  });
  ipcMain.handle("db:add-artist", async (_event, artistData: NewArtist) => {
    // Validation and processing
    return dbService.addArtist(artistData);
  });
  ipcMain.handle("db:delete-artist", async (_event, id: number) => {
    return dbService.deleteArtist(id);
  });
  ipcMain.handle("db:get-posts", async (_event, payload: unknown) => {
    // Validation with Zod schema
    const { artistId, page, limit } = validatedPayload;
    const offset = (page - 1) * limit;
    return dbService.getPostsByArtist(artistId, limit, offset);
  });
  ipcMain.handle("db:sync-all", async () => {
    // Initiates background sync
    syncService.syncAllArtists();
  });

  // Sync handlers
  ipcMain.handle("sync:repair-artist", async (_event, artistId: number) => {
    await syncService.repairArtist(artistId);
    return { success: true };
  });
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

  getArtistPosts: ({ artistId, page }) =>
    ipcRenderer.invoke("db:get-posts", { artistId, page }),

  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),

  syncAll: () => ipcRenderer.invoke("db:sync-all"),
  repairArtist: (artistId) =>
    ipcRenderer.invoke("sync:repair-artist", artistId),

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

