# Руководство по разработке

## 📑 Оглавление

- [Предварительные требования](#prerequisites)
- [Начальная настройка](#initial-setup)
- [Скрипты для разработки](#development-scripts)
- [Структура проекта](#project-structure)
- [Рабочий процесс разработки](#development-workflow)
- [Конфигурация сборки](#build-configuration)
- [Отладка](#debugging)
- [Часто встречающиеся проблемы](#common-issues)
- [Оптимизация производительности](#performance-optimization)
- [Качество кода](#code-quality)
- [Переменные окружения](#environment-variables)
- [Hot Module Replacement (HMR)](#hot-module-replacement-hmr)
- [Продуктовая сборка](#production-build)

---

Это руководство охватывает настройку для разработки, процесс сборки и общие задачи разработки.

**📖 Связанная документация:**

- [Руководство по участию в разработке](./contributing.md) - Стандарты и рекомендации по коду
- [Документация по архитектуре](./architecture.md) - Архитектура системы
- [Документация по API](./api.md) - Справочник по IPC API
- [Документация по базе данных](./database.md) - Операции с базой данных
- [Глоссарий](./glossary.md) - Ключевые термины и концепции

## Предварительные требования

-   **Node.js:** v18 или выше
-   **npm:** v9 или выше (или yarn)
-   **Git:** Для контроля версий
-   **Python:** Требуется для сборки нативных модулей (better-sqlite3) в Windows

## Начальная настройка

### 1. Клонирование репозитория

```bash
git clone https://github.com/KazeKaze93/ruledesk.git
cd ruledesk
```

### 2. Установка зависимостей

```bash
npm install
```

Это устанавливает:

-   Electron и связанные с Electron зависимости
-   React и связанные с React зависимости
-   TypeScript и инструменты сборки
-   Библиотеки баз данных (Drizzle ORM, better-sqlite3)
-   Библиотеки UI (Tailwind CSS, shadcn/ui Components)

### 3. Проверка установки

```bash
npm run typecheck
npm run lint
```

## Скрипты для разработки

### `npm run dev`

Запускает приложение в режиме разработки с Hot Module Replacement (HMR).

**Что делает:**

-   Запускает dev-сервер Vite для Renderer Process
-   Компилирует Main Process в режиме наблюдения за изменениями
-   Открывает окно Electron с включенными DevTools
-   Включает HMR для React Components

**Использование:**

```bash
npm run dev
```

### `npm run build`

Собирает приложение для продакшена.

**Что делает:**

-   Компилирует TypeScript для Main и Renderer
-   Собирает React-приложение
-   Генерирует готовое к продакшену Electron-приложение в `out/`

**Использование:**

```bash
npm run build
```

### Скрипты для тестирования

Проект использует **Vitest** для модульных и интеграционных тестов, а также **Playwright** для E2E-тестов.

#### `npm test`

Запускает все тесты с автоматическим переключением ABI:

-   **Перед тестами:** Пересобирает `better-sqlite3` для Node.js (`pretest` hook)
-   **Запускает тесты:** Выполняет набор тестов Vitest
-   **После тестов:** Пересобирает `better-sqlite3` для Electron (`posttest` hook)

Это гарантирует корректное выполнение тестов и немедленную работу `npm run dev` после них.

**Использование:**

```bash
npm test
```

#### `npm run test:integration`

Запускает только интеграционные тесты (автономно, автоматически пересобирает для Node.js).

**Использование:**

```bash
npm run test:integration
```

#### `npm run test:integration:watch`

Запускает интеграционные тесты в режиме наблюдения за изменениями для рабочего процесса TDD.

**Использование:**

```bash
npm run test:integration:watch
```

#### `npm run test:e2e`

Запускает сквозные (end-to-end) тесты с Playwright.

**Использование:**

```bash
npm run test:e2e
```

**Архитектура тестирования:**

-   **Модульные тесты (Unit Tests):** `tests/unit/` - Тестируют отдельные Components, Hooks и утилиты
-   **Интеграционные тесты (Integration Tests):** `tests/integration/` - Тестируют IPC-контроллеры и сервисы с реальной базой данных
-   **Сквозные тесты (E2E Tests):** `tests/e2e/` - Тестируют полные пользовательские сценарии с Playwright

**Поддержка двойного ABI:**

Настройка тестирования автоматически переключается между Node.js и Electron ABI для `better-sqlite3`:
-   `pretest` hook пересобирает для Node.js перед тестами
-   `posttest` hook пересобирает для Electron после тестов
-   Скрипты интеграционных тестов включают свой собственный шаг пересборки для автономной работы

### `npm run preview`

Предварительно просматривает продуктовую сборку локально.

**Использование:**

```bash
npm run build
npm run preview
```

### `npm run typecheck`

Запускает компилятор TypeScript в режиме проверки (без генерации файлов).

**Использование:**

```bash
npm run typecheck
```

### `npm run lint`

Запускает ESLint для проверки качества кода.

**Использование:**

```bash
npm run lint
```

### Скрипты для базы данных

#### `npm run db:generate`

Генерирует новую миграцию базы данных на основе изменений схемы.

**Использование:**

1.  Измените `src/main/db/schema.ts`
2.  Запустите: `npm run db:generate`
3.  Проверьте сгенерированную миграцию в `drizzle/`

#### `npm run db:migrate`

Запускает отложенные миграции базы данных.

**Использование:**

```bash
npm run db:migrate
```

**Примечание:** Миграции запускаются автоматически при старте приложения, но вы можете запускать их вручную для тестирования.

#### `npm run db:studio`

Открывает Drizzle Studio для инспекции базы данных.

**Использование:**

```bash
npm run db:studio
```

Открывает веб-интерфейс по адресу `http://localhost:4983` (порт по умолчанию).

## Структура проекта

```
.
├── src/
│   ├── main/                          # Electron Main Process
│   │   ├── db/                        # Слой базы данных
│   │   │   ├── client.ts              # Клиент базы данных (инициализация, getDb)
│   │   │   ├── schema.ts              # Определения схемы Drizzle
│   │   ├── ipc/                       # IPC (Inter-Process Communication)
│   │   │   ├── controllers/           # IPC Контроллеры (по доменам)
│   │   │   │   ├── ArtistsController.ts
│   │   │   │   ├── PostsController.ts
│   │   │   │   ├── SettingsController.ts
│   │   │   │   ├── AuthController.ts
│   │   │   │   ├── MaintenanceController.ts
│   │   │   │   ├── ViewerController.ts
│   │   │   │   ├── FileController.ts
│   │   │   │   ├── SearchController.ts
│   │   │   │   └── SystemController.ts
│   │   │   ├── channels.ts            # IPC константы каналов
│   │   │   └── index.ts               # Настройка и регистрация IPC
│   │   ├── core/                      # Базовая инфраструктура
│   │   │   ├── di/                    # Внедрение зависимостей (Dependency Injection)
│   │   │   │   ├── Container.ts       # DI Container (Singleton)
│   │   │   │   └── Token.ts           # Типобезопасные DI-токены
│   │   │   └── ipc/                   # IPC инфраструктура
│   │   │       └── BaseController.ts  # Базовый контроллер с обработкой ошибок
│   │   ├── providers/                 # Реализации провайдеров Booru
│   │   │   ├── rule34-provider.ts     # Провайдер Rule34.xxx
│   │   │   ├── gelbooru-provider.ts   # Провайдер Gelbooru
│   │   │   ├── types.ts               # Интерфейсы провайдеров
│   │   │   └── index.ts               # Реестр провайдеров
│   │   ├── services/                  # Фоновые сервисы
│   │   │   ├── secure-storage.ts      # Безопасное хранилище для учетных данных
│   │   │   ├── sync-service.ts        # Синхронизация API
│   │   │   └── updater-service.ts     # Автоматический обновлятор
│   │   ├── lib/                        # Утилиты
│   │   │   └── logger.ts              # Утилита логирования
│   │   ├── bridge.ts                  # IPC bridge интерфейс
│   │   ├── main.d.ts                  # Определения типов
│   │   └── main.ts                    # Точка входа Main Process
│   │
│   └── renderer/                      # Electron Renderer Process
│       ├── components/                 # React Components
│       │   ├── dialogs/               # Компоненты диалогов
│       │   ├── gallery/               # Компоненты галереи
│       │   ├── inputs/                # Компоненты ввода
│       │   ├── layout/                # Компоненты макета
│       │   ├── pages/                 # Компоненты страниц
│       │   ├── settings/              # Компоненты настроек
│       │   ├── ui/                    # shadcn/ui Components
│       │   └── viewer/                # Компоненты просмотра
│       ├── i18n/                      # Интернационализация
│       ├── lib/                       # Утилиты
│       │   ├── hooks/                 # Пользовательские React Hooks
│       │   ├── artist-utils.ts
│       │   ├── tag-utils.ts
│       │   └── utils.ts
│       ├── locales/                   # Файлы переводов
│       ├── schemas/                    # Схемы валидации форм
│       ├── store/                      # Zustand Stores
│       ├── App.tsx                     # Главный React Component
│       ├── main.tsx                    # Точка входа Renderer
│       └── index.html                  # HTML-шаблон
│
├── drizzle/                            # Миграции базы данных
│   ├── *.sql                          # SQL файлы миграций (отслеживаются в git)
│   └── meta/                          # Метаданные миграций (игнорируются git)
│       ├── _journal.json              # Журнал миграций
│       └── *_snapshot.json            # Снимки схемы
│
├── docs/                               # Документация
│   ├── api.md
│   ├── architecture.md
│   ├── contributing.md
│   ├── database.md
│   ├── development.md
│   ├── roadmap.md
│   └── rule34-api-reference.md
│
├── scripts/                            # Скрипты сборки и утилит
│   ├── ai_reviewer.py
│   └── system_prompt.md
│
├── .github/                            # Рабочие процессы GitHub
│   └── workflows/
│       ├── ai-review.yml
│       └── ci.yml
│
├── electron.vite.config.ts             # Конфигурация Electron-Vite
├── drizzle.config.ts                   # Конфигурация Drizzle ORM
├── tailwind.config.js                  # Конфигурация Tailwind CSS
├── tsconfig.json                       # Конфигурация TypeScript
└── package.json                        # Зависимости и скрипты проекта
```

## Рабочий процесс разработки

### 1. Внесение изменений

**Изменения в Main Process:**

-   Редактируйте файлы в `src/main/`
-   Изменения требуют перезапуска приложения (без HMR для Main Process)
-   Проверяйте консоль/терминал на наличие ошибок
-   Изменения в базе данных требуют генерации миграции (`npm run db:generate`)

**Изменения в Renderer:**

-   Редактируйте файлы в `src/renderer/`
-   Изменения автоматически обновляются в реальном времени (hot-reload)
-   Проверяйте DevTools браузера на наличие ошибок

### 2. Добавление новых функций

**Добавление IPC-метода:**

1.  Определите в `src/main/bridge.ts`:

    ```typescript
    export interface IpcBridge {
      newMethod: () => Promise<ReturnType>;
    }
    ```

2.  Реализуйте в `src/main/bridge.ts`:

    ```typescript
    const ipcBridge: IpcBridge = {
      newMethod: () => ipcRenderer.invoke(IPC_CHANNELS.APP.NEW_METHOD),
    };
    ```

3.  Добавьте константу канала в `src/main/ipc/channels.ts`:

    ```typescript
    export const IPC_CHANNELS = {
      APP: {
        // ... existing channels
        NEW_METHOD: "app:new-method",
      },
    } as const;
    ```

4.  Добавьте обработчик в соответствующий контроллер (`src/main/ipc/controllers/`):

    ```typescript
    export class MyController extends BaseController {
      setup() {
        this.handle(
          IPC_CHANNELS.APP.NEW_METHOD,
          MySchema, // Zod schema for validation
          this.newMethod.bind(this)
        );
      }

      private async newMethod(_event: IpcMainInvokeEvent, data: MyRequestType) {
        const db = container.resolve(DI_TOKENS.DB);
        // Implementation
      }
    }
    ```

5.  Зарегистрируйте контроллер в `src/main/ipc/index.ts` (через функцию `setupIpc()`):

    ```typescript
    const myController = new MyController();
    myController.setup();
    ```

6.  Обновите типы в `src/renderer.d.ts`:
    ```typescript
    export interface IpcApi {
      newMethod: () => Promise<ReturnType>;
    }
    ```

**Добавление таблицы базы данных:**

1.  Добавьте схему в `src/main/db/schema.ts`
2.  Сгенерируйте миграцию: `npm run db:generate`
3.  Проверьте миграцию в `drizzle/`
4.  Протестируйте: `npm run db:migrate`

**Добавление React Component:**

1.  Создайте Component в `src/renderer/components/`
2.  Используйте TypeScript и корректную типизацию
3.  Используйте Tailwind CSS для стилизации
4.  Следуйте паттернам Components из существующего кода

### 3. Тестирование изменений

**Перед коммитом:**

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Manual testing
npm run dev
```

## Конфигурация сборки

### Electron-Vite

**Файл:** `electron.vite.config.ts`

Конфигурирует:

-   Сборку Main Process
-   Сборку Preload-скрипта
-   Сборку Renderer Process (Vite)

### TypeScript

**Файл:** `tsconfig.json`

-   Строгий режим включен
-   Модули ES
-   Настроены псевдонимы путей

### Tailwind CSS

**Файл:** `tailwind.config.js`

-   Настроены пути к содержимому
-   Пользовательские расширения темы
-   Интеграция shadcn/ui

## Отладка

### Отладка Main Process

**Логи консоли:**

-   Используйте `logger` из `src/main/lib/logger.ts`
-   Логи появляются в терминале/консоли

**Отладчик:**

-   Используйте отладчик VS Code с конфигурацией Electron
-   Устанавливайте точки останова в коде Main Process

### Отладка Renderer Process

**DevTools:**

-   Автоматически открываются в режиме разработки
-   Используйте расширение React DevTools
-   Используйте DevTools браузера для отладки

**Консоль:**

-   Доступ через `window.api` в консоли DevTools
-   Тестируйте IPC-вызовы напрямую

### Отладка базы данных

**Drizzle Studio:**

```bash
npm run db:studio
```

**Логи:**

-   Операции с базой данных логируются через `logger`
-   Проверяйте консоль на наличие SQL-ошибок

## Часто встречающиеся проблемы

### Проблема: Ошибки TypeScript

**Решение:**

```bash
npm run typecheck
# Fix errors shown
```

### Проблема: Ошибки миграции базы данных

**Решение:**

1.  Проверьте файлы миграций в `drizzle/`
2.  Убедитесь в правильности изменений схемы
3.  Попробуйте ручную миграцию: `npm run db:migrate`

### Проблема: IPC не работает

**Решение:**

1.  Проверьте, что bridge выставлен: Проверьте `src/main/bridge.ts`
2.  Убедитесь, что константа канала существует: Проверьте `src/main/ipc/channels.ts`
3.  Убедитесь, что контроллер зарегистрирован: Проверьте `src/main/ipc/index.ts` (через функцию `setupIpc()`)
4.  Убедитесь, что обработчик зарегистрирован в контроллере: Проверьте метод `setup()` контроллера
5.  Проверьте соответствие типов: Проверьте `src/renderer.d.ts`
6.  Проверьте DI Container: Убедитесь, что зависимости зарегистрированы до настройки контроллера (через `registerServices()`)
7.  Проверьте BaseController: Убедитесь, что контроллер расширяет `BaseController` и использует метод `this.handle()`

### Проблема: Сбой сборки

**Решение:**

1.  Очистите кэш сборки: Удалите `out/` и `node_modules/.vite/`
2.  Переустановите зависимости: `rm -rf node_modules && npm install`
3.  Проверьте наличие ошибок TypeScript: `npm run typecheck`

## Оптимизация производительности

### Разработка

-   Используйте React DevTools Profiler
-   Мониторьте частоту вызовов IPC
-   Проверяйте производительность запросов к базе данных

### Продакшен

-   Включите продакшен-сборки
-   Минимизируйте размер бандла
-   Оптимизируйте запросы к базе данных
-   Используйте индексы, где это необходимо

## Качество кода

### TypeScript

-   Отсутствие типов `any`
-   Отсутствие небезопасных приведений типов
-   Правильная обработка ошибок
-   Вывод типов там, где это возможно

### React

-   Только функциональные Components
-   Правильная типизация Props
-   Лучшие практики Hooks
-   Отсутствие инлайн-стилей

### База данных

-   Используйте Drizzle ORM (без чистого SQL)
-   Типобезопасные запросы
-   Правильная обработка ошибок
-   Поддержка транзакций, где это необходимо

## Переменные окружения

В настоящее время переменные окружения не требуются. Будущие дополнения:

-   `API_KEY` - Ключ внешнего API (при необходимости)
-   `NODE_ENV` - Режим разработки/продакшена
-   `ELECTRON_RENDERER_URL` - URL dev-сервера (автоматически устанавливается electron-vite)

## Hot Module Replacement (HMR)

**Renderer Process:**

-   ✅ Полностью поддерживается
-   React Components горячо перезагружаются
-   Изменения CSS применяются мгновенно
-   Vite dev-сервер обеспечивает мгновенные обновления

**Main Process:**

-   ⚠️ Частично поддерживается
-   Нет автоматического HMR - изменения требуют ручного перезапуска приложения
-   `electron-vite` отслеживает файлы Main Process, но не перезапускает автоматически
-   **Обходной путь:** Используйте `nodemon` или аналогичный инструмент для автоматического перезапуска во время разработки
-   **Текущий статус:** Ручной перезапуск требуется после изменений в Main Process

## Продуктовая сборка

### Сборка

```bash
npm run build
```

Выход в `out/`:

-   `out/main/` - Бандл Main Process
-   `out/preload/` - Preload-скрипт
-   `out/renderer/` - Бандл Renderer

### Распространение

Используйте `electron-builder` (сконфигурирован в `package.json`):

```bash
# Сборка для текущей платформы
npm run build
npx electron-builder

# Сборка для конкретной платформы
npx electron-builder --win
npx electron-builder --mac
npx electron-builder --linux
```

## Дополнительные ресурсы

-   [Документация Electron](https://www.electronjs.org/docs)
-   [Документация Drizzle ORM](https://orm.drizzle.team/)
-   [Документация React](https://react.dev/)
-   [Документация TypeScript](https://www.typescriptlang.org/docs/)
-   [Документация Tailwind CSS](https://tailwindcss.com/docs)

## Получение помощи

1.  Проверьте существующую документацию в `docs/`
2.  Изучите аналогичный код в кодовой базе
3.  Проверьте GitHub Issues
4.  Откройте новую Issue с подробностями
