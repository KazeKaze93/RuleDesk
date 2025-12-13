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
│  │  • Database (SQLite) │      │  • React UI          │    │
│  │  • API Clients       │      │  • State Management  │    │
│  │  • File I/O          │      │  • User Interactions │    │
│  │  • Background Jobs   │      │                      │    │
│  └──────────────────────┘      └──────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
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

1. **Database Service** (`src/main/db/db-service.ts`)

   - Manages all database operations
   - Uses Drizzle ORM for type-safe queries
   - Thread-safe SQLite access
   - Methods: getTrackedArtists, addArtist, deleteArtist, getPostsByArtist, savePostsForArtist, getSettings, saveSettings

2. **Sync Service** (`src/main/services/sync-service.ts`)

   - Handles Rule34.xxx API synchronization
   - Implements rate limiting and pagination
   - Maps API responses to database schema
   - Updates artist post counts

3. **IPC Handlers** (`src/main/ipc.ts`)

   - Registers all IPC communication channels
   - Validates input from Renderer using Zod schemas
   - Delegates to appropriate services
   - Security validation (e.g., openExternal URL whitelist)

4. **Bridge** (`src/main/bridge.ts`)

   - Defines the IPC interface
   - Exposed via preload script
   - Type-safe communication contract

5. **Main Entry** (`src/main/main.ts`)
   - Application initialization
   - Window creation
   - Security configuration
   - Database initialization and migrations

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
   - Methods: getSettings, saveSettings, getTrackedArtists, addArtist, deleteArtist, getArtistPosts, syncAll, openExternal

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
2. **Input Validation:** All inputs are validated in Main process
3. **Error Handling:** Errors are properly handled without exposing sensitive data
4. **No Direct Node Access:** Renderer cannot access Node.js APIs directly

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
DbService.getTrackedArtists()
    ↓
Drizzle ORM Query
    ↓
SQLite Database
    ↓
Return Artist[]
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
Main Process: Validation
    ↓
DbService.addArtist()
    ↓
Drizzle ORM Insert
    ↓
SQLite Database
    ↓
Return Artist
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

## Future Architecture Considerations

### Implemented Features

1. ✅ **Sync Service:** Dedicated service for Rule34.xxx API synchronization
2. ✅ **Settings Management:** Secure storage of API credentials
3. ✅ **Artist Tracking:** Support for tag-based and uploader-based tracking
4. ✅ **Post Gallery:** Grid view of cached posts with preview images

### Planned Features

1. **Download Manager:** Queue-based download system for posts
2. **Tag Subscriptions:** Subscribe to tag combinations (schema ready)
3. **Content Script Injection:** DOM enhancements for external sites
4. **Post Filtering:** Filter posts by rating, tags, date
5. **Statistics Dashboard:** Analytics on tracked artists and posts
6. **Dual-Module System:** Library mode (local database) and Browser mode (embedded webview)
7. **Multi-Booru Support:** Provider pattern abstraction for multiple booru sources

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
