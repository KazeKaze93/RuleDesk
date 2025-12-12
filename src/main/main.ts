import { app, BrowserWindow, dialog } from "electron";
import * as path from "path";
import { registerIpcHandlers } from "./ipc";
import Database from "better-sqlite3";
import { DbService } from "./db/db-service";
import { logger } from "./lib/logger";
import { runMigrations } from "./db/migrate";
import { updaterService } from "./services/updater-service";

logger.info("🚀 Application starting...");

// Глобальные ссылки
let dbService: DbService;
let mainWindow: BrowserWindow | null = null;

// --- SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.warn("Another instance is already running. Quitting...");
  app.quit();
} else {
  // Если мы - первый экземпляр, вешаем обработчик на попытку запуска второго
  app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
    logger.info("Second instance detected. Focusing main window...");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Инициализация БД и старт
  initializeAppAndReady();
}

function initializeAppAndReady() {
  try {
    const DB_PATH = path.join(app.getPath("userData"), "metadata.db");
    const dbInstance = new Database(DB_PATH, {});
    dbService = new DbService(dbInstance);

    registerIpcHandlers(dbService);
    runMigrations(dbService.db);
  } catch (e) {
    logger.error("FATAL: Failed to initialize database.", e);
    dialog.showErrorBox(
      "Startup Error",
      `Failed to initialize.\n\n${e instanceof Error ? e.message : String(e)}`
    );
    app.quit();
    process.exit(1);
  }

  // Запуск окна только когда Electron готов
  app.on("ready", createWindow);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "../preload/bridge.cjs"),
      sandbox: true,
    },
  });

  updaterService.setWindow(mainWindow);

  mainWindow.webContents.on("did-finish-load", () => {
    logger.info("Renderer loaded");
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) mainWindow.show();
    // Проверка обновлений
    updaterService.checkForUpdates();
  });

  // Очистка ссылки при закрытии
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Стандартные обработчики закрытия
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
