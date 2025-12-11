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
  getAppVersion: () => Promise<string>;
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: NewArtist) => Promise<Artist>;
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
  console.log(artist.username, artist.apiEndpoint);
});
```

**IPC Channel:** `db:get-artists`

**Artist Type:**

```typescript
type Artist = {
  id: number;
  username: string;
  apiEndpoint: string;
  lastPostId: number;
  newPostsCount: number;
  lastChecked: number | null;
  createdAt: number;
};
```

---

### `addArtist(artist: NewArtist)`

Adds a new artist to track. Validates the input before insertion.

**Parameters:**

- `artist: NewArtist` - Artist data to add

**Returns:** `Promise<Artist>`

**Throws:**

- `Error("Username is required")` - If username is empty or whitespace
- `Error("Invalid API Endpoint URL")` - If apiEndpoint is not a valid URL

**Example:**

```typescript
const newArtist: NewArtist = {
  username: "example_artist",
  apiEndpoint: "https://danbooru.donmai.us",
  lastPostId: 0,
  newPostsCount: 0,
};

try {
  const savedArtist = await window.api.addArtist(newArtist);
  console.log("Artist added:", savedArtist.id);
} catch (error) {
  console.error("Failed to add artist:", error);
}
```

**IPC Channel:** `db:add-artist`

**NewArtist Type:**

```typescript
type NewArtist = {
  username: string;
  apiEndpoint: string;
  lastPostId?: number; // Defaults to 0
  newPostsCount?: number; // Defaults to 0
};
```

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
export const registerIpcHandlers = (dbService: DbService) => {
  ipcMain.handle("app:get-version", handleGetAppVersion);
  ipcMain.handle("db:get-artists", async () => {
    return dbService.getTrackedArtists();
  });
  ipcMain.handle("db:add-artist", async (_event, artistData: NewArtist) => {
    // Validation and processing
    return dbService.addArtist(artistData);
  });
};
```

### Preload Script (Bridge)

The bridge is exposed in `src/main/bridge.ts`:

```typescript
const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  getTrackedArtists: () => ipcRenderer.invoke("db:get-artists"),
  addArtist: (artist) => ipcRenderer.invoke("db:add-artist", artist),
};

contextBridge.exposeInMainWorld("api", ipcBridge);
```

## Future API Extensions

Planned API methods (not yet implemented):

- `getPosts(artistId: number)` - Retrieve posts for an artist
- `downloadPost(postId: number)` - Download a post's media file
- `updateArtist(artistId: number, data: Partial<Artist>)` - Update artist settings
- `deleteArtist(artistId: number)` - Remove an artist from tracking
- `getSubscriptions()` - Get tag subscriptions
- `addSubscription(tagString: string)` - Subscribe to a tag combination

## External API Integration

The application integrates with external Booru APIs (e.g., Danbooru, Gelbooru). These integrations are handled in the Main process and are not exposed via IPC for security reasons. API calls include:

- Rate limiting
- Exponential backoff
- Retry logic
- Error handling

See [Architecture Documentation](./architecture.md) for more details on external API integration.
