import { app, BrowserWindow, dialog } from "electron";
import path from "path";
import { mkdirSync } from "fs";

// === PORTABLE MODE LOGIC ===
if (app.isPackaged) {
  const portableDataPath = path.join(path.dirname(process.execPath), "data");

  try {
    mkdirSync(portableDataPath, { recursive: true });

    app.setPath("userData", portableDataPath);

    console.log(`PORTABLE MODE: Active. Path: ${portableDataPath}`);
  } catch (e) {
    console.error(
      "PORTABLE MODE: Failed to init data folder. Fallback to default.",
      e
    );
  }
}

import { promises as fs } from "fs";
import { registerAllHandlers } from "./ipc/index";
import { DbWorkerClient } from "./db/db-worker-client";
import { initializeDatabase } from "./db";
import { logger } from "./lib/logger";
import { updaterService } from "./services/updater-service";
import { syncService } from "./services/sync-service";

logger.info("🚀 Application starting...");

async function migrateUserData() {
  try {
    const oldUserDataPath = path.join(
      app.getPath("appData"),
      "NSFW Booru Client"
    );
    const newUserDataPath = path.join(app.getPath("appData"), "RuleDesk");

    try {
      await fs.access(oldUserDataPath);
      const oldFolderExists = true;

      let newFolderExists = false;
      try {
        await fs.access(newUserDataPath);
        newFolderExists = true;
      } catch {
        // New folder doesn't exist, which is what we want
      }

      if (oldFolderExists && !newFolderExists) {
        // Create new folder
        await fs.mkdir(newUserDataPath, { recursive: true });
        logger.info(`Created new user data folder: ${newUserDataPath}`);

        const oldDbPath = path.join(oldUserDataPath, "metadata.db");
        const newDbPath = path.join(newUserDataPath, "metadata.db");

        try {
          await fs.access(oldDbPath);
          await fs.copyFile(oldDbPath, newDbPath);
          logger.info(`Migrated metadata.db from ${oldDbPath} to ${newDbPath}`);
        } catch (_err) {
          logger.info(
            "No metadata.db found in old user data folder, skipping migration"
          );
        }
      }
    } catch (_err) {
      logger.info("Old user data folder not found, skipping migration");
    }
  } catch (err) {
    logger.error("Error during user data migration:", err);
  }
}

// Run migration before app is ready
migrateUserData();

process.env.USER_DATA_PATH = app.getPath("userData");

let dbWorkerClient: DbWorkerClient | null = null;
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

  app.on("ready", initializeAppAndWindow);
}

function getMigrationsPath(): string {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return path.join(process.cwd(), "drizzle");
  }

  return path.join(process.resourcesPath, "drizzle");
}

/**
 * Асинхронная функция, которая запускается после app.ready.
 * Отвечает за инициализацию Worker и создание главного окна.
 */
async function initializeAppAndWindow() {
  try {
    DB_PATH = path.join(app.getPath("userData"), "metadata.db");

    const MIGRATIONS_PATH = getMigrationsPath();
    logger.info(`Main: Migrations Path: ${MIGRATIONS_PATH}`);

    // === 1. АСИНХРОННАЯ ИНИЦИАЛИЗАЦИЯ DB WORKER ===
    // Блокировка здесь безопасна, так как Electron уже готов.
    dbWorkerClient = await DbWorkerClient.initialize(DB_PATH, MIGRATIONS_PATH);
    logger.info("✅ Main: DB Worker Client initialized and ready.");

    // === 1.5. ИНИЦИАЛИЗАЦИЯ ПРЯМОГО DB ИНСТАНСА ===
    const db = initializeDatabase(DB_PATH);
    logger.info("✅ Main: Direct DB instance initialized and ready.");

    // === 2. Инициализация сервисов и создание окна ===
    syncService.setDbWorkerClient(dbWorkerClient);

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      title: "RuleDesk",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "../preload/bridge.cjs"),
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
      const workerClient = dbWorkerClient;
      const window = mainWindow;

      if (window && workerClient) {
        window.show();
        updaterService.checkForUpdates();

        registerAllHandlers(
          workerClient,
          db,
          syncService,
          updaterService,
          window
        );

        setTimeout(() => {
          logger.info("Main: Starting deferred background DB maintenance...");

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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeAppAndWindow();
  }
});

/**
 * Restore database from backup file
 */
export async function restoreDatabase(backupPath: string): Promise<void> {
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
