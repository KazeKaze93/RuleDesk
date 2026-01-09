# Документация базы данных

## 📑 Содержание

- [Обзор](#обзор)
- [Расположение базы данных](#расположение-базы-данных)
- [Схема](#схема)
- [Архитектура базы данных](#архитектура-базы-данных)
- [Доступные методы](#доступные-методы-via-drizzle-orm)
- [Миграции](#миграции)
- [Drizzle ORM](#drizzle-orm)
- [Database Studio](#database-studio)
- [Рекомендации](#рекомендации)
- [Резервное копирование и восстановление](#резервное-копирование-и-восстановление)
- [Вопросы производительности](#вопросы-производительности)
- [Будущие улучшения](#будущие-улучшения)

---

## Обзор

Приложение использует **SQLite** в качестве локальной базы данных для хранения метаданных, отслеживаемых художников, публикаций и настроек. Доступ к базе данных осуществляется напрямую в **Main Process** с помощью **Drizzle ORM** для типобезопасных запросов. Режим WAL (Write-Ahead Logging) включен для одновременного чтения.

**📖 Связанная документация:**
- [Документация по архитектуре](./architecture.md) - Архитектура базы данных в системном дизайне
- [Документация API](./api.md) - методы IPC для операций с базой данных
- [Руководство разработчика](./development.md) - Скрипты базы данных и миграции
- [Глоссарий](./glossary.md) - Основные термины (режим WAL, Drizzle ORM, миграция и т.д.)

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

Хранит информацию об отслеживаемых художниках/пользователях.

| Столбец            | Тип                           | Описание                                 |
| ----------------- | ------------------------------ | ------------------------------------------- |
| `id`              | INTEGER (PK, AutoIncrement)    | Первичный ключ                                 |
| `name`            | TEXT (NOT NULL)                | Отображаемое имя художника                         |
| `tag`             | TEXT (NOT NULL, UNIQUE)        | Tag или имя пользователя для отслеживания                |
| `provider`        | TEXT (NOT NULL, DEFAULT 'rule34') | ID провайдера: "rule34" или "gelbooru"      |
| `type`            | TEXT (NOT NULL, DEFAULT 'tag') | Тип: "tag", "uploader" или "query"         |
| `api_endpoint`    | TEXT (NOT NULL)                | Базовый URL конечной точки API                       |
| `last_post_id`    | INTEGER (NOT NULL, DEFAULT 0)  | ID последней просмотренной публикации                    |
| `new_posts_count` | INTEGER (NOT NULL, DEFAULT 0)  | Количество новых, непросмотренных публикаций                |
| `last_checked`    | INTEGER (NULL)                 | Временная метка последнего опроса API (режим timestamp) |
| `created_at`      | INTEGER (NOT NULL)             | Временная метка создания (режим timestamp, мс)     |

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

**Типы TypeScript:**

```typescript
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
```

### Таблица: `posts`

Кэширует метаданные публикаций для фильтрации, статистики и управления загрузками. Поддерживает прогрессивную загрузку изображений с URL-адресами предварительного просмотра, образца и полного разрешения.

| Столбец         | Тип                                   | Описание                                   |
| -------------- | -------------------------------------- | --------------------------------------------- |
| `id`           | INTEGER (PK, AutoIncrement)            | Внутренний ID публикации                              |
| `post_id`      | INTEGER (NOT NULL)                     | ID публикации из внешнего API                     |
| `artist_id`    | INTEGER (FK → artists.id)              | Ссылка на художника                           |
| `file_url`     | TEXT (NOT NULL)                        | Прямой URL к медиафайлу полного разрешения      |
| `preview_url`  | TEXT (NOT NULL)                        | URL к предварительному просмотру низкого разрешения (размытому)       |
| `sample_url`   | TEXT (NOT NULL, DEFAULT '')            | URL к образцу среднего разрешения               |
| `title`        | TEXT                                   | Заголовок публикации                                    |
| `rating`       | TEXT                                   | Рейтинг контента (safe, questionable, explicit) |
| `tags`         | TEXT                                   | Tagи, разделённые пробелами                          |
| `published_at` | INTEGER (NOT NULL)                     | Временная метка публикации (режим timestamp, мс)    |
| `created_at`   | INTEGER (NOT NULL)                     | Когда добавлено в локальную базу данных (timestamp мс)   |
| `is_viewed`    | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Просмотрена ли публикация                  |
| `is_favorited` | INTEGER (BOOLEAN, NOT NULL, DEFAULT 0) | Добавлена ли публикация в избранное               |

**Уникальное ограничение:** `(artist_id, post_id)` - Предотвращает дублирование публикаций для каждого художника.

**Индексы:**
- `postIdIdx` - Индекс по `post_id` для эффективного поиска
- `artistIdIdx` - Индекс по `artist_id` для запросов, основанных на художниках
- `isViewedIdx` - Индекс по `is_viewed` для фильтрации по статусу просмотра
- `publishedAtIdx` - Индекс по `published_at` для сортировки по дате
- `isFavoritedIdx` - Индекс по `is_favorited` для фильтрации избранного
- `posts_artist_rating_viewed_idx` - Составной индекс по `(artist_id, rating, is_viewed)` для оптимизированных многоколоночных запросов фильтрации

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
    postIdIdx: index("postIdIdx").on(table.postId),
    artistIdIdx: index("artistIdIdx").on(table.artistId),
    isViewedIdx: index("isViewedIdx").on(table.isViewed),
    publishedAtIdx: index("publishedAtIdx").on(table.publishedAt),
    isFavoritedIdx: index("isFavoritedIdx").on(table.isFavorited),
    artistRatingViewedIdx: index("posts_artist_rating_viewed_idx").on(
      table.artistId,
      table.rating,
      table.isViewed
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

| Столбец                | Тип                          | Описание                                    |
| --------------------- | ----------------------------- | ---------------------------------------------- |
| `id`                  | INTEGER (PK, AutoIncrement)   | Первичный ключ                                    |
| `user_id`             | TEXT (DEFAULT '')             | ID пользователя Booru (зависит от провайдера)              |
| `encrypted_api_key`   | TEXT (DEFAULT '')             | Зашифрованный ключ API (зашифрованный при хранении)          |
| `is_safe_mode`        | INTEGER (BOOLEAN, DEFAULT 1) | Флаг безопасного режима (размытие NSFW контента)            |
| `is_adult_confirmed`  | INTEGER (BOOLEAN, DEFAULT 0) | Флаг подтверждения совершеннолетия (подтверждение 18+)     |
| `is_adult_verified`   | INTEGER (BOOLEAN, DEFAULT 0, NOT NULL) | Флаг проверки совершеннолетия (юридическое подтверждение) |
| `tos_accepted_at`     | INTEGER (TIMESTAMP, NULL)     | Временная метка принятия Условий обслуживания          |

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

**Типы TypeScript:**

```typescript
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
```

## Архитектура базы данных

Все операции с базой данных выполняются напрямую в **Main Process** с использованием синхронного доступа через `better-sqlite3`. Режим WAL (Write-Ahead Logging) включен для обеспечения одновременного чтения во время выполнения записи.

### Архитектура клиента базы данных

**Клиент базы данных** (`src/main/db/client.ts`):

- Прямой синхронный доступ к SQLite через `better-sqlite3`
- Режим WAL включен для одновременного чтения
- Оптимизированные прагмы SQLite: `synchronous = NORMAL`, `temp_store = MEMORY`, ввод/вывод с отображением в памяти
- Управляет инициализацией базы данных и миграциями
- Предоставляет функции `getDb()` и `getSqliteInstance()`
- Автоматическое выполнение миграций при запуске
- Поддержка портативного режима (автоматическое обнаружение)

### Инициализация

```typescript
import { initializeDatabase, getDb } from "./db/client";

// Инициализация базы данных (автоматически запускает миграции)
await initializeDatabase();

// Получение экземпляра базы данных для запросов
const db = getDb();
```

**Примечание:** Миграции запускаются автоматически при инициализации базы данных. Соединение с базой данных управляется в Main Process.

### Доступные методы (через Drizzle ORM)

Все операции с базой данных осуществляются через Drizzle ORM с использованием экземпляра базы данных из `getDb()`.

#### Получить всех художников

Получает всех отслеживаемых художников, отсортированных по имени.

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

#### Добавить художника

Добавляет нового художника для отслеживания.

**Пример:**

```typescript
import { getDb } => from "./db/client";
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

#### Удалить художника

Удаляет художника и все связанные публикации (каскадное удаление).

**Пример:**

```typescript
import { getDb } from "./db/client";
import { artists } from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();
await db.delete(artists).where(eq(artists.id, 123));
```

#### Получить публикации художника

Получает публикации для определенного художника с пагинацией.

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

**Примечание:** Метод IPC `getArtistPosts` использует лимит в 50 публикаций на страницу для лучшей производительности.

#### Сохранить публикации (массовая вставка/обновление)

Сохраняет публикации для художника с использованием массовой вставки/обновления. Обновляет `lastPostId` художника и увеличивает `newPostsCount`.

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

// Массовая вставка/обновление с обработкой ON CONFLICT
await db
  .insert(posts)
  .values(newPosts)
  .onConflictDoUpdate({
    target: [posts.artistId, posts.postId],
    set: {
      fileUrl: sql`excluded.file_url`,
      previewUrl: sql`excluded.preview_url`,
      // ... другие поля
    },
  });

// Обновить lastPostId художника
await db
  .update(artists)
  .set({ lastPostId: Math.max(...newPosts.map((p) => p.postId)) })
  .where(eq(artists.id, 1));
```

#### Получить настройки

Получает сохраненные настройки. Ключ API зашифрован и должен быть расшифрован в Main Process.

**Пример:**

```typescript
import { getDb } from "./db/client";
import { settings } from "./schema";
import { SecureStorage } from "../services/secure-storage";

const db = getDb();
const settingsRecord = await db.query.settings.findFirst();

if (settingsRecord && settingsRecord.encryptedApiKey) {
  // Расшифровать ключ API с помощью SecureStorage (только в Main Process)
  const decryptedKey = SecureStorage.decrypt(settingsRecord.encryptedApiKey);
  // decryptedKey имеет тип string | null
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

#### Отметить публикацию как просмотренную

Отмечает публикацию как просмотренную в базе данных.

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

#### Переключить статус избранного для публикации

Переключает статус избранного для публикации в базе данных.

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

#### Поиск художников

Ищет художников в локальной базе данных по имени или tagу.

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

### Генерация миграций

При изменении схемы (`src/main/db/schema.ts`) сгенерируйте миграцию:

```bash
npm run db:generate
```

Это создает новый файл миграции в директории `drizzle/`.

### Запуск миграций

Миграции автоматически запускаются при запуске приложения через `src/main/db/migrate.ts`.

**Ручное выполнение:**

```bash
npm run db:migrate
```

### Файлы миграций

Миграции хранятся в `drizzle/`:

- SQL-файлы: `0000_*.sql`
- Метаданные: `meta/_journal.json`
- Снимки: `meta/*_snapshot.json`

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
    lastChecked: new Date(), // Использует режим timestamp
  })
  .where(eq(schema.artists.id, artistId));
```

## Database Studio

Drizzle Kit предоставляет Database Studio для просмотра и редактирования данных:

```bash
npm run db:studio
```

Это открывает веб-интерфейс по адресу `http://localhost:4983` (по умолчанию).

## Рекомендации

### 1. Типобезопасность

Всегда используйте выведенные Drizzle типы:

```typescript
// Правильно
const artist: Artist = await dbService.getTrackedArtists()[0];

// Неправильно
const artist: any = await dbService.getTrackedArtists()[0];
```

### 2. Обработка ошибок

Всегда обрабатывайте ошибки базы данных:

```typescript
try {
  const artist = await dbService.addArtist(data);
} catch (error) {
  logger.error("Ошибка базы данных:", error);
  throw error;
}
```

### 3. Транзакции

Для нескольких связанных операций используйте транзакции:

```typescript
// Пример (будет реализовано)
await db.transaction(async (tx) => {
  await tx.insert(schema.artists).values(artistData);
  await tx.insert(schema.posts).values(postData);
});
```

### 4. Индексы

Добавляйте индексы для часто запрашиваемых столбцов:

```typescript
// Пример (будет добавлено)
export const artists = sqliteTable(
  "artists",
  {
    // ... столбцы
  },
  (table) => ({
    usernameIdx: index("username_idx").on(table.username),
  })
);
```

## Резервное копирование и восстановление

### Резервное копирование

Приложение предоставляет встроенную функциональность резервного копирования:

1.  **Ручное резервное копирование:** Используйте `window.api.createBackup()` или компонент пользовательского интерфейса Backup Controls
2.  **Расположение резервных копий:** Резервные копии хранятся в каталоге пользовательских данных с именами файлов, содержащими временные метки
3.  **Формат резервной копии:** Полная копия базы данных SQLite

**Пример:**

```typescript
const result = await window.api.createBackup();
if (result.success) {
  console.log(`Резервная копия создана по адресу: ${result.path}`);
}
```

### Восстановление

**Использование приложения:**

1.  Используйте `window.api.restoreBackup()` или компонент пользовательского интерфейса Backup Controls
2.  Выберите файл резервной копии из диалогового окна
3.  Проверка целостности базы данных выполняется автоматически перед восстановлением
4.  Окно приложения перезагружается после успешного восстановления

**Ручное восстановление:**

Если база данных повреждена и требуется ручное восстановление:

1.  Остановите приложение
2.  Найдите файл резервной копии (в каталоге пользовательских данных)
3.  Скопируйте файл резервной копии для замены `metadata.db`
4.  Перезапустите приложение (миграции будут запущены автоматически)

**Примечание:** Процесс восстановления включает автоматические проверки целостности с использованием `PRAGMA integrity_check` перед заменой базы данных. Если проверка целостности не удалась, восстановление откатывается, и исходная база данных сохраняется.

## Вопросы производительности

1.  **Режим WAL:** Режим Write-Ahead Logging включен для одновременного чтения
2.  **Индексы:**
    - Одноколоночные индексы по `artistId`, `isViewed`, `publishedAt`, `isFavorited`, `lastChecked`, `createdAt`
    - Составной индекс по `(artist_id, rating, is_viewed)` для общих комбинаций фильтров
3.  **Полнотекстовый поиск FTS5:**
    - Виртуальная таблица `posts_fts` для быстрого поиска по tagам с использованием FTS5
    - Внешняя таблица контента (без дублирования данных) с токенизатором `unicode61`
    - Автоматическая синхронизация через триггеры (INSERT, UPDATE, DELETE)
    - Поддерживает префиксный поиск с использованием маски `*` (например, `tag*`)
    - Поиск без учета регистра с правильной обработкой Unicode
4.  **Оптимизация SQLite:**
    - `synchronous = NORMAL` для оптимальной производительности в режиме WAL
    - `temp_store = MEMORY` для более быстрых операций с временными таблицами
    - Ввод/вывод с отображением в памяти (настраивается через переменную среды `SQLITE_MMAP_SIZE`, по умолчанию 64 МБ)
5.  **Пакетные операции:** Операции массовой вставки/обновления обрабатывают публикации порциями (200 публикаций на порцию), чтобы избежать ограничения количества переменных SQLite
6.  **Оптимизация запросов:**
    - Эффективно используйте построитель запросов Drizzle с правильными индексами
    - Запросы FTS5 используют EXISTS с шаблоном JOIN для оптимальной производительности
    - Составные индексы оптимизируют запросы фильтрации по нескольким столбцам
7.  **Синхронный доступ:** Прямой синхронный доступ через `better-sqlite3` в Main Process
8.  **Управление соединением:** Одно соединение с базой данных, управляемое в Main Process

## Полнотекстовый поиск (FTS5)

Приложение использует SQLite FTS5 для эффективного поиска по tagам в таблице `posts`.

### Виртуальная таблица FTS5

**Таблица:** `posts_fts`
- **Тип:** Внешняя таблица контента (ссылается на таблицу `posts`, без дублирования данных)
- **Токенизатор:** `unicode61` для правильной обработки Unicode и поиска без учета регистра
- **Столбцы:** `tags` (индексируются для полнотекстового поиска)
- **Сопоставление контента:** `content='posts'`, `content_rowid='id'`

### Возможности

- **Быстрый поиск по Tagам:** Индекс FTS5 обеспечивает производительность поиска менее чем за миллисекунду даже на больших наборах данных (более 100 тыс. записей)
- **Префиксный поиск:** Поддерживает маску `*` в конце слов (например, `tag*` ищет tagи, начинающиеся с "tag")
- **Без учета регистра:** Токенизатор Unicode автоматически обрабатывает поиск без учета регистра
- **Многоязычная поддержка:** Правильная обработка Unicode для tagов на разных языках
- **Автоматическая синхронизация:** Триггеры поддерживают синхронизацию индекса FTS5 с таблицей `posts`:
  - `posts_fts_insert` - Заполняет индекс при INSERT
  - `posts_fts_update` - Обновляет индекс при UPDATE tagов
  - `posts_fts_delete` - Удаляет из индекса при DELETE

### Использование

FTS5 используется автоматически при фильтрации публикаций по tagам через `PostsController.getPosts()`:

```typescript
// Поиск FTS5 используется внутри, когда filters.tags предоставлен
const posts = await db.getPosts({
  filters: { tags: "blue_hair" },
  page: 1,
  limit: 50
});
```

### Производительность

- **Размер индекса:** Минимальный (внешняя таблица контента хранит только индекс, а не данные)
- **Скорость поиска:** Сложность O(log n), обычно < 10 мс для 100 тыс.+ записей
- **Использование памяти:** Низкое (без дублирования данных, только индексные структуры)

## Будущие улучшения

Запланированные улучшения базы данных:

- ✅ **Полнотекстовые индексы для tagов (FTS5):** ✅ **Реализовано**
  - Виртуальная таблица FTS5 `posts_fts` с токенизатором `unicode61`
  - Внешняя таблица контента для экономии места
  - Автоматическая синхронизация через триггеры
  - Поддерживает префиксный поиск и запросы без учета регистра
- ✅ **Составные индексы:** ✅ **Реализовано**
  - Составной индекс по `(artist_id, rating, is_viewed)` для оптимизированных запросов фильтрации
- ✅ **Система избранного:** Реализована с полем `isFavorited` и индексом
- ⏳ **Таблица подписок:** Функция подписок на tagи запланирована (схема еще не реализована)
- ⏳ **Таблицы плейлистов:** Функция плейлистов запланирована (схема еще не реализована)
- ⏳ Логика дедупликации публикаций
- ⏳ Таблицы статистики для аналитики
- ⏳ Функциональность экспорта/импорта
- ⏳ Утилиты для сжатия базы данных