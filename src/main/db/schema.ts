import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- 1. SETTINGS TABLE ---
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  userId: text("user_id"),
  apiKey: text("api_key"),
});

// --- 2. ARTISTS TABLE ---
export const artists = sqliteTable("artists", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  tag: text("tag").notNull(),
  type: text("type").notNull(), // 'tag' | 'uploader'
  apiEndpoint: text("api_endpoint"),
  lastPostId: integer("last_post_id").default(0).notNull(),
  newPostsCount: integer("new_posts_count").default(0).notNull(),
  lastChecked: integer("last_checked", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --- 3. POSTS TABLE ---
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey(),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  previewUrl: text("preview_url").notNull(),
  title: text("title"),
  rating: text("rating"),
  tags: text("tags"),
  publishedAt: integer("published_at"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  // Новое поле для миграции
  isViewed: integer("is_viewed", { mode: "boolean" }).default(false),
});

// --- 4. TYPE EXPORTS (Генерируем типы из таблиц) ---

export type Settings = typeof settings.$inferSelect;

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
