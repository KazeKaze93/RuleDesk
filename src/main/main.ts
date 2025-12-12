// src/main/main.ts

import { app, BrowserWindow } from "electron";
import * as path from "path";
import { registerIpcHandlers } from "./ipc";
import Database from "better-sqlite3";
import { DbService } from "./db/db-service";
import { logger } from "./lib/logger";
import { runMigrations } from "./db/migrate";

logger.info("🚀 Application starting...");

// --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ И СЕРВИСОВ ---
const DB_PATH = path.join(app.getPath("userData"), "metadata.db");
// Используем app.getPath('userData') для надежного хранения файла БД
const dbInstance = new Database(DB_PATH);
const dbService = new DbService(dbInstance);

// --- КРИТИЧЕСКИЙ ШАГ: Регистрация всех IPC хендлеров ---
registerIpcHandlers(dbService);

// --- Запуск миграций ---
try {
  runMigrations(dbService.db);
} catch (e) {
  logger.error("Failed to run migrations. App will quit.", e);
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      // --- SECURITY ENFORCEMENT ---
      // 1. Context Isolation: ОБЯЗАТЕЛЬНО для безопасности.
      contextIsolation: true,
      // 2. Node Integration: НИКОГДА не должно быть true в Renderer.
      nodeIntegration: false,
      // 3. Preload Script: Указываем путь к нашему безопасному мосту
      preload: path.join(__dirname, "../preload/bridge.cjs"),
      sandbox: true,
    },
  });

  mainWindow.webContents.on("did-finish-load", () => {
    logger.info("Renderer loaded");
  });

  // ... обработка ошибок БД ...
  try {
    // db init
  } catch (e) {
    logger.error("Database init failed:", e);
    app.quit();
  }

  // Загрузка UI (Renderer)
  if (process.env["ELECTRON_RENDERER_URL"]) {
    // Режим разработки (HMR)
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    // Production (Собранный файл)
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

// --- Жизненный цикл Electron ---
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
