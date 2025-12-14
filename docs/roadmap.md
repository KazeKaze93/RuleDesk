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

### A. Filters (Advanced Search) [Priority: High]

**Goal:** Allow users to refine the gallery view.

**UI:**
- Sidebar or Top Bar filter menu

**Functionality:**
- Filter by **Rating** (Safe, Questionable, Explicit)
- Filter by **Media Type** (Image vs Video)
- Filter by **Tags** (Local search within downloaded posts)
- Sort by: Date Added (New/Old), Posted Date

**Implementation Notes:**
- Use Drizzle ORM queries with proper filtering
- Maintain type safety with Zod/TypeScript
- Update UI state via React Query invalidation

---

### B. Download Manager [Priority: High]

**Goal:** Allow saving full-resolution files to the local file system (outside the app's internal DB cache).

**Features:**
- "Download Original" button on post view
- "Download All" for current filter/artist
- **Queue System:** Handle downloads in the background/main process to avoid freezing UI
- **Settings:** Allow choosing a default download directory

**Implementation Notes:**
- Downloads must run in Main Process (file I/O)
- Use IPC events for download progress updates
- Implement queue management to prevent overwhelming the system
- Store download preferences in settings table

---

### C. Playlists / Collections [Priority: Medium]

**Goal:** Create curated collections of posts independent of Artists/Trackers.

#### Phase 1: MVP

1. **Database:**
   - New table `playlists` (`id`, `name`, `created_at`)
   - New table `playlist_posts` (`playlist_id`, `post_id`, `added_at`)

2. **UI Interactions:**
   - "⭐ Add to playlist" button on Post Card (opens Popover: List of playlists + "Create New")
   - New Page/Tab: "Playlists"
   - View Playlist: Grid view of posts inside a playlist

3. **Logic:**
   - Filter inside playlist (Search tags by `LIKE`)
   - Sort by `addedAt`
   - Remove post from playlist
   - Delete/Rename playlist

**Implementation Notes:**
- Follow existing database patterns (Drizzle ORM, type safety)
- Use IPC for all database operations
- Maintain separation of concerns (Renderer ↔ Main)

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

## 📝 Notes

- All features must maintain backward compatibility
- Database migrations must be tested thoroughly
- UI/UX should follow existing design patterns
- Performance optimization is important for large datasets (6000+ posts)
