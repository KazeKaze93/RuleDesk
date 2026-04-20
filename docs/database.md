# Database Documentation

## 📑 Table of Contents

- [Overview](#overview)
- [Database Location](#database-location)
- [Schema](#schema)
- [Database Architecture](#database-architecture)
- [Available Methods](#available-methods-via-drizzle-orm)
- [Migrations](#migrations)
- [Drizzle ORM](#drizzle-orm)
- [Database Studio](#database-studio)
- [Best Practices](#best-practices)
- [Backup and Recovery](#backup-and-recovery)
- [Performance Considerations](#performance-considerations)
- [Future Enhancements](#future-enhancements)

---

## Overview

The application uses **SQLite** as the local database for storing metadata, tracked artists, posts, and settings. The database is accessed directly in the **Main Process** using **Drizzle ORM** for type-safe queries. WAL (Write-Ahead Logging) mode is enabled for concurrent reads.

**📖 Related Documentation:**

- [Architecture Documentation](./architecture.md) - Database architecture in system design
- [API Documentation](./api.md) - IPC methods for database operations
- [Development Guide](./development.md) - Database scripts and migrations
- [Glossary](./glossary.md) - Key terms (WAL Mode, Drizzle ORM, Migration, etc.)

## Database Location

The database file location depends on the application mode:

**Standard Mode (Installed):**

- **Windows:** `%APPDATA%/RuleDesk/metadata.db`
- **macOS:** `~/Library/Application Support/RuleDesk/metadata.db`
- **Linux:** `~/.config/RuleDesk/metadata.db`

**Portable Mode (Portable Executable):**

- Database is stored in `data/metadata.db` next to the executable

**Implementation:**

```typescript
// Portable mode detection (in main.ts)
if (app.isPackaged) {
  const portableDataPath = path.join(path.dirname(process.execPath), "data");
  app.setPath("userData", portableDataPath);
}

// Database initialization (in db/client.ts)
const dbPath = path.join(app.getPath("userData"), "metadata.db");
```

## Schema

### Table: `artists`

Stores information about tracked artists/users.

| Column            | Type                              | Description                                 |
| ----------------- | --------------------------------- | ------------------------------------------- |
| `id`              | INTEGER (PK, AutoIncrement)       | Primary key                                 |
| `name`            | TEXT (NOT NULL)                   | Artist display name                         |
| `tag`             | TEXT (NOT NULL, UNIQUE)           | Tag or username for tracking                |
| `provider`        | TEXT (NOT NULL, DEFAULT 'rule34') | Provider ID: "rule34" or "gelbooru"         |
| `type`            | TEXT (NOT NULL, DEFAULT 'tag')    | Type: "tag", "uploader", or "query"         |
| `api_endpoint`    | TEXT (NOT NULL)                   | Base API endpoint URL                       |
| `last_post_id`    | INTEGER (NOT NULL, DEFAULT 0)     | ID of the last seen post                    |
| `new_posts_count` | INTEGER (NOT NULL, DEFAULT 0)     | Count of new, unviewed posts                |
| `last_checked`    | INTEGER (NULL)                    | Timestamp of last API poll (timestamp mode) |
| `created_at`      | INTEGER (NOT NULL)                | Creation timestamp (timestamp mode, ms)     |

**Schema Definition:**

```typescript
export const artists = sqliteTable(
  "artists",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    tag: text("tag").notNull().unique(),
    provider: text("provider", { enum: ["rule34", "gelbooru"] })
      .notNull()
      .default("rule34"),
    type: text("type", { enum: ["tag", "uploader", "query"] }).notNull(),
    apiEndpoint: text("api_endpoint").notNull(),
    lastPostId: integer("last_post_id").default(0).notNull(),
    newPostsCount: integer("new_posts_count").default(0).notNull(),
    lastChecked: integer("last_checked", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    lastCheckedIdx: index("artists_lastChecked_idx").on(t.lastChecked),
    createdAtIdx: index("artists_createdAt_idx").on(t.createdAt),
  })
);
```

**TypeScript Types:**

```typescript
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
```

### Table: `posts`

Caches post metadata for filtering, statistics, and download management. Supports progressive image loading with preview, sample, and full-resolution URLs.

| Column         | Type                                   | Description                                   |
| -------------- | -------------------------------------- | --------------------------------------------- |
| `id`           | INTEGER (PK, AutoIncrement)            | Internal post ID                              |
| `post_id`      | INTEGER (NOT NULL)                     | Post ID from external API                     |
| `artist_id`    | INTEGER (FK → artists.id)              | Reference to artist                           |
| `file_url`     | TEXT (NOT NULL)                        | Direct URL to full-resolution media file      |
| `preview_url`  | TEXT (NOT NULL)                        | URL to low-resolution preview (blurred)       |
| `sample_url`   | TEXT (NOT NULL, DEFAULT '')            | URL to medium-resolution sample               |
| `title`        | TEXT                                   | Post title                                    |
| `rating`       | TEXT                                   | Content rating (safe, questionable, explicit) |
| `tags`         | TEXT                                   | Space-separated tags                          |
| `media_type`   | TEXT (NULL)                            | Media type: "image" or "video" (indexed)     |
| `published_at` | INTEGER (NOT NULL)                     | Publication timestamp (timestamp mode, ms)    |
| `created_at`   | INTEGER (NOT NULL)                     | When added to local database (timestamp ms)   |
| `is_viewed`    | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Whether post has been viewed                  |
| `is_favorited` | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Whether post has been favorited               |

**Unique Constraint:** `(artist_id, post_id)` - Prevents duplicate posts per artist.

**Indexes:**

- `postIdIdx` - Index on `post_id` for efficient lookups
- `artistIdIdx` - Index on `artist_id` for artist-based queries
- `isViewedIdx` - Index on `is_viewed` for view status filtering
- `publishedAtIdx` - Index on `published_at` for date-based sorting
- `isFavoritedIdx` - Index on `is_favorited` for favorites filtering
- `posts_media_type_idx` - Index on `media_type` for fast image/video filtering
- `posts_artist_rating_viewed_idx` - Composite index on `(artist_id, rating, is_viewed)` for optimized multi-column filter queries
- `posts_artist_media_type_idx` - Composite index on `(artist_id, media_type)` for optimized artist + media type filtering

**Schema Definition:**

```typescript
export const posts = sqliteTable(
  "posts",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull(),
    artistId: integer("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    previewUrl: text("preview_url").notNull(),
    sampleUrl: text("sample_url").notNull().default(""),
    title: text("title").default(""),
    rating: text("rating").default(""),
    tags: text("tags").notNull(),
    mediaType: text("media_type", { enum: ["image", "video"] }),
    publishedAt: integer("published_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    isViewed: integer("is_viewed", { mode: "boolean" })
      .default(false)
      .notNull(),
    isFavorited: integer("is_favorited", { mode: "boolean" })
      .default(false)
      .notNull(),
  },
  (table) => ({
    uniquePostPerArtist: unique().on(table.artistId, table.postId),
    postIdIdx: index("postIdIdx").on(table.postId),
    artistIdIdx: index("artistIdIdx").on(table.artistId),
    isViewedIdx: index("isViewedIdx").on(table.isViewed),
    publishedAtIdx: index("publishedAtIdx").on(table.publishedAt),
    isFavoritedIdx: index("isFavoritedIdx").on(table.isFavorited),
    mediaTypeIdx: index("posts_media_type_idx").on(table.mediaType),
    artistRatingViewedIdx: index("posts_artist_rating_viewed_idx").on(
      table.artistId,
      table.rating,
      table.isViewed
    ),
    artistMediaTypeIdx: index("posts_artist_media_type_idx").on(
      table.artistId,
      table.mediaType
    ),
  })
);
```

**TypeScript Types:**

```typescript
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

### Table: `settings`

Stores application settings including API credentials and user preferences.

| Column               | Type                                   | Description                                  |
| -------------------- | -------------------------------------- | -------------------------------------------- |
| `id`                 | INTEGER (PK, AutoIncrement)            | Primary key                                  |
| `user_id`            | TEXT (DEFAULT '')                      | Booru User ID (provider-specific)            |
| `encrypted_api_key`  | TEXT (DEFAULT '')                      | Encrypted API key (encrypted at rest)        |
| `is_safe_mode`       | INTEGER (BOOLEAN, DEFAULT 1)           | Safe mode flag (blur NSFW content)           |
| `is_adult_confirmed` | INTEGER (BOOLEAN, DEFAULT 0)           | Adult confirmation flag (18+ confirmation)   |
| `is_adult_verified`  | INTEGER (BOOLEAN, DEFAULT 0, NOT NULL) | Adult verification flag (legal confirmation) |
| `tos_accepted_at`    | INTEGER (TIMESTAMP, NULL)              | Terms of Service acceptance timestamp        |

**Schema Definition:**

```typescript
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").default(""),
  encryptedApiKey: text("encrypted_api_key").default(""),
  isSafeMode: integer("is_safe_mode", { mode: "boolean" }).default(true),
  isAdultConfirmed: integer("is_adult_confirmed", { mode: "boolean" }).default(
    false
  ),
  isAdultVerified: integer("is_adult_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  tosAcceptedAt: integer("tos_accepted_at", { mode: "timestamp" }),
});
```

**TypeScript Types:**

```typescript
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
```

### Table: `playlists`

Stores playlist/collection information for curated post collections.

| Column        | Type                              | Description                                    |
| ------------- | --------------------------------- | ---------------------------------------------- |
| `id`          | INTEGER (PK, AutoIncrement)      | Primary key                                    |
| `name`        | TEXT (NOT NULL)                   | Playlist display name                          |
| `is_smart`    | INTEGER (BOOLEAN, DEFAULT 0)      | Smart playlist flag (dynamic tag-based queries) |
| `query_json`  | TEXT (DEFAULT '')                 | JSON-encoded smart playlist query              |
| `icon_name`   | TEXT (DEFAULT '')                 | Icon name for playlist display                 |
| `created_at`  | INTEGER (TIMESTAMP, NOT NULL)     | Creation timestamp (timestamp mode, ms)        |

**Indexes:**

- `playlists_createdAt_idx` - Index on `created_at` for sorting
- `playlists_isSmart_idx` - Index on `is_smart` for filtering smart playlists

**Schema Definition:**

```typescript
export const playlists = sqliteTable(
  "playlists",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    isSmart: integer("is_smart", { mode: "boolean" })
      .notNull()
      .default(false),
    queryJson: text("query_json").default(""),
    iconName: text("icon_name").default(""),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    createdAtIdx: index("playlists_createdAt_idx").on(t.createdAt),
    isSmartIdx: index("playlists_isSmart_idx").on(t.isSmart),
  })
);
```

**TypeScript Types:**

```typescript
export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;
```

### Table: `playlist_entries`

Junction table linking playlists to posts. Uses composite primary key to prevent duplicate entries.

| Column        | Type                              | Description                                    |
| ------------- | --------------------------------- | ---------------------------------------------- |
| `playlist_id` | INTEGER (NOT NULL, FK)            | Foreign key to `playlists.id` (CASCADE DELETE) |
| `post_id`     | INTEGER (NOT NULL, FK)            | Foreign key to `posts.id` (CASCADE DELETE)     |
| `added_at`    | INTEGER (TIMESTAMP, NOT NULL)     | Timestamp when post was added (timestamp mode, ms) |

**Primary Key:**

- Composite primary key: `(playlist_id, post_id)` - Ensures uniqueness and prevents duplicate entries

**Indexes:**

- `playlist_entries_playlist_id_idx` - Index on `playlist_id` for fast playlist queries
- `playlist_entries_post_id_idx` - Index on `post_id` for fast post queries
- `playlist_entries_playlist_post_idx` - Composite index on `(playlist_id, post_id)` for common queries
- `playlist_entries_added_at_idx` - Index on `added_at` for sorting by addition date

**Schema Definition:**

```typescript
export const playlistEntries = sqliteTable(
  "playlist_entries",
  {
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    addedAt: integer("added_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playlistId, t.postId] }),
    playlistIdIdx: index("playlist_entries_playlist_id_idx").on(t.playlistId),
    postIdIdx: index("playlist_entries_post_id_idx").on(t.postId),
    playlistPostIdx: index("playlist_entries_playlist_post_idx").on(
      t.playlistId,
      t.postId
    ),
    addedAtIdx: index("playlist_entries_added_at_idx").on(t.addedAt),
  })
);
```

**TypeScript Types:**

```typescript
export type PlaylistEntry = typeof playlistEntries.$inferSelect;
export type NewPlaylistEntry = typeof playlistEntries.$inferInsert;
```

**Cascade Behavior:**

- Deleting a playlist automatically deletes all associated `playlist_entries` records
- Deleting a post automatically removes it from all playlists (via cascade delete)

All database operations are performed directly in the **Main Process** using synchronous access via `better-sqlite3`. WAL (Write-Ahead Logging) mode is enabled to allow concurrent reads while writes are in progress.

### Database Client Architecture

**Database Client** (`src/main/db/client.ts`):

- Direct synchronous access to SQLite via `better-sqlite3`
- WAL mode enabled for concurrent reads
- Optimized SQLite pragmas: `synchronous = NORMAL`, `temp_store = MEMORY`, memory-mapped I/O
- Manages database initialization and migrations
- Provides `getDb()` and `getSqliteInstance()` functions
- Automatic migration execution on startup
- Portable mode support (automatic detection)

### Initialization

```typescript
import { initializeDatabase, getDb } from "./db/client";

// Initialize database (runs migrations automatically)
await initializeDatabase();

// Get database instance for queries
const db = getDb();
```

**Note:** Migrations run automatically on database initialization. The database connection is managed in the Main Process.

### Available Methods (via Drizzle ORM)

All database operations are accessed through Drizzle ORM using the database instance from `getDb()`.

**Driver behavior note:** This project uses `better-sqlite3` (synchronous driver). Write queries (`insert`, `update`, `delete`) must end with `.run()`. Read queries (`db.query...`) auto-execute.

#### Get All Artists

Retrieves all tracked artists, ordered by name.

**Example:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";
import { asc } from "drizzle-orm";

const db = getDb();
const artistsList = await db.query.artists.findMany({
  orderBy: [asc(artists.name)],
});
```

#### Add Artist

Adds a new artist to track.

**Example:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";

const db = getDb();
const newArtist = {
  name: "Example Artist",
  tag: "tag_name",
  type: "tag" as const,
  apiEndpoint: "https://api.rule34.xxx",
  lastPostId: 0,
  newPostsCount: 0,
};

const result = db.insert(artists).values(newArtist).run();
const savedArtistId = Number(result.lastInsertRowid);
```

#### Delete Artist

Deletes an artist and all associated posts (cascade delete).

**Example:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
db.delete(artists).where(eq(artists.id, 123)).run();
```

#### Get Posts by Artist

Retrieves posts for a specific artist with pagination.

**Example:**

```typescript
import { getDb } from "./db/client";
import { posts } from "./schema";
import { eq, desc } from "drizzle-orm";

const db = getDb();
const limit = 50;
const offset = 0;

const postsList = await db.query.posts.findMany({
  where: eq(posts.artistId, 123),
  orderBy: [desc(posts.postId)],
  limit,
  offset,
});
```

**Note:** The IPC method `getArtistPosts` uses a limit of 50 posts per page for better performance.

#### Save Posts (Bulk Upsert)

Saves posts for an artist using bulk upsert. Updates artist's `lastPostId` and increments `newPostsCount`.

**Example:**

```typescript
import { getDb } from "./db/client";
import { posts, artists } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
const newPosts: NewPost[] = [
  {
    postId: 12345,
    artistId: 1,
    fileUrl: "https://...",
    previewUrl: "https://...",
    sampleUrl: "https://...",
    rating: "s",
    tags: "tag1 tag2 tag3",
    publishedAt: new Date(),
  },
];

// Bulk upsert with ON CONFLICT handling
db
  .insert(posts)
  .values(newPosts)
  .onConflictDoUpdate({
    target: [posts.artistId, posts.postId],
    set: {
      fileUrl: sql`excluded.file_url`,
      previewUrl: sql`excluded.preview_url`,
      // ... other fields
    },
  })
  .run();

// Update artist's lastPostId
db
  .update(artists)
  .set({ lastPostId: Math.max(...newPosts.map((p) => p.postId)) })
  .where(eq(artists.id, 1))
  .run();
```

#### Get Settings

Retrieves stored settings. API key is encrypted and should be decrypted in Main Process.

**Example:**

```typescript
import { getDb } from "./db/client";
import { settings } from "./schema";
import { SecureStorage } from "../services/secure-storage";

const db = getDb();
const settingsRecord = await db.query.settings.findFirst();

if (settingsRecord && settingsRecord.encryptedApiKey) {
  // Decrypt API key using SecureStorage (only in Main Process)
  const decryptedKey = SecureStorage.decrypt(settingsRecord.encryptedApiKey);
  // decryptedKey is string | null
}
```

#### Save Settings

Saves or updates settings. API key should be encrypted before saving.

**Example:**

```typescript
import { getDb } from "./db/client";
import { settings } from "./schema";
import { SecureStorage } from "../services/secure-storage";

const db = getDb();
const encryptedKey = SecureStorage.encrypt("your-api-key");

db
  .insert(settings)
  .values({
    userId: "123456",
    encryptedApiKey: encryptedKey,
    isSafeMode: true,
    isAdultConfirmed: false,
  })
  .onConflictDoUpdate({
    target: settings.id,
    set: {
      userId: sql`excluded.user_id`,
      encryptedApiKey: sql`excluded.encrypted_api_key`,
    },
  })
  .run();
```

#### Mark Post as Viewed

Marks a post as viewed in the database.

**Example:**

```typescript
import { getDb } from "./db/client";
import { posts } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
db.update(posts).set({ isViewed: true }).where(eq(posts.id, 123)).run();
```

#### Toggle Post Favorite

Toggles the favorite status of a post in the database.

**Example:**

```typescript
import { getDb } from "./db/client";
import { posts } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
const post = await db.query.posts.findFirst({
  where: eq(posts.id, 123),
});

if (post) {
  db
    .update(posts)
    .set({ isFavorited: !post.isFavorited })
    .where(eq(posts.id, 123))
    .run();
}
```

#### Search Artists

Searches for artists in the local database by name or tag.

**Example:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";
import { or, like } from "drizzle-orm";

const db = getDb();
const query = "artist";
const results = await db.query.artists.findMany({
  where: or(like(artists.name, `%${query}%`), like(artists.tag, `%${query}%`)),
});
```

## Migrations

### Generating Migrations

When modifying the schema (`src/main/db/schema.ts`), generate a migration:

```bash
npm run db:generate
```

This creates a new migration file in the `drizzle/` directory.

### Running Migrations

Migrations are automatically run on application startup via `src/main/db/migrate.ts`.

**Manual execution:**

```bash
npm run db:migrate
```

### Migration Files

Migrations are stored in `drizzle/`:

- **SQL files:** `drizzle/*.sql` - **Tracked in git** (included in repository and build)
- **Metadata:** `drizzle/meta/` - **Ignored by git** (local development files)
  - `meta/_journal.json` - Migration journal
  - `meta/*_snapshot.json` - Schema snapshots
- **Migrations config:** `drizzle/migrations.json` - **Ignored by git** (generated file)

**Note:** Only SQL migration files are tracked in version control. Meta files and migration configuration are generated locally and should not be committed.

**Example Migration:**

```sql
CREATE TABLE `artists` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `username` text NOT NULL,
  `api_endpoint` text NOT NULL,
  `last_post_id` integer DEFAULT 0 NOT NULL,
  `new_posts_count` integer DEFAULT 0 NOT NULL,
  `last_checked` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
```

## Drizzle ORM

### Configuration

**File:** `drizzle.config.ts`

```typescript
export default defineConfig({
  schema: "./src/main/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./metadata.db",
  },
});
```

### Query Examples

**Select All Artists:**

```typescript
const artists = await db.query.artists.findMany({
  orderBy: [asc(schema.artists.username)],
});
```

**Find Artist by ID:**

```typescript
const artist = await db.query.artists.findFirst({
  where: eq(schema.artists.id, artistId),
});
```

**Insert Artist:**

```typescript
const result = db
  .insert(schema.artists)
  .values(artistData)
  .run();
```

**Update Artist:**

```typescript
db
  .update(schema.artists)
  .set({
    lastPostId: newPostId,
    newPostsCount: count,
    lastChecked: new Date(), // Uses timestamp mode
  })
  .where(eq(schema.artists.id, artistId))
  .run();
```

## Database Studio

Drizzle Kit provides a database studio for viewing and editing data:

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:4983` (default).

## Best Practices

### 1. Type Safety

Always use Drizzle's inferred types:

```typescript
// Good
const artist: Artist = await dbService.getTrackedArtists()[0];

// Bad
const artist: any = await dbService.getTrackedArtists()[0];
```

### 2. Error Handling

Always handle database errors:

```typescript
try {
  const artist = await dbService.addArtist(data);
} catch (error) {
  logger.error("Database error:", error);
  throw error;
}
```

### 3. Transactions

> ⚠️ **Synchronous transactions only:** This project uses better-sqlite3 (synchronous driver). All DB operations inside a transaction are SYNCHRONOUS. Never use `async` callbacks or `await` inside `db.transaction(...)`. See `.cursorrules` for the full ruleset.

For multiple related operations, use transactions:

```typescript
// CORRECT: sync callback, sync operations, mandatory .run()
db.transaction((tx) => {
  tx.insert(schema.artists).values(artistData).run();
  tx.insert(schema.posts).values(postData).run();
});
```

### 4. Indexes

Add indexes for frequently queried columns:

```typescript
// Example (to be added)
export const artists = sqliteTable(
  "artists",
  {
    // ... columns
  },
  (table) => ({
    usernameIdx: index("username_idx").on(table.username),
  })
);
```

## Backup and Recovery

### Backup

The application provides built-in backup functionality:

1. **Manual Backup:** Use `window.api.createBackup()` or the Backup Controls UI component
2. **Backup Location:** Backups are stored in the user data directory with timestamped filenames
3. **Backup Format:** Full SQLite database copy

**Example:**

```typescript
const result = await window.api.createBackup();
if (result.success) {
  console.log(`Backup created at: ${result.path}`);
}
```

### Recovery

**Using the Application:**

1. Use `window.api.restoreBackup()` or the Backup Controls UI component
2. Select a backup file from the file dialog
3. Database integrity check runs automatically before restore
4. Application window reloads after successful restore

**Manual Recovery:**

If the database becomes corrupted and you need to restore manually:

1. Stop the application
2. Locate the backup file (in user data directory)
3. Copy the backup file to replace `metadata.db`
4. Restart the application (migrations will run automatically)

**Note:** The restore process includes automatic integrity checks using `PRAGMA integrity_check` before replacing the database. If integrity check fails, the restore is rolled back and original database is preserved.

## Performance Considerations

1. **WAL Mode:** Write-Ahead Logging mode enabled for concurrent reads
2. **Indexes:**
   - Single-column indexes on `artistId`, `isViewed`, `publishedAt`, `isFavorited`, `lastChecked`, `createdAt`, `mediaType`
   - Composite index on `(artist_id, rating, is_viewed)` for common filter combinations
   - Composite index on `(artist_id, media_type)` for artist + media type filtering
   - Index on `media_type` for fast image/video filtering
   - Playlist indexes: `playlists_createdAt_idx`, `playlists_isSmart_idx`, `playlist_entries_playlist_id_idx`, `playlist_entries_post_id_idx`, `playlist_entries_added_at_idx`, `playlist_entries_playlist_post_idx`
3. **FTS5 Full-Text Search:**
   - Virtual table `posts_fts` for fast tag searching using FTS5
   - External content table (no data duplication) with `unicode61` tokenizer
   - Automatic synchronization via triggers (INSERT, UPDATE, DELETE)
   - Supports prefix search with `*` wildcard (e.g., `tag*`)
   - Case-insensitive search with proper Unicode handling
4. **SQLite Optimization:**
   - `synchronous = NORMAL` for optimal performance with WAL mode
   - `temp_store = MEMORY` for faster temporary table operations
   - Memory-mapped I/O (configurable via `SQLITE_MMAP_SIZE` env var, default 64MB)
5. **Batch Operations:** Bulk upsert operations process posts in chunks (200 posts per chunk) to avoid SQLite variable limit
6. **Query Optimization:**
   - Use Drizzle's query builder efficiently with proper indexes
   - FTS5 queries use EXISTS with JOIN pattern for optimal performance
   - Composite indexes optimize multi-column filter queries
7. **Synchronous Access:** Direct synchronous access via `better-sqlite3` in Main Process
8. **Connection Management:** Single database connection managed in Main Process

## Full-Text Search (FTS5)

The application uses SQLite FTS5 for efficient tag searching in the `posts` table.

### FTS5 Virtual Table

**Table:** `posts_fts`

- **Type:** External content table (references `posts` table, no data duplication)
- **Tokenizer:** `unicode61` for proper Unicode handling and case-insensitive search
- **Columns:** `tags` (indexed for full-text search)
- **Content Mapping:** `content='posts'`, `content_rowid='id'`

### Features

- **Fast Tag Search:** FTS5 index provides sub-millisecond search performance even on large datasets (100k+ records)
- **Prefix Search:** Supports `*` wildcard at end of words (e.g., `tag*` searches for tags starting with "tag")
- **Case-Insensitive:** Unicode tokenizer handles case-insensitive search automatically
- **Multi-Language Support:** Proper Unicode handling for tags in different languages
- **Automatic Sync:** Triggers keep FTS5 index synchronized with `posts` table:
  - `posts_fts_insert` - Populates index on INSERT
  - `posts_fts_update` - Updates index on tags UPDATE
  - `posts_fts_delete` - Removes from index on DELETE

### Usage

FTS5 is used automatically when filtering posts by tags via `PostsController.getPosts()`:

```typescript
// FTS5 search is used internally when filters.tags is provided
const posts = await db.getPosts({
  filters: { tags: "blue_hair" },
  page: 1,
  limit: 50,
});
```

### Performance

- **Index Size:** Minimal (external content table stores only index, not data)
- **Search Speed:** O(log n) complexity, typically < 10ms for 100k+ records
- **Memory Usage:** Low (no data duplication, only index structures)

## Future Enhancements

Planned database improvements:

- ✅ **Full-text search indexes for tags (FTS5):** ✅ **Implemented**
  - FTS5 virtual table `posts_fts` with `unicode61` tokenizer
  - External content table for space efficiency
  - Automatic synchronization via triggers
  - Supports prefix search and case-insensitive queries
- ✅ **Composite Indexes:** ✅ **Implemented**
  - Composite index on `(artist_id, rating, is_viewed)` for optimized filter queries
  - Composite index on `(artist_id, media_type)` for optimized artist + media type filtering
- ✅ **Media Type Column:** ✅ **Implemented**
  - `media_type` column in `posts` table for efficient image/video filtering
  - Automatic detection during sync, background backfill for existing data
  - Indexed column lookups replace slow `LIKE` queries
- ✅ **Favorites System:** Implemented with `isFavorited` field and index
- ✅ **Playlists Tables:** ✅ **Implemented**
  - `playlists` table with support for manual and smart playlists
  - `playlist_entries` junction table with composite primary key
  - Full CRUD operations via `PlaylistController`
- ⏳ **Subscriptions Table:** Tag subscriptions feature planned (schema not yet implemented)
- ⏳ Post deduplication logic
- ⏳ Statistics tables for analytics
- ⏳ Export/import functionality
- ⏳ Database compaction utilities
