import { app, BrowserWindow, dialog } from "electron";
import * as path from "path";
import { registerIpcHandlers } from "./ipc";
import { DbWorkerClient } from "./db/db-worker-client";
import { logger } from "./lib/logger";
import { updaterService } from "./services/updater-service";
import { syncService } from "./services/sync-service";

logger.info("🚀 Application starting...");

let dbWorkerClient: DbWorkerClient | null = null; // Делаем null, пока не инициализируем
let mainWindow: BrowserWindow | null = null;
let DB_PATH: string;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.warn("Another instance is already running. Quitting...");
  app.quit();
} else {
  app.on("second-instance", () => {
    logger.info("Second instance detected. Focusing main window...");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // 🛑 ФИКС: Вызываем initializeAppAndWindow только после того, как Electron готов.
  app.on("ready", initializeAppAndWindow);
}

// 🛑 УДАЛЕНА: Старая функция initializeAppAndReady (ее логика перенесена ниже)

/**
 * Асинхронная функция, которая запускается после app.ready.
 * Отвечает за инициализацию Worker и создание главного окна.
 */
async function initializeAppAndWindow() {
  try {
    DB_PATH = path.join(app.getPath("userData"), "metadata.db");

    // === 1. АСИНХРОННАЯ ИНИЦИАЛИЗАЦИЯ DB WORKER ===
    // Блокировка здесь безопасна, так как Electron уже готов.
    dbWorkerClient = await DbWorkerClient.initialize(DB_PATH);
    logger.info("✅ Main: DB Worker Client initialized and ready.");

    // === 2. Инициализация сервисов и создание окна ===
    syncService.setDbWorkerClient(dbWorkerClient);

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
        // Обязательная мера безопасности
        sandbox: true,
      },
    });

    // Устанавливаем окно для синглтонов
    updaterService.setWindow(mainWindow);
    syncService.setWindow(mainWindow);

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
      // 🛑 ФИКС 1: Захватываем инстансы, проверенные на null
      const workerClient = dbWorkerClient;
      const window = mainWindow;

      if (window && workerClient) {
        window.show();
        updaterService.checkForUpdates();

        registerIpcHandlers(workerClient, syncService, updaterService, window);

        // ⚡ DEFERRED DATABASE MAINTENANCE
        setTimeout(() => {
          logger.info("Main: Starting deferred background DB maintenance...");

          // 🛑 ФИКС: Используем единый RPC-вызов для отложенного обслуживания
          // workerClient - это локальная переменная, захваченная из замыкания
          workerClient
            .call("runDeferredMaintenance", {})
            .then(() => {
              logger.info("✅ Main: DB maintenance complete.");
            })
            .catch((err) => {
              logger.error("❌ Main: DB maintenance failed", err);
            });
        }, 3000);
      }
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (e) {
    logger.error("FATAL: Failed to initialize application or database.", e);
    dialog.showErrorBox(
      "Fatal Error",
      `App initialization failed:\n${
        e instanceof Error ? e.message : String(e)
      }`
    );
    app.exit(1);
  }
}

// 🛑 ФИКС: Удаляем старую createWindow (ее логика теперь в initializeAppAndWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // В этом случае вызываем initializeAppAndWindow, который создаст окно
    initializeAppAndWindow();
  }
});

/**
 * Restore database from backup file
 */
export async function restoreDatabase(backupPath: string): Promise<void> {
  // 🛑 ФИКС: Теперь dbWorkerClient может быть null, проверяем.
  if (!dbWorkerClient || !mainWindow) {
    throw new Error("DB Worker Client or Main Window is not initialized.");
  }

  try {
    logger.info(`Main: Starting database restore from ${backupPath}`);
    await dbWorkerClient.restore(backupPath);
    logger.info("Main: Database restore completed successfully");

    if (mainWindow) {
      mainWindow.webContents.send("db:restored-success");
    }
  } catch (error: unknown) {
    logger.error("Main: Database restore failed", error);

    if (mainWindow) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      mainWindow.webContents.send("db:restored-error", errorMessage);
    }
    throw error;
  }
}
