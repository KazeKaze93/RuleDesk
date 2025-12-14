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

// Global references to prevent garbage collection
let dbService: DbService;
let mainWindow: BrowserWindow | null = null;

// --- SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.warn("Another instance is already running. Quitting...");
  app.quit();
} else {
  // Handle second instance launch
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
    const dbInstance = new Database(DB_PATH, { verbose: console.log });
    dbService = new DbService(dbInstance);

    syncService.setDbService(dbService);

    // 1. Run Migrations (Critical - must block start)
    runMigrations(dbService.db);

    // 2. ⚡ BACKGROUND MAINTENANCE (Fire & Forget)
    // We do NOT await here. The window will open while this runs in the background.
    logger.info("Main: Starting background DB maintenance...");
    Promise.all([
      dbService.fixDatabaseSchema(), // Remove duplicates / Add Index
      dbService.repairArtistTags(), // Normalize tags
    ])
      .then(() => {
        logger.info("✅ Main: Background DB maintenance complete.");
      })
      .catch((err) => {
        logger.error("❌ Main: Background DB maintenance failed", err);
      });

    // 3. Init IPC
    registerIpcHandlers(dbService, syncService);
  } catch (e) {
    logger.error("FATAL: Failed to initialize database.", e);

    dialog.showErrorBox(
      "Fatal Error: Application Initialization Failed",
      `The application could not start due to a critical error.\n\nError Details:\n${
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
    show: false, // Wait for 'ready-to-show' to prevent flickering
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
