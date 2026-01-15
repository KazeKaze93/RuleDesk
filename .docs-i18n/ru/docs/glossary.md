# Глоссарий

Этот глоссарий определяет ключевые термины и понятия, используемые в документации и приложении RuleDesk.

## Основные концепции

### Booru

Тип имиджборд-сайтов, который позволяет пользователям публиковать, маркировать (тэгировать) и организовывать изображения. Сайты Booru обычно используют систему категоризации контента на основе тегов.

**Примеры:** Rule34.xxx, Gelbooru, Danbooru

**Связанные темы:** [Provider Pattern](./architecture.md#provider-pattern-architecture)

---

### Tags

Ключевые слова или метки, используемые для категоризации и поиска публикаций. Tags описывают различные атрибуты контента, такие как персонажи, художники, тип контента, рейтинг и т.д.

**Использование в RuleDesk:**

- Tags хранятся в базе данных как строки, разделенные пробелами.
- Tags используются для фильтрации и поиска публикаций.
- Нормализация Tags автоматически удаляет метаданные (например, "tag (123)" → "tag").

**Связанные темы:** [Database Schema - Posts](./database.md#table-posts), [Tag Normalization](./roadmap.md#data-integrity--sync)

---

### Рейтинг

Система классификации контента по рейтингу, используемая сайтами Booru для категоризации публикаций по типу контента:

-   **Безопасно (s):** Контент, безопасный для просмотра на работе.
-   **Сомнительно (q):** Сомнительный контент.
-   **Явный (e):** Откровенный/NSFW контент.

**Связанные темы:** [Database Schema - Posts](./database.md#table-posts), [Filters](./roadmap.md#a-filters-advanced-search-priority-high--ui-ready-backend-pending)

---

### Sync / Синхронизация

Процесс получения новых публикаций из Booru API и обновления локальной базы данных. RuleDesk реализует интеллектуальную синхронизацию с ограничением скорости (rate limiting) и инкрементными обновлениями.

**Особенности:**

-   Ограничение скорости запросов (задержка 1.5 с между художниками, 0.5 с между страницами).
-   Инкрементная синхронизация (получает только публикации новее, чем `lastPostId`).
-   Фоновое выполнение с отслеживанием прогресса.
-   Экспоненциальная выдержка (exponential backoff) для обработки ошибок.

**Связанные темы:** [Sync Service](./architecture.md#sync-service), [Synchronization Flow](./architecture.md#synchronization-flow), [Sync Settings](./README.md#sync--background)

---

### Кэш

Локальное хранилище метаданных публикаций и изображений-превью для обеспечения автономного просмотра и быстрой фильтрации. RuleDesk использует 3-уровневую систему прогрессивной загрузки изображений.

**Уровни кэша:**

1.  **Preview URL** - Размытое превью низкого разрешения (мгновенное отображение).
2.  **Sample URL** - Сэмпл среднего разрешения (загружается в галерее).
3.  **File URL** - Оригинал полного разрешения (загружается только в просмотрщике).

**Связанные темы:** [Progressive Image Loading](./README.md#progressive-image-loading), [Storage & Cache](./README.md#storage--cache)

---

### Blacklist

Список тегов или контента, который должен быть исключен из результатов поиска или лент. В настоящее время не реализован в RuleDesk, но планируется для будущих выпусков.

**Связанные темы:** [Roadmap - Filters](./roadmap.md#a-filters-advanced-search-priority-high--ui-ready-backend-pending)

---

### Отслеживание художников

Процесс отслеживания новых публикаций от конкретных художников или загрузчиков. RuleDesk поддерживает отслеживание по:

-   **Тег:** Отслеживание публикаций, помеченных определенным тегом.
-   **Загрузчик:** Отслеживание публикаций, загруженных конкретным пользователем.
-   **Запрос:** Отслеживание публикаций, соответствующих пользовательскому запросу.

**Связанные темы:** [Database Schema - Artists](./database.md#table-artists), [Artist Tracking](./README.md#-artist-tracking)

---

### Provider Pattern

Уровень абстракции, который позволяет RuleDesk поддерживать несколько источников Booru без изменения основной базы данных. Каждый провайдер реализует интерфейс `IBooruProvider`.

**Текущие провайдеры:**

-   Rule34.xxx (`Rule34Provider`)
-   Gelbooru (`GelbooruProvider`)

**Связанные темы:** [Architecture - Provider Pattern](./architecture.md#provider-pattern-architecture), [Multi-Booru Support](./README.md#-multi-source-ready)

---

## Технические термины

### IPC (Inter-Process Communication)

Механизм связи между Main Process и Renderer Process Electron. RuleDesk использует архитектуру IPC на основе контроллеров с типобезопасными интерфейсами.

**Связанные темы:** [IPC Architecture](./api.md#architecture), [IPC Bridge Interface](./api.md#ipc-bridge-interface)

---

### Main Process

Безопасная среда Node.js в Electron, которая обрабатывает весь ввод/вывод, сохранение данных и секреты. Операции с базами данных, вызовы API и доступ к файловой системе выполняются в Main Process.

**Связанные темы:** [Architecture - Main Process](./architecture.md#main-process-the-brain)

---

### Renderer Process

Песочница (sandboxed) браузерная среда в Electron, которая обрабатывает рендеринг пользовательского интерфейса и взаимодействия с пользователем. Renderer Process обменивается данными с Main Process через IPC.

**Связанные темы:** [Architecture - Renderer Process](./architecture.md#renderer-process-the-face)

---

### Изоляция контекста

Функция безопасности в Electron, которая предотвращает прямой доступ Renderer Process к API Node.js. Все коммуникации должны проходить через мост IPC.

**Статус:** ✅ Включено в RuleDesk

**Связанные темы:** [Security Architecture](./architecture.md#security-architecture), [Context Isolation](./architecture.md#context-isolation)

---

### Drizzle ORM

Библиотека Object-Relational Mapping, используемая RuleDesk для типобезопасных запросов к базе данных. Drizzle предоставляет вывод типов TypeScript и генерацию SQL.

**Связанные темы:** [Database Architecture](./database.md#database-architecture), [Drizzle ORM](./database.md#drizzle-orm)

---

### Режим WAL (Write-Ahead Logging)

Режим SQLite, который позволяет выполнять одновременное чтение во время выполнения записи. RuleDesk использует режим WAL для оптимальной производительности.

**Связанные темы:** [Database Architecture](./database.md#database-architecture), [WAL Mode](./database.md#database-architecture)

---

### Безопасное хранилище

API `safeStorage` Electron, используемый для шифрования конфиденциальных данных (API keys) в состоянии покоя. Шифрование использует системные хранилища ключей (Windows Credential Manager, macOS Keychain, Linux libsecret).

**Связанные темы:** [Security - Credential Security](./architecture.md#credential-security-flow), [Secure Storage](./README.md#security)

---

### Прогрессивная загрузка изображений

3-уровневая стратегия загрузки изображений, обеспечивающая мгновенную визуальную обратную связь с плавным улучшением качества:

1.  **Превью** - Размытое превью низкого разрешения (мгновенно).
2.  **Образец** - Сэмпл среднего разрешения (галерея).
3.  **Оригинал** - Оригинал полного разрешения (только в просмотрщике).

**Связанные темы:** [Progressive Image Loading](./README.md#progressive-image-loading), [Cache](#cache)

---

## Термины UI/UX

### Галерея

Табличное представление публикаций с изображениями-превью, рейтингами и метаданными. RuleDesk поддерживает несколько видов галерей:

-   **Сетка** - Макет сетки на основе карточек.
-   **Список** - Компактный макет списка.
-   **Masonry View** - Макет в стиле Pinterest (планируется).

**Связанные темы:** [Artist Gallery](./README.md#-artist-gallery), [Gallery Cards](./README.md#gallery-cards)

---

### Просмотрщик

Полноэкранный иммерсивный просмотрщик для просмотра публикаций с горячими клавишами, элементами управления загрузкой и управлением тегами.

**Особенности:**

-   Автоматическое скрытие элементов управления.
-   Навигация с помощью клавиатуры (←/→).
-   Загрузка и избранное.
-   Панель Tags.

**Связанные темы:** [Viewer Experience](./README.md#viewer-experience), [Full-Screen Viewer](./README.md#-full-screen-viewer)

---

### Избранное

Система для отметки и управления избранными публикациями. Избранные публикации хранятся локально в базе данных и могут быть переключены через пользовательский интерфейс или горячую клавишу (`F`).

**Связанные темы:** [Favorites System](./README.md#-favorites-system), [Database Schema - Posts](./database.md#table-posts)

---

### Подписки

Подписки на основе тегов для отслеживания определенных комбинаций тегов. В настоящее время планируется, но еще не реализовано.

**Связанные темы:** [Roadmap - Subscriptions](./roadmap.md#-subscriptions--updates)

---

### Плейлисты / Коллекции

Кураторские коллекции публикаций, независимые от Художников/Трекеров. В настоящее время планируется, но еще не реализовано.

**Связанные темы:** [Roadmap - Playlists](./roadmap.md#c-playlists--collections-priority-medium--not-started)

---

## Термины базы данных

### Миграция

Скрипт, который изменяет схему базы данных. RuleDesk использует Drizzle Kit для автоматической генерации и выполнения миграций.

**Связанные темы:** [Migrations](./database.md#migrations), [Development - Database Scripts](./development.md#database-scripts)

---

### Резервное копирование / Восстановление

Функциональность ручного резервного копирования и восстановления базы данных. Резервные копии снабжены отметкой времени и хранятся в каталоге пользовательских данных.

**Связанные темы:** [Backup and Recovery](./database.md#backup-and-recovery), [Backup & Restore](./README.md#-backup--restore)

---

### Проверка целостности

Операция SQLite (`PRAGMA integrity_check`), которая проверяет целостность файла базы данных. RuleDesk выполняет проверки целостности перед операциями восстановления.

**Связанные темы:** [Backup and Recovery](./database.md#backup-and-recovery)

---

## Термины API

### API Key

Учетные данные для аутентификации, необходимые для доступа к Booru API. RuleDesk хранит API keys в зашифрованном виде в состоянии покоя, используя API `safeStorage` Electron.

**Связанные темы:** [API Authentication](./README.md#-api-authentication), [Secure Storage](#secure-storage)

---

### Ограничение скорости запросов

Механизм для предотвращения злоупотреблений API путем ограничения частоты запросов. RuleDesk реализует интеллектуальное ограничение скорости запросов с настраиваемыми задержками.

**Текущие лимиты:**

-   Задержка 1.5 с между запросами по художникам.
-   Задержка 0.5 с между запросами по страницам.

**Связанные темы:** [Sync Service](./architecture.md#sync-service), [Rate Limiting](./api.md#external-api-integration)

---

### Экспоненциальная выдержка

Стратегия обработки ошибок, которая увеличивает время ожидания между попытками повтора. RuleDesk использует экспоненциальную выдержку для обработки ошибок API.

**Связанные темы:** [Sync Service](./architecture.md#sync-service), [Best Practices](./rule34-api-reference.md#rate-limiting)

---

## См. также

-   [Указатель документации](./index.md) - Полная навигация по документации.
-   [Обзор архитектуры](./architecture.md) - Архитектура и дизайн системы.
-   [Справочник API](./api.md) - Документация по IPC API.
-   [Документация по базе данных](./database.md) - Схема и операции базы данных.