import { app, BrowserWindow } from "electron";
import path from "path";
import { mkdirSync, promises as fs } from "fs";
import { registerAllHandlers } from "./ipc/index";
import { initializeDatabase } from "./db"; // Только прямая база
import { logger } from "./lib/logger";
import { updaterService } from "./services/updater-service";
import { syncService } from "./services/sync-service";

// === PORTABLE MODE LOGIC ===
if (app.isPackaged) {
  const portableDataPath = path.join(path.dirname(process.execPath), "data");
  try {
    mkdirSync(portableDataPath, { recursive: true });
    app.setPath("userData", portableDataPath);
  } catch (e) {
    console.error("PORTABLE MODE: Failed to init data folder.", e);
  }
}

logger.info("🚀 Application starting...");

// Migration Logic
async function migrateUserData() {
  try {
    const oldUserDataPath = path.join(
      app.getPath("appData"),
      "NSFW Booru Client"
    );
    const newUserDataPath = path.join(app.getPath("appData"), "RuleDesk");
    try {
      await fs.access(oldUserDataPath);
      await fs.mkdir(newUserDataPath, { recursive: true });
      await fs.copyFile(
        path.join(oldUserDataPath, "metadata.db"),
        path.join(newUserDataPath, "metadata.db")
      );
    } catch {
      // New folder doesn't exist, which is what we want.
    }
  } catch (err) {
    logger.error("Migration error:", err);
  }
}
migrateUserData();

let mainWindow: BrowserWindow | null = null;
let DB_PATH: string;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.on("ready", initializeAppAndWindow);
}

async function initializeAppAndWindow() {
  try {
    DB_PATH = path.join(app.getPath("userData"), "metadata.db");

    // === 🔥 ИНИЦИАЛИЗАЦИЯ ТОЛЬКО ПРЯМОЙ БД ===
    initializeDatabase(DB_PATH);
    logger.info("✅ Main: Direct DB instance initialized.");

    // SyncService больше не требует воркера
    // syncService.setDbWorkerClient(...) — УДАЛЕНО

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

    updaterService.setWindow(mainWindow);
    syncService.setWindow(mainWindow);

    if (process.env["ELECTRON_RENDERER_URL"]) {
      mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
      mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    }

    if (process.env.NODE_ENV === "development") {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.once("ready-to-show", () => {
      if (mainWindow) {
        mainWindow.show();
        updaterService.checkForUpdates();

        // 🔥 УДАЛЕН АРГУМЕНТ dbWorkerClient
        registerAllHandlers(syncService, updaterService, mainWindow);

        // Фоновое обслуживание через 3 сек (уже без воркера, можно добавить в DbService если нужно)
        setTimeout(() => {
          logger.info("Main: App Ready.");
        }, 3000);
      }
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (e) {
    logger.error("FATAL: Init failed", e);
    app.exit(1);
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) initializeAppAndWindow();
});
