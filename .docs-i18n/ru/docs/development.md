# Руководство по разработке

## 📑 Оглавление

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Scripts](#development-scripts)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Build Configuration](#build-configuration)
- [Debugging](#debugging)
- [Common Issues](#common-issues)
- [Performance Optimization](#performance-optimization)
- [Code Quality](#code-quality)
- [Environment Variables](#environment-variables)
- [Hot Module Replacement (HMR)](#hot-module-replacement-hmr)
- [Production Build](#production-build)

---

Это руководство охватывает настройку среды разработки, процесс сборки и типовые задачи разработки.

**📖 Связанная документация:**

- [Руководство по внесению вклада](./contributing.md) - Стандарты и рекомендации по коду
- [Документация по архитектуре](./architecture.md) - Архитектура системы
- [Документация по API](./api.md) - Справочник по IPC API
- [Документация по базе данных](./database.md) - Операции с базой данных
- [Глоссарий](./glossary.md) - Ключевые термины и концепции

## Необходимые условия

- **Node.js:** v18 или выше
- **npm:** v9 или выше (или yarn)
- **Git:** Для контроля версий
- **Python:** Требуется для сборки нативных модулей (better-sqlite3) в Windows

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

- Electron и связанные с Electron зависимости
- React и связанные с React зависимости
- TypeScript и инструменты сборки
- Библиотеки баз данных (Drizzle ORM, better-sqlite3)
- UI библиотеки (Tailwind CSS, shadcn/ui Components)

### 3. Проверка установки

```bash
npm run typecheck
npm run lint
```

## Скрипты для разработки

### `npm run dev`

Запускает приложение в режиме разработки с Hot Module Replacement (HMR).

**Что он делает:**

- Запускает dev-сервер Vite для Renderer Process
- Компилирует Main Process в режиме отслеживания изменений
- Открывает окно Electron с включёнными DevTools
- Включает HMR для React Components

**Использование:**

```bash
npm run dev
```

### `npm run build`

Собирает приложение для production.

**Что он делает:**

- Компилирует TypeScript для Main Process и Renderer Process
- Собирает (бандлит) React приложение
- Генерирует готовое к production приложение Electron в `out/`

**Использование:**

```bash
npm run build
```

### `npm run preview`

Предварительный просмотр production сборки локально.

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

### Скрипты базы данных

#### `npm run db:generate`

Генерирует новую миграцию базы данных на основе изменений схемы.

**Использование:**

1. Измените `src/main/db/schema.ts`
2. Запустите: `npm run db:generate`
3. Просмотрите сгенерированную миграцию в `drizzle/`

#### `npm run db:migrate`

Выполняет отложенные миграции базы данных.

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
│   │   │   ├── schema.ts              # Определения схемы Drizzle ORM
│   │   ├── ipc/                       # IPC (Inter-Process Communication)
│   │   │   ├── controllers/           # IPC Controllers (на основе доменов)
│   │   │   │   ├── ArtistsController.ts
│   │   │   │   ├── PostsController.ts
│   │   │   │   ├── SettingsController.ts
│   │   │   │   ├── AuthController.ts
│   │   │   │   ├── MaintenanceController.ts
│   │   │   │   ├── ViewerController.ts
│   │   │   │   ├── FileController.ts
│   │   │   │   ├── SearchController.ts
│   │   │   │   └── SystemController.ts
│   │   │   ├── channels.ts            # Константы IPC каналов
│   │   │   └── index.ts               # Настройка и регистрация IPC
│   │   ├── core/                      # Базовая инфраструктура
│   │   │   ├── di/                    # Внедрение зависимостей (Dependency Injection)
│   │   │   │   ├── Container.ts       # DI Container (Singleton)
│   │   │   │   └── Token.ts           # Типобезопасные DI токены
│   │   │   └── ipc/                   # IPC инфраструктура
│   │   │       └── BaseController.ts  # Базовый контроллер с обработкой ошибок
│   │   ├── providers/                 # Реализации провайдеров Booru
│   │   │   ├── rule34-provider.ts     # Провайдер Rule34.xxx
│   │   │   ├── gelbooru-provider.ts   # Провайдер Gelbooru
│   │   │   ├── types.ts               # Интерфейсы провайдеров
│   │   │   └── index.ts               # Реестр провайдеров
│   │   ├── services/                  # Фоновые службы
│   │   │   ├── secure-storage.ts      # Безопасное хранилище для учетных данных
│   │   │   ├── sync-service.ts        # Синхронизация API
│   │   │   └── updater-service.ts     # Автоматическое обновление
│   │   ├── lib/                        # Утилиты
│   │   │   └── logger.ts              # Утилита логирования
│   │   ├── bridge.ts                  # Интерфейс IPC моста
│   │   ├── main.d.ts                  # Определения типов
│   │   └── main.ts                    # Точка входа Main Process
│   │
│   └── renderer/                      # Electron Renderer Process
│       ├── components/                 # React Components
│       │   ├── dialogs/               # Dialog Components
│       │   ├── gallery/               # Gallery Components
│       │   ├── inputs/                # Input Components
│       │   ├── layout/                # Layout Components
│       │   ├── pages/                 # Page Components
│       │   ├── settings/              # Settings Components
│       │   ├── ui/                    # shadcn/ui Components
│       │   └── viewer/                # Viewer Components
│       ├── i18n/                      # Интернационализация
│       ├── lib/                       # Утилиты
│       │   ├── hooks/                 # Пользовательские React хуки
│       │   ├── artist-utils.ts
│       │   ├── tag-utils.ts
│       │   └── utils.ts
│       ├── locales/                   # Файлы переводов
│       ├── schemas/                    # Схемы валидации форм
│       ├── store/                      # Zustand Store
│       ├── App.tsx                     # Главный React Component
│       ├── main.tsx                    # Точка входа Renderer Process
│       └── index.html                  # HTML шаблон
│
├── drizzle/                            # Миграции базы данных
│   ├── meta/                          # Метаданные миграций
│   └── *.sql                          # SQL файлы миграций
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
├── scripts/                            # Скрипты сборки и утилиты
│   ├── ai_reviewer.py
│   └── system_prompt.md
│
├── .github/                            # GitHub workflows
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

- Редактируйте файлы в `src/main/`
- Изменения требуют перезапуска приложения (нет HMR для Main Process)
- Проверяйте консоль/терминал на наличие ошибок
- Изменения в базе данных требуют генерации миграции (`npm run db:generate`)

**Изменения в Renderer Process:**

- Редактируйте файлы в `src/renderer/`
- Изменения автоматически перезагружаются (hot-reload)
- Проверяйте DevTools браузера на наличие ошибок

### 2. Добавление новых функций

**Добавление IPC метода:**

1. Определите в `src/main/bridge.ts`:

   ```typescript
   export interface IpcBridge {
     newMethod: () => Promise<ReturnType>;
   }
   ```

2. Реализуйте в `src/main/bridge.ts`:

   ```typescript
   const ipcBridge: IpcBridge = {
     newMethod: () => ipcRenderer.invoke(IPC_CHANNELS.APP.NEW_METHOD),
   };
   ```

3. Добавьте константу канала в `src/main/ipc/channels.ts`:

   ```typescript
   export const IPC_CHANNELS = {
     APP: {
       // ... existing channels
       NEW_METHOD: "app:new-method",
     },
   } as const;
   ```

4. Добавьте обработчик в соответствующий контроллер (`src/main/ipc/controllers/`):

   ```typescript
   export class MyController extends BaseController {
     setup() {
       this.handle(
         IPC_CHANNELS.APP.NEW_METHOD,
         MySchema, // Схема Zod для валидации
         this.newMethod.bind(this)
       );
     }

     private async newMethod(_event: IpcMainInvokeEvent, data: MyRequestType) {
       const db = container.resolve(DI_TOKENS.DB);
       // Реализация
     }
   }
   ```

5. Зарегистрируйте контроллер в `src/main/ipc/index.ts` (через функцию `setupIpc()`):

   ```typescript
   const myController = new MyController();
   myController.setup();
   ```

6. Обновите типы в `src/renderer.d.ts`:
   ```typescript
   export interface IpcApi {
     newMethod: () => Promise<ReturnType>;
   }
   ```

**Добавление таблицы базы данных:**

1. Добавьте схему в `src/main/db/schema.ts`
2. Сгенерируйте миграцию: `npm run db:generate`
3. Просмотрите миграцию в `drizzle/`
4. Протестируйте: `npm run db:migrate`

**Добавление React Component:**

1. Создайте Component в `src/renderer/components/`
2. Используйте TypeScript и корректную типизацию
3. Используйте Tailwind CSS для стилизации
4. Следуйте шаблонам Components из существующего кода

### 3. Тестирование изменений

**Перед коммитом:**

```bash
# Проверка типов
npm run typecheck

# Линтинг
npm run lint

# Ручное тестирование
npm run dev
```

## Конфигурация сборки

### Electron-Vite

**Файл:** `electron.vite.config.ts`

Конфигурирует:

- Сборка Main Process
- Сборка preload-скрипта
- Сборка Renderer Process (Vite)

### TypeScript

**Файл:** `tsconfig.json`

- Строгий режим включён
- ES модули
- Сконфигурированы псевдонимы путей

### Tailwind CSS

**Файл:** `tailwind.config.js`

- Сконфигурированы пути к контенту
- Пользовательские расширения темы
- Интеграция shadcn/ui

## Отладка

### Отладка Main Process

**Логи консоли:**

- Используйте `logger` из `src/main/lib/logger.ts`
- Логи появляются в терминале/консоли

**Отладчик:**

- Используйте отладчик VS Code с конфигурацией Electron
- Установите точки останова в коде Main Process

### Отладка Renderer Process

**DevTools:**

- Автоматически открывается в режиме разработки
- Используйте расширение React DevTools
- Используйте DevTools браузера для отладки

**Консоль:**

- Доступ через `window.api` в консоли DevTools
- Тестируйте IPC вызовы напрямую

### Отладка базы данных

**Drizzle Studio:**

```bash
npm run db:studio
```

**Логи:**

- Операции с базой данных логируются через `logger`
- Проверяйте консоль на наличие SQL ошибок

## Распространенные проблемы

### Проблема: Ошибки TypeScript

**Решение:**

```bash
npm run typecheck
# Исправьте показанные ошибки
```

### Проблема: Ошибки миграции базы данных

**Решение:**

1. Проверьте файлы миграции в `drizzle/`
2. Проверьте изменения схемы
3. Попробуйте ручную миграцию: `npm run db:migrate`

### Проблема: IPC не работает

**Решение:**

1. Убедитесь, что мост (bridge) открыт: проверьте `src/main/bridge.ts`
2. Убедитесь, что константа канала существует: проверьте `src/main/ipc/channels.ts`
3. Убедитесь, что контроллер зарегистрирован: проверьте `src/main/ipc/index.ts` (через функцию `setupIpc()`)
4. Убедитесь, что обработчик зарегистрирован в контроллере: проверьте метод `setup()` контроллера
5. Проверьте соответствие типов: проверьте `src/renderer.d.ts`
6. Проверьте DI container: Убедитесь, что зависимости зарегистрированы до настройки контроллера (через `registerServices()`)
7. Проверьте BaseController: Убедитесь, что контроллер расширяет `BaseController` и использует метод `this.handle()`

### Проблема: Сборка не удалась

**Решение:**

1. Очистите кэш сборки: Удалите `out/` и `node_modules/.vite/`
2. Переустановите зависимости: `rm -rf node_modules && npm install`
3. Проверьте на наличие ошибок TypeScript: `npm run typecheck`

## Оптимизация производительности

### Разработка

- Используйте React DevTools Profiler
- Отслеживайте частоту вызовов IPC
- Проверяйте производительность запросов к базе данных

### Production

- Включите production сборки
- Минимизируйте размер бандла
- Оптимизируйте запросы к базе данных
- Используйте индексы там, где это необходимо

## Качество кода

### TypeScript

- Нет типов `any`
- Нет небезопасных приведений типов
- Корректная обработка ошибок
- Вывод типов, где это возможно

### React

- Только функциональные Components
- Корректная типизация Props
- Лучшие практики использования хуков
- Нет инлайн-стилей

### База данных

- Используйте Drizzle ORM (без прямого SQL)
- Типобезопасные запросы
- Корректная обработка ошибок
- Поддержка транзакций, где это необходимо

## Переменные окружения

В настоящее время переменные окружения не требуются. Будущие добавления:

- `API_KEY` - Ключ внешнего API (при необходимости)
- `NODE_ENV` - Режим разработки/production
- `ELECTRON_RENDERER_URL` - URL dev-сервера (автоматически устанавливается electron-vite)

## Горячая замена модулей (HMR)

**Renderer Process:**

- ✅ Полностью поддерживается
- React Components перезагружаются "на лету" (hot-reload)
- Изменения CSS применяются мгновенно
- Vite dev-сервер обеспечивает мгновенные обновления

**Main Process:**

- ⚠️ Частично поддерживается
- Нет автоматического HMR - изменения требуют ручного перезапуска приложения
- `electron-vite` отслеживает файлы Main Process, но не перезапускает их автоматически
- **Обходное решение:** Используйте `nodemon` или аналогичный инструмент для автоматического перезапуска во время разработки
- **Текущий статус:** После изменений в Main Process требуется ручной перезапуск

## Production сборка

### Сборка

```bash
npm run build
```

Вывод в `out/`:

- `out/main/` - Main Process бандл
- `out/preload/` - Preload скрипт
- `out/renderer/` - Renderer бандл

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

- [Electron Documentation](https://www.electronjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Получение помощи

1. Проверьте существующую документацию в `docs/`
2. Изучите аналогичный код в кодовой базе
3. Проверьте проблемы (issues) на GitHub
4. Откройте новую проблему (issue) с подробностями
