# Database Documentation

## Overview

The application uses **SQLite** as the local database for storing metadata, tracked artists, posts, and subscriptions. The database is accessed exclusively through the **Main Process** using **Drizzle ORM** for type-safe queries.

## Database Location

The database file is stored in the Electron user data directory:

- **Windows:** `%APPDATA%/NSFW Booru Client/metadata.db`
- **macOS:** `~/Library/Application Support/NSFW Booru Client/metadata.db`
- **Linux:** `~/.config/NSFW Booru Client/metadata.db`

**Implementation:**

```typescript
const DB_PATH = path.join(app.getPath("userData"), "metadata.db");
```

## Schema

### Table: `artists`

Stores information about tracked artists/users.

| Column            | Type                           | Description                     |
| ----------------- | ------------------------------ | ------------------------------- |
| `id`              | INTEGER (PK, AutoIncrement)    | Primary key                     |
| `name`            | TEXT (NOT NULL)                | Artist display name             |
| `tag`             | TEXT (NOT NULL, UNIQUE)        | Tag or username for tracking    |
| `type`            | TEXT (NOT NULL, DEFAULT 'tag') | Type: "tag" or "uploader"       |
| `api_endpoint`    | TEXT (NOT NULL)                | Base API endpoint URL           |
| `last_post_id`    | INTEGER (NOT NULL, DEFAULT 0)  | ID of the last seen post        |
| `new_posts_count` | INTEGER (NOT NULL, DEFAULT 0)  | Count of new, unviewed posts    |
| `last_checked`    | INTEGER (NULL)                 | Timestamp of last API poll      |
| `created_at`      | INTEGER (NOT NULL)             | Creation timestamp (Unix epoch) |

**Schema Definition:**

```typescript
export const artists = sqliteTable("artists", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tag: text("tag").notNull().unique(),
  type: text("type", { enum: ["tag", "uploader"] })
    .default("tag")
    .notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  lastPostId: integer("last_post_id").default(0).notNull(),
  newPostsCount: integer("new_posts_count").default(0).notNull(),
  lastChecked: integer("last_checked", { mode: "number" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});
```

**TypeScript Types:**

```typescript
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
```

### Table: `posts`

Caches post metadata for filtering, statistics, and download management.

| Column         | Type                                   | Description                                    |
| -------------- | -------------------------------------- | ---------------------------------------------- |
| `id`           | INTEGER (PK)                           | Post ID from external API (not auto-increment) |
| `artist_id`    | INTEGER (FK → artists.id)              | Reference to artist                            |
| `title`        | TEXT (NOT NULL)                        | Post title                                     |
| `file_url`     | TEXT (NOT NULL)                        | Direct URL to media file                       |
| `tag_hash`     | TEXT (NULL)                            | Hash or JSON of tags                           |
| `is_viewed`    | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Whether post has been viewed                   |
| `published_at` | INTEGER (NOT NULL)                     | Publication timestamp (Unix epoch)             |
| `created_at`   | INTEGER                                | When added to local database (Unix epoch)      |

**Schema Definition:**

```typescript
export const posts = sqliteTable("posts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: false }),
  artistId: integer("artist_id")
    .references(() => artists.id, { onDelete: "cascade" })
    .notNull(),
  fileUrl: text("file_url").notNull(),
  previewUrl: text("preview_url"),
  title: text("title").default(""),
  rating: text("rating"),
  tags: text("tags"),
  publishedAt: integer("published_at", { mode: "number" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  isViewed: integer("is_viewed", { mode: "boolean" }).default(false).notNull(),
});
```

**TypeScript Types:**

```typescript
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

### Table: `subscriptions`

Stores user subscriptions to tag combinations.

| Column            | Type                          | Description                                      |
| ----------------- | ----------------------------- | ------------------------------------------------ |
| `id`              | INTEGER (PK, AutoIncrement)   | Primary key                                      |
| `tag_string`      | TEXT (NOT NULL, UNIQUE)       | Tag search string (e.g., 'tag_a, tag_b, -tag_c') |
| `last_post_id`    | INTEGER (NOT NULL, DEFAULT 0) | ID of last seen post for this subscription       |
| `new_posts_count` | INTEGER (NOT NULL, DEFAULT 0) | Count of new posts matching tags                 |

**Schema Definition:**

```typescript
export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  tagString: text("tag_string").notNull().unique(),
  lastPostId: integer("last_post_id", { mode: "number" }).notNull().default(0),
  newPostsCount: integer("new_posts_count", { mode: "number" })
    .notNull()
    .default(0),
});
```

## Database Service

All database operations are performed through the `DbService` class (`src/main/db/db-service.ts`).

### Initialization

```typescript
import Database from "better-sqlite3";
import { DbService } from "./db/db-service";

const dbInstance = new Database(DB_PATH);
const dbService = new DbService(dbInstance);
```

### Available Methods

#### `getTrackedArtists(): Promise<Artist[]>`

Retrieves all tracked artists, ordered by username.

**Example:**

```typescript
const artists = await dbService.getTrackedArtists();
```

#### `addArtist(artistData: NewArtist): Promise<Artist>`

Adds a new artist to track.

**Example:**

```typescript
const newArtist: NewArtist = {
  name: "Example Artist",
  tag: "tag_name",
  type: "tag",
  apiEndpoint: "https://api.rule34.xxx",
  lastPostId: 0,
  newPostsCount: 0,
};

const savedArtist = await dbService.addArtist(newArtist);
```

#### `deleteArtist(id: number): Promise<void>`

Deletes an artist and all associated posts (cascade delete).

**Example:**

```typescript
await dbService.deleteArtist(123);
```

#### `getPostsByArtist(artistId: number, limit?: number, offset?: number): Promise<Post[]>`

Retrieves posts for a specific artist with pagination.

**Parameters:**

- `artistId: number` - Artist ID
- `limit?: number` - Number of posts to retrieve (default: 1000)
- `offset?: number` - Number of posts to skip (default: 0)

**Example:**

```typescript
// Get first 50 posts
const posts = await dbService.getPostsByArtist(123, 50, 0);

// Get next 50 posts (page 2)
const nextPosts = await dbService.getPostsByArtist(123, 50, 50);
```

**Note:** The IPC method `getArtistPosts` uses a limit of 50 posts per page for better performance.

#### `savePostsForArtist(artistId: number, posts: NewPost[]): Promise<void>`

Saves posts for an artist. Updates artist's `lastPostId` and increments `newPostsCount`.

**Example:**

```typescript
const newPosts: NewPost[] = [
  {
    id: 12345,
    artistId: 1,
    fileUrl: "https://...",
    previewUrl: "https://...",
    rating: "s",
    tags: "tag1 tag2 tag3",
    publishedAt: 1234567890,
  },
];

await dbService.savePostsForArtist(1, newPosts);
```

#### `getSettings(): Promise<Settings | undefined>`

Retrieves stored API credentials.

**Example:**

```typescript
const settings = await dbService.getSettings();
if (settings) {
  console.log(settings.userId);
}
```

#### `saveSettings(userId: string, apiKey: string): Promise<void>`

Saves or updates API credentials (always uses id=1).

**Example:**

```typescript
await dbService.saveSettings("123456", "your-api-key");
```

#### `updateArtistPostStatus(artistId: number, newPostId: number, count: number): Promise<void>`

Updates the last seen post ID and new posts count for an artist.

**Example:**

```typescript
await dbService.updateArtistPostStatus(123, 45678, 5);
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

- SQL files: `0000_*.sql`
- Metadata: `meta/_journal.json`
- Snapshots: `meta/*_snapshot.json`

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
const result = await db
  .insert(schema.artists)
  .values(artistData)
  .returning({ id: schema.artists.id });
```

**Update Artist:**

```typescript
await db
  .update(schema.artists)
  .set({
    lastPostId: newPostId,
    newPostsCount: count,
    lastChecked: Math.floor(Date.now() / 1000),
  })
  .where(eq(schema.artists.id, artistId));
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

For multiple related operations, use transactions:

```typescript
// Example (to be implemented)
await db.transaction(async (tx) => {
  await tx.insert(schema.artists).values(artistData);
  await tx.insert(schema.posts).values(postData);
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

The database file can be backed up by copying `metadata.db` from the user data directory.

### Recovery

If the database becomes corrupted:

1. Stop the application
2. Delete or rename `metadata.db`
3. Restart the application (migrations will recreate the schema)
4. Re-add artists and data

## Performance Considerations

1. **Indexes:** Add indexes on frequently queried columns
2. **Batch Operations:** Use transactions for multiple inserts
3. **Query Optimization:** Use Drizzle's query builder efficiently
4. **Connection Pooling:** SQLite uses a single connection (better-sqlite3)

## Future Enhancements

Planned database improvements:

- Full-text search indexes for tags
- Post deduplication logic
- Statistics tables for analytics
- Export/import functionality
- Database compaction utilities


