# Руководство по участию

## 📑 Оглавление

- [Кодекс поведения](#code-of-conduct)
- [Принципы разработки](#development-principles)
- [Начало работы](#getting-started)
- [Рабочий процесс разработки](#development-workflow)
- [Стандарты кода](#code-standards)
- [Изменения в базе данных](#database-changes)
- [Тестирование](#testing)
- [Процесс обработки Pull Request](#pull-request-process)
- [Структура проекта](#project-structure)
- [Часто выполняемые задачи](#common-tasks)

---

Благодарим за интерес к участию в развитии RuleDesk! Этот документ содержит рекомендации и инструкции для контрибьюторов.

**📖 Связанная документация:**

- [Руководство по разработке](./development.md) - Настройка и рабочие процессы разработки
- [Архитектурная документация](./architecture.md) - Архитектура системы и шаблоны проектирования
- [Документация API](./api.md) - Справочник по IPC API
- [Глоссарий](./glossary.md) - Ключевые термины и концепции

## Кодекс поведения

- Будьте уважительны и профессиональны
- Соблюдайте стандарты кодирования проекта
- Пишите чистый, поддерживаемый код
- Тестируйте свои изменения перед отправкой

## Принципы разработки

Проект придерживается строгих принципов разработки. Пожалуйста, ознакомьтесь с ними перед тем, как вносить свой вклад:

### KISS и YAGNI

- **KISS (Keep It Simple, Stupid):** Предпочитайте простые, читаемые решения
- **YAGNI (You Aren't Gonna Need It):** Реализуйте только то, что требуется сейчас

### SOLID и DRY

- **Single Responsibility:** Один Component/функция = одна задача
- **DRY (Don't Repeat Yourself):** Рефакторинг дублирующегося кода
- **Composition over Inheritance:** Предпочитайте композицию в React

### Качество кода

- **TypeScript:** Строгая типизация, без `any` или небезопасных приведений типов
- **Explicit over Implicit:** Явное лучше неявного; без «магических» чисел или строк
- **Fail Fast:** Валидация входных данных на границах
- **Error Handling:** Надлежащая обработка ошибок, без пустого `catch (e)`

## Начало работы

### Предварительные требования

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

## Рабочий процесс разработки

### Стратегия ветвления

- Создавайте функциональную ветку из `master`
- Используйте описательные имена веток: `feature/add-download-manager`, `fix/artist-validation`

### Внесение изменений

1.  **Создание ветки**

    ```bash
    git checkout -b feature/your-feature-name
    ```

2.  **Внесение изменений**

    - Соблюдайте стандарты кодирования
    - Пишите понятный, самодокументируемый код
    - Добавляйте комментарии там, где это необходимо

3.  **Тестирование изменений**

    - Запустите приложение: `npm run dev`
    - Проверьте наличие ошибок TypeScript: `npm run typecheck`
    - Запустите линтер: `npm run lint`

4.  **Фиксация изменений**
    ```bash
    git add .
    git commit -m "feat: add download manager"
    ```

### Формат сообщения коммита

Следуйте соглашениям о коммитах (conventional commits):

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

- **Без типов `any`:** Используйте правильные типы или `unknown`
- **Без небезопасных приведений:** Избегайте `as`, если это абсолютно не необходимо
- **Строгий режим:** Весь код должен проходить проверку `tsc --noEmit`
- **Вывод типов:** Предпочитайте вывод типов, где это возможно

**Хорошо:**

```typescript
const artists: Artist[] = await dbService.getTrackedArtists();
```

**Плохо:**

```typescript
const artists: any = await dbService.getTrackedArtists();
```

### React

- **Функциональные Components:** Используйте функциональные Components, а не классы
- **Хуки:** Предпочитайте хуки методам жизненного цикла
- **Типы Props:** Всегда типизируйте Props Component-ов
- **Без инлайн-стилей:** Используйте классы Tailwind CSS

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

- **Никогда не используйте пустой catch:** Всегда правильно обрабатывайте ошибки
- **Описательные ошибки:** Предоставляйте содержательные сообщения об ошибках
- **Логирование ошибок:** Используйте логгер для отслеживания ошибок

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

- **Используйте Drizzle ORM:** Никогда не пишите чистый SQL, если это не необходимо
- **Типобезопасность:** Используйте выведенные типы из схемы
- **Миграции:** Всегда создавайте миграции для изменений схемы

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

1.  **Изменение схемы** (`src/main/db/schema.ts`)

2.  **Генерация миграции**

    ```bash
    npm run db:generate
    ```

3.  **Просмотр миграции** (в папке `drizzle/`)

    - SQL-файлы миграций (`drizzle/*.sql`) отслеживаются в git
    - Метафайлы (`drizzle/meta/`) игнорируются git и генерируются локально

4.  **Тестирование миграции**
    ```bash
    npm run db:migrate
    ```

## Тестирование

### Ручное тестирование

- Протестируйте все новые функции вручную
- Проверьте обработку ошибок
- Проверьте адаптивность пользовательского интерфейса
- Протестируйте на разных размерах экрана

### Автоматизированное тестирование

(Будет реализовано)

## Процесс обработки Pull Request

1.  **Обновление документации**

    - Обновите соответствующие файлы документации
    - Добавьте примеры, если вводятся новые функции

2.  **Обновление README**

    - При добавлении новых функций обновите README
    - Сохраняйте README лаконичным

3.  **Создание Pull Request**

    - Предоставьте чёткое описание
    - Ссылайтесь на связанные проблемы
    - Включите скриншоты для изменений пользовательского интерфейса

4.  **Процесс рецензирования**
    - Устраните замечания рецензентов
    - Сохраняйте коммиты атомарными (одно логическое изменение на коммит)
    - Сквошируйте коммиты, если требуется

## Структура проекта

### Ключевые директории

- `src/main/` - Код Electron Main Process
- `src/renderer/` - Код React Renderer Process
- `src/main/db/` - Схема базы данных и сервисы
- `docs/` - Файлы документации
- `drizzle/` - Миграции базы данных

### Именование файлов

- **Components:** PascalCase (`ArtistCard.tsx`)
- **Утилиты:** camelCase (`utils.ts`)
- **Типы:** PascalCase (`types.ts`)
- **Сервисы:** PascalCase (`DbService.ts`)

## Часто выполняемые задачи

### Добавление нового IPC метода

1.  **Добавление константы канала** (`src/main/ipc/channels.ts`)

    ```typescript
    export const IPC_CHANNELS = {
      APP: {
        // ... existing channels
        NEW_METHOD: "app:new-method",
      },
    } as const;
    ```

2.  **Определение в Bridge** (`src/main/bridge.ts`)

    ```typescript
    export interface IpcBridge {
      // ... existing methods
      newMethod: () => Promise<ReturnType>;
    }
    ```

3.  **Реализация в Bridge**

    ```typescript
    const ipcBridge: IpcBridge = {
      // ... existing methods
      newMethod: () => ipcRenderer.invoke(IPC_CHANNELS.APP.NEW_METHOD),
    };
    ```

4.  **Добавление обработчика в Контроллер** (`src/main/ipc/controllers/` - добавьте в соответствующий контроллер или создайте новый)

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

5.  **Регистрация Контроллера** (`src/main/ipc/index.ts` - в функции `setupIpc()`)

    ```typescript
    const myController = new MyController();
    myController.setup();
    ```

6.  **Обновление типов** (`src/renderer.d.ts`)
    ```typescript
    export interface IpcApi {
      // ... existing methods
      newMethod: () => Promise<ReturnType>;
    }
    ```

### Добавление новой таблицы базы данных

1.  **Добавление схемы** (`src/main/db/schema.ts`)
2.  **Генерация миграции** (`npm run db:generate`)
3.  **Просмотр миграции** (проверьте сгенерированный SQL в файлах `drizzle/*.sql` - они отслеживаются в git)
4.  **Тестирование миграции** (`npm run db:migrate`)
5.  **Обновление документации** (`docs/database.md` - добавьте документацию по таблице)

**Примечание:** Коммититься должны только SQL-файлы миграций (`drizzle/*.sql`). Метафайлы в `drizzle/meta/` автоматически игнорируются git.

## Вопросы?

Если у вас есть вопросы по участию:

1.  Проверьте существующую документацию
2.  Изучите аналогичный код в кодовой базе
3.  Откройте issue для обсуждения

## Лицензия

Внося свой вклад, вы соглашаетесь с тем, что ваши изменения будут лицензированы под лицензией MIT.