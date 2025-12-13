import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- 1. SETTINGS TABLE ---
export const settings = sqliteTable("settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id"),
  apiKey: text("api_key"),
});

// --- 2. ARTISTS TABLE ---
const artistType = ["tag", "uploader"] as const;
export const artists = sqliteTable("artists", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tag: text("tag").notNull(),
  type: text("type", { enum: artistType }).notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  lastPostId: integer("last_post_id").default(0).notNull(),
  newPostsCount: integer("new_posts_count").default(0).notNull(),
  lastChecked: integer("last_checked"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch`),
});

// --- 3. POSTS TABLE ---
export const posts = sqliteTable("posts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  previewUrl: text("preview_url").notNull(),
  title: text("title"),
  rating: text("rating"),
  tags: text("tags"),

  publishedAt: integer("published_at").notNull(),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch`),

  isViewed: integer("is_viewed", { mode: "boolean" }).default(false).notNull(),
});

// --- 4. TYPE EXPORTS ---
export type Settings = typeof settings.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type NewArtist = Omit<
  typeof artists.$inferInsert,
  "id" | "createdAt" | "lastPostId" | "newPostsCount"
> & {
  type: (typeof artistType)[number];
};
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
