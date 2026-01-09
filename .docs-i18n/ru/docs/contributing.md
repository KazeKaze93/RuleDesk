# Руководство по участию в проекте

## 📑 Содержание

- [Кодекс поведения](#code-of-conduct)
- [Принципы разработки](#development-principles)
- [Начало работы](#getting-started)
- [Процесс разработки](#development-workflow)
- [Стандарты кода](#code-standards)
- [Изменения в базе данных](#database-changes)
- [Тестирование](#testing)
- [Процесс Pull Request](#pull-request-process)
- [Структура проекта](#project-structure)
- [Общие задачи](#common-tasks)

---

Спасибо за ваш интерес к участию в разработке RuleDesk! Этот документ содержит рекомендации и инструкции по внесению вклада в проект.

**📖 Связанная документация:**
- [Руководство по разработке](./development.md) - Настройка и процессы разработки
- [Документация по архитектуре](./architecture.md) - Архитектура системы и паттерны проектирования
- [Документация по API](./api.md) - Справочник IPC API
- [Глоссарий](./glossary.md) - Ключевые термины и концепции

## Кодекс поведения

- Будьте уважительны и профессиональны
- Следуйте стандартам кодирования проекта
- Пишите чистый, поддерживаемый код
- Тестируйте свои изменения перед отправкой

## Принципы разработки

Этот проект придерживается строгих принципов разработки. Пожалуйста, ознакомьтесь с ними перед внесением вклада:

### KISS & YAGNI

- **KISS (Keep It Simple, Stupid):** Предпочитайте простые, читаемые решения
- **YAGNI (You Aren't Gonna Need It):** Реализуйте только то, что требуется сейчас

### SOLID & DRY

- **Единая ответственность:** Один Component/функция = одна задача
- **DRY (Don't Repeat Yourself):** Рефакторите дублирующийся код
- **Композиция вместо наследования:** Предпочитайте композицию в React

### Качество кода

- **TypeScript:** Строгая типизация, без `any` или небезопасных приведений типов
- **Явное лучше неявного:** Без магических чисел или строк
- **Fail Fast:** Проверяйте входные данные на границах
- **Обработка ошибок:** Правильная обработка ошибок, без "голых" `catch (e)`

## Начало работы

### Необходимые условия

- Node.js v18 или выше
- npm или yarn
- Git

### Настройка

1.  **Форк и клонирование**

    ```bash
    git clone https://github.com/KazeKaze93/ruledesk.git
    cd ruledesk
    ```

2.  **Установка зависимостей**

    ```bash
    npm install
    ```

3.  **Запуск в режиме разработки**

    ```bash
    npm run dev
    ```

4.  **Запуск проверки типов**

    ```bash
    npm run typecheck
    ```

5.  **Запуск линтера**
    ```bash
    npm run lint
    ```

## Процесс разработки

### Стратегия ветвления

- Создавайте функциональную ветку из `master`
- Используйте описательные имена веток: `feature/add-download-manager`, `fix/artist-validation`

### Внесение изменений

1.  **Создайте ветку**

    ```bash
    git checkout -b feature/your-feature-name
    ```

2.  **Внесите свои изменения**

    - Следуйте стандартам кодирования
    - Пишите чистый, самодокументируемый код
    - Добавляйте комментарии там, где это необходимо

3.  **Протестируйте свои изменения**

    - Запустите приложение: `npm run dev`
    - Проверьте наличие ошибок TypeScript: `npm run typecheck`
    - Запустите линтер: `npm run lint`

4.  **Закоммитьте свои изменения**
    ```bash
    git add .
    git commit -m "feat: add download manager"
    ```

### Формат сообщения коммита

Следуйте Conventional Commits:

- `feat:` - Новая функция
- `fix:` - Исправление ошибки
- `docs:` - Изменения в документации
- `style:` - Изменения стиля кода (форматирование)
- `refactor:` - Рефакторинг кода
- `test:` - Добавление тестов
- `chore:` - Задачи по обслуживанию

**Пример:**

```
feat: add artist deletion functionality

- Add deleteArtist method to DbService
- Add delete button to artist list UI
- Add confirmation dialog before deletion
```

## Стандарты кода

### TypeScript

-   **Без типов `any`:** Используйте правильные типы или `unknown`
-   **Без небезопасных приведений типов:** Избегайте `as`, если это не абсолютно необходимо
-   **Строгий режим:** Весь код должен проходить `tsc --noEmit`
-   **Вывод типов:** Предпочитайте вывод типов, где это возможно

**Хорошо:**

```typescript
const artists: Artist[] = await dbService.getTrackedArtists();
```

**Плохо:**

```typescript
const artists: any = await dbService.getTrackedArtists();
```

### React

-   **Функциональные Components:** Используйте функциональные Components, а не классы
-   **Hooks:** Предпочитайте хуки методам жизненного цикла
-   **Типы Props:** Всегда типизируйте Props Component'ов
-   **Без инлайн-стилей:** Используйте классы Tailwind CSS

**Хорошо:**

```typescript
interface ArtistCardProps {
  artist: Artist;
  onDelete: (id: number) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onDelete }) => {
  return <div className="p-4">{artist.name}</div>;
};
```

**Плохо:**

```typescript
export const ArtistCard = ({ artist, onDelete }: any) => {
  return <div style={{ padding: "16px" }}>{artist.name}</div>;
};
```

### Обработка ошибок

-   **Никогда не используйте "голый" catch:** Всегда обрабатывайте ошибки должным образом
-   **Описательные ошибки:** Предоставляйте содержательные сообщения об ошибках
-   **Логирование ошибок:** Используйте логгер для отслеживания ошибок

**Хорошо:**

```typescript
try {
  const result = await dbService.addArtist(data);
  return result;
} catch (error) {
  logger.error("Failed to add artist:", error);
  if (error instanceof Error) {
    throw new Error(`Failed to add artist: ${error.message}`);
  }
  throw error;
}
```

**Плохо:**

```typescript
try {
  return await dbService.addArtist(data);
} catch (e) {
  // ...
}
```

### База данных

-   **Используйте Drizzle ORM:** Никогда не пишите сырой SQL, если это не необходимо
-   **Безопасность типов:** Используйте выведенные типы из схемы
-   **Миграции:** Всегда создавайте миграции для изменений схемы

**Хорошо:**

```typescript
const artists = await db.query.artists.findMany({
  where: eq(schema.artists.id, artistId),
});
```

**Плохо:**

```typescript
const artists = db.prepare("SELECT * FROM artists WHERE id = ?").all(artistId);
```

## Изменения в базе данных

### Создание миграций

1.  **Измените схему** (`src/main/db/schema.ts`)

2.  **Сгенерируйте миграцию**

    ```bash
    npm run db:generate
    ```

3.  **Просмотрите миграцию** (в папке `drizzle/`)

4.  **Протестируйте миграцию**
    ```bash
    npm run db:migrate
    ```

## Тестирование

### Ручное тестирование

-   Тестируйте все новые функции вручную
-   Проверяйте обработку ошибок
-   Проверяйте адаптивность UI
-   Тестируйте на разных размерах экрана

### Автоматизированное тестирование

(Будет реализовано)

## Процесс Pull Request

1.  **Обновите документацию**

    - Обновите соответствующие файлы документации
    - Добавьте примеры, если вводите новые функции

2.  **Обновите README**

    - Если добавляете новые функции, обновите README
    - Сохраняйте README лаконичным

3.  **Создайте Pull Request**

    - Предоставьте четкое описание
    - Ссылайтесь на любые связанные проблемы
    - Включите скриншоты для изменений UI

4.  **Процесс ревью**
    - Устраните замечания ревьюеров
    - Сохраняйте коммиты атомарными (одно логическое изменение на коммит)
    - Объединяйте коммиты (squash), если это требуется

## Структура проекта

### Ключевые каталоги

-   `src/main/` - Код Electron Main Process
-   `src/renderer/` - Код React Renderer Process
-   `src/main/db/` - Схема базы данных и сервисы
-   `docs/` - Файлы документации
-   `drizzle/` - Миграции базы данных

### Именование файлов

-   **Components:** PascalCase (`ArtistCard.tsx`)
-   **Утилиты:** camelCase (`utils.ts`)
-   **Типы:** PascalCase (`types.ts`)
-   **Сервисы:** PascalCase (`DbService.ts`)

## Общие задачи

### Добавление нового IPC-метода

1.  **Добавьте константу канала** (`src/main/ipc/channels.ts`)

    ```typescript
    export const IPC_CHANNELS = {
      APP: {
        // ... existing channels
        NEW_METHOD: "app:new-method",
      },
    } as const;
    ```

2.  **Определите в Bridge** (`src/main/bridge.ts`)

    ```typescript
    export interface IpcBridge {
      // ... existing methods
      newMethod: () => Promise<ReturnType>;
    }
    ```

3.  **Реализуйте в Bridge**

    ```typescript
    const ipcBridge: IpcBridge = {
      // ... existing methods
      newMethod: () => ipcRenderer.invoke(IPC_CHANNELS.APP.NEW_METHOD),
    };
    ```

4.  **Добавьте обработчик в Controller** (`src/main/ipc/controllers/` - добавьте в соответствующий контроллер или создайте новый)

    ```typescript
    export class MyController extends BaseController {
      setup() {
        this.handle(
          IPC_CHANNELS.APP.NEW_METHOD,
          NewMethodSchema, // Zod schema
          this.newMethod.bind(this)
        );
      }

      private async newMethod(
        _event: IpcMainInvokeEvent,
        data: NewMethodRequest
      ) {
        const db = container.resolve(DI_TOKENS.DB);
        // Implementation
      }
    }
    ```

5.  **Зарегистрируйте Controller** (`src/main/ipc/index.ts` - в функции `setupIpc()`)

    ```typescript
    const myController = new MyController();
    myController.setup();
    ```

6.  **Обновите типы** (`src/renderer.d.ts`)
    ```typescript
    export interface IpcApi {
      // ... existing methods
      newMethod: () => Promise<ReturnType>;
    }
    ```

### Добавление новой таблицы базы данных

1.  **Добавьте схему** (`src/main/db/schema.ts`)
2.  **Сгенерируйте миграцию** (`npm run db:generate`)
3.  **Просмотрите миграцию** (проверьте сгенерированный SQL в папке `drizzle/`)
4.  **Протестируйте миграцию** (`npm run db:migrate`)
5.  **Обновите документацию** (`docs/database.md` - добавьте документацию по таблице)

## Вопросы?

Если у вас есть вопросы по участию:

1.  Проверьте существующую документацию
2.  Просмотрите похожий код в кодовой базе
3.  Откройте Issue для обсуждения

## Лицензия

Внося свой вклад, вы соглашаетесь с тем, что ваши материалы будут лицензированы по лицензии MIT License.