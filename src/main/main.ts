import { app, BrowserWindow, dialog } from "electron";
import * as path from "path";
import { registerIpcHandlers } from "./ipc";
import Database from "better-sqlite3";
import { DbService } from "./db/db-service";
import { logger } from "./lib/logger";
import { runMigrations } from "./db/migrate";
import { updaterService } from "./services/updater-service";

logger.info("🚀 Application starting...");

let dbService: DbService;

// --- ИНИЦИАЛИЗАЦИЯ (CRITICAL SECTION) ---
try {
  // 1. Подключение к БД
  const DB_PATH = path.join(app.getPath("userData"), "metadata.db");
  const dbInstance = new Database(DB_PATH, {});
  dbService = new DbService(dbInstance);

  // 2. Регистрация IPC (API)
  registerIpcHandlers(dbService);

  // 3. Накатывание миграций
  runMigrations(dbService.db);
} catch (e) {
  // 🛑 FATAL ERROR HANDLING
  logger.error("FATAL: Failed to initialize database or services.", e);

  dialog.showErrorBox(
    "Application Startup Error",
    `Failed to initialize database or services.\nThe application will now quit.\n\nError: ${
      e instanceof Error ? e.message : String(e)
    }`
  );

  app.quit();
  process.exit(1);
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      // --- SECURITY ENFORCEMENT ---
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "../preload/bridge.cjs"),
      sandbox: true,
    },
  });

  // --- UPDATER INTEGRATION ---
  updaterService.setWindow(mainWindow);

  mainWindow.webContents.on("did-finish-load", () => {
    logger.info("Renderer loaded");
  });

  // Загрузка контента
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // --- SHOW WINDOW & CHECK UPDATES ---
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    updaterService.checkForUpdates();
  });
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
