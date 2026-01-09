import {
  sqliteTable,
  text,
  integer,
  unique,
  index,
} from "drizzle-orm/sqlite-core";

// Artist type constants for type safety
export const ARTIST_TYPES = ["tag", "uploader", "query"] as const;
export type ArtistType = (typeof ARTIST_TYPES)[number];

// Provider constants (must match providers/index.ts)
export const PROVIDER_IDS_SCHEMA = ["rule34", "gelbooru"] as const;

// Tag type constants for type safety (matches Rule34 API tag types)
export const TAG_TYPES = {
  GENERAL: 0,
  ARTIST: 1,
  COPYRIGHT: 3,
  CHARACTER: 4,
  META: 5,
} as const;

export type TagType = typeof TAG_TYPES[keyof typeof TAG_TYPES];

// Settings ID constant for single profile design
export const SETTINGS_ID = 1;

export const artists = sqliteTable(
  "artists",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    tag: text("tag").notNull().unique(),
    // Provider ID with enum constraint
    provider: text("provider", { enum: PROVIDER_IDS_SCHEMA })
      .notNull()
      .default("rule34"),
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
    // Note: Expression index for COALESCE(lastChecked, createdAt) is created via migration
    // See drizzle/0003_add_artists_sort_index.sql
    // Drizzle doesn't support expression indexes directly, so we use raw SQL in migration
    // Individual column indexes are kept for other potential queries
    lastCheckedIdx: index("artists_lastChecked_idx").on(t.lastChecked),
    createdAtIdx: index("artists_createdAt_idx").on(t.createdAt),
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
    postIdIdx: index("postIdIdx").on(t.postId),
    artistIdIdx: index("artistIdIdx").on(t.artistId),
    isViewedIdx: index("isViewedIdx").on(t.isViewed),
    publishedAtIdx: index("publishedAtIdx").on(t.publishedAt),
    isFavoritedIdx: index("isFavoritedIdx").on(t.isFavorited),
    // Composite index for common filter combination: artistId + rating + isViewed
    // Optimizes queries filtering by these columns simultaneously
    artistRatingViewedIdx: index("posts_artist_rating_viewed_idx").on(
      t.artistId,
      t.rating,
      t.isViewed
    ),
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
  isAdultVerified: integer("is_adult_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  tosAcceptedAt: integer("tos_accepted_at", { mode: "timestamp" }),
});

export const tagMetadata = sqliteTable(
  "tag_metadata",
  {
    name: text("name").primaryKey(),
    type: integer("type").notNull(), // Use TAG_TYPES constants: 0=General, 1=Artist, 3=Copyright, 4=Character, 5=Meta
  },
  (t) => ({
    typeIdx: index("tag_metadata_type_idx").on(t.type), // Index for filtering by type (e.g., all artists)
  })
);

// Types
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
export type Post = typeof posts.$inferSelect & {
  isFavorited: boolean;
};
export type NewPost = typeof posts.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type TagMetadata = typeof tagMetadata.$inferSelect;
export type NewTagMetadata = typeof tagMetadata.$inferInsert;