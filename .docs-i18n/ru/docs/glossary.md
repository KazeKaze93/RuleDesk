# Глоссарий

Этот глоссарий определяет ключевые термины и концепции, используемые в документации и приложении RuleDesk.

## Основные концепции

### Booru

Тип имиджборда, который позволяет пользователям публиковать, Tag-ировать и организовывать изображения. Booru-сайты обычно используют систему категоризации на основе Tags для организации контента.

**Примеры:** Rule34.xxx, Gelbooru, Danbooru

**Связанные понятия:** [Provider Pattern](./architecture.md#provider-pattern-architecture)

---

### Tags

Ключевые слова или метки, используемые для категоризации и поиска постов. Tags описывают различные атрибуты контента, такие как персонажи, художники, тип контента, рейтинг и т.д.

**Использование в RuleDesk:**

- Tags хранятся в базе данных как строки, разделенные пробелами
- Tags используются для фильтрации и поиска постов
- Нормализация Tags автоматически удаляет метаданные (например, "tag (123)" → "tag")

**Связанные понятия:** [Database Schema - Posts](./database.md#table-posts), [Tag Normalization](./roadmap.md#data-integrity--sync)

---

### Рейтинг

Система классификации контента по рейтингу, используемая Booru-сайтами для категоризации постов по типу контента:

-   **Безопасно (s):** Контент, безопасный для работы
-   **Сомнительно (q):** Сомнительный контент
-   **Откровенно (e):** Откровенный/NSFW контент

**Связанные понятия:** [Database Schema - Posts](./database.md#table-posts), [Filters](./roadmap.md#a-filters-advanced-search-priority-high--ui-ready-backend-pending)

---

### Синхронизация

Процесс получения новых постов из Booru API и обновления локальной базы данных. RuleDesk реализует интеллектуальную синхронизацию с ограничением скорости (rate limiting) и инкрементными обновлениями.

**Особенности:**

-   Ограничение скорости (задержка 1.5 с между художниками, 0.5 с между страницами)
-   Инкрементальная синхронизация (получает только посты новее `lastPostId`)
-   Выполнение в фоновом режиме с отслеживанием прогресса
-   Экспоненциальная задержка (exponential backoff) для обработки ошибок

**Связанные понятия:** [Sync Service](./architecture.md#sync-service), [Synchronization Flow](./architecture.md#synchronization-flow), [Sync Settings](./README.md#sync--background)

---

### Кэш

Локальное хранилище метаданных постов и изображений предварительного просмотра для обеспечения офлайн-просмотра и быстрой фильтрации. RuleDesk использует 3-слойную систему прогрессивной загрузки изображений.

**Слои кэша:**

1.  **Preview URL** - Размытое превью низкого разрешения (мгновенное отображение)
2.  **Sample URL** - Образец среднего разрешения (загружается в галерее)
3.  **File URL** - Оригинал полного разрешения (загружается только в просмотрщике)

**Связанные понятия:** [Progressive Image Loading](./README.md#progressive-image-loading), [Storage & Cache](./README.md#storage--cache)

---

### Blacklist

Список Tags или контента, который должен быть исключен из результатов поиска или лент. В настоящее время не реализован в RuleDesk, но планируется для будущих релизов.

**Связанные понятия:** [Roadmap - Filters](./roadmap.md#a-filters-advanced-search-priority-high--ui-ready-backend-pending)

---

### Отслеживание художников

Процесс мониторинга определенных художников или загрузчиков на предмет новых постов. RuleDesk поддерживает отслеживание по:

-   **Tag:** Отслеживание постов, помеченных определенным Tag
-   **Загрузчик:** Отслеживание постов, загруженных определенным пользователем
-   **Запрос:** Отслеживание постов, соответствующих пользовательскому запросу

**Связанные понятия:** [Database Schema - Artists](./database.md#table-artists), [Artist Tracking](./README.md#-artist-tracking)

---

### Provider Pattern

Абстракционный слой, который позволяет RuleDesk поддерживать несколько Booru-источников без изменений в основной базе данных. Каждый провайдер реализует интерфейс `IBooruProvider`.

**Текущие провайдеры:**

-   Rule34.xxx (`Rule34Provider`)
-   Gelbooru (`GelbooruProvider`)

**Связанные понятия:** [Architecture - Provider Pattern](./architecture.md#provider-pattern-architecture), [Multi-Booru Support](./README.md#-multi-source-ready)

---

## Технические термины

### IPC (Inter-Process Communication)

Механизм связи между Main Process и Renderer Process Electron. RuleDesk использует контроллер-ориентированную IPC-архитектуру с типобезопасными интерфейсами.

**Связанные понятия:** [IPC Architecture](./api.md#architecture), [IPC Bridge Interface](./api.md#ipc-bridge-interface)

---

### Main Process

Защищенная среда Node.js в Electron, которая управляет всеми операциями ввода-вывода, сохранением данных и секретами. Операции с базой данных, вызовы API и доступ к файловой системе выполняются в Main Process.

**Связанные понятия:** [Architecture - Main Process](./architecture.md#main-process-the-brain)

---

### Renderer Process

Изолированная среда браузера в Electron, которая отвечает за рендеринг пользовательского интерфейса и взаимодействие с пользователем. Renderer Process обменивается данными с Main Process через IPC.

**Связанные понятия:** [Architecture - Renderer Process](./architecture.md#renderer-process-the-face)

---

### Изоляция контекста (Context Isolation)

Функция безопасности в Electron, которая не позволяет Renderer Process напрямую обращаться к Node.js API. Все взаимодействие должно осуществляться через IPC-мост.

**Статус:** ✅ Включено в RuleDesk

**Связанные понятия:** [Security Architecture](./architecture.md#security-architecture), [Context Isolation](./architecture.md#context-isolation)

---

### Drizzle ORM

Библиотека Object-Relational Mapping, используемая RuleDesk для типобезопасных запросов к базе данных. Drizzle обеспечивает вывод типов TypeScript и генерацию SQL.

**Связанные понятия:** [Database Architecture](./database.md#database-architecture), [Drizzle ORM](./database.md#drizzle-orm)

---

### Режим WAL (Write-Ahead Logging)

Режим SQLite, который позволяет выполнять параллельное чтение во время выполнения записи. RuleDesk использует режим WAL для оптимальной производительности.

**Связанные понятия:** [Database Architecture](./database.md#database-architecture), [WAL Mode](./database.md#database-architecture)

---

### Безопасное хранилище (Secure Storage)

API `safeStorage` Electron, используемый для шифрования конфиденциальных данных (API-ключей) в состоянии покоя. Шифрование использует цепочки ключей платформы (Диспетчер учетных данных Windows, Связка ключей macOS, Linux libsecret).

**Связанные понятия:** [Security - Credential Security](./architecture.md#credential-security-flow), [Secure Storage](./README.md#security)

---

### Прогрессивная загрузка изображений

3-слойная стратегия загрузки изображений, обеспечивающая мгновенную визуальную обратную связь с плавным улучшением качества:

1.  **Превью** - Размытое превью низкого разрешения (мгновенно)
2.  **Образец** - Образец среднего разрешения (галерея)
3.  **Оригинал** - Оригинал полного разрешения (только в просмотрщике)

**Связанные понятия:** [Progressive Image Loading](./README.md#progressive-image-loading), [Cache](#cache)

---

## Термины UI/UX

### Галерея

Сетчатое представление постов с изображениями предварительного просмотра, рейтингами и метаданными. RuleDesk поддерживает несколько видов галерей:

-   **Сетчатый вид** - Карточная сетка
-   **Вид списка** - Компактный список
-   **Masonry View** - Расположение в стиле Pinterest (планируется)

**Связанные понятия:** [Artist Gallery](./README.md#-artist-gallery), [Gallery Cards](./README.md#gallery-cards)

---

### Просмотрщик

Полноэкранный иммерсивный просмотрщик для просмотра постов с горячими клавишами, элементами управления загрузкой и управлением Tags.

**Особенности:**

-   Автоматическое скрытие элементов управления
-   Навигация с клавиатуры (←/→)
-   Загрузка и избранное
-   Панель Tags

**Связанные понятия:** [Viewer Experience](./README.md#viewer-experience), [Full-Screen Viewer](./README.md#-full-screen-viewer)

---

### Избранное

Система для пометки и управления избранными постами. Избранное хранится локально в базе данных и может быть переключено через пользовательский интерфейс или горячую клавишу (`F`).

**Связанные понятия:** [Favorites System](./README.md#-favorites-system), [Database Schema - Posts](./database.md#table-posts)

---

### Подписки

Подписки на основе Tags для отслеживания определенных комбинаций Tags. В настоящее время планируются, но еще не реализованы.

**Связанные понятия:** [Roadmap - Subscriptions](./roadmap.md#-subscriptions--updates)

---

### Плейлисты / Коллекции

Курируемые коллекции постов, независимые от художников/трекеров. В настоящее время планируются, но еще не реализованы.

**Связанные понятия:** [Roadmap - Playlists](./roadmap.md#c-playlists--collections-priority-medium--not-started)

---

## Термины базы данных

### Миграция

Скрипт, который изменяет схему базы данных. RuleDesk использует Drizzle Kit для автоматической генерации и выполнения миграций.

**Связанные понятия:** [Migrations](./database.md#migrations), [Development - Database Scripts](./development.md#database-scripts)

---

### Резервное копирование / Восстановление

Функциональность ручного резервного копирования и восстановления базы данных. Резервные копии имеют метку времени и хранятся в каталоге пользовательских данных.

**Связанные понятия:** [Backup and Recovery](./database.md#backup-and-recovery), [Backup & Restore](./README.md#-backup--restore)

---

### Проверка целостности

Операция SQLite (`PRAGMA integrity_check`), которая проверяет целостность файла базы данных. RuleDesk выполняет проверки целостности перед операциями восстановления.

**Связанные понятия:** [Backup and Recovery](./database.md#backup-and-recovery)

---

## Термины API

### API-ключ

Учетные данные для аутентификации, необходимые для доступа к Booru API. RuleDesk хранит API-ключи, зашифрованные в состоянии покоя, используя API `safeStorage` Electron.

**Связанные понятия:** [API Authentication](./README.md#-api-authentication), [Secure Storage](#secure-storage)

---

### Ограничение скорости (Rate Limiting)

Механизм для предотвращения злоупотреблений API путем ограничения частоты запросов. RuleDesk реализует интеллектуальное ограничение скорости с настраиваемыми задержками.

**Текущие ограничения:**

-   Задержка 1.5 с между художниками
-   Задержка 0.5 с между страницами

**Связанные понятия:** [Sync Service](./architecture.md#sync-service), [Rate Limiting](./api.md#external-api-integration)

---

### Экспоненциальная задержка (Exponential Backoff)

Стратегия обработки ошибок, которая увеличивает время ожидания между повторными попытками. RuleDesk использует экспоненциальную задержку для обработки ошибок API.

**Связанные понятия:** [Sync Service](./architecture.md#sync-service), [Best Practices](./rule34-api-reference.md#rate-limiting)

---

## См. также

-   [Указатель документации](./index.md) - Полная навигация по документации
-   [Обзор архитектуры](./architecture.md) - Архитектура и дизайн системы
-   [Справочник API](./api.md) - Документация по IPC API
-   [Документация по базе данных](./database.md) - Схема и операции с базой данных