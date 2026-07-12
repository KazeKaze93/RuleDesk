# Glossary

This glossary defines key terms and concepts used throughout the RuleDesk documentation and application.

## Core Concepts

### Booru

A type of imageboard website that allows users to post, tag, and organize images. Booru sites typically use a tag-based categorization system for content organization.

**Examples:** Rule34.xxx, Gelbooru, Danbooru

**Related:** [Provider Pattern](./architecture.md#provider-pattern-architecture)

---

### Tags

Keywords or labels used to categorize and search for posts. Tags describe various attributes of content such as characters, artists, content type, rating, etc.

**Usage in RuleDesk:**

- Tags are stored as space-separated strings in the database
- Tags are used for filtering and searching posts
- Tag normalization automatically strips metadata (e.g., "tag (123)" → "tag")

**Related:** [Database Schema - Posts](./database.md#table-posts), [Roadmap](./roadmap.md#-recent-fixes--current-status-completed)

---

### Rating

Content rating classification system used by booru sites to categorize posts by content type:

- **Safe (s):** Safe for work content
- **Questionable (q):** Questionable content
- **Explicit (e):** Explicit/NSFW content

**Related:** [Database Schema - Posts](./database.md#table-posts), [Filters](./roadmap.md#-navigation--ux-revamp)

---

### Sync / Synchronization

The process of fetching new posts from booru APIs and updating the local database. RuleDesk implements intelligent synchronization with rate limiting and incremental updates.

**Features:**

- Rate limiting (1.5s delay between artists, 0.5s between pages)
- Incremental sync (only fetches posts newer than `lastPostId`)
- Background execution with progress tracking
- Exponential backoff for error handling

**Related:** [Sync Service](./architecture.md#sync-service), [Synchronization Flow](./architecture.md#synchronization-flow), [Sync Settings](../README.md#-sync--background)

---

### Cache

Local storage of post metadata and preview images to enable offline browsing and fast filtering. RuleDesk uses a 3-layer progressive image loading system.

**Cache Layers:**

1. **Preview URL** - Low-resolution blurred preview (instant display)
2. **Sample URL** - Medium-resolution sample (loaded in gallery)
3. **File URL** - Full-resolution original (loaded only in viewer)

**Related:** [Progressive Image Loading](../README.md#progressive-image-loading), [Settings - General](../README.md#-settings)

---

### Blacklist

A list of tags excluded from gallery and search results after fetch. Configured in **Settings → Blacklist**; enforced in Main (`SearchController`, `PostsController`) so hidden tags do not affect pagination math (`apiFetchedCount` is measured before blacklist filtering).

**Related:** [Settings - Blacklist](./user-guide.md#blacklist), [searchBooru](./api-guide.md#searchbooru)

---

### Artist Tracking

The process of monitoring specific artists or uploaders for new posts. RuleDesk supports tracking by:

- **Tag:** Track posts tagged with a specific tag
- **Uploader:** Track posts uploaded by a specific user
- **Query:** Track posts matching a custom query

**Related:** [Database Schema - Artists](./database.md#table-artists), [Artist Tracking](../README.md#-artist-tracking)

---

### Provider Pattern

An abstraction layer that allows RuleDesk to support multiple booru sources without core database changes. Each provider implements the `IBooruProvider` interface.

**Current Providers:**

- Rule34.xxx (`Rule34Provider`)
- Gelbooru (`GelbooruProvider`)

**Related:** [Architecture - Provider Pattern](./architecture.md#provider-pattern-architecture), [Multi-Booru Support](../README.md#-multi-source-ready)

---

### Browse

The **Browse** page searches the live booru API (Source: **All**) or filters posts from the local cache (Source: **Favorites** / **Subscriptions**). Infinite scroll loads 50 posts per batch; on Rule34, RuleDesk continues past the API offset cap using cursor pagination (`id:<postId>`).

**Related:** [User Guide - Search](./user-guide.md#search), [Rule34 pagination](./rule34-api-reference.md#pagination-beyond-the-offset-cap), [searchBooru](./api-guide.md#searchbooru)

---

## Technical Terms

### IPC (Inter-Process Communication)

The communication mechanism between Electron's Main Process and Renderer Process. RuleDesk uses a controller-based IPC architecture with type-safe interfaces.

**Related:** [IPC Architecture](./api-guide.md#architecture), [IPC Bridge Interface](./api-guide.md#ipc-bridge-interface)

---

### Main Process

The secure Node.js environment in Electron that handles all I/O, persistence, and secrets. Database operations, API calls, and file system access run in the Main Process.

**Related:** [Architecture - Main Process](./architecture.md#main-process-the-brain)

---

### Renderer Process

The sandboxed browser environment in Electron that handles UI rendering and user interactions. The Renderer Process communicates with the Main Process via IPC. UI copy is **English-only** (inline literals / local constants) — there is no i18n layer under `src/renderer/`.

**Related:** [Architecture - Renderer Process](./architecture.md#renderer-process-the-face)

---

### Wipe all data

Settings → General → **Danger zone** → confirmed delete of everything under the user data directory (`.rdcache`), including the database, `video-cache/`, logs, and in-app backups, then app quit. Does not delete the separate media download folder. IPC: `system:wipe-all-data` / `wipeAllData`.

**Related:** [User Guide — Settings](./user-guide.md#settings), [API Reference](./api.md)

---

### Video proxy / video-cache

Main-process `VideoProxyServer` serves local `http://127.0.0.1` URLs for `<video>` playback and stores **complete** files under `{userData}/video-cache/` (atomic tmp + rename; bounded by `VIDEO_CACHE_MAX_BYTES` with eviction).

**Related:** [API Guide — getVideoProxyUrl](./api-guide.md#getvideoproxyurlfileurl-string), [Roadmap](./roadmap.md#open-p0-audit--remaining)

---

### Sync cursor (`lastPostId`)

Per-artist watermark used for incremental sync. **Open P0:** advancing the cursor on incomplete pagination/error paths can skip posts. Treat as “best effort” until the integrity fix ships.

**Related:** [Architecture — Sync](./architecture.md), [Roadmap — Open P0](./roadmap.md#open-p0-audit--not-yet-shipped)

---

### Context Isolation

A security feature in Electron that prevents the Renderer Process from directly accessing Node.js APIs. All communication must go through the IPC bridge.

**Status:** ✅ Enabled in RuleDesk

**Related:** [Security Architecture](./architecture.md#security-architecture), [Context Isolation](./architecture.md#context-isolation)

---

### Drizzle ORM

The Object-Relational Mapping library used by RuleDesk for type-safe database queries. Drizzle provides TypeScript type inference and SQL generation.

**Related:** [Database Architecture](./database.md#database-architecture), [Drizzle ORM](./database.md#drizzle-orm)

---

### WAL Mode (Write-Ahead Logging)

A SQLite mode that enables concurrent reads while writes are in progress. RuleDesk uses WAL mode for optimal performance.

**Related:** [Database Architecture](./database.md#database-architecture), [WAL Mode](./database.md#database-architecture)

---

### Secure Storage

Electron's `safeStorage` API used to encrypt sensitive data (API keys) at rest. Encryption uses platform keychains (Windows Credential Manager, macOS Keychain, Linux libsecret).

**Related:** [Security - Credential Security](./architecture.md#credential-security-flow), [Secure Storage](../README.md#-settings)

---

### Progressive Image Loading

A 3-layer image loading strategy that provides instant visual feedback with smooth quality enhancement:

1. **Preview** - Low-res blurred preview (instant)
2. **Sample** - Medium-res sample (gallery)
3. **Original** - Full-res original (viewer only)

**Related:** [Progressive Image Loading](../README.md#progressive-image-loading), [Cache](#cache)

---

## UI/UX Terms

### Gallery

A grid view of posts with preview images, ratings, and metadata. RuleDesk supports multiple gallery views:

- **Grid View** - Card-based grid layout
- **List View** - Compact list layout
- **Masonry View** - CSS column (Pinterest-style) layout; available where the view toggle is shown (differs from virtualized grid on very large lists)

**Related:** [Artist Gallery](../README.md#-artist-gallery), [Gallery Cards](../README.md#gallery-cards)

---

### Viewer

A full-screen immersive viewer for viewing posts with keyboard shortcuts, download controls, and tag management.

**Features:**

- Auto-hide controls
- Keyboard navigation (←/→)
- Download and favorites
- Tags drawer

**Related:** [Viewer Experience](../README.md#viewer-experience), [Full-Screen Viewer](../README.md#-full-screen-viewer)

---

### Favorites

A system for marking and managing favorite posts. Favorites are stored locally in the database and can be toggled via UI or keyboard shortcut (`F`).

**Related:** [Favorites System](../README.md#-favorites-system), [Database Schema - Posts](./database.md#table-posts)

---

### Tracked Artists / `MAX_TRACKED_ARTISTS`

Artists (tags, uploaders, or query subscriptions) stored in the local `artists` table and surfaced via `getTrackedArtists()` IPC.

**Cap:** IPC returns at most **5000** rows (`MAX_TRACKED_ARTISTS` in `src/shared/constants.ts`). Larger libraries are truncated with a Main-process warning — not a silent full export.

**Related:** [API — getTrackedArtists](./api-guide.md#gettrackedartists), [Database — Get All Artists](./database.md#get-all-artists)

---

### Subscriptions

Tag-based subscriptions for tracking specific tag combinations. Currently planned but not yet implemented.

**Related:** [Roadmap - Subscriptions](./roadmap.md#-subscriptions--updates)

---

### Playlists / Collections

Curated collections of posts independent of Artists/Trackers. Users can create playlists, add/remove posts, and view galleries with filtering and sorting. Supports both manual playlists and smart playlists with tag-based queries.

**Features:**

- Create, rename, and delete playlists
- Add posts to playlists via quick menu on Post Cards or in viewer
- View playlist galleries with grid and masonry layouts
- Filter and sort posts within playlists (FTS5 tag search, rating, media type, AI filter)
- Smart playlists with dynamic tag-based queries

**Related:** [Roadmap](./roadmap.md#-active-roadmap-priority-tasks), [Database Schema - Playlists](./database.md#table-playlists)

---

## Database Terms

### Migration

A script that modifies the database schema. RuleDesk uses Drizzle Kit to generate and run migrations automatically.

**Related:** [Migrations](./database.md#migrations), [Database Documentation](./database.md)

---

### Backup / Restore

Manual database backup and restore functionality. Backups are timestamped and stored in the user data directory.

**Related:** [Backup and Recovery](./database.md#backup-and-recovery), [Backup & Restore](../README.md#-backup--restore)

---

### VACUUM (SQLite)

A SQLite maintenance command that rewrites and compacts the database file, reclaiming unused space.

**RuleDesk usage:**

- Manual trigger from Settings (`Run VACUUM now`)
- User-visible status (last run timestamp/result/error)
- Policy stored in `settings` (`manual`, `weekly`, `monthly`)

**Related:** [User-visible DB Maintenance](./database.md#user-visible-db-maintenance-vacuum), [Settings](../README.md#-settings)

---

### Integrity Check

A SQLite operation (`PRAGMA integrity_check`) that verifies database file integrity. RuleDesk runs integrity checks before restore operations.

**Related:** [Backup and Recovery](./database.md#backup-and-recovery)

---

## API Terms

### API Key

Authentication credentials required to access booru APIs. RuleDesk stores API keys encrypted at rest using Electron's `safeStorage` API.

**Related:** [API Authentication](../README.md#-api-authentication), [Secure Storage](#secure-storage)

---

### Rate Limiting

A mechanism to prevent API abuse by limiting request frequency. RuleDesk implements intelligent rate limiting with configurable delays.

**Current Limits:**

- 1.5s delay between artists
- 0.5s delay between pages

**Related:** [Sync Service](./architecture.md#sync-service), [Rate Limiting](./api-guide.md#external-api-integration)

---

### Exponential Backoff

An error handling strategy that increases wait time between retry attempts. RuleDesk uses exponential backoff for API error handling.

**Related:** [Sync Service](./architecture.md#sync-service), [Best Practices](./rule34-api-reference.md#rate-limiting)

---

### validate (npm script)

Local quality gate: `npm run typecheck` + `npm run lint` + `npm run check:img-attrs`. CI runs this before `docs:api` freshness and tests.

**Related:** [README — Quality Checks](../README.md#quality-checks)

---

### docs:api (npm script)

Regenerates the IPC channel reference (`docs/api.md`) from `channels.ts` and handler registrations. Hand-editing `api.md` is forbidden; CI fails if the file is stale.

**Related:** [API Reference](./api.md), [API Guide](./api-guide.md), [README — Quality Checks](../README.md#quality-checks)

---

### test:verify (npm script)

Full maintainer gate before a PR: `validate` → all Vitest suites (unit, integration, property) → restore `better-sqlite3` for Electron.

**Related:** [README — Testing](../README.md#testing), [Architecture — Testing & CI](./architecture.md#testing--ci)

---

## See Also

- [Documentation Index](./index.md) - Complete documentation navigation
- [Architecture Overview](./architecture.md) - System architecture and design
- [API Reference](./api.md) - Generated IPC channel table
- [API Guide](./api-guide.md) - IPC usage documentation
- [Database Documentation](./database.md) - Database schema and operations
