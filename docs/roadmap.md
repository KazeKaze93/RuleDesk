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

### A. Filters (Advanced Search) [Priority: High] ⏳ Not Started

**Goal:** Allow users to refine the gallery view.

**UI:**

- [ ] Sidebar or Top Bar filter menu

**Functionality:**

- [ ] Filter by **Rating** (Safe, Questionable, Explicit)
- [ ] Filter by **Media Type** (Image vs Video)
- [ ] Filter by **Tags** (Local search within downloaded posts)
- [ ] Sort by: Date Added (New/Old), Posted Date

**Implementation Notes:**

- Use Drizzle ORM queries with proper filtering
- Maintain type safety with Zod/TypeScript
- Update UI state via React Query invalidation

**Status:** No filtering UI or logic implemented. `ArtistGallery` component currently displays all posts without filtering options.

---

### B. Download Manager [Priority: High] ⏳ Not Started

**Goal:** Allow saving full-resolution files to the local file system (outside the app's internal DB cache).

**Features:**

- [ ] "Download Original" button on post view
- [ ] "Download All" for current filter/artist
- [ ] **Queue System:** Handle downloads in the background/main process to avoid freezing UI
- [ ] **Settings:** Allow choosing a default download directory

**Implementation Notes:**

- Downloads must run in Main Process (file I/O)
- Use IPC events for download progress updates
- Implement queue management to prevent overwhelming the system
- Store download preferences in settings table

**Status:** No download functionality for posts. Only auto-updater download exists.

---

### C. Playlists / Collections [Priority: Medium] ⏳ Not Started

**Goal:** Create curated collections of posts independent of Artists/Trackers.

#### Phase 1: MVP

1. **Database:**

   - [ ] New table `playlists` (`id`, `name`, `created_at`)
   - [ ] New table `playlist_posts` (`playlist_id`, `post_id`, `added_at`)

2. **UI Interactions:**

   - [ ] "⭐ Add to playlist" button on Post Card (opens Popover: List of playlists + "Create New")
   - [ ] New Page/Tab: "Playlists"
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

## 🛡️ Security & Reliability (Hardening)

### DB Worker Thread Migration (better-sqlite3) ✅ COMPLETED

**Goal:** Move ALL SQLite access out of Main into a dedicated Worker Thread (single DB actor).

**Tasks:**

- [x] Create dedicated Worker Thread for database operations
- [x] Replace direct `DbService` calls with worker RPC (request/response with correlationId + timeouts)
- [x] Run startup maintenance (schema fix / repair tags / migrations) inside worker (non-blocking UI)
- [x] Add basic progress events for long operations (maintenance/sync/repair)

**Implementation Notes:**

- Uses Node.js `worker_threads` module
- RPC pattern with correlation IDs for request/response matching implemented
- Timeout handling for worker requests implemented
- Type safety maintained across worker boundary via `WorkerRequest` and `WorkerResponse` types

**Status:** ✅ **COMPLETED:** All database operations now run in a dedicated worker thread (`src/main/db/db-worker.ts`). Main process communicates via `DbWorkerClient` (`src/main/db/db-worker-client.ts`).

---

### Encrypt / Secure Storage for API Credentials ✅ COMPLETED

**Goal:** Stop exposing raw API key to Renderer and encrypt credentials at rest.

**Tasks:**

- [x] Stop exposing raw API key to Renderer (decryption only in Main Process)
- [x] Store API key encrypted at rest using Electron's `safeStorage` API
- [x] Update settings flow: DB stores encrypted API key, decryption only when needed
- [x] Threat model: stolen `metadata.db` does not reveal API key in plaintext

**Implementation Notes:**

- Uses Electron's built-in `safeStorage` API (`electron.safeStorage`)
- Windows: Uses Windows Credential Manager (via Electron)
- macOS: Uses Keychain Services (via Electron)
- Linux: Uses libsecret (via Electron)
- `SecureStorage` class (`src/main/services/secure-storage.ts`) handles encryption/decryption
- API key is encrypted before saving to database, decrypted only in Main Process when needed for API calls

**Status:** ✅ **COMPLETED:** API keys are encrypted at rest using Electron's `safeStorage` API. Decryption only occurs in Main Process when needed for API calls.

---

### Database Backup / Restore System ✅ COMPLETED (Phase 1)

**Goal:** Add backup and restore functionality to protect user data.

**Tasks:**

- [x] Add manual "Backup now" action (create timestamped DB dump)
- [ ] Add automatic pre-maintenance backup (before migrations/repair) - **Future enhancement**
- [x] Add Restore flow (switch DB file atomically, re-run schema fix)
- [ ] Add integrity check command (`PRAGMA integrity_check`) + recovery suggestion - **Future enhancement**
- [ ] Retention policy for backups (keep last N, cleanup old) - **Future enhancement**

**Implementation Notes:**

- Backup location: User data directory with timestamped filenames
- Uses file copy with atomic operations
- Backup metadata includes timestamp in filename
- UI: `BackupControls` component (`src/renderer/components/BackupControls.tsx`) with backup/restore buttons
- IPC methods: `db:create-backup` and `db:restore-backup`
- Application automatically restarts after restore to ensure proper reinitialization

**Status:** ✅ **COMPLETED (Phase 1):** Manual backup and restore functionality implemented. Future enhancements include automatic backups, integrity checks, and retention policies.

---

## 📝 Notes

- All features must maintain backward compatibility
- Database migrations must be tested thoroughly
- UI/UX should follow existing design patterns
- Performance optimization is important for large datasets (6000+ posts)
