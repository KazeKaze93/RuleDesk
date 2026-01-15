# Индекс документации

Добро пожаловать в документацию RuleDesk. Этот индекс представляет собой структурированное руководство по навигации по всем ресурсам документации.

## 📚 Структура документации

### Начало работы

**Начните отсюда, если вы новичок в RuleDesk:**

1.  **[README.md](../README.md)** - Основная точка входа с обзором, функциями и руководством по быстрому старту
2.  **[Glossary](./glossary.md)** - Ключевые термины и концепции, используемые в документации

### Руководства пользователя

**Для конечных пользователей:**

-   **[Руководство пользователя](./user-guide.md)** - Полное руководство для конечных пользователей (начните отсюда!)
    -   [Установка](./user-guide.md#installation) - Как установить RuleDesk
    -   [Первый запуск](./user-guide.md#first-launch) - Начало работы
    -   [Основное использование](./user-guide.md#basic-usage) - Добавление артистов, синхронизация, просмотр постов
    -   [Функции](./user-guide.md#features) - Поиск, избранное, загрузки, фильтры
    -   [Устранение неполадок](./user-guide.md#troubleshooting) - Распространенные проблемы и их решения
-   **[README.md - Быстрый старт](../README.md#-quick-start)** - Краткий справочник для разработчиков
-   **[README.md - Функции](../README.md#-features)** - Полный список функций

### Документация для разработчиков

**Для контрибьюторов и разработчиков:**

#### Архитектура и дизайн

-   **[Документация по архитектуре](./architecture.md)** - Архитектура системы, паттерны проектирования и структура Components
    -   [Разделение процессов](./architecture.md#process-separation) - Main Process vs Renderer Process
    -   [Архитектура безопасности](./architecture.md#security-architecture) - Уровни безопасности и изоляция контекста
    -   [Поток данных](./architecture.md#data-flow) - Потоки чтения, записи и синхронизации
    -   [Архитектура Components](./architecture.md#component-architecture) - Иерархия React Components

#### Справочник по API

-   **[Документация по API](./api.md)** - Полный справочник по API IPC
    -   [Интерфейс IPC Bridge](./api.md#ipc-bridge-interface) - Определения типов
    -   [Методы API](./api.md#api-methods) - Все доступные методы IPC
    -   [Слушатели событий](./api.md#event-listeners) - Подписки на события в реальном времени
    -   [Обработка ошибок](./api.md#error-handling) - Паттерны обработки ошибок

#### База данных

-   **[Документация по базе данных](./database.md)** - Схема базы данных, операции и лучшие практики
    -   [Схема](./database.md#schema) - Определения таблиц и взаимосвязи
    -   [Архитектура базы данных](./database.md#database-architecture) - Клиентская архитектура и инициализация
    -   [Миграции](./database.md#migrations) - Генерация и выполнение миграций
    -   [Резервное копирование и восстановление](./database.md#backup-and-recovery) - Процедуры резервного копирования/восстановления

#### Разработка

-   **[Руководство по разработке](./development.md)** - Настройка разработки, процесс сборки и рабочие процессы
    -   [Начальная настройка](./development.md#initial-setup) - Предварительные условия и установка
    -   [Скрипты разработки](./development.md#development-scripts) - Доступные npm-скрипты
    -   [Рабочий процесс разработки](./development.md#development-workflow) - Внесение изменений и добавление функций
    -   [Отладка](./development.md#debugging) - Методы отладки

#### Вклад в разработку

-   **[Руководство по внесению вклада](./contributing.md)** - Рекомендации для контрибьюторов
    -   [Принципы разработки](./contributing.md#development-principles) - KISS, YAGNI, SOLID, DRY
    -   [Стандарты кода](./contributing.md#code-standards) - TypeScript, React, обработка ошибок
    -   [Процесс Pull Request](./contributing.md#pull-request-process) - Рекомендации по PR

### Справочник по внешнему API

-   **[Справочник по Rule34 API](./rule34-api-reference.md)** - Неофициальная документация по API Rule34.xxx
    -   [API Keys](./rule34-api-reference.md#api-keys) - Запрос и управление API-ключами
    -   [Эндпоинты](./rule34-api-reference.md#endpoints) - Доступные API-эндпоинты
    -   [Лучшие практики](./rule34-api-reference.md#best-practices-and-cautions) - Ограничение скорости запросов, кеширование, безопасность

### Планирование и дорожная карта

-   **[Дорожная карта](./roadmap.md)** - Дорожная карта разработки и запланированные функции
    -   [Актуальная дорожная карта](./roadmap.md#-active-roadmap-priority-tasks) - Текущие приоритетные задачи
    -   [Этапы](./roadmap.md#-milestones) - MVP и будущие фазы
    -   [Технические улучшения](./roadmap.md#-technical-improvements-from-audit) - Запланированные технические улучшения

---

## 🗺️ Руководство по навигации

### По роли

#### Я пользователь
1.  Начните с [README.md](../README.md) для обзора и быстрого старта
2.  Проверьте [Glossary](./glossary.md) на наличие незнакомых терминов
3.  Прочитайте [README.md - Настройки](../README.md#-settings) для конфигурации
4.  См. [README.md - Синхронизация и фон](../README.md#-sync--background) для синхронизации

#### Я разработчик
1.  Прочитайте [Руководство по разработке](./development.md) для настройки
2.  Изучите [Документацию по архитектуре](./architecture.md) для проектирования системы
3.  Обратитесь к [Документации по API](./api.md) для методов IPC
4.  Ознакомьтесь с [Документацией по базе данных](./database.md) для схемы и операций
5.  Следуйте [Руководству по внесению вклада](./contributing.md) для стандартов кода

#### Я вношу вклад
1.  Прочитайте [Руководство по внесению вклада](./contributing.md) для рекомендаций
2.  Ознакомьтесь с [Руководством по разработке](./development.md) для рабочих процессов
3.  Проверьте [Дорожную карту](./roadmap.md) на наличие запланированных функций
4.  Изучите [Документацию по архитектуре](./architecture.md) для паттернов проектирования

### По темам

#### Понимание системы
-   [Обзор архитектуры](./architecture.md#overview) - Высокоуровневое проектирование системы
-   [Разделение процессов](./architecture.md#process-separation) - Main Process vs Renderer Process
-   [Архитектура безопасности](./architecture.md#security-architecture) - Уровни безопасности
-   [Архитектура базы данных](./database.md#database-architecture) - Проектирование базы данных

#### Работа с кодом
-   [Настройка разработки](./development.md#initial-setup) - Начало работы
-   [Структура проекта](./development.md#project-structure) - Организация кода
-   [Добавление функций](./development.md#2-adding-new-features) - Разработка функций
-   [Стандарты кода](./contributing.md#code-standards) - Руководство по кодированию

#### Использование API
-   [Интерфейс IPC Bridge](./api.md#ipc-bridge-interface) - Определения типов
-   [Методы API](./api.md#api-methods) - Доступные методы
-   [Слушатели событий](./api.md#event-listeners) - События в реальном времени
-   [Обработка ошибок](./api.md#error-handling) - Паттерны ошибок

#### Операции с базой данных
-   [Схема](./database.md#schema) - Определения таблиц
-   [Доступные методы](./database.md#available-methods-via-drizzle-orm) - Примеры запросов
-   [Миграции](./database.md#migrations) - Изменения схемы
-   [Резервное копирование и восстановление](./database.md#backup-and-recovery) - Защита данных

---

## 🔗 Быстрые ссылки

### Основные материалы для чтения
-   [Руководство по быстрому старту](../README.md#-quick-start) - Начните работу за 5 минут
-   [Обзор архитектуры](./architecture.md#overview) - Понимание системы
-   [Справочник по API](./api.md) - Полная документация по API IPC
-   [Glossary](./glossary.md) - Ключевые термины и концепции

### Общие задачи
-   [Добавление метода IPC](./contributing.md#adding-a-new-ipc-method) - Расширение API IPC
-   [Добавление таблицы базы данных](./contributing.md#adding-a-new-database-table) - Изменения схемы
-   [Создание миграций](./development.md#database-scripts) - Миграции базы данных
-   [Отладка](./development.md#debugging) - Методы отладки

### Справочник
-   [Определения типов](./api.md#type-definitions) - Интерфейсы TypeScript
-   [Схема базы данных](./database.md#schema) - Структуры таблиц
-   [Каналы IPC](./api.md#implementation-details) - Константы каналов
-   [Внешний API](./rule34-api-reference.md) - Справочник по API Rule34.xxx

---

## 📖 Взаимосвязи документов

```
README.md (Entry Point)
├── Quick Start → Development Guide
├── Features → Glossary
├── Architecture → Architecture Documentation
└── Documentation → This Index

Architecture Documentation
├── Security → Contributing Guide (Security section)
├── Database → Database Documentation
└── IPC → API Documentation

API Documentation
├── Implementation → Architecture Documentation
└── External API → Rule34 API Reference

Database Documentation
├── Schema → Architecture Documentation
└── Migrations → Development Guide

Development Guide
├── Setup → Contributing Guide
└── Workflow → Architecture Documentation

Contributing Guide
└── Standards → Development Guide

Roadmap
└── All documents (references features and improvements)
```

---

## 🆘 Нужна помощь?

1.  **Проверьте Glossary** - [Glossary](./glossary.md) определяет все ключевые термины
2.  **Ищите в документации** - Используйте поиск вашего редактора, чтобы найти конкретные темы
3.  **Изучите примеры** - Каждый документ содержит примеры кода
4.  **Проверьте дорожную карту** - [Roadmap](./roadmap.md) показывает запланированные функции и улучшения

---

## 📝 Поддержание документации

Эта документация поддерживается вместе с кодовой базой. При внесении изменений:

1.  **Обновляйте соответствующие документы** - Синхронизируйте документацию с изменениями в коде
2.  **Добавляйте перекрестные ссылки** - Связывайте связанные разделы с помощью markdown-ссылок
3.  **Обновляйте Glossary** - Добавляйте новые термины в [Glossary](./glossary.md)
4.  **Проверяйте ссылки** - Убедитесь, что все внутренние ссылки работают правильно

---

**Последнее обновление:** См. историю git для последних изменений.