# ruledesk

# 💻 RuleDesk

> A modern, secure desktop companion built on Electron and React/TypeScript for browsing and organizing booru-style imageboard content via its public API. Designed for performance and maintainability.

---

---

## ⚠️ Disclaimer & Risk Assessment

This project is **unofficial** and **not affiliated** with any external website or company.

- **Content Risk:** The application does **not** host, redistribute, or bundle any media. All content is loaded directly from the original website's API or CDN. Users are responsible for adhering to local laws regarding NSFW content and the target website’s API Terms of Service (ToS).
- **API Risk (Polling):** The Core Services are implemented with strict **Exponential Backoff** and **Rate Limiting** to minimize the risk of IP/key bans due to abusive polling behavior.
- **Security Posture:** The application is configured with mandatory Electron security hardening (Context Isolation, Preload Scripts) to prevent any potential Remote Code Execution (RCE) via the renderer process.

---

## ✨ Features

| Feature                           | Description                                                                                                                                                                                                                                                                                  |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🔐 API Authentication**         | Secure onboarding flow for Rule34.xxx API credentials (User ID and API Key). Credentials encrypted using Electron's `safeStorage` API and stored securely. Decryption only happens in Main Process when needed for API calls.                                                                |
| **👤 Artist Tracking**            | Track artists/uploaders by tag or username. Add, view, and delete tracked artists. Supports tag-based tracking with autocomplete search (local and remote Rule34.xxx API). Tag normalization automatically strips metadata like "(123)" from tag names.                                      |
| **🔄 Background Synchronization** | Sync service fetches new posts from Rule34.xxx API with rate limiting (1.5s delay between artists, 0.5s between pages). Implements exponential backoff and proper error handling. Real-time sync progress updates via IPC events.                                                            |
| **💾 Local Metadata Database**    | Uses **SQLite** via **Drizzle ORM** (TypeScript mandatory). Database operations run in a dedicated **Worker Thread** to prevent blocking the main process. Stores artists, posts metadata (tags, ratings, URLs, sample URLs), and settings. Thread-safe architecture ensures data integrity. |
| **🖼️ Artist Gallery**             | View cached posts for each tracked artist in a responsive grid layout. Shows preview images, ratings, and metadata. Click to open external link to Rule34.xxx. Supports pagination and artist repair/resync functionality. Mark posts as viewed for better organization.                     |
| **🎨 Progressive Image Loading**  | 3-layer progressive image loading system: Preview (blurred/low-res) → Sample (medium-res) → Original (high-res). Provides instant visual feedback with smooth quality enhancement.                                                                                                           |
| **📊 Post Metadata**              | Cached posts include file URLs, preview URLs, sample URLs, tags, ratings, and publication timestamps. Enables offline browsing and fast filtering.                                                                                                                                           |
| **🔧 Artist Repair**              | Repair/resync functionality to update low-quality previews or fix synchronization issues. Resets artist's last post ID and re-fetches initial pages.                                                                                                                                         |
| **💾 Backup & Restore**           | Manual database backup and restore functionality. Create timestamped backups to protect your data. Restore from backup files with automatic application restart. Backup files are stored in the user data directory.                                                                         |
| **🔍 Search Functionality**       | Search for artists locally and search for tags remotely via Rule34.xxx autocomplete API. Supports both local database search and remote tag suggestions.                                                                                                                                     |
| **⭐ Favorites System**           | Mark posts as favorites and manage your favorite collection. Toggle favorite status with keyboard shortcut (`F`) in viewer or via UI controls. Favorites are stored locally in the database.                                                                                                 |
| **⬇️ Download Manager**           | Download full-resolution media files to your local file system. Download individual posts or manage download queue. Files are saved to user-selected directory with progress tracking.                                                                                                       |
| **🖥️ Full-Screen Viewer**         | Immersive viewer with keyboard shortcuts, download controls, favorite toggling, and tag management. Auto-hide controls, navigation between posts, and comprehensive media viewing experience.                                                                                                |
| **🧭 Navigation & Layout**        | Sidebar navigation with dedicated pages: Updates, Browse, Favorites, Tracked, and Settings. Global Top Bar with search, filters, sort controls, and view toggles. Responsive layout with modern UI components.                                                                               |
| **🔄 Auto-Updater**               | Built-in automatic update checker using `electron-updater`. Notifies users of available updates, supports manual download, and provides seamless installation on app restart.                                                                                                                |
| **🌐 Clean English UI**           | Fully localized English interface using i18next. All UI components and logs use English language for consistency and maintainability.                                                                                                                                                        |
| **🔌 Multi-Source Ready**         | Architecture designed for future multi-booru support. Provider pattern abstraction allows adding new sources (Danbooru, Gelbooru, etc.) without core database changes.                                                                                                                       |

---

## 🏗️ Architecture Overview & Tech Stack

The application adheres to a strict **Separation of Concerns (SoC)** model:

### 1. Core Services (The Brain - Electron Main Process)

This is the secure Node.js environment. It handles all I/O, persistence, and secrets.

- **Desktop Runtime:** **Electron** (chosen for `BrowserView`/`Webview` control to support DOM injection).
- **Database:** **SQLite** (via `better-sqlite3` driver) running in a **dedicated Worker Thread** for non-blocking operations.
- **Data Layer:** **Drizzle ORM** (TypeScript type-safety for queries, raw SQL timestamps in milliseconds).
- **Security:** **Secure Storage** using Electron's `safeStorage` API for encrypting API credentials at rest.
- **API:** Custom wrapper based on `fetch`/`axios` with retry and backoff logic.
- **Background Jobs:** Node.js timers and asynchronous workers.

### 2. Renderer (The Face - UI Process)

This is the sandboxed browser environment. It handles presentation.

- **Frontend:** **React + TypeScript**
- **Styling:** **Tailwind CSS + shadcn/ui** (modern UI, good baseline A11y).
- **State Management:** **Zustand** (minimalistic state layer, aligned with KISS/YAGNI).
- **Data Fetching:** **TanStack Query (React Query)** (caching, loading states, API boundary).

### 3. Security Boundary (The Gatekeeper)

- **IPC Bridge:** Strictly typed TypeScript interface (`bridge.ts`) used by the Renderer to communicate with the Main Process.
- **Security:** **Context Isolation** enforced globally; no direct Node.js access from the Renderer.
- **Encryption:** API credentials encrypted using Electron's `safeStorage` API. Decryption only occurs in Main Process when needed for API calls.
- **Worker Thread Isolation:** Database operations run in a separate worker thread, providing additional isolation and preventing main process blocking.

## 📐 Product Structure

The application is organized into the following main sections accessible via the Sidebar:

- **Updates (Subscriptions)** - View new posts from tracked artists and tag subscriptions
- **Browse (All posts)** - Browse all cached posts with advanced filtering and search
- **Favorites (Account favorites)** - Access your account favorites synced from the booru
- **Tracked (Artists/Tags management)** - Manage tracked artists, tags, and subscriptions
- **Settings** - Configure sync behavior, storage limits, security, and database maintenance

## 🎨 Core UX Principles

### Global Top Bar

A unified Top Bar appears on all content pages providing:

- **Search** - Quick search across posts, tags, and artists
- **Filters** - Rating, media type, tags, date range
- **Sort** - Sort by date added, posted date, rating, etc.
- **View Toggle** - Switch between grid, list, and masonry layouts
- **Sync Status** - Real-time sync progress indicator with last sync timestamp

### Viewer Experience

The full-screen viewer provides a polished media viewing experience:

- **Full-screen Mode** - Immersive viewing with auto-hide controls
- **Navigation** - Arrow keys (←/→) for previous/next post
- **Hotkeys:**
  - `Esc` - Close viewer
  - `←/→` - Navigate between posts
  - `F` - Toggle favorite
  - `V` - Mark as viewed
  - `T` - Toggle tags drawer
- **Auto-hide Bars** - Top and bottom bars automatically hide after inactivity
- **Tags Drawer** - Right-side sheet (Slide-over) with clickable tags:
  - Click tag to add filter (`+tag`)
  - Right-click or modifier key to exclude (`-tag`)
  - Visual indicators for active filters

### Progressive Image Loading

Optimized image loading strategy for performance:

- **Preview URL** - Low-resolution blurred preview (instant display)
- **Sample URL** - Medium-resolution sample (loaded in gallery)
- **File URL** - Full-resolution original (loaded only in viewer)

This ensures fast initial page loads while maintaining high-quality viewing experience.

### Gallery Cards

Post cards in gallery views include informative overlays:

- **Viewed Badge** - Indicator for already viewed posts
- **Favorite Badge** - Star icon for favorited posts
- **Rating Badge** - Visual indicator (Safe/Questionable/Explicit)
- **Media Type Badge** - Icon indicating image or video content

## 🔄 Sync & Background

### Auto-sync on Startup

Automatic synchronization when the application starts:

- **Toggle Setting** - Enable/disable auto-sync in Settings
- **Background Execution** - Sync runs in background without blocking UI
- **Progress Indicators** - Real-time sync status in Top Bar

### Periodic Sync

Continuous synchronization while the application is running:

- **Configurable Interval** - Set sync frequency in Settings (e.g., every 30 minutes)
- **Smart Rate Limiting** - Prevents API spam with intelligent backoff
- **Last Sync Status** - Display last successful sync timestamp
- **Respectful Polling** - Implements exponential backoff and respects API limits

## ⚙️ Settings

### Sync Settings

- **Auto-sync on Startup** - Toggle automatic sync when app launches
- **Periodic Sync Interval** - Configure how often to check for new posts
- **Rate Limiting** - Adjust delays between API requests

### Storage & Cache

- **Cache Limit** - Set maximum cache size (preview/sample images)
- **Clear Cache** - Manual cache cleanup option
- **Storage Usage** - Display current cache size and database size

### Security

- **API Key Storage** - Secure storage using Electron's `safeStorage` API
  - API keys are **never** sent to Renderer process
  - Encrypted at rest using platform keychain (Windows Credential Manager, macOS Keychain, Linux libsecret)
  - Decryption only occurs in Main Process when needed for API calls
- **Threat Model** - Stolen database file does not reveal API key in plaintext

### Database Management

- **Backup & Restore** - Create timestamped backups and restore from backup files
- **Integrity Check** - Run database integrity verification (`PRAGMA integrity_check`)
- **Vacuum/Compact** - Optimize database file size and performance
- **Maintenance** - Automatic maintenance runs in worker thread (non-blocking)

## ✅ Recent Fixes & Current Status

The application core has been successfully stabilized and enhanced with security improvements:

### Infrastructure & Build

- ✅ Fixed `better-sqlite3` native build on Windows (resolved `node-gyp`, Python, and ABI version mismatches)
- ✅ App runs successfully via `npm run dev` and communicates with SQLite database
- ✅ **Database Worker Thread:** All database operations moved to a dedicated worker thread for non-blocking main process

### Database & Schema

- ✅ Replaced incompatible `unixepoch` and JS-dates with raw SQL timestamps (ms)
- ✅ Added proper `UNIQUE` constraints to the `posts` table (`artistId` + `postId`) to enable correct UPSERT operations
- ✅ Added `sampleUrl` column for progressive image loading
- ✅ Migrations system (`drizzle-kit`) is fully functional
- ✅ **Worker Thread Architecture:** Database operations isolated in worker thread with RPC pattern

### Security & Reliability

- ✅ **Secure Storage:** API credentials encrypted using Electron's `safeStorage` API. Credentials encrypted at rest, decryption only in Main Process
- ✅ **Database Backup/Restore:** Manual backup and restore functionality implemented. Create timestamped backups and restore from files
- ✅ **Thread Safety:** Database operations run in dedicated worker thread, preventing main process blocking

### Data Integrity & Sync

- ✅ Implemented Tag Normalization in `AddArtistModal`: Inputs like "tag (123)" are now stripped to "tag" before saving/syncing
- ✅ SyncService correctly handles `ON CONFLICT` and populates the gallery
- ✅ Fixed timestamp handling: `lastChecked` now uses `new Date()` with proper Drizzle timestamp mode

### UI/UX

- ✅ Fixed "Soapy/Blurred" Previews: Image rendering quality for previews has been corrected
- ✅ Implemented Progressive Image Loading: 3-layer system (Preview → Sample → Original) for instant viewing
- ✅ Basic Gallery grid is functional
- ✅ AsyncAutocomplete component for artist/tag search with free-text input support
- ✅ **Search Functionality:** Local artist search and remote tag search via Rule34.xxx autocomplete API
- ✅ **Backup Controls:** UI component for creating and restoring database backups
- ✅ **Mark as Viewed:** Ability to mark posts as viewed for better organization
- ✅ **Sidebar Navigation:** Persistent sidebar with main navigation sections (Updates, Browse, Favorites, Tracked, Settings)
- ✅ **Global Top Bar:** Unified top bar with search, filters, sort controls, and view toggles
- ✅ **Full-Screen Viewer:** Immersive viewer with keyboard shortcuts, download, favorites, and tag management
- ✅ **Download Manager:** Download full-resolution files with progress tracking and queue management
- ✅ **Favorites System:** Mark and manage favorite posts with keyboard shortcuts and UI controls
- ✅ **Credential Verification:** Verify API credentials before saving and during sync operations

---

## 🚀 Quick Start

### First Launch

1. **Get API Credentials:**

   - Visit https://rule34.xxx/index.php?page=account&s=options
   - Copy your **User ID** and **API Key** from the API Access section

2. **Onboarding:**

   - Launch the application
   - Enter your User ID and API Key in the onboarding screen
   - Click "Save and Login"

3. **Add Artists:**

   - Click "Add Artist" button
   - Enter artist name and tag
   - Select type (tag or uploader)
   - Click "Add"

4. **Sync Posts:**
   - Click "Sync All" to fetch posts from Rule34.xxx
   - Wait for synchronization to complete (progress updates shown in real-time)
   - Click on an artist to view their gallery
   - Use "Repair" button in gallery to resync and update preview quality if needed

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[API Documentation](./docs/api.md)** - IPC API reference and usage examples
- **[Architecture Documentation](./docs/architecture.md)** - System architecture and design patterns
- **[Roadmap](./docs/roadmap.md)** - Development roadmap and planned features
- **[Contributing Guide](./docs/contributing.md)** - Guidelines for contributors
- **[Database Documentation](./docs/database.md)** - Database schema and operations
- **[Development Guide](./docs/development.md)** - Development setup and workflows

## 🚀 Active Roadmap

We are moving to Feature Development. Priority tasks:

### A. Filters (Advanced Search) 🚧 In Progress

**Goal:** Allow users to refine the gallery view.

- ✅ **Global Top Bar UI:** Search bar, filter button, sort dropdown, and view toggle implemented
- ⏳ Filter by **Rating** (Safe, Questionable, Explicit) - UI ready, backend filtering pending
- ⏳ Filter by **Media Type** (Image vs Video) - UI ready, backend filtering pending
- ⏳ Filter by **Tags** (Local search within downloaded posts) - UI ready, backend filtering pending
- ⏳ Sort by: Date Added (New/Old), Posted Date - UI ready, backend sorting pending

### B. Download Manager ✅ Implemented

**Goal:** Allow saving full-resolution files to the local file system.

- ✅ "Download Original" button on post view (implemented in ViewerDialog)
- ✅ **Queue System:** Handle downloads in the background/main process with progress tracking
- ✅ **Progress Events:** Real-time download progress via IPC events
- ⏳ "Download All" for current filter/artist (planned)
- ⏳ **Settings:** Allow choosing a default download directory (planned)

### C. Playlists / Collections ⏳ Not Started

**Goal:** Create curated collections of posts independent of Artists/Trackers.

**Phase 1: MVP**

- New table `playlists` (`id`, `name`, `created_at`)
- New table `playlist_posts` (`playlist_id`, `post_id`, `added_at`)
- "⭐ Add to playlist" button on Post Card
- New Page/Tab: "Playlists"
- View Playlist: Grid view with filtering and sorting

### 🛡️ Security & Reliability (Hardening)

- ✅ **DB Worker Thread Migration** - ✅ **COMPLETED:** All SQLite operations run in dedicated worker thread with RPC pattern. Database worker provides non-blocking operations and thread-safe access.
- ✅ **Encrypt / Secure Storage for API Credentials** - ✅ **COMPLETED:** Using Electron's `safeStorage` API for encryption. API keys encrypted at rest, never exposed to Renderer process.
- ✅ **Database Backup / Restore System** - ✅ **COMPLETED:** Manual backup and restore functionality implemented with timestamped backups.

See [Roadmap](./docs/roadmap.md) for detailed implementation status and requirements.

---

## ⚙️ Development Setup

This project uses **Vite** as the build tool for both the Electron Main and Renderer processes, ensuring optimal build performance.

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/KazeKaze93/ruledesk.git
cd ruledesk

# Install dependencies
npm install

# Start the application in development mode
# This runs the Vite dev server for the Renderer and starts the Electron Main process.
npm run dev
```

### Configuration

The application stores configuration in SQLite database:

- **API Credentials:** Stored securely with encryption using Electron's `safeStorage` API. API keys are encrypted at rest and only decrypted in Main Process when needed for API calls.
- **Database Location:** Electron user data directory (automatically managed)
- **Database Architecture:** All database operations run in a dedicated worker thread for non-blocking performance
- **No Environment Variables Required:** All configuration is handled through the UI

### Building the Binary

To package the application for distribution:

```bash
# Build for current platform
npm run build

# Package with electron-builder (after build)
npx electron-builder
```

The built binaries will be available in the `dist/` directory. The exact output location may vary depending on your Electron builder configuration.

### Quality Checks

Run the following commands to ensure code quality:

```bash
# Type checking
npm run typecheck

# Run linter to check code style and potential issues
npm run lint

# Run both (validation)
npm run validate
```

## 📜 License

This project is licensed under the **Apache License 2.0**.

You may use, reproduce, modify, distribute, and sublicense the software under the terms of the Apache License 2.0. The license also includes an express patent grant and requires preservation of copyright and license notices.

The full license text is available in the `LICENSE` file in this repository.

---

## 🧾 Legal Disclaimer

By using this software, you acknowledge and agree to the following:

**18+ Only:** This application is intended exclusively for adults (18+) in jurisdictions where viewing NSFW content is legal.

**No Content Hosting:** The application does not host, store, mirror, or redistribute any media content. All media is requested directly from the original website’s API/CDN at the user’s initiative.

**Use at Your Own Risk:** The authors and contributors of this project:

* Do not control the content provided by third-party services.
* Do not endorse, moderate, or curate any content accessed through this software.
* Are not responsible for how you use this software or which content you access with it.

**Compliance with Laws & ToS:** You are solely responsible for:

* Complying with the laws and regulations applicable in your country/region.
* Complying with the target website's Terms of Service, API rules, and any usage limitations (including rate limits and content policies).

**No Warranty / Limitation of Liability:** This software is provided “AS IS”, without warranties or conditions of any kind, either express or implied. To the fullest extent permitted by applicable law, in no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.


---

## ⚙️ Database Management

### Migrations

If you modify the database schema (`src/main/db/schema.ts`):

```bash
# Generate migration from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio to inspect database
npm run db:studio
```

**Note:** Migrations run automatically on application startup.

---

## 🛡️ Code Quality Standards

This project adheres to strict development principles:

- **Architecture:** SOLID, DRY, KISS, YAGNI principles
- **TypeScript:** Strict typing, no `any` or unsafe casts
- **Error Handling:** Proper error handling with descriptive messages
- **Security:** Context Isolation, no direct Node.js access from Renderer
- **Database:** Type-safe queries via Drizzle ORM, no raw SQL
- **UI:** Tailwind CSS only, no inline styles, accessibility considerations

See [Contributing Guide](./docs/contributing.md) for detailed guidelines.
