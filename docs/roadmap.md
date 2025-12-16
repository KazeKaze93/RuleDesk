# 🚀 Roadmap

## ✅ Recent Fixes & Current Status (COMPLETED)

We have successfully stabilized the application core. The following issues are RESOLVED:

### Infrastructure & Build

- ✅ Fixed `better-sqlite3` native build on Windows (resolved `node-gyp`, Python, and ABI version mismatches)
- ✅ App runs successfully via `npm run dev` and communicates with the SQLite database

### Database & Schema

- ✅ Replaced incompatible `unixepoch` and JS-dates with raw SQL timestamps (ms)
- ✅ Added proper `UNIQUE` constraints to the `posts` table (`artistId` + `postId`) to enable correct UPSERT operations
- ✅ Added `sampleUrl` column for progressive image loading
- ✅ Migrations system (`drizzle-kit`) is fully functional

### Data Integrity & Sync

- ✅ Implemented Tag Normalization in `AddArtistModal`: Inputs like "tag (123)" are now stripped to "tag" before saving/syncing
- ✅ SyncService correctly handles `ON CONFLICT` and populates the gallery
- ✅ Fixed timestamp handling: `lastChecked` now uses `new Date()` with proper Drizzle timestamp mode

### UI/UX

- ✅ Fixed "Soapy/Blurred" Previews: Image rendering quality for previews has been corrected
- ✅ Implemented Progressive Image Loading: 3-layer system (Preview → Sample → Original) for instant viewing
- ✅ Basic Gallery grid is functional
- ✅ AsyncAutocomplete component for artist/tag search with free-text input support

---

## 🚀 Active Roadmap (Priority Tasks)

We are moving to Feature Development. Implement the following modules:

## 🧭 Navigation & UX Revamp

### Sidebar Navigation

Implement a persistent sidebar with main navigation sections:

- **Updates** - Subscriptions feed (new posts from tracked sources)
- **Browse** - All posts view with advanced filtering
- **Favorites** - Account favorites synced from booru
- **Tracked** - Artists and tags management
- **Settings** - Application configuration

### Global Top Bar

Unified top bar on all content pages:

- **Search Bar** - Quick search across posts, tags, artists
- **Filters Panel** - Rating, media type, tags, date range filters
- **Sort Controls** - Sort by date added, posted date, rating
- **View Toggle** - Grid, list, masonry layout options
- **Sync Status** - Real-time sync indicator with last sync timestamp

### Viewer Polish

Enhanced full-screen viewer experience:

- **Auto-hide Bars** - Top and bottom bars hide after inactivity
- **Tags Sheet** - Right-side slide-over drawer with clickable tags
  - Click tag to add filter (`+tag`)
  - Right-click or modifier key to exclude (`-tag`)
  - Visual indicators for active filters
- **Tooltips** - Keyboard shortcuts and action hints
- **Keyboard Shortcuts:**
  - `Esc` - Close viewer
  - `←/→` - Navigate between posts
  - `F` - Toggle favorite
  - `V` - Mark as viewed
  - `T` - Toggle tags drawer

### Gallery Card Overlays

Post cards with informative overlays:

- **Viewed Badge** - Indicator for viewed posts
- **Favorite Badge** - Star icon for favorited posts
- **Rating Badge** - Visual indicator (Safe/Questionable/Explicit)
- **Media Type Badge** - Icon for image/video content

### Progressive Image Loading

Optimized loading strategy:

- **Preview URL** - Low-res blurred preview (instant display in gallery)
- **Sample URL** - Medium-res sample (loaded in gallery)
- **File URL** - Full-res original (loaded only in viewer)

## 📰 Subscriptions / Updates

### Feed Tab

Unified feed showing all new posts:

- **All New Posts** - Combined feed from all tracked sources
- **Filters** - Apply tags, rating, media type filters
- **Infinite Scroll** - Progressive loading as user scrolls
- **Mark as Read** - Batch mark posts as viewed

### Creators Tab

List/tile view of creators with new post counts:

- **Creator List** - Grid or list view of tracked artists
- **New Count Badge** - Display number of unviewed posts per creator
- **Quick Actions** - Sync, repair, view gallery per creator
- **Filters** - Filter creators by type (tag/uploader)

### Filters

Advanced filtering within Updates section:

- **Tag Filters** - Include/exclude specific tags
- **Rating Filter** - Safe, Questionable, Explicit
- **Media Type Filter** - Images, Videos, or both
- **Date Range** - Filter by publication date

## 🛡️ Security & Reliability (Hardening)

### API Key Security

Enhanced security for API credentials:

- **Renderer Isolation** - Renderer process never receives raw API key
- **Safe Storage** - Use Electron's `safeStorage` API (Windows Credential Manager, macOS Keychain, Linux libsecret)
- **AES-GCM Policy** - Encrypt API keys at rest with AES-GCM encryption
- **Threat Model** - Stolen database file does not reveal API key in plaintext

**Status:** ✅ **COMPLETED:** API keys encrypted at rest, decryption only in Main Process.

### Database Backups & Integrity

Comprehensive database protection:

- **Backup System** - Manual and automatic pre-maintenance backups
- **Restore Flow** - Restore from backup with automatic restart
- **Integrity Check** - Run `PRAGMA integrity_check` and display results
- **Retention Policy** - Keep last N backups, auto-cleanup old backups

**Status:** ✅ **Phase 1 COMPLETED:** Manual backup/restore implemented. Future: Auto-backups, integrity check UI, retention policy.

### Auto Maintenance

Non-blocking database maintenance:

- **Worker Thread** - All heavy operations run in database worker thread
- **Non-blocking** - Maintenance operations don't freeze UI
- **Progress Events** - Real-time progress updates for long operations
- **Scheduled Runs** - Automatic maintenance on startup or periodic intervals

**Status:** ✅ **COMPLETED:** Database operations run in worker thread. Future: Scheduled maintenance runs.

## 📋 Milestones

### MVP (Minimum Viable Product)

Core features for initial release:

- ✅ **Navigation & Sidebar** - Basic sidebar with main sections (implemented)
- ✅ **Global Top Bar** - Search, filters, sort, view toggle UI (implemented, backend filtering pending)
- ✅ **Viewer Polish** - Full-screen viewer with keyboard shortcuts, download, favorites (implemented)
- ✅ **Progressive Loading** - Preview → Sample → Original (implemented)
- ⏳ **Auto-sync Startup** - Toggle for automatic sync on app launch (planned)
- ✅ **Worker Threads** - Database operations in worker thread (completed)
- ✅ **Download Manager** - Individual file downloads with progress tracking (implemented)
- ✅ **Favorites System** - Mark and manage favorite posts (implemented)

### Next Phase

Enhanced features after MVP:

- ✅ **Favorites System** - Mark and manage favorite posts (implemented)
- ✅ **Tag Autocomplete** - Local and remote tag search with autocomplete (implemented)
- ⏳ **Favorites Sync** - Sync account favorites from booru (planned)
- ⏳ **Playlists Groundwork** - Basic playlist tables and UI structure (planned)
- ⏳ **Periodic Sync** - Configurable interval sync while app running (planned)
- ⏳ **Card Overlays** - Viewed, favorite, rating, media type badges (partially implemented - viewed and favorite badges exist)

### Later Phase

Advanced features for future releases:

- ⏳ **Smart Playlists** - Auto-fill playlists based on tag rules
- ⏳ **Normalized Tag Index** - Full-text search on tags
- ⏳ **Advanced Caching** - Intelligent cache management with size limits
- ⏳ **Proxy Support** - Optional proxy configuration for API requests
- ⏳ **Multi-Booru** - Provider pattern for multiple booru sources

### A. Filters (Advanced Search) [Priority: High] 🚧 In Progress

**Goal:** Allow users to refine the gallery view.

**UI:**

- ✅ Top Bar filter panel (part of Global Top Bar) - UI implemented
- ✅ Search bar in Global Top Bar
- ✅ Sort dropdown in Global Top Bar
- ✅ View toggle (Grid/List) in Global Top Bar

**Functionality:**

- ⏳ Filter by **Rating** (Safe, Questionable, Explicit) - UI ready, backend filtering pending
- ⏳ Filter by **Media Type** (Image vs Video) - UI ready, backend filtering pending
- ⏳ Filter by **Tags** (Local search within downloaded posts) - UI ready, backend filtering pending
- ⏳ Sort by: Date Added (New/Old), Posted Date - UI ready, backend sorting pending

**Implementation Notes:**

- Use Drizzle ORM queries with proper filtering
- Maintain type safety with Zod/TypeScript
- Update UI state via React Query invalidation

**Status:** UI components implemented in `GlobalTopBar.tsx`. Backend filtering and sorting logic needs to be connected to the UI controls.

---

### B. Download Manager [Priority: High] ✅ Implemented (Partial)

**Goal:** Allow saving full-resolution files to the local file system (outside the app's internal DB cache).

**Features:**

- ✅ "Download Original" button on post view (implemented in ViewerDialog)
- ✅ **Queue System:** Handle downloads in the background/main process with progress tracking
- ✅ **Progress Events:** Real-time download progress via IPC events (`onDownloadProgress`)
- ✅ **File Management:** Open downloaded file in folder (`openFileInFolder`)
- ⏳ "Download All" for current filter/artist (planned)
- ⏳ **Settings:** Allow choosing a default download directory (planned)

**Implementation Notes:**

- Downloads run in Main Process (file I/O) via `registerFileHandlers`
- IPC events provide download progress updates
- Queue management prevents overwhelming the system
- Download preferences can be stored in settings table (future enhancement)

**Status:** Core download functionality implemented. Individual file downloads work with progress tracking. Batch download and default directory settings are planned for future releases.

---

### C. Playlists / Collections [Priority: Medium] ⏳ Not Started

**Goal:** Create curated collections of posts independent of Artists/Trackers.

#### Phase 1: MVP

1. **Database:**

   - [ ] New table `playlists` (`id`, `name`, `created_at`)
   - [ ] New table `playlist_posts` (`playlist_id`, `post_id`, `added_at`)

2. **UI Interactions:**

   - [ ] "⭐ Add to playlist" button on Post Card (opens Popover: List of playlists + "Create New")
   - [ ] New Page/Tab: "Playlists" (in Sidebar)
   - [ ] View Playlist: Grid view of posts inside a playlist

3. **Logic:**
   - [ ] Filter inside playlist (Search tags by `LIKE`)
   - [ ] Sort by `addedAt`
   - [ ] Remove post from playlist
   - [ ] Delete/Rename playlist

**Implementation Notes:**

- Follow existing database patterns (Drizzle ORM, type safety)
- Use IPC for all database operations
- Maintain separation of concerns (Renderer ↔ Main)

**Status:** No playlist tables in schema, no playlist-related code implemented.

#### Phase 2: Future Improvements (Not for now)

- Drag & Drop sorting
- Smart/Dynamic Playlists (Auto-fill based on tags)
- JSON Export/Import

---

## 🏗️ Architecture Considerations

### Design Principles

- **KISS & YAGNI:** Keep It Simple, Stupid. You Aren't Gonna Need It.
- **SOLID:** Single Responsibility, Open/Closed, Dependency Inversion
- **DRY:** Don't Repeat Yourself
- **Type Safety:** Strict TypeScript, Zod validation, no `any` types
- **Separation of Concerns:** Renderer (UI) ↔ Main Process (I/O, DB, API)

### Implementation Guidelines

- Maintain current schema patterns (no regression)
- Strict type safety (Zod/TypeScript)
- Separation of Concerns (Renderer vs Main process)
- Follow existing IPC patterns and service architecture
- Use Drizzle ORM for all database operations (no raw SQL)
- Proper error handling with descriptive messages

---

## 🔮 Long-Term Goals (Future Considerations)

### Multi-Booru Support

- Refactor `SyncService` into Provider Pattern
- Abstract booru-specific logic
- Support for Danbooru, Gelbooru, etc.

### Dual-Module System

- **Module 1: Library** - Local database, favorites, gallery
- **Module 2: Browser** - Embedded Webview for native site navigation
  - JS injection (`preload`) for site integration
  - Floating Action Button (FAB) "Track Artist" overlay

### Statistics Dashboard

- Analytics on tracked artists and posts
- Sync history and statistics
- Content analysis

---

---

## 📝 Notes

- All features must maintain backward compatibility
- Database migrations must be tested thoroughly
- UI/UX should follow existing design patterns
- Performance optimization is important for large datasets (6000+ posts)
