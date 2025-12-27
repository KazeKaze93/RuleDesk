# Документация Базы Данных

## 📑 Содержание

- [Обзор](#overview)
- [Расположение Базы Данных](#database-location)
- [Схема](#schema)
- [Архитектура Базы Данных](#database-architecture)
- [Доступные Методы](#available-methods-via-drizzle-orm)
- [Миграции](#migrations)
- [Drizzle ORM](#drizzle-orm)
- [Database Studio](#database-studio)
- [Лучшие Практики](#best-practices)
- [Резервное Копирование и Восстановление](#backup-and-recovery)
- [Соображения Производительности](#performance-considerations)
- [Будущие Улучшения](#future-enhancements)

---

## Обзор

Приложение использует **SQLite** в качестве локальной базы данных для хранения метаданных, отслеживаемых художников, публикаций и настроек. Доступ к базе данных осуществляется напрямую в **Main Process** с помощью **Drizzle ORM** для типобезопасных запросов. Включен режим WAL (Write-Ahead Logging) для одновременного чтения.

**📖 Связанная документация:**
- [Документация по архитектуре](./architecture.md) - Архитектура базы данных в системном дизайне
- [Документация по API](./api.md) - Методы IPC для операций с базой данных
- [Руководство по разработке](./development.md) - Скрипты базы данных и миграции
- [Глоссарий](./glossary.md) - Ключевые термины (режим WAL, Drizzle ORM, миграция и т.д.)

## Расположение Базы Данных

Расположение файла базы данных зависит от режима работы приложения:

**Стандартный режим (установленное приложение):**
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

Хранит информацию об отслеживаемых художниках/пользователях.

| Колонка            | Тип                           | Описание                                    |
| ----------------- | ------------------------------ | ------------------------------------------- |
| `id`              | INTEGER (PK, AutoIncrement)    | Первичный ключ                              |
| `name`            | TEXT (NOT NULL)                | Отображаемое имя художника                  |
| `tag`             | TEXT (NOT NULL, UNIQUE)        | Tag или имя пользователя для отслеживания   |
| `provider`        | TEXT (NOT NULL, DEFAULT 'rule34') | Идентификатор провайдера: "rule34" или "gelbooru" |
| `type`            | TEXT (NOT NULL, DEFAULT 'tag') | Тип: "tag", "uploader" или "query"          |
| `api_endpoint`    | TEXT (NOT NULL)                | Базовый URL API-конечной точки              |
| `last_post_id`    | INTEGER (NOT NULL, DEFAULT 0)  | ID последней просмотренной публикации       |
| `new_posts_count` | INTEGER (NOT NULL, DEFAULT 0)  | Количество новых, непросмотренных публикаций |
| `last_checked`    | INTEGER (NULL)                 | Временная метка последнего запроса API (режим временных меток) |
| `created_at`      | INTEGER (NOT NULL)             | Временная метка создания (режим временных меток, мс) |

**Определение схемы:**

```typescript
export const artists = sqliteTable("artists", {
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
}, (t) => ({
  lastCheckedIdx: index("artists_lastChecked_idx").on(t.lastChecked),
  createdAtIdx: index("artists_createdAt_idx").on(t.createdAt),
}));
```

**TypeScript-типы:**

```typescript
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
```

### Таблица: `posts`

Кэширует метаданные публикаций для фильтрации, статистики и управления загрузками. Поддерживает прогрессивную загрузку изображений с URL-адресами для предварительного просмотра, образца и полного разрешения.

| Колонка         | Тип                                   | Описание                                        |
| -------------- | -------------------------------------- | ----------------------------------------------- |
| `id`           | INTEGER (PK, AutoIncrement)            | Внутренний ID публикации                        |
| `post_id`      | INTEGER (NOT NULL)                     | ID публикации из внешнего API                   |
| `artist_id`    | INTEGER (FK → artists.id)              | Ссылка на художника                             |
| `file_url`     | TEXT (NOT NULL)                        | Прямой URL к медиафайлу полного разрешения     |
| `preview_url`  | TEXT (NOT NULL)                        | URL к предварительному просмотру низкого разрешения (размытый) |
| `sample_url`   | TEXT (NOT NULL, DEFAULT '')            | URL к образцу среднего разрешения               |
| `title`        | TEXT                                   | Заголовок публикации                            |
| `rating`       | TEXT                                   | Рейтинг контента (safe, questionable, explicit) |
| `tags`         | TEXT                                   | Tags, разделённые пробелами                     |
| `published_at` | INTEGER (NOT NULL)                     | Временная метка публикации (режим временных меток, мс) |
| `created_at`   | INTEGER (NOT NULL)                     | Время добавления в локальную базу данных (временная метка, мс) |
| `is_viewed`    | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Просмотрена ли публикация                       |
| `is_favorited` | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Добавлена ли публикация в избранное             |

**Уникальное ограничение:** `(artist_id, post_id)` - предотвращает дублирование публикаций для одного художника.

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
  })
);
```

**TypeScript-типы:**

```typescript
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

### Таблица: `settings`

Хранит настройки приложения, включая учетные данные API и пользовательские предпочтения.

| Колонка                | Тип                          | Описание                                      |
| --------------------- | ----------------------------- | --------------------------------------------- |
| `id`                  | INTEGER (PK, AutoIncrement)   | Первичный ключ                                |
| `user_id`             | TEXT (DEFAULT '')             | ID пользователя Booru (зависит от провайдера) |
| `encrypted_api_key`   | TEXT (DEFAULT '')             | Зашифрованный API-ключ (зашифрован в покое)   |
| `is_safe_mode`        | INTEGER (BOOLEAN, DEFAULT 1) | Флаг безопасного режима (размытие контента NSFW) |
| `is_adult_confirmed`  | INTEGER (BOOLEAN, DEFAULT 0) | Флаг подтверждения совершеннолетия (подтверждение 18+) |
| `is_adult_verified`   | INTEGER (BOOLEAN, DEFAULT 0, NOT NULL) | Флаг подтверждения совершеннолетия (юридическое подтверждение) |
| `tos_accepted_at`     | INTEGER (TIMESTAMP, NULL)     | Временная метка принятия Условий использования |

**Определение схемы:**

```typescript
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").default(""),
  encryptedApiKey: text("encrypted_api_key").default(""),
  isSafeMode: integer("is_safe_mode", { mode: "boolean" }).default(true),
  isAdultConfirmed: integer("is_adult_confirmed", { mode: "boolean" }).default(false),
  isAdultVerified: integer("is_adult_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  tosAcceptedAt: integer("tos_accepted_at", { mode: "timestamp" }),
});
```

**TypeScript-типы:**

```typescript
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
```

## Архитектура Базы Данных

Все операции с базой данных выполняются напрямую в **Main Process** с использованием синхронного доступа через `better-sqlite3`. Включен режим WAL (Write-Ahead Logging), чтобы разрешить одновременное чтение во время выполнения операций записи.

### Архитектура Клиента Базы Данных

**Клиент базы данных** (`src/main/db/client.ts`):

-   Прямой синхронный доступ к SQLite через `better-sqlite3`
-   Включен режим WAL для одновременного чтения
-   Оптимизированные прагмы SQLite: `synchronous = NORMAL`, `temp_store = MEMORY`, память, отображаемая на ввод/вывод
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

### Доступные Методы (через Drizzle ORM)

Все операции с базой данных доступны через Drizzle ORM с использованием экземпляра базы данных из `getDb()`.

#### Получить Всех Художников

Извлекает всех отслеживаемых художников, отсортированных по имени.

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

#### Добавить Художника

Добавляет нового художника для отслеживания.

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

#### Удалить Художника

Удаляет художника и все связанные с ним публикации (каскадное удаление).

**Пример:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
await db.delete(artists).where(eq(artists.id, 123));
```

#### Получить Публикации по Художнику

Извлекает публикации для определённого художника с пагинацией.

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

**Примечание:** Метод IPC `getArtistPosts` использует ограничение в 50 публикаций на страницу для лучшей производительности.

#### Сохранить Публикации (Пакетное Upsert)

Сохраняет публикации для художника с использованием пакетного upsert. Обновляет `lastPostId` художника и увеличивает `newPostsCount`.

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

#### Получить Настройки

Извлекает сохранённые настройки. API-ключ зашифрован и должен быть расшифрован в Main Process.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { settings } from "./schema";
import { decrypt } from "../lib/crypto";

const db = getDb();
const settingsRecord = await db.query.settings.findFirst();

if (settingsRecord && settingsRecord.encryptedApiKey) {
  // Decrypt API key using crypto utility
  const decryptedKey = decrypt(settingsRecord.encryptedApiKey);
}
```

#### Сохранить Настройки

Сохраняет или обновляет настройки. API-ключ должен быть зашифрован перед сохранением.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { settings } from "./schema";
import { encrypt } from "../lib/crypto";

const db = getDb();
const encryptedKey = encrypt("your-api-key");

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

#### Пометить Публикацию как Просмотренную

Помечает публикацию как просмотренную в базе данных.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { posts } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
await db
  .update(posts)
  .set({ isViewed: true })
  .where(eq(posts.id, 123));
```

#### Переключить Избранное для Публикации

Переключает статус "избранное" для публикации в базе данных.

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

#### Поиск Художников

Ищет художников в локальной базе данных по имени или Tag.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";
import { or, like } from "drizzle-orm";

const db = getDb();
const query = "artist";
const results = await db.query.artists.findMany({
  where: or(
    like(artists.name, `%${query}%`),
    like(artists.tag, `%${query}%`)
  ),
});
```

## Миграции

### Генерация Миграций

При изменении схемы (`src/main/db/schema.ts`) сгенерируйте миграцию:

```bash
npm run db:generate
```

Это создаст новый файл миграции в каталоге `drizzle/`.

### Запуск Миграций

Миграции автоматически запускаются при старте приложения через `src/main/db/migrate.ts`.

**Ручное выполнение:**

```bash
npm run db:migrate
```

### Файлы Миграций

Миграции хранятся в `drizzle/`:

-   SQL-файлы: `0000_*.sql`
-   Метаданные: `meta/_journal.json`
-   Снимки: `meta/*_snapshot.json`

**Пример Миграции:**

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

### Примеры Запросов

**Выбрать всех художников:**

```typescript
const artists = await db.query.artists.findMany({
  orderBy: [asc(schema.artists.username)],
});
```

**Найти художника по ID:**

```typescript
const artist = await db.query.artists.findFirst({
  where: eq(schema.artists.id, artistId),
});
```

**Вставить художника:**

```typescript
const result = await db
  .insert(schema.artists)
  .values(artistData)
  .returning({ id: schema.artists.id });
```

**Обновить художника:**

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

Drizzle Kit предоставляет студию базы данных для просмотра и редактирования данных:

```bash
npm run db:studio
```

Это открывает веб-интерфейс по адресу `http://localhost:4983` (по умолчанию).

## Лучшие Практики

### 1. Типобезопасность

Всегда используйте выводимые типы Drizzle:

```typescript
// Good
const artist: Artist = await dbService.getTrackedArtists()[0];

// Bad
const artist: any = await dbService.getTrackedArtists()[0];
```

### 2. Обработка Ошибок

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

## Резервное Копирование и Восстановление

### Резервное Копирование

Приложение предоставляет встроенную функциональность резервного копирования:

1.  **Ручное резервное копирование:** Используйте `window.api.createBackup()` или компонент UI Backup Controls
2.  **Расположение резервных копий:** Резервные копии хранятся в каталоге пользовательских данных с именами файлов, содержащими временные метки.
3.  **Формат резервной копии:** Полная копия базы данных SQLite

**Пример:**

```typescript
const result = await window.api.createBackup();
if (result.success) {
  console.log(`Backup created at: ${result.path}`);
}
```

### Восстановление

**Использование Приложения:**

1.  Используйте `window.api.restoreBackup()` или компонент UI Backup Controls
2.  Выберите файл резервной копии из диалога выбора файла
3.  Проверка целостности базы данных выполняется автоматически перед восстановлением
4.  Окно приложения перезагружается после успешного восстановления

**Ручное Восстановление:**

Если база данных повреждена и требуется ручное восстановление:

1.  Остановите приложение
2.  Найдите файл резервной копии (в каталоге пользовательских данных)
3.  Скопируйте файл резервной копии для замены `metadata.db`
4.  Перезапустите приложение (миграции будут запущены автоматически)

**Примечание:** Процесс восстановления включает автоматические проверки целостности с использованием `PRAGMA integrity_check` перед заменой базы данных. Если проверка целостности не удалась, восстановление откатывается, и исходная база данных сохраняется.

## Соображения Производительности

1.  **Режим WAL:** Включен режим Write-Ahead Logging для одновременного чтения
2.  **Индексы:** Индексы по `artistId`, `isViewed`, `publishedAt`, `isFavorited`, `lastChecked`, `createdAt` для оптимизированных запросов
3.  **Оптимизация SQLite:**
    -   `synchronous = NORMAL` для оптимальной производительности с режимом WAL
    -   `temp_store = MEMORY` для более быстрых операций с временными таблицами
    -   Память, отображаемая на ввод/вывод (настраивается через переменную окружения `SQLITE_MMAP_SIZE`, по умолчанию 64 МБ)
4.  **Пакетные Операции:** Операции пакетного upsert обрабатывают публикации порциями (200 публикаций за порцию), чтобы избежать ограничения на количество переменных в SQLite.
5.  **Оптимизация Запросов:** Эффективно используйте построитель запросов Drizzle с правильными индексами.
6.  **Синхронный Доступ:** Прямой синхронный доступ через `better-sqlite3` в Main Process
7.  **Управление Подключением:** Единственное подключение к базе данных, управляемое в Main Process

## Будущие Улучшения

Запланированные улучшения базы данных:

-   ⏳ **Полнотекстовые поисковые индексы для Tags (FTS5):** Запланировано, но не реализовано
    -   **Текущее состояние:** Только стандартные индексы (`artistIdIdx`, `isViewedIdx`, `publishedAtIdx`, `isFavoritedIdx`)
    -   **Цель:** Виртуальная таблица FTS5 для эффективного поиска по Tags
    -   **Статус:** См. [Дорожную карту](./roadmap.md#-technical-improvements-from-audit) для плана реализации
-   ✅ **Система избранного:** Реализована с полем `isFavorited` и индексом
-   ⏳ **Таблица подписок:** Запланирована функция подписки на Tags (схема ещё не реализована)
-   ⏳ **Таблицы плейлистов:** Запланирована функция плейлистов (схема ещё не реализована)
-   ⏳ Логика дедупликации публикаций
-   ⏳ Таблицы статистики для аналитики
-   ⏳ Функциональность экспорта/импорта
-   ⏳ Утилиты для сжатия базы данных