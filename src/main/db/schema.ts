import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// --- 1. Таблица отслеживаемых авторов (Tracked Artists) ---
export const artists = sqliteTable("artists", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),

  name: text("name").notNull(),
  tag: text("tag").notNull(),

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

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  userId: text("userId").notNull(),
  apiKey: text("apiKey").notNull(),
});

// --- 2. Таблица кэша постов (Cache of Post Metadata) ---
// Хранит метаданные (теги, рейтинг) для фильтрации и статистики (Tag Explorer).
export const posts = sqliteTable("posts", {
  // ID с Rule34 (не автоинкремент, так как мы берем их ID)
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: false }),

  artistId: integer("artist_id")
    .references(() => artists.id, { onDelete: "cascade" })
    .notNull(),

  fileUrl: text("file_url").notNull(),

  // ДОБАВЛЕНЫ НОВЫЕ ПОЛЯ:
  previewUrl: text("preview_url"), // Превью
  rating: text("rating"), // Рейтинг (s, q, e)
  tags: text("tags"), // Теги одной строкой

  title: text("title").default(""),

  // Даты
  publishedAt: integer("published_at", { mode: "number" }).notNull(), // Дата с Booru
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),

  isViewed: integer("is_viewed", { mode: "boolean" }).default(false).notNull(),
});

// --- 3. Таблица подписок (Subscriptions / Watched Tags) ---
// Хранит пользовательские подписки на теги или их комбинации.
export const subscriptions = sqliteTable("subscriptions", {
  // ID подписки
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),

  // Набор тегов (строка поиска, например, 'tag_a, tag_b, -tag_c')
  tagString: text("tag_string").notNull().unique(),

  // ID последнего поста, который видели по этому набору тегов (для уведомлений)
  lastPostId: integer("last_post_id", { mode: "number" }).notNull().default(0),

  // Счетчик новых постов по этому набору тегов
  newPostsCount: integer("new_posts_count", { mode: "number" })
    .notNull()
    .default(0),
});

// --- 4. Типы (TypeScript Interfaces) ---
// Эти типы используются для строгого контроля данных в Main Process.
export type Artist = typeof artists.$inferSelect; // Тип для SELECT (чтение)
export type NewArtist = typeof artists.$inferInsert; // Тип для INSERT (запись)

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
