# Документация по базе данных

## 📑 Содержание

- [Обзор](#overview)
- [Расположение базы данных](#database-location)
- [Схема](#schema)
- [Архитектура базы данных](#database-architecture)
- [Доступные методы](#available-methods-via-drizzle-orm)
- [Миграции](#migrations)
- [Drizzle ORM](#drizzle-orm)
- [Database Studio](#database-studio)
- [Лучшие практики](#best-practices)
- [Резервное копирование и восстановление](#backup-and-recovery)
- [Вопросы производительности](#performance-considerations)
- [Будущие улучшения](#future-enhancements)

---

## Обзор

Приложение использует **SQLite** в качестве локальной базы данных для хранения метаданных, отслеживаемых артистов, постов и настроек. Доступ к базе данных осуществляется напрямую в **Main Process** с помощью **Drizzle ORM** для типобезопасных запросов. Включен режим WAL (Write-Ahead Logging) для одновременного чтения.

**📖 Связанная документация:**

- [Документация по архитектуре](./architecture.md) - Архитектура базы данных в системном дизайне
- [Документация по API](./api.md) - Методы IPC для операций с базой данных
- [Руководство по разработке](./development.md) - Скрипты и миграции базы данных
- [Глоссарий](./glossary.md) - Ключевые термины (WAL Mode, Drizzle ORM, Migration и т.д.)

## Расположение базы данных

Расположение файла базы данных зависит от режима работы приложения:

**Стандартный режим (установленный):**

- **Windows:** `%APPDATA%/RuleDesk/metadata.db`
- **macOS:** `~/Library/Application Support/RuleDesk/metadata.db`
- **Linux:** `~/.config/RuleDesk/metadata.db`

**Портативный режим (портативный исполняемый файл):**

- База данных хранится в `data/metadata.db` рядом с исполняемым файлом

**Реализация:**

```typescript
// Portable mode detection (in main.ts)
if (app.isPackaged) {
  const portableDataPath = path.join(path.dirname(process.execPath), "data");
  app.setPath("userData", portableDataPath);
}

// Database initialization (in db/client.ts)
const dbPath = path.join(app.getPath("userData"), "metadata.db");
```

## Схема

### Таблица: `artists`

Хранит информацию об отслеживаемых артистах/пользователях.

| Колонка            | Тип                               | Описание                                    |
| ----------------- | --------------------------------- | ------------------------------------------- |
| `id`              | INTEGER (PK, AutoIncrement)       | Первичный ключ                              |
| `name`            | TEXT (NOT NULL)                   | Отображаемое имя артиста                    |
| `tag`             | TEXT (NOT NULL, UNIQUE)           | Tag или имя пользователя для отслеживания   |
| `provider`        | TEXT (NOT NULL, DEFAULT 'rule34') | ID провайдера: "rule34" или "gelbooru"      |
| `type`            | TEXT (NOT NULL, DEFAULT 'tag')    | Тип: "tag", "uploader" или "query"          |
| `api_endpoint`    | TEXT (NOT NULL)                   | Базовый URL конечной точки API              |
| `last_post_id`    | INTEGER (NOT NULL, DEFAULT 0)     | ID последнего просмотренного поста          |
| `new_posts_count` | INTEGER (NOT NULL, DEFAULT 0)     | Количество новых, непросмотренных постов    |
| `last_checked`    | INTEGER (NULL)                    | Отметка времени последнего опроса API       |
| `created_at`      | INTEGER (NOT NULL)                | Отметка времени создания (timestamp mode, ms) |

**Определение схемы:**

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

**Типы TypeScript:**

```typescript
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
```

### Таблица: `posts`

Кэширует метаданные постов для фильтрации, статистики и управления загрузками. Поддерживает прогрессивную загрузку изображений с URL для предпросмотра, образца и полного разрешения.

| Колонка         | Тип                                   | Описание                                      |
| -------------- | -------------------------------------- | --------------------------------------------- |
| `id`           | INTEGER (PK, AutoIncrement)            | Внутренний ID поста                           |
| `post_id`      | INTEGER (NOT NULL)                     | ID поста из внешнего API                      |
| `artist_id`    | INTEGER (FK → artists.id)              | Ссылка на артиста                             |
| `file_url`     | TEXT (NOT NULL)                        | Прямой URL к медиафайлу полного разрешения   |
| `preview_url`  | TEXT (NOT NULL)                        | URL к предпросмотру низкого разрешения (размытый) |
| `sample_url`   | TEXT (NOT NULL, DEFAULT '')            | URL к образцу среднего разрешения             |
| `title`        | TEXT                                   | Заголовок поста                               |
| `rating`       | TEXT                                   | Рейтинг контента (safe, questionable, explicit) |
| `tags`         | TEXT                                   | Tags, разделенные пробелами                   |
| `media_type`   | TEXT (NULL)                            | Тип медиа: "image" или "video" (индексируется) |
| `published_at` | INTEGER (NOT NULL)                     | Отметка времени публикации (timestamp mode, ms) |
| `created_at`   | INTEGER (NOT NULL)                     | Когда добавлено в локальную БД (timestamp ms) |
| `is_viewed`    | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Просмотрен ли пост                            |
| `is_favorited` | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Добавлен ли пост в избранное                  |

**Уникальное ограничение:** `(artist_id, post_id)` - Предотвращает дублирование постов для каждого артиста.

**Индексы:**

- `postIdIdx` - Индекс по `post_id` для эффективного поиска
- `artistIdIdx` - Индекс по `artist_id` для запросов на основе артиста
- `isViewedIdx` - Индекс по `is_viewed` для фильтрации по статусу просмотра
- `publishedAtIdx` - Индекс по `published_at` для сортировки по дате
- `isFavoritedIdx` - Индекс по `is_favorited` для фильтрации избранных
- `posts_media_type_idx` - Индекс по `media_type` для быстрой фильтрации изображений/видео
- `posts_artist_rating_viewed_idx` - Композитный индекс по `(artist_id, rating, is_viewed)` для оптимизированных многоколоночных запросов фильтрации
- `posts_artist_media_type_idx` - Композитный индекс по `(artist_id, media_type)` для оптимизированной фильтрации по артисту + типу медиа

**Определение схемы:**

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

**Типы TypeScript:**

```typescript
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

### Таблица: `settings`

Хранит настройки приложения, включая учетные данные API и пользовательские предпочтения.

| Колонка               | Тип                                   | Описание                                     |
| -------------------- | -------------------------------------- | -------------------------------------------- |
| `id`                 | INTEGER (PK, AutoIncrement)            | Первичный ключ                               |
| `user_id`            | TEXT (DEFAULT '')                      | ID пользователя Booru (зависит от провайдера) |
| `encrypted_api_key`  | TEXT (DEFAULT '')                      | Зашифрованный ключ API (зашифрован в покое)  |
| `is_safe_mode`       | INTEGER (BOOLEAN, DEFAULT 1)           | Флаг безопасного режима (размытие NSFW контента) |
| `is_adult_confirmed` | INTEGER (BOOLEAN, DEFAULT 0)           | Флаг подтверждения совершеннолетия (18+)    |
| `is_adult_verified`  | INTEGER (BOOLEAN, DEFAULT 0, NOT NULL) | Флаг подтверждения совершеннолетия (правовое) |
| `tos_accepted_at`    | INTEGER (TIMESTAMP, NULL)              | Отметка времени принятия Условий обслуживания |

**Определение схемы:**

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

**Типы TypeScript:**

```typescript
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
```

## Архитектура базы данных

Все операции с базой данных выполняются непосредственно в **Main Process** с использованием синхронного доступа через `better-sqlite3`. Режим WAL (Write-Ahead Logging) включен для обеспечения одновременного чтения во время выполнения записи.

### Архитектура клиента базы данных

**Клиент базы данных** (`src/main/db/client.ts`):

-   Прямой синхронный доступ к SQLite через `better-sqlite3`
-   Режим WAL включен для одновременного чтения
-   Оптимизированные прагмы SQLite: `synchronous = NORMAL`, `temp_store = MEMORY`, память, отображаемая на ввод-вывод
-   Управляет инициализацией и миграциями базы данных
-   Предоставляет функции `getDb()` и `getSqliteInstance()`
-   Автоматическое выполнение миграций при запуске
-   Поддержка портативного режима (автоматическое определение)

### Инициализация

```typescript
import { initializeDatabase, getDb } from "./db/client";

// Initialize database (runs migrations automatically)
await initializeDatabase();

// Get database instance for queries
const db = getDb();
```

**Примечание:** Миграции запускаются автоматически при инициализации базы данных. Подключение к базе данных управляется в Main Process.

### Доступные методы (через Drizzle ORM)

Все операции с базой данных доступны через Drizzle ORM с использованием экземпляра базы данных из `getDb()`.

#### Получить всех артистов

Извлекает всех отслеживаемых артистов, отсортированных по имени.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";
import { asc } from "drizzle-orm";

const db = getDb();
const artistsList = await db.query.artists.findMany({
  orderBy: [asc(artists.name)],
});
```

#### Добавить артиста

Добавляет нового артиста для отслеживания.

**Пример:**

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

const result = await db.insert(artists).values(newArtist).returning();
const savedArtist = result[0];
```

#### Удалить артиста

Удаляет артиста и все связанные с ним посты (каскадное удаление).

**Пример:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
await db.delete(artists).where(eq(artists.id, 123));
```

#### Получить посты по артисту

Извлекает посты для конкретного артиста с пагинацией.

**Пример:**

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

**Примечание:** Метод IPC `getArtistPosts` использует ограничение в 50 постов на страницу для лучшей производительности.

#### Сохранить посты (массовый Upsert)

Сохраняет посты для артиста, используя массовый upsert. Обновляет `lastPostId` артиста и увеличивает `newPostsCount`.

**Пример:**

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
await db
  .insert(posts)
  .values(newPosts)
  .onConflictDoUpdate({
    target: [posts.artistId, posts.postId],
    set: {
      fileUrl: sql`excluded.file_url`,
      previewUrl: sql`excluded.preview_url`,
      // ... other fields
    },
  });

// Update artist's lastPostId
await db
  .update(artists)
  .set({ lastPostId: Math.max(...newPosts.map((p) => p.postId)) })
  .where(eq(artists.id, 1));
```

#### Получить настройки

Извлекает сохраненные настройки. Ключ API зашифрован и должен быть расшифрован в Main Process.

**Пример:**

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

#### Сохранить настройки

Сохраняет или обновляет настройки. Ключ API должен быть зашифрован перед сохранением.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { settings } from "./schema";
import { SecureStorage } from "../services/secure-storage";

const db = getDb();
const encryptedKey = SecureStorage.encrypt("your-api-key");

await db
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
  });
```

#### Пометить пост как просмотренный

Помечает пост как просмотренный в базе данных.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { posts } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
await db.update(posts).set({ isViewed: true }).where(eq(posts.id, 123));
```

#### Переключить статус избранного поста

Переключает статус избранного поста в базе данных.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { posts } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
const post = await db.query.posts.findFirst({
  where: eq(posts.id, 123),
});

if (post) {
  await db
    .update(posts)
    .set({ isFavorited: !post.isFavorited })
    .where(eq(posts.id, 123));
}
```

#### Поиск артистов

Ищет артистов в локальной базе данных по имени или tag.

**Пример:**

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

## Миграции

### Генерация миграций

При изменении схемы (`src/main/db/schema.ts`) сгенерируйте миграцию:

```bash
npm run db:generate
```

Это создаст новый файл миграции в каталоге `drizzle/`.

### Запуск миграций

Миграции автоматически запускаются при запуске приложения через `src/main/db/migrate.ts`.

**Ручное выполнение:**

```bash
npm run db:migrate
```

### Файлы миграций

Миграции хранятся в `drizzle/`:

-   **SQL-файлы:** `drizzle/*.sql` - **Отслеживаются в git** (включены в репозиторий и сборку)
-   **Метаданные:** `drizzle/meta/` - **Игнорируются git** (файлы локальной разработки)
    -   `meta/_journal.json` - Журнал миграций
    -   `meta/*_snapshot.json` - Снимки схемы
-   **Конфигурация миграций:** `drizzle/migrations.json` - **Игнорируется git** (сгенерированный файл)

**Примечание:** В систему контроля версий отслеживаются только SQL-файлы миграций. Мета-файлы и конфигурация миграций генерируются локально и не должны быть коммитированы.

**Пример миграции:**

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

### Конфигурация

**Файл:** `drizzle.config.ts`

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

### Примеры запросов

**Выбрать всех артистов:**

```typescript
const artists = await db.query.artists.findMany({
  orderBy: [asc(schema.artists.username)],
});
```

**Найти артиста по ID:**

```typescript
const artist = await db.query.artists.findFirst({
  where: eq(schema.artists.id, artistId),
});
```

**Вставить артиста:**

```typescript
const result = await db
  .insert(schema.artists)
  .values(artistData)
  .returning({ id: schema.artists.id });
```

**Обновить артиста:**

```typescript
await db
  .update(schema.artists)
  .set({
    lastPostId: newPostId,
    newPostsCount: count,
    lastChecked: new Date(), // Uses timestamp mode
  })
  .where(eq(schema.artists.id, artistId));
```

## Database Studio

Drizzle Kit предоставляет Database Studio для просмотра и редактирования данных:

```bash
npm run db:studio
```

Это открывает веб-интерфейс по адресу `http://localhost:4983` (по умолчанию).

## Лучшие практики

### 1. Типобезопасность

Всегда используйте выведенные типы Drizzle:

```typescript
// Good
const artist: Artist = await dbService.getTrackedArtists()[0];

// Bad
const artist: any = await dbService.getTrackedArtists()[0];
```

### 2. Обработка ошибок

Всегда обрабатывайте ошибки базы данных:

```typescript
try {
  const artist = await dbService.addArtist(data);
} catch (error) {
  logger.error("Database error:", error);
  throw error;
}
```

### 3. Транзакции

Для нескольких связанных операций используйте транзакции:

```typescript
// Example (to be implemented)
await db.transaction(async (tx) => {
  await tx.insert(schema.artists).values(artistData);
  await tx.insert(schema.posts).values(postData);
});
```

### 4. Индексы

Добавляйте индексы для часто запрашиваемых столбцов:

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

## Резервное копирование и восстановление

### Резервное копирование

Приложение предоставляет встроенную функциональность резервного копирования:

1.  **Ручное резервное копирование:** Используйте `window.api.createBackup()` или компонент пользовательского интерфейса Backup Controls.
2.  **Расположение резервных копий:** Резервные копии хранятся в каталоге пользовательских данных с именами файлов, содержащими отметки времени.
3.  **Формат резервной копии:** Полная копия базы данных SQLite.

**Пример:**

```typescript
const result = await window.api.createBackup();
if (result.success) {
  console.log(`Backup created at: ${result.path}`);
}
```

### Восстановление

**Использование приложения:**

1.  Используйте `window.api.restoreBackup()` или компонент пользовательского интерфейса Backup Controls.
2.  Выберите файл резервной копии из диалогового окна файла.
3.  Проверка целостности базы данных запускается автоматически перед восстановлением.
4.  Окно приложения перезагружается после успешного восстановления.

**Ручное восстановление:**

Если база данных повреждена и требуется ручное восстановление:

1.  Остановите приложение.
2.  Найдите файл резервной копии (в каталоге пользовательских данных).
3.  Скопируйте файл резервной копии, чтобы заменить `metadata.db`.
4.  Перезапустите приложение (миграции будут запущены автоматически).

**Примечание:** Процесс восстановления включает автоматические проверки целостности с использованием `PRAGMA integrity_check` перед заменой базы данных. Если проверка целостности не удалась, восстановление откатывается, и исходная база данных сохраняется.

## Вопросы производительности

1.  **WAL Mode:** Режим Write-Ahead Logging включен для одновременного чтения.
2.  **Индексы:**
    -   Одноколоночные индексы по `artistId`, `isViewed`, `publishedAt`, `isFavorited`, `lastChecked`, `createdAt`.
    -   Композитный индекс по `(artist_id, rating, is_viewed)` для общих комбинаций фильтров.
    -   Композитный индекс по `(artist_id, media_type)` для фильтрации по артисту + типу медиа.
    -   Индекс по `media_type` для быстрой фильтрации изображений/видео.
3.  **Полнотекстовый поиск FTS5:**
    -   Виртуальная таблица `posts_fts` для быстрого поиска по tags с использованием FTS5.
    -   Внешняя таблица контента (без дублирования данных) с токенизатором `unicode61`.
    -   Автоматическая синхронизация через триггеры (INSERT, UPDATE, DELETE).
    -   Поддерживает поиск по префиксу с помощью wildcard `*` (например, `tag*`).
    -   Поиск без учета регистра с правильной обработкой Unicode.
4.  **Оптимизация SQLite:**
    -   `synchronous = NORMAL` для оптимальной производительности с режимом WAL.
    -   `temp_store = MEMORY` для более быстрых операций с временными таблицами.
    -   Память, отображаемая на ввод-вывод (настраивается через переменную окружения `SQLITE_MMAP_SIZE`, по умолчанию 64 МБ).
5.  **Пакетные операции:** Массовые операции upsert обрабатывают посты порциями (200 постов за порцию), чтобы избежать ограничения на количество переменных в SQLite.
6.  **Оптимизация запросов:**
    -   Эффективное использование построителя запросов Drizzle с правильными индексами.
    -   Запросы FTS5 используют шаблон EXISTS с JOIN для оптимальной производительности.
    -   Композитные индексы оптимизируют запросы фильтрации по нескольким столбцам.
7.  **Синхронный доступ:** Прямой синхронный доступ через `better-sqlite3` в Main Process.
8.  **Управление подключением:** Единое подключение к базе данных управляется в Main Process.

## Полнотекстовый поиск (FTS5)

Приложение использует SQLite FTS5 для эффективного поиска по tags в таблице `posts`.

### Виртуальная таблица FTS5

**Таблица:** `posts_fts`

-   **Тип:** Внешняя таблица контента (ссылается на таблицу `posts`, без дублирования данных).
-   **Токенизатор:** `unicode61` для правильной обработки Unicode и поиска без учета регистра.
-   **Столбцы:** `tags` (индексируются для полнотекстового поиска).
-   **Сопоставление контента:** `content='posts'`, `content_rowid='id'`.

### Возможности

-   **Быстрый поиск по tags:** Индекс FTS5 обеспечивает производительность поиска менее миллисекунды даже на больших наборах данных (100k+ записей).
-   **Поиск по префиксу:** Поддерживает wildcard `*` в конце слов (например, `tag*` ищет tags, начинающиеся с "tag").
-   **Без учета регистра:** Токенизатор Unicode автоматически обрабатывает поиск без учета регистра.
-   **Поддержка нескольких языков:** Правильная обработка Unicode для tags на разных языках.
-   **Автоматическая синхронизация:** Триггеры поддерживают синхронизацию индекса FTS5 с таблицей `posts`:
    -   `posts_fts_insert` - Заполняет индекс при INSERT.
    -   `posts_fts_update` - Обновляет индекс при UPDATE tags.
    -   `posts_fts_delete` - Удаляет из индекса при DELETE.

### Использование

FTS5 используется автоматически при фильтрации постов по tags через `PostsController.getPosts()`:

```typescript
// FTS5 search is used internally when filters.tags is provided
const posts = await db.getPosts({
  filters: { tags: "blue_hair" },
  page: 1,
  limit: 50,
});
```

### Производительность

-   **Размер индекса:** Минимальный (таблица внешнего контента хранит только индекс, а не данные).
-   **Скорость поиска:** Сложность O(log n), обычно < 10 мс для 100k+ записей.
-   **Использование памяти:** Низкое (нет дублирования данных, только структуры индекса).

## Будущие улучшения

Планируемые улучшения базы данных:

-   ✅ **Индексы полнотекстового поиска для tags (FTS5):** ✅ **Реализовано**
    -   Виртуальная таблица FTS5 `posts_fts` с токенизатором `unicode61`
    -   Внешняя таблица контента для эффективного использования пространства
    -   Автоматическая синхронизация через триггеры
    -   Поддерживает поиск по префиксу и запросы без учета регистра
-   ✅ **Композитные индексы:** ✅ **Реализовано**
    -   Композитный индекс по `(artist_id, rating, is_viewed)` для оптимизированных запросов фильтрации
    -   Композитный индекс по `(artist_id, media_type)` для оптимизированной фильтрации по артисту + типу медиа
-   ✅ **Колонка типа медиа:** ✅ **Реализовано**
    -   Колонка `media_type` в таблице `posts` для эффективной фильтрации изображений/видео
    -   Автоматическое определение во время синхронизации, фоновое заполнение для существующих данных
    -   Индексированные поиски по столбцам заменяют медленные запросы `LIKE`
-   ✅ **Система избранного:** Реализована с полем `isFavorited` и индексом
-   ⏳ **Таблица подписок:** Планируется функция подписок на Tags (схема еще не реализована)
-   ⏳ **Таблицы плейлистов:** Планируется функция плейлистов (схема еще не реализована)
-   ⏳ Логика дедупликации постов
-   ⏳ Таблицы статистики для аналитики
-   ⏳ Функциональность экспорта/импорта
-   ⏳ Утилиты для сжатия базы данных