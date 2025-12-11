import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// --- 1. Таблица отслеживаемых авторов (Tracked Artists) ---
export const artists = sqliteTable("artists", {
  // Уникальный ID, который мы получаем от внешнего API (e.g., ArtStation user_id)
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: false }),

  // Псевдоним автора (для удобства отображения в UI)
  username: text("username").notNull(),

  // Полный или базовый API-эндпоинт для этого автора
  apiEndpoint: text("api_endpoint").notNull(),

  // ID последнего поста, который мы видели. Ключевое поле для обнаружения обновлений.
  lastPostId: integer("last_post_id", { mode: "number" }).notNull().default(0),

  // Счетчик новых, непросмотренных постов (для бейджа UI)
  newPostsCount: integer("new_posts_count", { mode: "number" })
    .notNull()
    .default(0),

  // Временная метка последнего успешного API-опроса
  lastChecked: integer("last_checked", { mode: "number" }).default(
    sql`(unixepoch('now'))`
  ),
});

// --- 2. Таблица кэша постов (Cache of Post Metadata) ---
// Хранит метаданные (теги, рейтинг) для фильтрации и статистики (Tag Explorer).
export const posts = sqliteTable("posts", {
  // Уникальный ID поста от внешнего API
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: false }),

  // Внешний ID автора, FK к таблице artists
  artistId: integer("artist_id", { mode: "number" })
    .references(() => artists.id, { onDelete: "cascade" })
    .notNull(),

  // Основные метаданные (можно сохранить как JSON, но для SQL лучше отдельные поля)
  title: text("title").notNull(),

  // Прямой URL к медиа (для One-Click Download)
  fileUrl: text("file_url").notNull(),

  // Хеш тегов (или JSON тегов), для быстрого поиска и статистики
  tagHash: text("tag_hash"),

  // Статус: был ли просмотрен (для DOM Enhancements)
  isViewed: integer("is_viewed", { mode: "boolean" }).notNull().default(false),

  // Дата публикации
  publishedAt: integer("published_at", { mode: "number" }).notNull(),

  // Когда пост был добавлен в нашу локальную базу
  createdAt: integer("created_at", { mode: "number" }).default(
    sql`(unixepoch('now'))`
  ),
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
