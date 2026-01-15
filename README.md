# 💻 RuleDesk

> A modern, secure desktop companion built on Electron and React/TypeScript for browsing and organizing booru-style imageboard content via its public API. Designed for performance and maintainability.

**Current Version:** 4.0.0

**🌐 Languages:** [English](README.md) | [Русский](.docs-i18n/ru/README.md)

---

## 📑 Table of Contents

- [Disclaimer & Risk Assessment](#-disclaimer--risk-assessment)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Architecture Overview](#-architecture-overview--tech-stack)
- [Product Structure](#-product-structure)
- [Core UX Principles](#-core-ux-principles)
- [Sync & Background](#-sync--background)
- [Settings](#-settings)
- [Current Status](#-current-status)
- [Active Roadmap](#-active-roadmap)
- [Development Setup](#-development-setup)
- [License & Legal](#-license--legal)

---

## ⚠️ Disclaimer & Risk Assessment

This project is **unofficial** and **not affiliated** with any external website or company.

- **Content Risk:** The application does **not** host, redistribute, or bundle any media. All content is loaded directly from the original website's API or CDN. Users are responsible for adhering to local laws regarding NSFW content and the target website’s API Terms of Service (ToS).
- **API Risk (Polling):** The Core Services are implemented with strict **Exponential Backoff** and **Rate Limiting** to minimize the risk of IP/key bans due to abusive polling behavior.
- **Security Posture:** The application is configured with mandatory Electron security hardening (Context Isolation, Preload Scripts) to prevent any potential Remote Code Execution (RCE) via the renderer process.

---

## ✨ Features

| Feature                           | Description                                                                                                                                                                                                                                                                                                                                            |
| :-------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🔐 API Authentication**         | Secure onboarding flow for Rule34.xxx API credentials (User ID and API Key). Credentials encrypted using Electron's `safeStorage` API and stored securely. Decryption only happens in Main Process when needed for API calls.                                                                                                                          |
| **👤 Artist Tracking**            | Track artists/uploaders by tag or username. Add, view, and delete tracked artists. Supports tag-based tracking with autocomplete search (local and remote Rule34.xxx API). Tag normalization automatically strips metadata like "(123)" from tag names.                                                                                                |
| **🔄 Background Synchronization** | Sync service fetches new posts from Rule34.xxx API with rate limiting (1.5s delay between artists, 0.5s between pages). Implements exponential backoff and proper error handling. Real-time sync progress updates via IPC events.                                                                                                                      |
| **💾 Local Metadata Database**    | Uses **SQLite** via **Drizzle ORM** (TypeScript mandatory). Direct synchronous access via `better-sqlite3` in Main Process. Stores artists, posts metadata (tags, ratings, URLs, sample URLs), and settings. WAL mode enabled for concurrent reads.                                                                                                    |
| **🖼️ Artist Gallery**             | View cached posts for each tracked artist in a responsive grid layout. Shows preview images, ratings, and metadata. Click to open external link to Rule34.xxx. Supports pagination and artist repair/resync functionality. Mark posts as viewed for better organization.                                                                               |
| **🎨 Progressive Image Loading**  | 3-layer progressive image loading system: Preview (blurred/low-res) → Sample (medium-res) → Original (high-res). Provides instant visual feedback with smooth quality enhancement.                                                                                                                                                                     |
| **📊 Post Metadata**              | Cached posts include file URLs, preview URLs, sample URLs, tags, ratings, and publication timestamps. Enables offline browsing and fast filtering.                                                                                                                                                                                                     |
| **🔧 Artist Repair**              | Repair/resync functionality to update low-quality previews or fix synchronization issues. Resets artist's last post ID and re-fetches initial pages.                                                                                                                                                                                                   |
| **💾 Backup & Restore**           | Manual database backup and restore functionality. Create timestamped backups to protect your data. Restore from backup files with automatic application restart. Backup files are stored in the user data directory.                                                                                                                                   |
| **🔍 Search Functionality**       | Search for artists locally, search for tags remotely via booru autocomplete API, and search posts directly on booru (`searchBooru`). Tag resolution methods (`resolveTags`, `resolveCharacterTags`, `resolveCopyrightTags`, `resolveTagsByType`) for identifying artist, character, and copyright tags. Multi-provider support (Rule34.xxx, Gelbooru). |
| **⭐ Favorites System**           | Mark posts as favorites and manage your favorite collection. Toggle favorite status with keyboard shortcut (`F`) in viewer or via UI controls. Favorites are stored locally in the database.                                                                                                                                                           |
| **⬇️ Download Manager**           | Download full-resolution media files to your local file system. Download individual posts or manage download queue. Files are saved to user-selected directory with progress tracking.                                                                                                                                                                 |
| **🖥️ Full-Screen Viewer**         | Immersive viewer with keyboard shortcuts, download controls, favorite toggling, and tag management. Auto-hide controls, navigation between posts, and comprehensive media viewing experience.                                                                                                                                                          |
| **🧭 Navigation & Layout**        | Sidebar navigation with dedicated pages: Updates, Browse, Favorites, Tracked, and Settings. Global Top Bar with search, filters, sort controls, and view toggles. Responsive layout with modern UI components.                                                                                                                                         |
| **🔄 Auto-Updater**               | Built-in automatic update checker using `electron-updater`. Notifies users of available updates, supports manual download, and provides seamless installation on app restart.                                                                                                                                                                          |
| **🌐 Clean English UI**           | Fully localized English interface using i18next. All UI components and logs use English language for consistency and maintainability.                                                                                                                                                                                                                  |
| **🔌 Multi-Source Ready**         | Provider pattern abstraction for multi-booru support. Current implementations: Rule34.xxx, Gelbooru. `IBooruProvider` interface allows adding new sources (Danbooru, etc.) without core database changes.                                                                                                                                              |

---

## 🏗️ Architecture Overview & Tech Stack

The application adheres to a strict **Separation of Concerns (SoC)** model:

### 1. Core Services (The Brain - Electron Main Process)

This is the secure Node.js environment. It handles all I/O, persistence, and secrets.

- **Desktop Runtime:** **Electron** (chosen for `BrowserView`/`Webview` control to support DOM injection).
- **Database:** **SQLite** (via `better-sqlite3` driver) with direct synchronous access in Main Process. WAL mode enabled for concurrent reads.
- **Data Layer:** **Drizzle ORM** (TypeScript type-safety for queries, raw SQL timestamps in milliseconds).
- **Security:** **Secure Storage** using Electron's `safeStorage` API for encrypting API credentials at rest.
- **API:** Custom wrapper based on `axios` with retry and backoff logic.
- **Background Jobs:** Node.js timers and asynchronous operations.

### 2. Renderer (The Face - UI Process)

This is the sandboxed browser environment. It handles presentation.

- **Frontend:** **React + TypeScript**
- **Styling:** **Tailwind CSS + shadcn/ui** (modern UI, good baseline A11y).
- **State Management:** **Zustand** (minimalistic state layer, aligned with KISS/YAGNI).
- **Data Fetching:** **TanStack Query (React Query)** (caching, loading states, API boundary).

### 3. Security Boundary (The Gatekeeper)

- **IPC Architecture:** Controller-based IPC handlers with `BaseController` for centralized error handling and validation. Type-safe dependency injection via DI Container.
- **IPC Bridge:** Strictly typed TypeScript interface (`bridge.ts`) used by the Renderer to communicate with the Main Process.
- **Security:** **Context Isolation** enforced globally; no direct Node.js access from the Renderer.
- **Encryption:** API credentials encrypted using Electron's `safeStorage` API. Decryption only occurs in Main Process when needed for API calls.
- **Provider Pattern:** Multi-booru support via `IBooruProvider` interface. Current implementations: Rule34.xxx, Gelbooru.

**📖 For detailed architecture information, see [Architecture Documentation](./docs/architecture.md).**

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
- **Maintenance** - Database maintenance operations use sequential queue to prevent race conditions (non-blocking)

## ✅ Current Status

The application is stable and production-ready (v4.0.0) with the following features implemented:

### Infrastructure & Build

- ✅ **Electron Version:** 39.2.7 with latest security features
- ✅ **Build System:** electron-vite for optimal build performance
- ✅ **Database Architecture:** Direct synchronous access via `better-sqlite3` in Main Process with WAL mode for concurrent reads
- ✅ **Portable Mode:** Support for portable executables with data folder next to executable
- ✅ **Testing Architecture:** Unified testing setup with Vitest for Unit/Integration tests, Playwright for E2E tests
- ✅ **Dual ABI Support:** Automatic switching between Node.js and Electron ABI for `better-sqlite3` during testing
- ⚠️ **HMR Status:** Renderer process has full HMR support. Main process requires manual restart (no auto-restart on file changes)

### Database & Schema

- ✅ **Schema:** Three main tables (`artists`, `posts`, `settings`) with proper relationships
- ✅ **Migrations:** Fully functional migration system using `drizzle-kit` with idempotent migration handling
- ✅ **Media Type Support:** `media_type` column in `posts` table for efficient image/video filtering (`image`, `video`)
- ✅ **Indexes:** Optimized indexes on `artistId`, `isViewed`, `publishedAt`, `isFavorited`, `lastChecked`, `createdAt`, `mediaType`
- ✅ **Composite Indexes:** Composite indexes on `(artist_id, rating, is_viewed)` and `(artist_id, media_type)` for optimized multi-column filter queries
- ✅ **FTS5 Full-Text Search:** FTS5 virtual table `posts_fts` with `unicode61` tokenizer for fast tag searching
- ✅ **Provider Support:** Multi-booru support with `provider` field in artists table (rule34, gelbooru)
- ✅ **Artist Types:** Support for `tag`, `uploader`, and `query` types

### Security & Reliability

- ✅ **Secure Storage:** API credentials encrypted using Electron's `safeStorage` API (Windows Credential Manager, macOS Keychain, Linux libsecret). Credentials encrypted at rest, decryption only in Main Process
- ✅ **Database Backup/Restore:** Manual backup and restore functionality implemented with integrity checks. Create timestamped backups and restore from files
- ✅ **Input Validation:** Zod validation implemented per IPC handler via `BaseController`
- ✅ **Context Isolation:** Enabled globally with sandbox mode for maximum security
- ✅ **CSP (Content Security Policy):** Strict CSP in production, relaxed for development (HMR support)
- ✅ **Portable Mode:** Fully implemented - automatically detects portable mode and uses `data/` folder
- ✅ **Age Gate:** Age gate component implemented with legal confirmation (`confirmLegal` method)

### Data Integrity & Sync

- ✅ **Tag Normalization:** Inputs like "tag (123)" are automatically stripped to "tag" before saving/syncing
- ✅ **Sync Service:** Handles `ON CONFLICT` correctly and populates the gallery with proper upsert logic
- ✅ **Timestamp Handling:** All timestamps use Drizzle timestamp mode with proper milliseconds precision
- ✅ **Provider Pattern:** Multi-booru support via `IBooruProvider` interface (Rule34, Gelbooru)
- ✅ **Rate Limiting:** Intelligent rate limiting with 1.5s delay between artists, 0.5s between pages
- ⚠️ **Anti-Bot Measures:** Static User-Agent strings used, fixed delays (1.5s/0.5s) but no randomization or rotation

### UI/UX

- ✅ **Progressive Image Loading:** 3-layer system (Preview → Sample → Original) for instant viewing
- ✅ **Virtualization:** `react-virtuoso` implemented for efficient large list rendering
- ✅ **Search Functionality:** Local artist search, remote tag search via booru autocomplete API, and direct booru search (`searchBooru` method) with tag resolution (`resolveTags`, `resolveCharacterTags`, `resolveCopyrightTags`, `resolveTagsByType`)
- ✅ **Sidebar Navigation:** Persistent sidebar with main navigation sections (Updates, Browse, Favorites, Tracked, Settings)
- ✅ **Global Top Bar:** Unified top bar with search, filters, sort controls, and view toggles
- ✅ **Advanced Filtering:** Filter by AI-generated tags, media type (image/video), source (all/favorites/subscriptions), and rating
- ✅ **Sorting:** Sort by date added, posted date, and rating (ascending/descending)
- ✅ **View Modes:** Grid and masonry layout options with responsive design
- ✅ **Full-Screen Viewer:** Immersive viewer with keyboard shortcuts, download, favorites, and tag management
- ✅ **Video Support:** `.mp4`, `.webm`, `.mov`, `.avi`, `.mkv`, `.flv`, `.wmv`, `.m4v` video formats supported with native `<video>` element
- ✅ **Download Manager:** Download full-resolution files with progress tracking and queue management
- ✅ **Favorites System:** Complete implementation with `isFavorited` database field, toggle functionality, and keyboard shortcuts
- ✅ **Backup Controls:** UI component for creating and restoring database backups with integrity checks
- ✅ **Credential Verification:** Verify API credentials before saving and during sync operations
- ✅ **Age Gate Component:** Fully implemented with legal confirmation (`AgeGate.tsx` component and `confirmLegal` IPC method)
- ✅ **Content Security Policy:** Strict CSP with support for Rule34.xxx and Gelbooru.com media sources
- ⏳ **Safe Mode/NSFW Filter:** Database schema includes `isSafeMode` field, but blur logic not yet implemented in UI components

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

### 📖 Start Here

- **[User Guide](./docs/user-guide.md)** - **Complete guide for end users** (installation, usage, troubleshooting)
- **[Documentation Index](./docs/index.md)** - Complete navigation guide to all documentation
- **[Glossary](./docs/glossary.md)** - Key terms and concepts (booru, tags, sync, cache, etc.)

**💡 New to RuleDesk?**

- **End users:** Start with the [User Guide](./docs/user-guide.md) - it covers everything you need to know!
- **Developers:** Check the [Documentation Index](./docs/index.md) for developer documentation

### 👤 User Guides

- **[Quick Start](#-quick-start)** - First launch and basic setup (this document)
- **[Features](#-features)** - Complete feature list (this document)
- **[Settings](#-settings)** - Application configuration (this document)
- **[Sync & Background](#-sync--background)** - Synchronization guide (this document)

### 👨‍💻 Developer Documentation

- **[Architecture Documentation](./docs/architecture.md)** - System architecture, design patterns, and component structure
- **[API Documentation](./docs/api.md)** - Complete IPC API reference and usage examples
- **[Database Documentation](./docs/database.md)** - Database schema, operations, and best practices
- **[Development Guide](./docs/development.md)** - Development setup, build process, and workflows
- **[Contributing Guide](./docs/contributing.md)** - Guidelines for contributors and code standards

### 📋 Planning & Reference

- **[Roadmap](./docs/roadmap.md)** - Development roadmap and planned features
- **[Rule34 API Reference](./docs/rule34-api-reference.md)** - Unofficial Rule34.xxx API documentation

**💡 Tip:** If you're new to RuleDesk, start with the [Documentation Index](./docs/index.md) for structured navigation.

## 🚀 Active Roadmap

We are moving to Feature Development. Priority tasks:

### A. Filters (Advanced Search) ✅ Partially Implemented

**Goal:** Allow users to refine the gallery view.

- ✅ **Global Top Bar UI:** Search bar, filter button, sort dropdown, and view toggle - fully implemented in `GlobalTopBar.tsx`
- ✅ **AI Filter:** Filter by AI-generated tags (hide/only/all) - fully implemented with backend support
- ✅ **Media Type Filter:** Filter by image/video - fully implemented with `media_type` column and backend filtering
- ✅ **Source Filter:** Filter by source (all/favorites/subscriptions) - fully implemented
- ✅ **Sorting:** Sort by date added, posted date, and rating (ascending/descending) - fully implemented
- ✅ **View Modes:** Grid and masonry layout options - fully implemented
- ⏳ **Tag Search:** Advanced tag search with FTS5 (UI ready, needs integration with filter panel)
- ⏳ **Rating Filter:** Filter by rating (Safe/Questionable/Explicit) - UI ready, backend filtering pending

**Status:** Core filtering functionality is implemented and working. Advanced tag search and rating filtering are planned for future releases.

### B. Download Manager ✅ Implemented (Core Features)

**Goal:** Allow saving full-resolution files to the local file system.

- ✅ "Download Original" button on post view (implemented in ViewerDialog)
- ✅ **Download Handler:** Downloads run in Main Process with progress tracking
- ✅ **Progress Events:** Real-time download progress via IPC events (`onDownloadProgress`)
- ✅ **File Management:** Open downloaded file in folder (`openFileInFolder`)
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

- ✅ **Database Architecture** - ✅ **COMPLETED:** Direct synchronous access via `better-sqlite3` with WAL mode for concurrent reads. All database operations run in Main Process.
- ✅ **Encrypt / Secure Storage for API Credentials** - ✅ **COMPLETED:** Using Electron's `safeStorage` API for encryption. API keys encrypted at rest, never exposed to Renderer process.
- ✅ **Database Backup / Restore System** - ✅ **COMPLETED:** Manual backup and restore functionality implemented with integrity checks and timestamped backups.
- ✅ **IPC Architecture** - ✅ **COMPLETED:** Controller-based IPC handlers with `BaseController` for centralized error handling and validation. Type-safe dependency injection via DI Container.
- ✅ **Portable Mode** - ✅ **COMPLETED:** Automatic detection of portable mode with data folder support.

**📖 For detailed roadmap information, see [Roadmap Documentation](./docs/roadmap.md).**

---

## ⚙️ Development Setup

This project uses **electron-vite** as the build tool for both the Electron Main and Renderer processes, ensuring optimal build performance.

### Prerequisites

- **Node.js:** v18 or higher
- **npm:** v9 or higher (or yarn)
- **Git:** For version control

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
- **Database Location:**
  - **Portable Mode:** If running from a portable executable, database is stored in `data/` folder next to the executable
  - **Standard Mode:** Electron user data directory (automatically managed)
    - Windows: `%APPDATA%/RuleDesk/metadata.db`
    - macOS: `~/Library/Application Support/RuleDesk/metadata.db`
    - Linux: `~/.config/RuleDesk/metadata.db`
- **Database Architecture:** Direct synchronous access via `better-sqlite3` with WAL mode for concurrent reads
- **No Environment Variables Required:** All configuration is handled through the UI

### Building the Binary

To package the application for distribution:

```bash
# Build for current platform
npm run build

# Package with electron-builder (after build)
npm run dist
# Or use electron-builder directly:
npx electron-builder
```

The built binaries will be available in the `release/` directory. The exact output location may vary depending on your Electron builder configuration.

**Build Targets:**

- **Windows:** NSIS installer and portable executable (x64)
- **macOS:** DMG package
- **Linux:** AppImage

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

### Testing

The project uses **Vitest** for unit and integration tests, and **Playwright** for E2E tests.

```bash
# Run all tests (automatically rebuilds better-sqlite3 for Node.js, then rebuilds for Electron after)
npm test

# Run tests in watch mode
npm run test:watch

# Run only integration tests (autonomous, rebuilds for Node.js automatically)
npm run test:integration

# Run integration tests in watch mode (for TDD)
npm run test:integration:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

**Testing Architecture:**

- **Unit Tests:** Located in `tests/unit/` - Test individual components, hooks, and utilities
- **Integration Tests:** Located in `tests/integration/` - Test IPC controllers and services with real database
- **E2E Tests:** Located in `tests/e2e/` - Test full user workflows with Playwright

**Dual ABI Support:**

The testing setup automatically handles switching between Node.js and Electron ABI for `better-sqlite3`:
- `pretest` hook rebuilds for Node.js before tests
- `posttest` hook rebuilds for Electron after tests
- This ensures `npm test` works seamlessly, and `npm run dev` works immediately after

## 📜 License & Legal

### License

This project is licensed under the **Apache License 2.0**.

You may use, reproduce, modify, distribute, and sublicense the software under the terms of the Apache License 2.0. The license also includes an express patent grant and requires preservation of copyright and license notices.

The full license text is available in the `LICENSE` file in this repository.

### Legal Disclaimer

By using this software, you acknowledge and agree to the following:

**18+ Only:** This application is intended exclusively for adults (18+) in jurisdictions where viewing NSFW content is legal.

**No Content Hosting:** The application does not host, store, mirror, or redistribute any media content. All media is requested directly from the original website’s API/CDN at the user’s initiative.

**Use at Your Own Risk:** The authors and contributors of this project:

- Do not control the content provided by third-party services.
- Do not endorse, moderate, or curate any content accessed through this software.
- Are not responsible for how you use this software or which content you access with it.

**Compliance with Laws & ToS:** You are solely responsible for:

- Complying with the laws and regulations applicable in your country/region.
- Complying with the target website's Terms of Service, API rules, and any usage limitations (including rate limits and content policies).

**No Warranty / Limitation of Liability:** This software is provided “AS IS”, without warranties or conditions of any kind, either express or implied. To the fullest extent permitted by applicable law, in no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.

---

## ⚙️ Database Management

### Migrations

If you modify the database schema (`src/main/db/schema.ts`):

```bash
# Generate migration from schema changes
npm run db:generate

# Run migrations manually (migrations also run automatically on startup)
npm run db:migrate

# Open Drizzle Studio to inspect database
npm run db:studio
```

**Note:** Migrations run automatically on application startup. The migration path is automatically detected based on whether the app is packaged or in development mode.

**Performance Optimizations:**

- **FTS5 Full-Text Search:** Fast tag searching using SQLite FTS5 virtual table with `unicode61` tokenizer
- **Composite Indexes:** Optimized indexes for common filter combinations (artist + rating + view status)
- **External Content Tables:** FTS5 uses external content to avoid data duplication and save storage space

### Database Location

- **Development:** Database stored in Electron user data directory
- **Production (Standard):** Electron user data directory
- **Production (Portable):** `data/` folder next to executable

**📖 For detailed database information, see [Database Documentation](./docs/database.md).**

---

## 🛡️ Code Quality Standards

This project adheres to strict development principles:

- **Architecture:** SOLID, DRY, KISS, YAGNI principles
- **TypeScript:** Strict typing, no `any` or unsafe casts
- **Error Handling:** Proper error handling with descriptive messages via `BaseController`
- **Security:** Context Isolation enabled, sandbox mode, CSP headers, no direct Node.js access from Renderer
- **Database:** Type-safe queries via Drizzle ORM, no raw SQL (except migrations)
- **UI:** Tailwind CSS only, no inline styles, shadcn/ui components, accessibility considerations
- **Logging:** `electron-log` for all logging (no `console.log` in production code)
- **IPC:** Controller-based architecture with dependency injection

**📖 For detailed guidelines, see [Contributing Guide](./docs/contributing.md).**
