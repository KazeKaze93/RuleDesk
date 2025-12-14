import { app, BrowserWindow, dialog } from "electron";
import * as path from "path";
import { registerIpcHandlers } from "./ipc";
import Database from "better-sqlite3";
import { DbService } from "./db/db-service";
import { logger } from "./lib/logger";
import { runMigrations } from "./db/migrate";
import { updaterService } from "./services/updater-service";
import { syncService } from "./services/sync-service";

logger.info("🚀 Application starting...");

let dbService: DbService;
let mainWindow: BrowserWindow | null = null;

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

  initializeAppAndReady();
}

async function initializeAppAndReady() {
  try {
    const DB_PATH = path.join(app.getPath("userData"), "metadata.db");
    // Verbose logging disabled for performance in prod
    const dbInstance = new Database(DB_PATH, {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    });
    dbService = new DbService(dbInstance);

    syncService.setDbService(dbService);

    // 1. Run Migrations (Must be sync/blocking to ensure integrity)
    runMigrations(dbService.db);

    // 2. Init IPC
    registerIpcHandlers(dbService, syncService);
  } catch (e) {
    logger.error("FATAL: Failed to initialize database.", e);
    dialog.showErrorBox(
      "Fatal Error",
      `App initialization failed:\n${
        e instanceof Error ? e.message : String(e)
      }`
    );
    app.exit(1);
  }

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
    if (mainWindow) mainWindow.show();
    updaterService.checkForUpdates();

    // ⚡ DEFERRED DATABASE MAINTENANCE
    // We delay this by 3 seconds to allow the UI to fully paint and become interactive.
    // This mitigates the impact of better-sqlite3 being synchronous on the main thread.
    // Ideally, this should move to a Worker Thread in v1.1.
    setTimeout(() => {
      logger.info("Main: Starting deferred background DB maintenance...");
      Promise.all([dbService.fixDatabaseSchema(), dbService.repairArtistTags()])
        .then(() => {
          logger.info("✅ Main: DB maintenance complete.");
        })
        .catch((err) => {
          logger.error("❌ Main: DB maintenance failed", err);
        });
    }, 3000);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

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
