# Architecture Documentation

## Overview

This application follows a strict **Separation of Concerns (SoC)** architecture, dividing responsibilities between the Electron Main Process (secure Node.js environment) and the Renderer Process (sandboxed browser environment).

## Architecture Concept

### 1. Dual-Module Interface

- **Library Mode:** Работает с локальной SQLite базой. Максимальная производительность, виртуализация.
- **Browser Mode:** Изолированный `<webview>` процесс. Позволяет пользователю серфить источник (Source) нативно. "Бридж" между сайтом и приложением осуществляется через инъекцию скриптов (DOM scraping + IPC triggers).

### 2. Provider Abstraction (Future Proofing)

- В будущем `SyncService` перестанет быть жестко связанным с Rule34.
- Вводится интерфейс `BooruProvider` (methods: `getPosts`, `getArtistInfo`, `search`).
- Текущая реализация станет `Rule34Provider`. Это позволит подключать новые источники без переписывания ядра БД.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │   Main Process       │◄────►│   Renderer Process   │    │
│  │   (Node.js)          │ IPC  │   (Browser)          │    │
│  │                      │      │                      │    │
│  │  • API Clients       │      │  • React UI          │    │
│  │  • File I/O          │      │  • State Management  │    │
│  │  • Background Jobs   │      │  • User Interactions │    │
│  │  • Secure Storage    │      │                      │    │
│  └──────────┬───────────┘      └──────────────────────┘    │
│             │ Worker Thread                                  │
│             │ RPC                                            │
│  ┌──────────▼───────────┐                                   │
│  │  Database Worker      │                                   │
│  │  (Worker Thread)      │                                   │
│  │  • SQLite (Drizzle)   │                                   │
│  │  • Migrations         │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
└─────────────┼────────────────────────────────────────────────┘
              │
              ▼
      ┌─────────────┐              ┌─────────────┐
      │   SQLite    │              │  External   │
      │  Database   │              │  Booru APIs │
      └─────────────┘              └─────────────┘
```

## Process Separation

### Main Process (The Brain)

**Location:** `src/main/`

**Responsibilities:**

- Database operations (SQLite via Drizzle ORM)
- External API communication
- File system operations
- Background polling jobs
- Security-sensitive operations

**Key Components:**

1. **Database Worker** (`src/main/db/db-worker.ts`)

   - Runs in a dedicated worker thread for non-blocking database operations
   - Manages all database operations using Drizzle ORM
   - Thread-safe SQLite access isolated from main process
   - RPC pattern with correlation IDs for request/response matching
   - Methods: getTrackedArtists, addArtist, deleteArtist, getPostsByArtist, savePostsForArtist, getSettings, saveSettings, backup, restore, searchArtists, markPostAsViewed

2. **Database Worker Client** (`src/main/db/db-worker-client.ts`)

   - Client interface for communicating with database worker thread
   - Handles worker lifecycle (initialization, termination)
   - Provides async/await interface over worker RPC calls
   - Manages backup and restore operations

3. **Sync Service** (`src/main/services/sync-service.ts`)

   - Handles Rule34.xxx API synchronization
   - Implements rate limiting and pagination
   - Maps API responses to database schema
   - Updates artist post counts
   - Provides repair/resync functionality for artists
   - Emits IPC events for sync progress tracking

4. **IPC Handlers** (`src/main/ipc.ts`)

   - Registers all IPC communication channels
   - Validates input from Renderer using Zod schemas
   - Delegates to appropriate services
   - Security validation (e.g., openExternal URL whitelist)
   - Handles updater and sync event subscriptions

5. **Updater Service** (`src/main/services/updater-service.ts`)

   - Manages automatic update checking via `electron-updater`
   - Handles update download and installation
   - Emits IPC events for update status and progress
   - User-controlled download (manual download trigger)

6. **Secure Storage** (`src/main/services/secure-storage.ts`)

   - Encrypts and decrypts sensitive data using Electron's `safeStorage` API
   - Used for API credentials encryption at rest
   - Decryption only occurs in Main Process when needed
   - Methods: encrypt, decrypt

7. **Bridge** (`src/main/bridge.ts`)

   - Defines the IPC interface
   - Exposed via preload script
   - Type-safe communication contract
   - Event listener management for real-time updates

8. **Main Entry** (`src/main/main.ts`)
   - Application initialization
   - Window creation
   - Security configuration
   - Database worker thread initialization and migrations

### Renderer Process (The Face)

**Location:** `src/renderer/`

**Responsibilities:**

- User interface rendering
- User interactions
- State management
- Data presentation

**Key Components:**

1. **React Application** (`src/renderer/App.tsx`)

   - Main UI component with routing logic
   - Onboarding screen for API credentials
   - Dashboard with artist list
   - Uses TanStack Query for data fetching
   - State management via React hooks

2. **Components** (`src/renderer/components/`)

   - **Onboarding.tsx** - API credentials input form
   - **AddArtistModal.tsx** - Modal for adding new artists
   - **ArtistGallery.tsx** - Grid view of posts for an artist
   - **ui/** - shadcn/ui components (Button, Dialog)

3. **IPC Client** (`window.api`)
   - Typed interface to Main process
   - All communication goes through this bridge
   - Methods: getSettings, saveSettings, getTrackedArtists, addArtist, deleteArtist, getArtistPosts, syncAll, openExternal, searchArtists, searchRemoteTags, markPostAsViewed, createBackup, restoreBackup

## Security Architecture

### Context Isolation

**Status:** ✅ Enabled

The Renderer process runs in a sandboxed environment with no direct Node.js access. This prevents Remote Code Execution (RCE) attacks.

**Configuration:**

```typescript
webPreferences: {
  contextIsolation: true,  // Required
  nodeIntegration: false,  // Never true
  sandbox: true,           // Additional security
  preload: path.join(__dirname, "../preload/bridge.cjs"),
}
```

### IPC Security

1. **Type Safety:** All IPC communication is strictly typed
2. **Input Validation:** All inputs are validated in Main process using Zod schemas
3. **Error Handling:** Errors are properly handled without exposing sensitive data
4. **No Direct Node Access:** Renderer cannot access Node.js APIs directly
5. **Secure Credentials:** API keys encrypted at rest, only decrypted in Main Process when needed
6. **Worker Thread Isolation:** Database operations isolated in worker thread

## Data Flow

### Reading Data

```
User Action (Renderer)
    ↓
window.api.getTrackedArtists()
    ↓
IPC: "db:get-artists"
    ↓
Main Process: ipcMain.handle()
    ↓
DbWorkerClient.call("getTrackedArtists")
    ↓
Worker Thread RPC (correlation ID)
    ↓
Database Worker: handleRequest()
    ↓
Drizzle ORM Query
    ↓
SQLite Database (in worker thread)
    ↓
Return Artist[] (via worker message)
    ↓
DbWorkerClient resolves Promise
    ↓
IPC Response
    ↓
Renderer: React Query Cache
    ↓
UI Update
```

### Writing Data

```
User Form Submit (Renderer)
    ↓
window.api.addArtist(data)
    ↓
IPC: "db:add-artist"
    ↓
Main Process: Zod Validation
    ↓
DbWorkerClient.call("addArtist", data)
    ↓
Worker Thread RPC (correlation ID)
    ↓
Database Worker: handleRequest()
    ↓
Drizzle ORM Insert
    ↓
SQLite Database (in worker thread)
    ↓
Return Artist (via worker message)
    ↓
DbWorkerClient resolves Promise
    ↓
IPC Response
    ↓
Renderer: Invalidate Query
    ↓
UI Refresh
```

## Database Architecture

### Schema

The database uses SQLite with the following tables:

1. **artists** - Tracked artists/users (by tag or uploader)
2. **posts** - Cached post metadata with tags, ratings, and URLs
3. **settings** - API credentials (User ID and API Key)
4. **subscriptions** - Tag subscriptions (schema defined, not yet implemented)

See [Database Documentation](./database.md) for detailed schema information.

### ORM Layer

**Drizzle ORM** provides:

- Type-safe queries
- Schema migrations
- Type inference
- SQL generation

### Worker Thread Architecture

**Database Worker Thread** (`src/main/db/db-worker.ts`):

- All database operations run in a dedicated worker thread
- Prevents blocking the main Electron process
- RPC pattern with correlation IDs for request/response matching
- Timeout handling for worker requests
- Type-safe communication via `WorkerRequest` and `WorkerResponse` types
- Automatic migration execution on worker initialization

## External API Integration

### API Client Design

External API calls are handled in the Main process via `SyncService` (`src/main/services/sync-service.ts`) with:

1. **Rate Limiting:** 1.5 second delay between artists, 0.5 second between pages
2. **Pagination:** Handles Rule34.xxx pagination (up to 1000 posts per page)
3. **Incremental Sync:** Only fetches posts newer than `lastPostId`
4. **Error Handling:** Graceful handling of API errors and network failures
5. **Authentication:** Uses User ID and API Key from settings table

### Sync Architecture

Background synchronization for new posts:

```
Renderer: User clicks "Sync All"
    ↓
IPC: db:sync-all
    ↓
Main Process: SyncService.syncAllArtists()
    ↓
For each tracked artist:
    ↓
    Get settings (userId, apiKey)
    ↓
    Build Rule34.xxx API query with tag and lastPostId filter
    ↓
    Paginate through results (1000 posts per page)
    ↓
    Map API response to NewPost[]
    ↓
    Save to database (onConflictDoNothing)
    ↓
    Update artist.lastPostId and increment newPostsCount
    ↓
    Rate limit: 1.5s between artists, 0.5s between pages
    ↓
Renderer: Query invalidation triggers UI refresh
```

## Build Architecture

### Build Tool: Vite

The project uses **electron-vite** for building both Main and Renderer processes.

**Configuration:** `electron.vite.config.ts`

**Build Targets:**

1. **Main:** Node.js bundle (`out/main/`)
2. **Preload:** CommonJS bridge (`out/preload/`)
3. **Renderer:** React application (`out/renderer/`)

### Development Mode

- Hot Module Replacement (HMR) for Renderer
- Fast rebuilds with Vite
- DevTools enabled in development

## State Management

### Renderer State

**TanStack Query (React Query):**

- Server state (data from Main process)
- Caching and synchronization
- Loading and error states

**Zustand:**

- Client-side UI state
- Minimal boilerplate
- KISS principle compliance

### Main Process State

- Database is the source of truth
- Services maintain minimal in-memory state
- Background jobs use timers, not persistent state

## File Structure

```
src/
├── main/              # Main Process
│   ├── db/           # Database layer
│   ├── lib/          # Utilities
│   ├── bridge.ts     # IPC interface
│   ├── ipc.ts        # IPC handlers
│   └── main.ts       # Entry point
│
├── renderer/         # Renderer Process
│   ├── components/   # React components
│   ├── lib/          # Utilities
│   ├── App.tsx       # Main component
│   └── main.tsx      # Entry point
│
└── preload/          # Preload scripts (generated)
```

## Design Principles

### SOLID Principles

- **Single Responsibility:** Each module has one clear purpose
- **Open/Closed:** Extend via composition, not modification
- **Dependency Inversion:** Services depend on abstractions

### KISS & YAGNI

- **KISS:** Simple, readable code over clever solutions
- **YAGNI:** Implement only what's needed now

### DRY

- Shared types between Main and Renderer
- Reusable components and utilities
- No code duplication

## Recent Fixes & Current Status

### ✅ Completed Stabilization

**Infrastructure & Build:**

- Fixed `better-sqlite3` native build on Windows (resolved `node-gyp`, Python, and ABI version mismatches)
- App runs successfully via `npm run dev` and communicates with SQLite database
- **Database Worker Thread:** All database operations moved to dedicated worker thread for non-blocking main process

**Database & Schema:**

- Replaced incompatible `unixepoch` and JS-dates with raw SQL timestamps (ms)
- Added proper `UNIQUE` constraints to the `posts` table (`artistId` + `postId`) to enable correct UPSERT operations
- Added `sampleUrl` column for progressive image loading
- Migrations system (`drizzle-kit`) is fully functional
- **Worker Thread Architecture:** Database operations isolated in worker thread with RPC pattern

**Security & Reliability:**

- **Secure Storage:** API credentials encrypted using Electron's `safeStorage` API. Credentials encrypted at rest, decryption only in Main Process
- **Database Backup/Restore:** Manual backup and restore functionality implemented. Create timestamped backups and restore from files
- **Thread Safety:** Database operations run in dedicated worker thread, preventing main process blocking

**Data Integrity & Sync:**

- Implemented Tag Normalization in `AddArtistModal`: Inputs like "tag (123)" are now stripped to "tag" before saving/syncing
- SyncService correctly handles `ON CONFLICT` and populates the gallery
- Fixed timestamp handling: `lastChecked` now uses `new Date()` with proper Drizzle timestamp mode

**UI/UX:**

- Fixed "Soapy/Blurred" Previews: Image rendering quality for previews has been corrected
- Implemented Progressive Image Loading: 3-layer system (Preview → Sample → Original) for instant viewing
- Basic Gallery grid is functional
- AsyncAutocomplete component for artist/tag search with free-text input support
- **Search Functionality:** Local artist search and remote tag search via Rule34.xxx autocomplete API
- **Backup Controls:** UI component for creating and restoring database backups
- **Mark as Viewed:** Ability to mark posts as viewed for better organization

## Implemented Features

1. ✅ **Sync Service:** Dedicated service for Rule34.xxx API synchronization with progress tracking
2. ✅ **Settings Management:** Secure storage of API credentials with encryption using Electron's `safeStorage` API
3. ✅ **Artist Tracking:** Support for tag-based tracking with autocomplete search and tag normalization
4. ✅ **Post Gallery:** Grid view of cached posts with preview images and pagination
5. ✅ **Progressive Image Loading:** 3-layer loading system (Preview → Sample → Original) for instant viewing
6. ✅ **Artist Repair:** Resync functionality to update previews and fix sync issues
7. ✅ **Auto-Updater:** Automatic update checking and installation via electron-updater
8. ✅ **Event System:** Real-time IPC events for sync progress and update status
9. ✅ **Database Worker Thread:** All database operations run in dedicated worker thread for non-blocking performance
10. ✅ **Secure Storage:** API credentials encrypted at rest using Electron's `safeStorage` API
11. ✅ **Backup/Restore:** Manual database backup and restore functionality with timestamped backups
12. ✅ **Search Functionality:** Local artist search and remote tag search via Rule34.xxx autocomplete API
13. ✅ **Mark as Viewed:** Ability to mark posts as viewed for better organization

## Active Roadmap (Priority Tasks)

### A. Filters (Advanced Search) ⏳ Not Started

**Goal:** Allow users to refine the gallery view.

- Filter by **Rating** (Safe, Questionable, Explicit)
- Filter by **Media Type** (Image vs Video)
- Filter by **Tags** (Local search within downloaded posts)
- Sort by: Date Added (New/Old), Posted Date

**Status:** No filtering UI or logic implemented. `ArtistGallery` component currently displays all posts without filtering options.

### B. Download Manager ⏳ Not Started

**Goal:** Allow saving full-resolution files to the local file system.

- "Download Original" button on post view
- "Download All" for current filter/artist
- **Queue System:** Handle downloads in the background/main process
- **Settings:** Allow choosing a default download directory

**Status:** No download functionality for posts. Only auto-updater download exists.

### C. Playlists / Collections ⏳ Not Started

**Goal:** Create curated collections of posts independent of Artists/Trackers.

**Phase 1: MVP**

- New table `playlists` (`id`, `name`, `created_at`)
- New table `playlist_posts` (`playlist_id`, `post_id`, `added_at`)
- "⭐ Add to playlist" button on Post Card
- New Page/Tab: "Playlists"
- View Playlist: Grid view with filtering and sorting

**Status:** No playlist tables in schema, no playlist-related code implemented.

### 🛡️ Security & Reliability (Hardening)

See [Roadmap](./roadmap.md#-security--reliability-hardening) for detailed security improvements:

- ✅ **DB Worker Thread Migration** - ✅ **COMPLETED:** SQLite access moved to dedicated worker thread
- ✅ **Encrypt / Secure Storage for API Credentials** - ✅ **COMPLETED:** Using Electron's `safeStorage` API for encryption
- ✅ **Database Backup / Restore System** - ✅ **COMPLETED:** Manual backup and restore functionality implemented

### Future Considerations

1. **Tag Subscriptions:** Subscribe to tag combinations (schema ready)
2. **Content Script Injection:** DOM enhancements for external sites
3. **Statistics Dashboard:** Analytics on tracked artists and posts
4. **Dual-Module System:** Library mode (local database) and Browser mode (embedded webview)
5. **Multi-Booru Support:** Provider pattern abstraction for multiple booru sources

### Scalability

- Database can handle thousands of artists and posts
- Polling can be optimized with batching
- UI can be virtualized for large lists
- Provider abstraction allows adding new booru sources without core changes

## Performance Considerations

1. **Database Indexing:** Proper indexes on frequently queried fields
2. **Query Optimization:** Efficient Drizzle queries
3. **React Optimization:** Memoization where needed
4. **Lazy Loading:** Code splitting for large components

## Error Handling Strategy

1. **Fail Fast:** Validate inputs at boundaries
2. **Descriptive Errors:** Clear error messages
3. **Error Logging:** All errors logged via `electron-log`
4. **User Feedback:** Errors surfaced to UI appropriately
