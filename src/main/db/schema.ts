import {
  sqliteTable,
  text,
  integer,
  unique,
  index,
} from "drizzle-orm/sqlite-core";

// Artist type constants for type safety
export const ARTIST_TYPES = ["tag", "uploader", "query"] as const;
export type ArtistType = typeof ARTIST_TYPES[number];

// Provider constants (must match providers/index.ts)
export const PROVIDER_IDS_SCHEMA = ["rule34", "gelbooru"] as const;

export const artists = sqliteTable(
  "artists",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    tag: text("tag").notNull().unique(),
    // Provider ID with enum constraint
    provider: text("provider", { enum: PROVIDER_IDS_SCHEMA }).notNull().default("rule34"),
    type: text("type", { enum: ARTIST_TYPES }).notNull(),
    apiEndpoint: text("api_endpoint").notNull(),
    lastPostId: integer("last_post_id").notNull().default(0),
    newPostsCount: integer("new_posts_count").notNull().default(0),
    lastChecked: integer("last_checked", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    // Indexes for COALESCE sorting performance (critical for >1000 artists)
    // Separate indexes allow SQLite to use index scan instead of full table scan
    lastCheckedIdx: index("artists_lastChecked_idx").on(t.lastChecked),
    createdAtIdx: index("artists_createdAt_idx").on(t.createdAt),
    // Composite index for common query pattern: COALESCE(lastChecked, createdAt) DESC
    // SQLite can use this for efficient sorting when both columns are indexed
    lastCheckedCreatedAtIdx: index("artists_lastChecked_createdAt_idx").on(
      t.lastChecked,
      t.createdAt
    ),
  })
);

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    publishedAt: integer("published_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    isViewed: integer("is_viewed", { mode: "boolean" })
      .notNull()
      .default(false),
    isFavorited: integer("is_favorited", { mode: "boolean" }) // Добавили поле
      .notNull()
      .default(false),
  },
  (t) => ({
    uniquePost: unique().on(t.artistId, t.postId),
    artistIdIdx: index("artistIdIdx").on(t.artistId),
    isViewedIdx: index("isViewedIdx").on(t.isViewed),
    publishedAtIdx: index("publishedAtIdx").on(t.publishedAt),
    isFavoritedIdx: index("isFavoritedIdx").on(t.isFavorited),
  })
);

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").default(""),
  encryptedApiKey: text("encrypted_api_key").default(""),
  isSafeMode: integer("is_safe_mode", { mode: "boolean" }).default(true),
  isAdultConfirmed: integer("is_adult_confirmed", { mode: "boolean" }).default(
    false
  ),
});

// Types
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
export type Post = typeof posts.$inferSelect & {
  isFavorited: boolean;
};
export type NewPost = typeof posts.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
