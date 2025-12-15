import {
  sqliteTable,
  text,
  integer,
  unique,
  index,
} from "drizzle-orm/sqlite-core";

export const artists = sqliteTable("artists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tag: text("tag").notNull().unique(),
  type: text("type", { enum: ["tag", "uploader", "query"] }).notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  lastPostId: integer("last_post_id").notNull().default(0),
  newPostsCount: integer("new_posts_count").notNull().default(0),
  lastChecked: integer("last_checked", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

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
