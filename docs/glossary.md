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

**Related:** [Database Schema - Posts](./database.md#table-posts), [Tag Normalization](./roadmap.md#data-integrity--sync)

---

### Rating

Content rating classification system used by booru sites to categorize posts by content type:

- **Safe (s):** Safe for work content
- **Questionable (q):** Questionable content
- **Explicit (e):** Explicit/NSFW content

**Related:** [Database Schema - Posts](./database.md#table-posts), [Filters](./roadmap.md#a-filters-advanced-search-priority-high--ui-ready-backend-pending)

---

### Sync / Synchronization

The process of fetching new posts from booru APIs and updating the local database. RuleDesk implements intelligent synchronization with rate limiting and incremental updates.

**Features:**

- Rate limiting (1.5s delay between artists, 0.5s between pages)
- Incremental sync (only fetches posts newer than `lastPostId`)
- Background execution with progress tracking
- Exponential backoff for error handling

**Related:** [Sync Service](./architecture.md#sync-service), [Synchronization Flow](./architecture.md#synchronization-flow), [Sync Settings](./README.md#sync--background)

---

### Cache

Local storage of post metadata and preview images to enable offline browsing and fast filtering. RuleDesk uses a 3-layer progressive image loading system.

**Cache Layers:**

1. **Preview URL** - Low-resolution blurred preview (instant display)
2. **Sample URL** - Medium-resolution sample (loaded in gallery)
3. **File URL** - Full-resolution original (loaded only in viewer)

**Related:** [Progressive Image Loading](./README.md#progressive-image-loading), [Storage & Cache](./README.md#storage--cache)

---

### Blacklist

A list of tags or content that should be excluded from search results or feeds. Currently not implemented in RuleDesk, but planned for future releases.

**Related:** [Roadmap - Filters](./roadmap.md#a-filters-advanced-search-priority-high--ui-ready-backend-pending)

---

### Artist Tracking

The process of monitoring specific artists or uploaders for new posts. RuleDesk supports tracking by:

- **Tag:** Track posts tagged with a specific tag
- **Uploader:** Track posts uploaded by a specific user
- **Query:** Track posts matching a custom query

**Related:** [Database Schema - Artists](./database.md#table-artists), [Artist Tracking](./README.md#-artist-tracking)

---

### Provider Pattern

An abstraction layer that allows RuleDesk to support multiple booru sources without core database changes. Each provider implements the `IBooruProvider` interface.

**Current Providers:**

- Rule34.xxx (`Rule34Provider`)
- Gelbooru (`GelbooruProvider`)

**Related:** [Architecture - Provider Pattern](./architecture.md#provider-pattern-architecture), [Multi-Booru Support](./README.md#-multi-source-ready)

---

## Technical Terms

### IPC (Inter-Process Communication)

The communication mechanism between Electron's Main Process and Renderer Process. RuleDesk uses a controller-based IPC architecture with type-safe interfaces.

**Related:** [IPC Architecture](./api.md#architecture), [IPC Bridge Interface](./api.md#ipc-bridge-interface)

---

### Main Process

The secure Node.js environment in Electron that handles all I/O, persistence, and secrets. Database operations, API calls, and file system access run in the Main Process.

**Related:** [Architecture - Main Process](./architecture.md#main-process-the-brain)

---

### Renderer Process

The sandboxed browser environment in Electron that handles UI rendering and user interactions. The Renderer Process communicates with the Main Process via IPC.

**Related:** [Architecture - Renderer Process](./architecture.md#renderer-process-the-face)

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

**Related:** [Security - Credential Security](./architecture.md#credential-security-flow), [Secure Storage](./README.md#security)

---

### Progressive Image Loading

A 3-layer image loading strategy that provides instant visual feedback with smooth quality enhancement:

1. **Preview** - Low-res blurred preview (instant)
2. **Sample** - Medium-res sample (gallery)
3. **Original** - Full-res original (viewer only)

**Related:** [Progressive Image Loading](./README.md#progressive-image-loading), [Cache](#cache)

---

## UI/UX Terms

### Gallery

A grid view of posts with preview images, ratings, and metadata. RuleDesk supports multiple gallery views:

- **Grid View** - Card-based grid layout
- **List View** - Compact list layout
- **Masonry View** - Pinterest-style layout (planned)

**Related:** [Artist Gallery](./README.md#-artist-gallery), [Gallery Cards](./README.md#gallery-cards)

---

### Viewer

A full-screen immersive viewer for viewing posts with keyboard shortcuts, download controls, and tag management.

**Features:**

- Auto-hide controls
- Keyboard navigation (←/→)
- Download and favorites
- Tags drawer

**Related:** [Viewer Experience](./README.md#viewer-experience), [Full-Screen Viewer](./README.md#-full-screen-viewer)

---

### Favorites

A system for marking and managing favorite posts. Favorites are stored locally in the database and can be toggled via UI or keyboard shortcut (`F`).

**Related:** [Favorites System](./README.md#-favorites-system), [Database Schema - Posts](./database.md#table-posts)

---

### Subscriptions

Tag-based subscriptions for tracking specific tag combinations. Currently planned but not yet implemented.

**Related:** [Roadmap - Subscriptions](./roadmap.md#-subscriptions--updates)

---

### Playlists / Collections

Curated collections of posts independent of Artists/Trackers. Currently planned but not yet implemented.

**Related:** [Roadmap - Playlists](./roadmap.md#c-playlists--collections-priority-medium--not-started)

---

## Database Terms

### Migration

A script that modifies the database schema. RuleDesk uses Drizzle Kit to generate and run migrations automatically.

**Related:** [Migrations](./database.md#migrations), [Development - Database Scripts](./development.md#database-scripts)

---

### Backup / Restore

Manual database backup and restore functionality. Backups are timestamped and stored in the user data directory.

**Related:** [Backup and Recovery](./database.md#backup-and-recovery), [Backup & Restore](./README.md#-backup--restore)

---

### Integrity Check

A SQLite operation (`PRAGMA integrity_check`) that verifies database file integrity. RuleDesk runs integrity checks before restore operations.

**Related:** [Backup and Recovery](./database.md#backup-and-recovery)

---

## API Terms

### API Key

Authentication credentials required to access booru APIs. RuleDesk stores API keys encrypted at rest using Electron's `safeStorage` API.

**Related:** [API Authentication](./README.md#-api-authentication), [Secure Storage](#secure-storage)

---

### Rate Limiting

A mechanism to prevent API abuse by limiting request frequency. RuleDesk implements intelligent rate limiting with configurable delays.

**Current Limits:**

- 1.5s delay between artists
- 0.5s delay between pages

**Related:** [Sync Service](./architecture.md#sync-service), [Rate Limiting](./api.md#external-api-integration)

---

### Exponential Backoff

An error handling strategy that increases wait time between retry attempts. RuleDesk uses exponential backoff for API error handling.

**Related:** [Sync Service](./architecture.md#sync-service), [Best Practices](./rule34-api-reference.md#rate-limiting)

---

## See Also

- [Documentation Index](./index.md) - Complete documentation navigation
- [Architecture Overview](./architecture.md) - System architecture and design
- [API Reference](./api.md) - IPC API documentation
- [Database Documentation](./database.md) - Database schema and operations
