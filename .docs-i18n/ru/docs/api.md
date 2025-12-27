# Документация API

## 📑 Оглавление

- [Обзор](#overview)
- [Архитектура](#architecture)
- [IPC Bridge Interface](#ipc-bridge-interface)
- [Методы API](#api-methods)
- [Слушатели событий](#event-listeners)
- [Обработка ошибок](#error-handling)
- [Вопросы безопасности](#security-considerations)
- [Детали реализации](#implementation-details)
- [Будущие расширения API](#future-api-extensions)
- [Интеграция с внешним API](#external-api-integration)

---

## Обзор

Этот документ описывает API IPC (Inter-Process Communication) между Electron Main Process и Renderer Process. Вся связь строго типизирована с использованием интерфейсов TypeScript и соответствует лучшим практикам безопасности.

**📖 Связанная документация:**
- [Документация по архитектуре](./architecture.md) - Архитектура системы и дизайн IPC
- [Документация по базе данных](./database.md) - Операции с базой данных и схема
- [Руководство по разработке](./development.md) - Добавление новых методов IPC
- [Глоссарий](./glossary.md) - Ключевые термины (IPC, Main Process, Renderer Process)

---

## 🚀 Как использовать этот API

Этот раздел содержит практические рекомендации по использованию API IPC в реальных сценариях.

### Базовый шаблон использования

Все методы IPC доступны через `window.api` в Renderer Process. Они возвращают Promises и должны использоваться с async/await или цепочками Promise.

```typescript
// Basic pattern
const result = await window.api.someMethod(params);
```

### Интеграция с React Query

Рекомендуемый способ использования методов IPC в React Components — это **TanStack Query (React Query)**. Это обеспечивает автоматическое кеширование, States загрузки, обработку ошибок и инвалидацию кеша.

**Пример: Получение данных:**

```typescript
import { useQuery } from "@tanstack/react-query";
import type { Artist } from "../../../main/db/schema";

const { data, isLoading, error } = useQuery<Artist[]>({
  queryKey: ["artists"],
  queryFn: () => window.api.getTrackedArtists(),
});
```

**Пример: Мутации (создание/обновление/удаление):**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Artist, NewArtist } from "../../../main/db/schema";

const queryClient = useQueryClient();

const mutation = useMutation<Artist | undefined, Error, NewArtist>({
  mutationFn: (artistData: NewArtist) => window.api.addArtist(artistData),
  onSuccess: () => {
    // Invalidate cache to refresh the list
    queryClient.invalidateQueries({ queryKey: ["artists"] });
  },
});
```

### Общие шаблоны

#### Шаблон 1: Загрузка исходных данных

**Сценарий:** Component должен загрузить данные при монтировании.

```typescript
import type { Artist } from "../../../main/db/schema";

const MyComponent = () => {
  const { data, isLoading } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return <div>{/* Render data with full type safety */}</div>;
};
```

#### Шаблон 2: Бесконечная прокрутка

**Сценарий:** Загрузка постраничных данных с бесконечной прокруткой.

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Post } from "../../../main/db/schema";

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery<Post[]>({
  queryKey: ["posts", artistId],
  queryFn: ({ pageParam = 1 }: { pageParam: number }) => 
    window.api.getArtistPosts({ artistId, page: pageParam }),
  getNextPageParam: (lastPage: Post[], allPages: Post[][]) => 
    lastPage.length === 50 ? allPages.length + 1 : undefined,
  initialPageParam: 1,
});

const allPosts: Post[] = data?.pages.flatMap((page: Post[]) => page) || [];
```

#### Шаблон 3: Слушатели событий

**Сценарий:** Прослушивание событий реального времени (ход синхронизации, загрузки и т. д.).

```typescript
useEffect(() => {
  const unsubscribe = window.api.onSyncProgress((message) => {
    console.log("Sync:", message);
    // Update UI with progress
  });

  return () => unsubscribe(); // Cleanup on unmount
}, []);
```

#### Шаблон 4: Обработка ошибок

**Сценарий:** Изящная обработка ошибок с обратной связью для пользователя.

```typescript
import { useMutation } from "@tanstack/react-query";
import type { Artist, NewArtist } from "../../../main/db/schema";

const mutation = useMutation<Artist | undefined, Error, NewArtist>({
  mutationFn: (data: NewArtist) => window.api.addArtist(data),
  onError: (error: Error) => {
    log.error("Operation failed:", error);
    // Show error toast/notification to user
  },
  onSuccess: (data: Artist | undefined) => {
    // Show success message
    // data contains the created artist with full type safety
  },
});
```

### Когда какой метод использовать

- **Чтение данных:** Используйте `useQuery` с соответствующим `queryKey`
- **Создание/обновление/удаление:** Используйте `useMutation` с инвалидацией кеша
- **Обновления в реальном времени:** Используйте слушателей событий (`onSyncProgress`, `onDownloadProgress` и т. д.)
- **Однократные операции:** Используйте прямые вызовы `await window.api.method()`

### Типобезопасность

Все методы IPC полностью типизированы. TypeScript обеспечит автозаполнение и проверку типов:

```typescript
// TypeScript knows the return type
const artists: Artist[] = await window.api.getTrackedArtists();

// TypeScript validates parameters
await window.api.addArtist({
  name: "artist", // ✅ Valid
  tag: "tag",
  // ❌ TypeScript error if missing required fields
});
```

---

## Архитектура

Приложение использует IPC (Inter-Process Communication) Electron с включенной изоляцией контекста. Renderer Process не может напрямую обращаться к API Node.js. Вместо этого он взаимодействует с Main Process через безопасный мост, определенный в `src/main/bridge.ts`.

**Архитектура IPC:**
- **На основе контроллеров:** Все обработчики IPC организованы в контроллеры, которые расширяют `BaseController`
- **Внедрение зависимостей:** Сервисы регистрируются в DI Container и разрешаются с помощью токенов
- **Типобезопасность:** Вся связь IPC строго типизирована с использованием интерфейсов TypeScript
- **Валидация ввода:** Все входные данные проверяются с использованием схем Zod в `BaseController`
- **Обработка ошибок:** Централизованная обработка ошибок через `BaseController`

## Интерфейс IPC Bridge

Мост IPC предоставляется Renderer Process через `window.api`. Все методы возвращают Promises и полностью типизированы.

### Определения типов

```typescript
interface IpcBridge {
  // App
  getAppVersion: () => Promise<string>;
  writeToClipboard: (text: string) => Promise<boolean>;
  verifyCredentials: () => Promise<boolean>;
  logout: () => Promise<void>;

  // Settings
  getSettings: () => Promise<Settings | undefined>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;

  // Artists
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: NewArtist) => Promise<Artist | undefined>;
  deleteArtist: (id: number) => Promise<void>;
  searchArtists: (query: string) => Promise<{ id: number; label: string }[]>;

  // Posts
  getArtistPosts: (params: {
    artistId: number;
    page?: number;
  }) => Promise<Post[]>;
  getArtistPostsCount: (artistId?: number) => Promise<number>;
  markPostAsViewed: (postId: number) => Promise<boolean>;
  togglePostViewed: (postId: number) => Promise<boolean>;
  togglePostFavorite: (postId: number) => Promise<boolean>;
  resetPostCache: (postId: number) => Promise<boolean>;

  // External
  openExternal: (url: string) => Promise<void>;
  searchRemoteTags: (query: string, provider?: ProviderId) => Promise<SearchResults[]>;

  // Sync
  syncAll: () => Promise<boolean>;
  repairArtist: (artistId: number) => Promise<boolean>;

  // Downloads
  downloadFile: (
    url: string,
    filename: string
  ) => Promise<{
    success: boolean;
    path?: string;
    error?: string;
    canceled?: boolean;
  }>;
  openFileInFolder: (path: string) => Promise<boolean>;
  onDownloadProgress: (callback: DownloadProgressCallback) => () => void;

  // Backup
  createBackup: () => Promise<BackupResponse>;
  restoreBackup: () => Promise<BackupResponse>;

  // Updater
  checkForUpdates: () => Promise<void>;
  quitAndInstall: () => Promise<void>;
  startDownload: () => Promise<void>;

  // Event Listeners
  onUpdateStatus: (callback: UpdateStatusCallback) => () => void;
  onUpdateProgress: (callback: UpdateProgressCallback) => () => void;
  onSyncStart: (callback: () => void) => () => void;
  onSyncEnd: (callback: () => void) => () => void;
  onSyncProgress: (callback: (message: string) => void) => () => void;
  onSyncError: (callback: SyncErrorCallback) => () => void;
}
```

## Методы API

### `getAppVersion()`

Возвращает текущую версию приложения.

**Когда использовать:** Для отображения версии приложения в диалоговом окне "О программе", уведомлениях об обновлениях или отладочной информации.

**Типичный сценарий:** Отображение номера версии на странице "Настройки" или в диалоговом окне "О программе".

**Возвращает:** `Promise<string>`

**Пример:**

```typescript
const version = await window.api.getAppVersion();
console.log(version); // "1.0.0"
```

**Реальное использование в React Component:**

```typescript
// In Settings or About component
const { data: version } = useQuery<string>({
  queryKey: ["app-version"],
  queryFn: () => window.api.getAppVersion(),
});

return <div>Version: {version}</div>;
```

**Канал IPC:** `app:get-version`

---

### `getTrackedArtists()`

Получает всех отслеживаемых артистов из локальной базы данных.

**Когда использовать:** Для загрузки списка отслеживаемых артистов для отображения на странице "Отслеживаемые", в боковой панели или в выпадающем списке выбора артистов.

**Типичный сценарий:** Пользователь открывает страницу "Отслеживаемые" → Component получает всех артистов → отображает их в виде сетки/списка.

**Почему этот метод:** Предоставляет полный список всех артистов, которых отслеживает пользователь. Используйте его для первоначальной загрузки страницы или после добавления/удаления артистов.

**Возвращает:** `Promise<Artist[]>`

**Пример:**

```typescript
const artists = await window.api.getTrackedArtists();
artists.forEach((artist) => {
  console.log(artist.name, artist.tag, artist.apiEndpoint);
});
```

**Реальное использование в React Component:**

```typescript
// In Tracked.tsx component
import type { Artist } from "../../../main/db/schema";

const {
  data: artists,
  isLoading,
  error,
} = useQuery<Artist[]>({
  queryKey: ["artists"],
  queryFn: () => window.api.getTrackedArtists(),
});

if (isLoading) return <div>Loading artists...</div>;
if (error) return <div>Error loading artists</div>;

return (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {artists?.map((artist) => (
      <ArtistCard key={artist.id} artist={artist} />
    ))}
  </div>
);
```

**Канал IPC:** `db:get-artists`

**Тип Artist:**

```typescript
type Artist = {
  id: number;
  name: string;
  tag: string;
  type: "tag" | "uploader";
  apiEndpoint: string;
  lastPostId: number;
  newPostsCount: number;
  lastChecked: number | null;
  createdAt: number;
};
```

**Тип Post:**

```typescript
type Post = {
  id: number;
  artistId: number;
  fileUrl: string;
  previewUrl: string | null;
  title: string;
  rating: string | null; // "s", "q", or "e"
  tags: string | null;
  publishedAt: number;
  createdAt: number;
  isViewed: boolean;
};
```

**Тип IpcSettings (безопасный формат IPC):**

```typescript
// ⚠️ SECURITY: This is the ONLY format Renderer receives
// API Key is NEVER included in this type
type IpcSettings = {
  userId: string;
  hasApiKey: boolean; // ← Boolean flag, NOT the actual API key
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
  isAdultVerified: boolean;
  tosAcceptedAt: number | null; // Timestamp in milliseconds
};
```

**Примечание:** Фактический тип `Settings` базы данных содержит `encryptedApiKey`, но он **никогда** не отправляется в Renderer Process. Тип `IpcSettings` — это безопасный контракт IPC.

---

### `getSettings()`

Получает сохраненные настройки. **⚠️ БЕЗОПАСНОСТЬ: API Key НИКОГДА не возвращается в Renderer Process.**

**Когда использовать:** Для проверки, завершил ли пользователь онбординг, отображения текущего идентификатора пользователя на странице "Настройки" или проверки статуса аутентификации.

**Типичный сценарий:** Приложение запускается → проверяет наличие настроек → показывает онбординг, если настроек нет, или основное приложение, если они есть.

**Почему этот метод:** Renderer Process **НИКОГДА** не получает API key, даже в расшифрованном виде. Этот метод возвращает только безопасные метаданные:
- `userId` - User ID (безопасно для раскрытия)
- `hasApiKey` - Булевый флаг, указывающий, настроен ли API key (безопасно для раскрытия)
- Другие флаги настроек (безопасный режим, подтверждение совершеннолетия и т. д.)

**Контракт безопасности:**

- ✅ **Renderer получает:** `userId`, `hasApiKey` (логическое значение), другие неконфиденциальные настройки
- ❌ **Renderer НИКОГДА не получает:** `apiKey` (зашифрованный или расшифрованный)
- 🔒 **Жизненный цикл API Key:**
  - Вводится в Renderer → Отправляется в Main Process через `saveSettings()` → Шифруется в Main Process → Хранится в зашифрованном виде
  - Никогда не расшифровывается для Renderer Process
  - Расшифровывается только в Main Process, когда это необходимо для вызовов API (в SyncService)

**Возвращает:** `Promise<IpcSettings | undefined>`

**Тип IpcSettings:**

```typescript
type IpcSettings = {
  userId: string;
  hasApiKey: boolean; // ← Boolean flag, NOT the actual key
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
  isAdultVerified: boolean;
  tosAcceptedAt: number | null;
};
```

**Пример:**

```typescript
import type { IpcSettings } from "../../../shared/schemas/settings";

const settings = await window.api.getSettings();
if (settings) {
  console.log("User ID:", settings.userId);
  console.log("Has API Key:", settings.hasApiKey); // ← Boolean, not the key itself
  // ❌ settings.apiKey does NOT exist - API key is never sent to Renderer
}
```

**Реальное использование в React Component:**

```typescript
// In App.tsx - check if user needs onboarding
import type { IpcSettings } from "../../../shared/schemas/settings";

const { data: settings } = useQuery<IpcSettings | undefined>({
  queryKey: ["settings"],
  queryFn: () => window.api.getSettings(),
});

if (!settings || !settings.hasApiKey) {
  // No settings or no API key configured - show onboarding
  return <Onboarding onComplete={() => queryClient.invalidateQueries(["settings"])} />;
}

// Settings exist and API key is configured - show main app
return <MainApp />;
```

**Канал IPC:** `app:get-settings`

---

### `saveSettings(creds: { userId: string; apiKey: string })`

Сохраняет учетные данные API в базу данных. API key шифруется в состоянии покоя с использованием API `safeStorage` Electron перед сохранением.

**⚠️ КОНТРАКТ БЕЗОПАСНОСТИ:**

- **Ввод:** API key отправляется из Renderer Process в **открытом виде** (неизбежно во время онбординга)
- **Обработка:** API key **немедленно шифруется** в Main Process с использованием API `safeStorage`
- **Хранение:** В базе данных хранится только **зашифрованный** ключ
- **Вывод:** API key **НИКОГДА** не возвращается в Renderer Process (см. `getSettings()`, который возвращает `hasApiKey: boolean`)

**Когда использовать:** Во время онбординга, когда пользователь вводит свои учетные данные, или при обновлении учетных данных в "Настройках".

**Типичный сценарий:** Пользователь вставляет учетные данные со страницы учетной записи Rule34.xxx → форма проходит валидацию → вызывает `saveSettings` → учетные данные шифруются и сохраняются → пользователь переходит к основному приложению.

**Почему этот метод:** Безопасность критически важна. API key шифруется в Main Process с использованием цепочки ключей платформы (Windows Credential Manager, macOS Keychain, Linux libsecret) перед хранением. Зашифрованный ключ никогда не раскрывается Renderer Process.

**Поток безопасности:**

1. Пользователь вводит API key в Renderer Process (открытый текст, неизбежно)
2. Вызывается `saveSettings()` → API key отправляется через IPC в Main Process
3. Main Process шифрует с использованием `safeStorage.encryptString()`
4. Зашифрованный ключ хранится в базе данных
5. **API key НИКОГДА не возвращается в Renderer Process** - `getSettings()` возвращает только `hasApiKey: boolean`

**Параметры:**

- `creds.userId: string` - User ID Rule34.xxx
- `creds.apiKey: string` - API Key Rule34.xxx (будет зашифрован перед хранением)

**Возвращает:** `Promise<boolean>`

**Выбрасывает:**

- `Error("Data is required")` - Если `userId` или `apiKey` отсутствуют

**Пример:**

```typescript
try {
  await window.api.saveSettings({
    userId: "123456",
    apiKey: "your-api-key-here",
  });
  console.log("Settings saved");
} catch (error) {
  console.error("Failed to save settings:", error);
}
```

**Реальное использование в React Component:**

```typescript
// In Onboarding.tsx component
import type { Settings } from "../../../main/db/schema";

const onSubmit = async (data: CredsFormValues) => {
  try {
    const success: boolean = await window.api.saveSettings({
      userId: data.userId,
      apiKey: data.apiKey,
    });
    // Credentials are now encrypted and stored
    onComplete(); // Navigate to main app
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown save error.";
    log.error(`[Onboarding] Authorization error: ${message}`);
    // Show error to user
  }
};
```

**Примечание по безопасности:** API key шифруется с использованием API `safeStorage` Electron в Main Process. Даже если файл базы данных будет украден, API key не может быть расшифрован без доступа к связке ключей платформы.

**Канал IPC:** `app:save-settings`

---

### `addArtist(artist: NewArtist)`

Добавляет нового артиста для отслеживания. Проверяет входные данные перед вставкой.

**Когда использовать:** Пользователь хочет начать отслеживать нового артиста/Tag. Вызывается из модального окна или формы "Добавить артиста".

**Типичный сценарий:** Пользователь нажимает "Добавить артиста" → вводит имя и Tag → выбирает тип (Tag/загрузчик) → нажимает "Добавить" → вызывается `addArtist` → артист сохраняется в базу данных → пользовательский интерфейс обновляется, чтобы показать нового артиста.

**Почему этот метод:** Проверяет входные данные (имя, Tag, конечная точка API) перед сохранением. Автоматически нормализует Tags (удаляет метаданные, такие как "(123)"). Возвращает сохраненного артиста с сгенерированным ID для немедленного обновления пользовательского интерфейса.

**Параметры:**

- `artist: NewArtist` - Данные артиста для добавления

**Возвращает:** `Promise<Artist | undefined>`

**Выбрасывает:**

- `Error("Username is required")` - Если имя пустое или состоит из пробелов
- `Error("Invalid API Endpoint URL")` - Если `apiEndpoint` не является действительным URL

**Пример:**

```typescript
const newArtist: NewArtist = {
  name: "example_artist",
  tag: "tag_name",
  type: "tag", // or "uploader" or "query"
  provider: "rule34", // or "gelbooru"
  apiEndpoint: "https://api.rule34.xxx",
};

try {
  const savedArtist = await window.api.addArtist(newArtist);
  if (savedArtist) {
    console.log("Artist added:", savedArtist.id);
  }
} catch (error) {
  console.error("Failed to add artist:", error);
}
```

**Реальное использование в React Component:**

```typescript
// In Tracked.tsx component
import type { Artist, NewArtist } from "../../../main/db/schema";
import type { ProviderId } from "../../../main/providers";

const handleAddArtist = async (
  name: string,
  tag: string,
  type: "tag" | "uploader" | "query",
  provider: ProviderId
) => {
  try {
    const newArtist: NewArtist = {
      name,
      tag,
      type,
      provider,
      apiEndpoint: getDefaultApiEndpoint(provider),
    };
    
    const savedArtist: Artist | undefined = await window.api.addArtist(newArtist);
    
    if (savedArtist) {
      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      setIsAddModalOpen(false);
    }
  } catch (err: unknown) {
    log.error("[Tracked] Failed to add artist:", err);
    // Show error notification to user
  }
};
```

**Канал IPC:** `db:add-artist`

**Тип NewArtist:**

```typescript
type NewArtist = {
  name: string;
  tag: string;
  type?: "tag" | "uploader"; // Defaults to "tag"
  apiEndpoint: string;
  lastPostId?: number; // Defaults to 0
  newPostsCount?: number; // Defaults to 0
};
```

---

### `deleteArtist(id: number)`

Удаляет артиста из отслеживания. Также удаляет все связанные записи (каскадное удаление).

**Параметры:**

- `id: number` - ID артиста для удаления

**Возвращает:** `Promise<void>`

**Пример:**

```typescript
try {
  await window.api.deleteArtist(123);
  console.log("Artist deleted");
} catch (error) {
  console.error("Failed to delete artist:", error);
}
```

**Канал IPC:** `db:delete-artist`

---

### `getArtistPosts(params: { artistId: number; page?: number })`

Получает посты для конкретного артиста с пагинацией.

**Когда использовать:** Для отображения постов в галерее артиста. Поддерживает бесконечную прокрутку или традиционную пагинацию.

**Типичный сценарий:** Пользователь нажимает на карточку артиста → переходит в галерею артиста → Component получает первую страницу постов → пользователь прокручивает вниз → автоматически загружается следующая страница.

**Почему этот метод:** Эффективно загружает посты частями (50 на страницу), чтобы избежать загрузки тысяч постов одновременно. Отлично работает с `useInfiniteQuery` React Query для бесконечной прокрутки.

**Параметры:**

- `params.artistId: number` - ID артиста
- `params.page?: number` - Номер страницы (по умолчанию 1)

**Возвращает:** `Promise<Post[]>`

**Пример:**

```typescript
const posts = await window.api.getArtistPosts({ artistId: 123, page: 1 });
console.log(`Found ${posts.length} posts`);
```

**Реальное использование в React Component с бесконечной прокруткой:**

```typescript
// In ArtistGallery.tsx component
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Post } from "../../../main/db/schema";

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery<Post[]>({
    queryKey: ["posts", artist.id],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }): Promise<Post[]> => {
      return await window.api.getArtistPosts({
        artistId: artist.id,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage: Post[], allPages: Post[][]): number | undefined => {
      // If last page has 50 posts, there might be more
      return lastPage.length === 50 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

// Flatten all pages into single array with type safety
const allPosts: Post[] = useMemo(() => {
  return data?.pages.flatMap((page: Post[]) => page) || [];
}, [data]);

// Render posts with infinite scroll
return (
  <VirtuosoGrid
    data={allPosts}
    endReached={() => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }}
    // ... other props
  />
);
```

**Канал IPC:** `db:get-posts`

**Примечание:** Каждая страница возвращает до 50 постов (лимит). Используйте пагинацию для получения большего количества постов. Идеально подходит для реализаций бесконечной прокрутки.

---

### `openExternal(url: string)`

Открывает URL в браузере по умолчанию. В целях безопасности разрешены только URL Rule34.xxx.

**Параметры:**

- `url: string` - URL для открытия

**Возвращает:** `Promise<void>`

**Пример:**

```typescript
await window.api.openExternal(
  "https://rule34.xxx/index.php?page=post&s=list&tags=tag_name"
);
```

**Канал IPC:** `app:open-external`

**Безопасность:** Разрешены только HTTPS URL из домена Rule34.xxx.

---

### `syncAll()`

Инициирует фоновую синхронизацию всех отслеживаемых артистов. Получает новые посты из API Rule34.xxx.

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
const success = await window.api.syncAll();
if (success) {
  console.log("Sync started");
}
```

**Канал IPC:** `db:sync-all`

**Примечание:** Это асинхронная операция. Метод возвращает управление немедленно, а синхронизация выполняется в фоновом режиме. Используйте слушателей событий (`onSyncStart`, `onSyncEnd`, `onSyncProgress`, `onSyncError`) для отслеживания прогресса. Проверьте `newPostsCount` артиста, чтобы увидеть результаты.

---

### `repairArtist(artistId: number)`

Восстанавливает/ресинхронизирует артиста, сбрасывая его `lastPostId` на 0 и повторно загружая начальные страницы. Полезно для обновления превью низкого качества или устранения проблем синхронизации.

**Параметры:**

- `artistId: number` - ID артиста для восстановления

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
try {
  const success = await window.api.repairArtist(123);
  if (success) {
    console.log("Artist repair completed");
  }
} catch (error) {
  console.error("Failed to repair artist:", error);
}
```

**Канал IPC:** `sync:repair-artist`

**Примечание:** Эта операция может занять время в зависимости от количества страниц для синхронизации. `lastPostId` артиста сбрасывается на 0, и начальные страницы загружаются повторно.

---

### `checkForUpdates()`

Проверяет наличие обновлений приложения на GitHub releases.

**Возвращает:** `Promise<void>`

**Пример:**

```typescript
await window.api.checkForUpdates();
```

**Канал IPC:** `app:check-for-updates`

**Примечание:** Используйте слушатель событий `onUpdateStatus` для получения уведомлений о статусе обновления.

---

### `startDownload()`

Начинает загрузку доступного обновления. Должен быть вызван после того, как `checkForUpdates()` сообщит о наличии обновления.

**Возвращает:** `Promise<void>`

**Пример:**

```typescript
await window.api.startDownload();
```

**Канал IPC:** `app:start-download`

**Примечание:** Используйте слушатель событий `onUpdateProgress` для отслеживания прогресса загрузки.

---

### `quitAndInstall()`

Закрывает приложение и устанавливает загруженное обновление. Должен быть вызван только после полной загрузки обновления.

**Возвращает:** `Promise<void>`

**Пример:**

```typescript
await window.api.quitAndInstall();
```

**Канал IPC:** `app:quit-and-install`

**Предупреждение:** Это немедленно закроет приложение. Перед вызовом убедитесь, что все пользовательские данные сохранены.

---

### `markPostAsViewed(postId: number)`

Отмечает пост как просмотренный в базе данных.

**Параметры:**

- `postId: number` - ID поста для отметки как просмотренного

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
const success = await window.api.markPostAsViewed(123);
if (success) {
  console.log("Post marked as viewed");
}
```

**Канал IPC:** `db:mark-post-viewed`

---

### `searchArtists(query: string)`

Ищет артистов в локальной базе данных по имени или Tag.

**Параметры:**

- `query: string` - Строка поискового запроса

**Возвращает:** `Promise<{ id: number; label: string }[]>`

**Пример:**

```typescript
const results = await window.api.searchArtists("artist");
results.forEach((result) => {
  console.log(result.id, result.label);
});
```

**Канал IPC:** `db:search-tags`

---

### `searchRemoteTags(query: string, provider?: ProviderId)`

Ищет Tags, используя API автозаполнения Booru (поддержка нескольких провайдеров).

**Параметры:**

- `query: string` - Строка поискового запроса (минимум 2 символа)
- `provider?: ProviderId` - ID провайдера ("rule34" или "gelbooru"), по умолчанию "rule34"

**Возвращает:** `Promise<SearchResults[]>`

**Пример:**

```typescript
const results = await window.api.searchRemoteTags("tag", "rule34");
results.forEach((result) => {
  console.log(result.id, result.label);
});
```

**Канал IPC:** `api:search-remote-tags`

**Примечание:** Требует минимум 2 символа. Возвращает пустой массив, если запрос слишком короткий или вызов API завершается неудачей. Поддерживает несколько провайдеров Booru через шаблон провайдера.

---

### `createBackup()`

Создает резервную копию базы данных с отметкой времени.

**Возвращает:** `Promise<BackupResponse>`

**Тип BackupResponse:**

```typescript
type BackupResponse = {
  success: boolean;
  path?: string;
  error?: string;
};
```

**Пример:**

```typescript
const result = await window.api.createBackup();
if (result.success) {
  console.log(`Backup created at: ${result.path}`);
} else {
  console.error(`Backup failed: ${result.error}`);
}
```

**Канал IPC:** `db:create-backup`

**Примечание:** Файл резервной копии создается в каталоге пользовательских данных. Файловый менеджер откроется, чтобы показать расположение резервной копии.

---

### `restoreBackup()`

Восстанавливает базу данных из файла резервной копии. Открывает диалог выбора файла для выбора файла резервной копии.

**Возвращает:** `Promise<BackupResponse>`

**Пример:**

```typescript
const result = await window.api.restoreBackup();
if (result.success) {
  console.log("Backup restored successfully");
  // Application will restart automatically
} else if (result.error !== "Canceled by user") {
  console.error(`Restore failed: ${result.error}`);
}
```

**Канал IPC:** `db:restore-backup`

**Предупреждение:** Это перезапишет текущую базу данных. Приложение автоматически перезапустится после восстановления. Перед восстановлением требуется подтверждение пользователя.

---

### `writeToClipboard(text: string)`

Записывает текст в системный буфер обмена.

**Параметры:**

- `text: string` - Текст для копирования в буфер обмена

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
await window.api.writeToClipboard("Copied text");
```

**Канал IPC:** `app:write-to-clipboard`

---

### `verifyCredentials()`

Проверяет учетные данные API, выполняя тестовый вызов API.

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
const isValid = await window.api.verifyCredentials();
if (isValid) {
  console.log("Credentials are valid");
} else {
  console.log("Credentials are invalid or expired");
}
```

**Канал IPC:** `app:verify-creds`

---

### `logout()`

Очищает сохраненные учетные данные API из базы данных.

**Возвращает:** `Promise<void>`

**Пример:**

```typescript
await window.api.logout();
// User will be redirected to onboarding screen
```

**Канал IPC:** `app:logout`

---

### `getArtistPostsCount(artistId?: number)`

Получает общее количество постов для артиста или всех постов, если `artistId` не предоставлен.

**Параметры:**

- `artistId?: number` - Необязательный ID артиста. Если опущен, возвращает количество всех постов.

**Возвращает:** `Promise<number>`

**Пример:**

```typescript
const count = await window.api.getArtistPostsCount(123);
console.log(`Artist has ${count} posts`);
```

**Канал IPC:** `db:get-posts-count`

---

### `togglePostViewed(postId: number)`

Переключает статус "просмотрено" для поста.

**Параметры:**

- `postId: number` - ID поста для переключения

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
const success = await window.api.togglePostViewed(123);
```

**Канал IPC:** `db:toggle-post-viewed`

---

### `togglePostFavorite(postId: number)`

Переключает статус "избранное" для поста.

**Параметры:**

- `postId: number` - ID поста для переключения

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
const success = await window.api.togglePostFavorite(123);
if (success) {
  console.log("Post favorite status toggled");
}
```

**Канал IPC:** `db:toggle-post-favorite`

---

### `resetPostCache(postId: number)`

Сбрасывает кеш для конкретного поста (очищает статус "просмотрено"/"избранное").

**Параметры:**

- `postId: number` - ID поста для сброса

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
const success = await window.api.resetPostCache(123);
```

**Канал IPC:** `db:reset-post-cache`

---

### `downloadFile(url: string, filename: string)`

Загружает файл по URL в локальную файловую систему. Открывает диалог сохранения, чтобы пользователь мог выбрать место загрузки.

**Параметры:**

- `url: string` - URL файла для загрузки
- `filename: string` - Предлагаемое имя файла для загрузки

**Возвращает:** `Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>`

**Пример:**

```typescript
const result = await window.api.downloadFile(
  "https://example.com/image.jpg",
  "image.jpg"
);
if (result.success && result.path) {
  console.log(`File downloaded to: ${result.path}`);
} else if (result.canceled) {
  console.log("Download canceled by user");
} else {
  console.error(`Download failed: ${result.error}`);
}
```

**Канал IPC:** `files:download`

**Примечание:** Загрузки выполняются в Main Process с отслеживанием прогресса через событие `onDownloadProgress`.

---

### `openFileInFolder(path: string)`

Открывает папку файловой системы, содержащую указанный файл, и выделяет его.

**Параметры:**

- `path: string` - Полный путь к файлу

**Возвращает:** `Promise<boolean>`

**Пример:**

```typescript
const success = await window.api.openFileInFolder("/path/to/file.jpg");
```

**Канал IPC:** `files:open-folder`

---

### Слушатели событий

IPC bridge предоставляет несколько слушателей событий для обновлений в реальном времени:

#### `onUpdateStatus(callback: UpdateStatusCallback)`

Прослушивает изменения статуса обновления.

**Тип Callback:**

```typescript
type UpdateStatusCallback = (data: UpdateStatusData) => void;

type UpdateStatusData = {
  status: string; // "checking" | "available" | "not-available" | "downloaded" | "error"
  message?: string;
  version?: string; // Available when status is "available"
};
```

**Возвращает:** `() => void` - Функция отмены подписки

**Пример:**

```typescript
const unsubscribe = window.api.onUpdateStatus((data) => {
  if (data.status === "available") {
    console.log(`Update ${data.version} is available!`);
  }
});

// Later, to unsubscribe:
unsubscribe();
```

**Канал IPC:** `updater:status`

---

#### `onUpdateProgress(callback: UpdateProgressCallback)`

Прослушивает обновления прогресса загрузки.

**Тип Callback:**

```typescript
type UpdateProgressCallback = (percent: number) => void;
```

**Возвращает:** `() => void` - Функция отмены подписки

**Пример:**

```typescript
const unsubscribe = window.api.onUpdateProgress((percent) => {
  console.log(`Download progress: ${percent}%`);
});

// Later, to unsubscribe:
unsubscribe();
```

**Канал IPC:** `updater:progress`

---

#### `onSyncStart(callback: () => void)`

Прослушивает события начала синхронизации.

**Возвращает:** `() => void` - Функция отмены подписки

**Пример:**

```typescript
const unsubscribe = window.api.onSyncStart(() => {
  console.log("Sync started");
});
```

**Канал IPC:** `sync:start`

---

#### `onSyncEnd(callback: () => void)`

Прослушивает события завершения синхронизации.

**Возвращает:** `() => void` - Функция отмены подписки

**Пример:**

```typescript
const unsubscribe = window.api.onSyncEnd(() => {
  console.log("Sync completed");
});
```

**Канал IPC:** `sync:end`

---

#### `onSyncProgress(callback: (message: string) => void)`

Прослушивает сообщения о ходе синхронизации.

**Возвращает:** `() => void` - Функция отмены подписки

**Пример:**

```typescript
const unsubscribe = window.api.onSyncProgress((message) => {
  console.log(`Sync: ${message}`);
});
```

**Канал IPC:** `sync:progress`

---

#### `onSyncError(callback: SyncErrorCallback)`

Прослушивает события ошибок синхронизации.

**Тип Callback:**

```typescript
type SyncErrorCallback = (message: string) => void;
```

**Возвращает:** `() => void` - Функция отмены подписки

**Пример:**

```typescript
const unsubscribe = window.api.onSyncError((message) => {
  console.error(`Sync error: ${message}`);
});
```

**Канал IPC:** `sync:error`

---

#### `onDownloadProgress(callback: DownloadProgressCallback)`

Прослушивает обновления прогресса загрузки файлов.

**Тип Callback:**

```typescript
type DownloadProgressCallback = (data: DownloadProgressData) => void;

type DownloadProgressData = {
  id: string;
  percent: number;
};
```

**Возвращает:** `() => void` - Функция отмены подписки

**Пример:**

```typescript
const unsubscribe = window.api.onDownloadProgress((data) => {
  console.log(`Download ${data.id}: ${data.percent}%`);
});

// Later, to unsubscribe:
unsubscribe();
```

**Канал IPC:** `files:download-progress`

---

## Обработка ошибок

Все методы IPC могут выбрасывать ошибки. Всегда оборачивайте вызовы в блоки try-catch:

```typescript
try {
  const result = await window.api.addArtist(artistData);
} catch (error) {
  // Handle error appropriately
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

## Вопросы безопасности

1.  **Изоляция контекста:** Renderer Process выполняется в изолированной среде без прямого доступа к Node.js.
2.  **Типобезопасность:** Вся связь IPC строго типизирована. Интерфейс моста обеспечивает типобезопасность во время компиляции.
3.  **Валидация ввода:** Все входные данные проверяются в Main Process с использованием схем Zod перед обработкой.
4.  **Распространение ошибок:** Ошибки корректно распространяются из Main Process в Renderer Process, но конфиденциальная информация не раскрывается.
5.  **Безопасные учетные данные:** API keys шифруются в состоянии покоя с использованием API `safeStorage` Electron. Расшифровка происходит только в Main Process, когда это необходимо для вызовов API.
6.  **Прямой доступ к базе данных:** Операции с базой данных выполняются непосредственно в Main Process через `better-sqlite3` с режимом WAL для одновременного чтения.

## Детали реализации

### Main Process (Контроллеры IPC)

Обработчики IPC регистрируются через контроллеры в `src/main/ipc/index.ts`:

**Архитектура контроллеров:**

Все операции IPC обрабатываются через доменно-ориентированные контроллеры, которые расширяют `BaseController`:

-   **BaseController** предоставляет:
    -   Централизованную обработку ошибок
    -   Автоматическую валидацию входных данных с использованием схем Zod
    -   Типобезопасную регистрацию обработчиков
    -   Предотвращает ошибки регистрации повторяющихся обработчиков

**Настройка контроллера:**

```typescript
// Example: ArtistsController
export class ArtistsController extends BaseController {
  setup() {
    this.handle(
      IPC_CHANNELS.DB.ADD_ARTIST,
      AddArtistSchema,
      this.addArtist.bind(this)
    );
  }

  private async addArtist(
    _event: IpcMainInvokeEvent,
    data: AddArtistRequest
  ) {
    const db = container.resolve(DI_TOKENS.DB);
    // Business logic here
  }
}
```

**Внедрение зависимостей:**

Контроллеры используют DI Container для разрешения зависимостей:

```typescript
const db = container.resolve(DI_TOKENS.DB);
const syncService = container.resolve(DI_TOKENS.SYNC_SERVICE);
```

**Регистрация контроллеров:**

Контроллеры регистрируются в функции `setupIpc()`:

```typescript
export function setupIpc(): { maintenanceController: MaintenanceController; fileController: FileController } {
  const systemController = new SystemController();
  systemController.setup();
  
  const artistsController = new ArtistsController();
  artistsController.setup();
  
  // ... other controllers
  
  return { maintenanceController, fileController };
}
```

**Доступные контроллеры:**

-   `SystemController` - Операции системного уровня (версия, буфер обмена и т. д.)
-   `ArtistsController` - Операции управления артистами
-   `PostsController` - Операции, связанные с постами
-   `SettingsController` - Управление настройками
-   `AuthController` - Аутентификация и проверка учетных данных
-   `MaintenanceController` - Операции резервного копирования/восстановления базы данных
-   `ViewerController` - Операции, связанные с просмотрщиком
-   `FileController` - Загрузка и управление файлами

**Константы каналов:**

Все каналы IPC определены в `src/main/ipc/channels.ts`:

```typescript
export const IPC_CHANNELS = {
  APP: {
    GET_VERSION: "app:get-version",
    OPEN_EXTERNAL: "app:open-external",
    // ... other channels
  },
  DB: {
    GET_ARTISTS: "db:get-artists",
    ADD_ARTIST: "db:add-artist",
    // ... other channels
  },
  // ... other channel groups
} as const;
```

**Регистрация устаревших обработчиков (устарело):**

Старый подход на основе обработчиков был перенесен на контроллеры:

```typescript
export const registerIpcHandlers = (
  dbWorkerClient: DbWorkerClient,
  syncService: SyncService,
  updaterService: UpdaterService,
  mainWindow: BrowserWindow
) => {
  // App handlers
  ipcMain.handle("app:get-version", handleGetAppVersion);
  ipcMain.handle("app:get-settings", async () => {
    // Gets settings and decrypts API key using crypto utility
    const db = getDb();
    const settings = await db.query.settings.findFirst();
    // ... decryption logic using decrypt() from lib/crypto
  });
  ipcMain.handle("app:save-settings", async (_event, { userId, apiKey }) => {
    // Encrypts API key using crypto utility before saving
    const encryptedKey = encrypt(apiKey);
    const db = getDb();
    await db.insert(settings).values({ userId, encryptedApiKey: encryptedKey })
      .onConflictDoUpdate({ target: settings.id, set: { userId, encryptedApiKey: encryptedKey } });
  });
  ipcMain.handle("app:open-external", async (_event, urlString: string) => {
    // Security validation and shell.openExternal
  });

  // Database handlers (via worker thread)
  ipcMain.handle("db:get-artists", async () => {
    const db = getDb();
    return await db.query.artists.findMany({
      orderBy: [asc(artists.name)],
    });
  });
  ipcMain.handle("db:add-artist", async (_event, payload: unknown) => {
    // Zod validation
    const artistData = AddArtistSchema.parse(payload);
    const db = getDb();
    const result = await db.insert(artists).values(artistData).returning();
    return result[0];
  });
  ipcMain.handle("db:delete-artist", async (_event, id: unknown) => {
    const validId = DeleteArtistSchema.parse(id);
    const db = getDb();
    await db.delete(artists).where(eq(artists.id, validId));
  });
  ipcMain.handle("db:get-posts", async (_event, payload: unknown) => {
    // Zod validation
    const { artistId, page, limit } = GetPostsSchema.parse(payload);
    const offset = (page - 1) * limit;
    const db = getDb();
    return await db.query.posts.findMany({
      where: eq(posts.artistId, artistId),
      orderBy: [desc(posts.postId)],
      limit,
      offset,
    });
  });
  ipcMain.handle("db:mark-post-viewed", async (_event, postId: unknown) => {
    const validId = MarkViewedSchema.parse(postId);
    const db = getDb();
    await db.update(posts).set({ isViewed: true }).where(eq(posts.id, validId));
  });
  ipcMain.handle("db:search-tags", async (_event, query: unknown) => {
    const validQuery = SearchTagsSchema.parse(query);
    const db = getDb();
    // Search implementation using Drizzle queries
  });

  // Backup handlers
  ipcMain.handle("db:create-backup", async () => {
    // Backup implementation using VACUUM INTO
    const sqlite = getSqliteInstance();
    const backupPath = path.join(app.getPath("userData"), `metadata-backup-${timestamp}.db`);
    const stmt = sqlite.prepare("VACUUM INTO ?");
    stmt.run(backupPath);
    shell.showItemInFolder(backupPath);
    return { success: true, path: backupPath };
  });
  ipcMain.handle("db:restore-backup", async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: "SQLite DB", extensions: ["db", "sqlite"] }],
    });
    // Restore implementation with integrity checks
    mainWindow.reload();
    return { success: true };
  });

  // Remote search
  ipcMain.handle("api:search-remote-tags", async (_event, query: unknown) => {
    // Calls Rule34.xxx autocomplete API
  });

  // Sync handlers
  ipcMain.handle("db:sync-all", async () => {
    syncService.syncAllArtists();
  });
  ipcMain.handle("sync:repair-artist", async (_event, artistId: number) => {
    await syncService.repairArtist(artistId);
    return { success: true };
  });

  // Updater handlers
  ipcMain.handle("app:check-for-updates", () => {
    updaterService.checkForUpdates();
  });
  // ... other updater handlers
};
```

### Скрипт предзагрузки (Bridge)

Мост предоставляется в `src/main/bridge.ts`:

```typescript
const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),

  getSettings: () => ipcRenderer.invoke("app:get-settings"),
  saveSettings: (creds) => ipcRenderer.invoke("app:save-settings", creds),

  getTrackedArtists: () => ipcRenderer.invoke("db:get-artists"),
  addArtist: (artist) => ipcRenderer.invoke("db:add-artist", artist),
  deleteArtist: (id) => ipcRenderer.invoke("db:delete-artist", id),
  searchArtists: (query) => ipcRenderer.invoke("db:search-tags", query),

  getArtistPosts: ({ artistId, page }) =>
    ipcRenderer.invoke("db:get-posts", { artistId, page }),
  markPostAsViewed: (postId) =>
    ipcRenderer.invoke("db:mark-post-viewed", postId),

  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),
  searchRemoteTags: (query) =>
    ipcRenderer.invoke("api:search-remote-tags", query),

  syncAll: () => ipcRenderer.invoke("db:sync-all"),
  repairArtist: (artistId) =>
    ipcRenderer.invoke("sync:repair-artist", artistId),

  createBackup: () => ipcRenderer.invoke("db:create-backup"),
  restoreBackup: () => ipcRenderer.invoke("db:restore-backup"),

  // Updater methods
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
  quitAndInstall: () => ipcRenderer.invoke("app:quit-and-install"),
  startDownload: () => ipcRenderer.invoke("app:start-download"),

  // Event listeners
  onUpdateStatus: (callback) => {
    const subscription = (_: IpcRendererEvent, data: UpdateStatusData) =>
      callback(data);
    ipcRenderer.on("updater:status", subscription);
    return () => ipcRenderer.removeListener("updater:status", subscription);
  },
  onUpdateProgress: (callback) => {
    const subscription = (_: IpcRendererEvent, percent: number) =>
      callback(percent);
    ipcRenderer.on("updater:progress", subscription);
    return () => ipcRenderer.removeListener("updater:progress", subscription);
  },
  onSyncStart: (callback) => {
    const sub = () => callback();
    ipcRenderer.on("sync:start", sub);
    return () => ipcRenderer.removeListener("sync:start", sub);
  },
  onSyncEnd: (callback) => {
    const sub = () => callback();
    ipcRenderer.on("sync:end", sub);
    return () => ipcRenderer.removeListener("sync:end", sub);
  },
  onSyncProgress: (callback) => {
    const sub = (_: IpcRendererEvent, msg: string) => callback(msg);
    ipcRenderer.on("sync:progress", sub);
    return () => ipcRenderer.removeListener("sync:progress", sub);
  },
  onSyncError: (callback) => {
    const subscription = (_: IpcRendererEvent, msg: string) => callback(msg);
    ipcRenderer.on("sync:error", subscription);
    return () => ipcRenderer.removeListener("sync:error", subscription);
  },
};

contextBridge.exposeInMainWorld("api", ipcBridge);
```

## Будущие расширения API

Запланированные методы API (еще не реализованы):

-   `updateArtist(artistId: number, data: Partial<Artist>)` - Обновление настроек артиста
-   `downloadPost(postId: number)` - Загрузка медиафайла поста
-   `getSubscriptions()` - Получение подписок на Tag
-   `addSubscription(tagString: string)` - Подписка на комбинацию Tags
-   `deleteSubscription(id: number)` - Удаление подписки
-   `getBackupList()` - Список доступных файлов резервных копий
-   `deleteBackup(backupPath: string)` - Удаление файла резервной копии

## Интеграция с внешним API

Приложение интегрируется с **API Rule34.xxx**. Интеграция обрабатывается в Main Process через `SyncService` (`src/main/services/sync-service.ts`) и не предоставляется напрямую через IPC по соображениям безопасности.

**Возможности:**

-   **Ограничение частоты:** Задержка 1,5 секунды между артистами, 0,5 секунды между страницами
-   **Пагинация:** Обрабатывает пагинацию Rule34.xxx (до 1000 постов на страницу)
-   **Обработка ошибок:** Изящная обработка ошибок API и сбоев сети
-   **Инкрементальная синхронизация:** Загружает только посты новее, чем `lastPostId`
-   **Аутентификация:** Использует User ID и API Key из настроек

**Конечная точка API:** `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index`

См. [Справочник по API Rule34](./rule34-api-reference.md) для подробной документации API.