import "./bootstrap-user-data";
import { app, BrowserWindow, dialog, Tray, nativeImage, Menu, session } from "electron";
import path from "node:path";
import { existsSync, writeFileSync } from "fs";
import log from "electron-log";
import { execFile } from "node:child_process";

// === Initialize electron-log first ===
log.initialize();

// === E2E CRASH LOGGING ===
// In test mode, log all uncaught errors to a dedicated file for E2E diagnostics
// IMPORTANT: This must be set up BEFORE any imports that might fail (like better-sqlite3)
const isTestMode = process.env.NODE_ENV === "test";
let crashLogPath: string | null = null;

if (isTestMode) {
  try {
    // Get userData path early - it's set via --user-data-dir in tests
    crashLogPath = path.join(app.getPath("userData"), "crash-e2e.log");
    
    // Clear previous crash log at startup
    try {
      writeFileSync(crashLogPath, `=== E2E Crash Log Started: ${new Date().toISOString()} ===\n\n`, "utf-8");
    } catch {
      // Ignore errors if file can't be written
    }
    
    const writeCrashLog = (type: string, error: Error | unknown) => {
      if (!crashLogPath) return;
      try {
        const timestamp = new Date().toISOString();
        const errorMessage = error instanceof Error 
          ? `${error.name}: ${error.message}\n${error.stack || ""}`
          : String(error);
        const logEntry = `[${timestamp}] ${type}:\n${errorMessage}\n\n`;
        writeFileSync(crashLogPath, logEntry, { flag: "a", encoding: "utf-8" });
        log.error(`[E2E Crash Log] ${type}:`, error);
      } catch {
        // Ignore errors if file can't be written
      }
    };
    
    // Catch synchronous errors during module loading
    process.on("uncaughtException", (error) => {
      writeCrashLog("uncaughtException", error);
      // Don't exit immediately - let the error propagate so dialog can show
    });
    
    process.on("unhandledRejection", (reason) => {
      writeCrashLog("unhandledRejection", reason);
    });
    
    log.info(`[E2E] Crash logging enabled. Log file: ${crashLogPath}`);
  } catch (error) {
    log.error("[E2E] Failed to set up crash logging:", error);
  }
}

import { getAppIconPath, getAppIconsDirectory } from "./lib/app-resources";

import { promises as fs } from "fs";
import { registerAllHandlers } from "./ipc/index";
import { initializeDatabase, closeDatabase, getDb } from "./db/client";
import { logger } from "./lib/logger";
import { updaterService } from "./services/updater-service";
import { syncService } from "./services/sync-service";
import { SyncScheduler } from "./services/sync-scheduler";
import { MaintenanceScheduler } from "./services/maintenance-scheduler";
import { BackupService } from "./services/backup-service";
import { getAllProviderDomains } from "./providers";
import { eq } from "drizzle-orm";
import { settings, SETTINGS_ID } from "./db/schema";
import { container, DI_TOKENS } from "./core/di/Container";
import { reloadProxyFromSettings } from "./lib/proxy";
import { VideoProxyServer } from "./services/video-proxy-server";
import { MaintenanceService } from "./services/MaintenanceService";
import { registerMaintenanceHandlers } from "./ipc/handlers/maintenanceHandlers";

logger.info("🚀 Application starting...");

function runCommand(file: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(file, args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function hideDirectoryOnWindows(dirPath: string): Promise<void> {
  if (process.platform !== "win32") {
    return;
  }

  try {
    await fs.writeFile(path.join(dirPath, ".init"), "", { flag: "a" });
    await runCommand("attrib", ["+H", dirPath]);
  } catch (error) {
    logger.warn(`[Main] Failed to set hidden attribute on ${dirPath}:`, error);
  }
}

if (!isTestMode) {
  logger.info(`[Main] userData path: ${app.getPath("userData")}`);
  void hideDirectoryOnWindows(app.getPath("userData"));
}

const videoProxyServer = new VideoProxyServer();

app.on("before-quit", () => {
  videoProxyServer.stop();
});

if (process.platform === "linux") {
  // Enable hardware video decode where supported
  app.commandLine.appendSwitch("enable-features", "VaapiVideoDecodeLinuxGL");
}
app.commandLine.appendSwitch("ignore-gpu-blacklist");

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const syncScheduler = new SyncScheduler(syncService);
const maintenanceScheduler = new MaintenanceScheduler();
const backupService = new BackupService(syncService);
const maintenanceService = new MaintenanceService();
container.register(DI_TOKENS.SYNC_SCHEDULER, syncScheduler);

// In test mode, skip single instance lock to allow multiple test instances
// Each test uses a unique --user-data-dir, so there's no conflict
const gotTheLock = isTestMode ? true : app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.warn("Another instance is already running. Quitting...");
  app.quit();
} else {
  // Only register second-instance handler if not in test mode
  if (!isTestMode) {
    app.on("second-instance", () => {
      logger.info("Second instance detected. Focusing main window...");
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }

  app.on("ready", () => {
    // Set app user model ID for Windows taskbar (helps with icon display)
    if (process.platform === "win32") {
      app.setAppUserModelId("com.kaze.ruledesk");
    }
    initializeAppAndWindow();
  });
}

function getMigrationsPath(): string {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return path.join(process.cwd(), "drizzle");
  }

  return path.join(process.resourcesPath, "drizzle");
}

/**
 * Gets the path to the application icon for the window (taskbar/panel).
 * Uses .png for all platforms as nativeImage handles it better.
 * For Windows taskbar, Electron will use the .ico from package.json build config.
 * In development, uses the resources folder from the project root.
 * In production, uses the resources folder relative to the app path.
 */
function getIconPath(): string {
  return getAppIconPath("icon.png");
}

function getTrayIconPath(): string {
  return getAppIconPath("icon.png");
}

function loadWindowIcon(): {
  windowIcon: Electron.NativeImage | null;
  windowIconPath: string;
} {
  const windowIconPath = getIconPath();
  let windowIcon: Electron.NativeImage | null = null;

  if (!existsSync(windowIconPath)) {
    logger.error(`[Main] Window icon file not found: ${windowIconPath}`);
  } else {
    try {
      windowIcon = nativeImage.createFromPath(windowIconPath);
      if (windowIcon.isEmpty()) {
        logger.error(`[Main] Failed to load window icon from: ${windowIconPath}`);
        windowIcon = null;
      }
    } catch (error) {
      logger.error("[Main] Error loading window icon:", error);
      windowIcon = null;
    }
  }

  return { windowIcon, windowIconPath };
}

function loadRendererUrl(window: BrowserWindow): Promise<void> {
  if (process.env["ELECTRON_RENDERER_URL"]) {
    return window.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  }
  return window.loadFile(path.join(__dirname, "../renderer/index.html"));
}

function createMainWindowShowController(window: BrowserWindow): {
  ensureVisible: () => void;
} {
  let hasShown = false;
  let deferredTasksScheduled = false;

  const showWindow = (): void => {
    if (hasShown || window.isDestroyed()) {
      return;
    }
    hasShown = true;
    window.show();
    window.focus();

    if (!deferredTasksScheduled) {
      deferredTasksScheduled = true;
      scheduleDeferredStartupTasks(window);
    }
  };

  // Must attach before any await — ready-to-show can fire during DB init / loadFile.
  window.once("ready-to-show", showWindow);
  window.webContents.once("did-finish-load", () => {
    setImmediate(() => {
      if (!hasShown && !window.isDestroyed()) {
        showWindow();
      }
    });
  });

  return {
    ensureVisible: showWindow,
  };
}

function scheduleDeferredStartupTasks(window: BrowserWindow): void {
  setTimeout(() => {
    updaterService.checkForUpdates();
  }, 3000);

  void videoProxyServer.start().catch((error) => {
    logger.error("[Main] Video proxy failed to start:", error);
  });

  setTimeout(() => {
    backupService.checkAndRunAutoBackup();
  }, 5000);

  setTimeout(async () => {
    try {
      const db = getDb();
      const currentSettings = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });

      if (currentSettings?.autoSyncOnStartup && !syncService.getIsSyncing()) {
        logger.info("[Main] Auto-sync on startup triggered");
        syncService.syncAllArtists().catch((error) => {
          logger.error("[Main] Auto-sync on startup failed:", error);
        });
      }
    } catch (error) {
      logger.error("[Main] Failed to check auto-sync setting:", error);
    }
  }, 2000);

  setTimeout(() => {
    try {
      const db = getDb();
      const currentSettings = db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];
      const intervalMinutes = currentSettings?.syncIntervalMinutes ?? 0;
      syncScheduler.restart(intervalMinutes);
      createTray(window);
      maintenanceScheduler.start();
      logger.info("[Main] Deferred startup tasks completed (scheduler)");
    } catch (error) {
      logger.error("[Main] Failed deferred startup tasks:", error);
    }
  }, 1500);
}

/**
 * Генерирует Content Security Policy в зависимости от режима работы приложения.
 * В режиме разработки ослабляет политику для поддержки HMR (Vite).
 * 
 * Кешируется один раз при инициализации для избежания оверхеда на каждый запрос.
 */
let isCspHandlerConfigured = false;

function buildCspPolicy(): string {
  const isDev = process.env.NODE_ENV === "development";
  const providerDomains = getAllProviderDomains();
  const providerOrigins = providerDomains.flatMap((domain) => [
    `https://${domain}`,
    `http://${domain}`,
    `https://*.${domain}`,
    `http://*.${domain}`,
  ]);
  const localVideoProxyOrigins = ["http://127.0.0.1:*", "http://localhost:*"];
  const mediaOrigins = [
    "'self'",
    "data:",
    "blob:",
    ...providerOrigins,
    ...localVideoProxyOrigins,
  ].join(" ");
  const connectOrigins = ["'self'", ...providerOrigins];
  const devOrigins = ["http://localhost:*", "http://127.0.0.1:*"];

  if (isDev) {
    connectOrigins.push("ws://localhost:*", "ws://127.0.0.1:*", ...devOrigins);
  }

  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${devOrigins.join(" ")}`
    : "script-src 'self'";

  const directives = [
    "default-src 'self'",
    `img-src ${mediaOrigins}`,
    `media-src ${mediaOrigins}`,
    "worker-src 'self' blob:",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `connect-src ${connectOrigins.join(" ")}`,
    "font-src 'self' https://fonts.gstatic.com",
  ];

  return directives.join("; ");
}

function configureDynamicCspHeaders(): void {
  if (isCspHandlerConfigured) {
    return;
  }

  isCspHandlerConfigured = true;
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = buildCspPolicy();
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
      },
    });
  });
}

/**
 * Асинхронная функция, которая запускается после app.ready.
 * Отвечает за инициализацию Worker и создание главного окна.
 */
async function initializeAppAndWindow() {
  try {
    configureDynamicCspHeaders();
    const isDev = process.env.NODE_ENV === "development";
    logger.info(`Main: CSP configured from provider registry (${isDev ? "development" : "production"} mode)`);
    logger.info(`Main: Migrations Path: ${getMigrationsPath()}`);

    const { windowIcon, windowIconPath } = loadWindowIcon();

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      // In test mode, show window immediately to ensure Playwright can detect it
      // In normal mode, show: false and wait for ready-to-show event
      show: isTestMode,
      title: `RuleDesk v${app.getVersion()}`,
      icon: windowIcon || windowIconPath, // Use nativeImage if loaded, otherwise fallback to path
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "../preload/bridge.cjs"),
        sandbox: true,
      },
    });

    // Log window creation for debugging (especially in test mode)
    logger.info(`[Main] Window created (show: ${isTestMode}, test mode: ${isTestMode})`);
    logger.info(`[Main] Icons directory: ${getAppIconsDirectory()}`);

    // Set icon again after window creation to ensure it's applied (Windows sometimes needs this)
    if (windowIcon && !windowIcon.isEmpty()) {
      try {
        mainWindow.setIcon(windowIcon);
        logger.info(`[Main] Window icon set successfully via setIcon()`);
      } catch (error) {
        logger.error(`[Main] Failed to set window icon via setIcon():`, error);
      }
    }

    updaterService.setWindow(mainWindow);
    syncService.setWindow(mainWindow);

    const windowShowController = isTestMode
      ? null
      : createMainWindowShowController(mainWindow);

    mainWindow.webContents.on("did-finish-load", () => {
      logger.info("Renderer loaded");
    });

    logger.info("[Main] Starting parallel UI load and database initialization...");
    const rendererLoadPromise = loadRendererUrl(mainWindow);
    const dbInitPromise = initializeDatabase();

    await dbInitPromise;
    logger.info("✅ Main: Database initialized and ready.");

    registerAllHandlers(syncService, backupService, updaterService, mainWindow, videoProxyServer);
    registerMaintenanceHandlers(maintenanceService);
    reloadProxyFromSettings();

    import("./db/backfill-media-type").then(({ backfillMediaType }) => {
      backfillMediaType().catch((error) => {
        logger.error("[Main] Background media_type backfill failed:", error);
      });
    });

    await rendererLoadPromise;
    logger.info(`[Main] Renderer load finished (test mode: ${isTestMode})`);

    if (isTestMode) {
      await videoProxyServer.start();
      backupService.checkAndRunAutoBackup();
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show();
      }
      logger.info(`[Main] Test mode: Window visible: ${mainWindow.isVisible()}`);
    } else {
      windowShowController?.ensureVisible();
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
      // Don't destroy tray on window close - allow app to run in background
    });

    // Clean up tray and database when app quits
    app.on("before-quit", () => {
      syncScheduler.stop();
      maintenanceScheduler.stop();
      if (tray) {
        tray.destroy();
        tray = null;
      }
      // CRITICAL: Close database connection before quitting to prevent data corruption
      // SQLite requires explicit close() to ensure all transactions are committed
      // and WAL file is properly synchronized
      closeDatabase();
    });
  } catch (e) {
    logger.error("FATAL: Failed to initialize application or database.", e);
    
    // Don't show error dialog in headless/test mode (blocks process in CI)
    const isHeadless = isTestMode || process.env.CI === "true" || !process.env.DISPLAY;
    if (!isHeadless) {
      dialog.showErrorBox(
        "Fatal Error",
        `App initialization failed:\n${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
    
    // In test mode, don't exit immediately - let Playwright handle the error
    // This allows tests to catch and report the error properly
    if (isTestMode) {
      logger.error("[Main] Test mode: Initialization failed, but not exiting (Playwright will handle cleanup)");
      // Still set mainWindow to null so tests can detect the failure
      mainWindow = null;
      // Don't call app.exit() - let Playwright detect the failure and clean up
      return;
    }
    
    app.exit(1);
  }
}

/**
 * Creates system tray icon
 */
function createTray(_window: BrowserWindow): void {
  try {
    const trayIconPath = getTrayIconPath();
    logger.info(`[Tray] Attempting to create tray with icon: ${trayIconPath}`);

    // Check if icon file exists
    if (!existsSync(trayIconPath)) {
      logger.error(`[Tray] Icon file not found: ${trayIconPath}`);
      return;
    }

    const trayImage = nativeImage.createFromPath(trayIconPath);
    
    // Check if image was loaded successfully
    if (trayImage.isEmpty()) {
      logger.error(`[Tray] Failed to load icon image from: ${trayIconPath}`);
      return;
    }

    // Resize tray icon to appropriate size
    // Windows: 16x16 is standard, but can use larger for better visibility
    // macOS/Linux: 22x22 is standard
    const traySize = process.platform === "win32" ? 32 : 22; // Use 32x32 on Windows for better visibility
    const resizedImage = trayImage.resize({ 
      width: traySize, 
      height: traySize,
      quality: "best" // Use best quality for resizing
    });

    if (resizedImage.isEmpty()) {
      logger.error(`[Tray] Failed to resize icon image`);
      return;
    }

    logger.info(`[Tray] Icon resized to ${traySize}x${traySize}px`);

    // Destroy existing tray if any
    if (tray) {
      try {
        tray.destroy();
      } catch (_e) {
        // Ignore errors when destroying
      }
      tray = null;
    }

    tray = new Tray(resizedImage);
    tray.setToolTip("RuleDesk");

    // Create context menu for tray
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            // Window was closed - recreate it
            initializeAppAndWindow();
          }
        },
      },
      {
        label: "Hide",
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.hide();
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          if (tray) {
            tray.destroy();
            tray = null;
          }
          closeDatabase();
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);

    // Tray click handler - show/hide window
    // Use 'click' on Windows/Linux, 'click' on macOS shows context menu, so we use 'click' for all
    tray.on("click", (_event, _bounds) => {
      try {
        // On macOS, click shows context menu, so we handle it differently
        if (process.platform === "darwin") {
          // On macOS, we might want to show context menu instead
          return;
        }

        // Window was closed - recreate it
        if (!mainWindow || mainWindow.isDestroyed()) {
          initializeAppAndWindow();
          return;
        }
        
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          // Double-check before focusing
          if (!mainWindow.isDestroyed()) {
            mainWindow.focus();
          }
        }
      } catch (error) {
        logger.error("[Tray] Error in click handler:", error);
      }
    });

    // Tray double-click handler - show and focus window (Windows/Linux)
    if (process.platform !== "darwin") {
      tray.on("double-click", () => {
        try {
          if (!mainWindow || mainWindow.isDestroyed()) {
            initializeAppAndWindow();
            return;
          }
          
          mainWindow.show();
          // Double-check before focusing
          if (!mainWindow.isDestroyed()) {
            mainWindow.focus();
          }
        } catch (error) {
          logger.error("[Tray] Error in double-click handler:", error);
        }
      });
    }

    logger.info(`[Tray] System tray created successfully with icon: ${trayIconPath}`);
  } catch (error) {
    logger.error("[Tray] Failed to create system tray:", error);
  }
}

app.on("window-all-closed", () => {
  // In test mode, don't quit when all windows are closed
  // Playwright manages the app lifecycle and will close it explicitly
  if (isTestMode) {
    logger.info("[Main] Test mode: window-all-closed event ignored (Playwright manages lifecycle)");
    return;
  }
  
  // On macOS, keep app running even when all windows are closed
  // On other platforms, quit only if tray is not available
  if (process.platform !== "darwin") {
    // If tray exists, don't quit - allow running in background
    if (!tray) {
      // CRITICAL: Close database connection before quitting to prevent data corruption
      closeDatabase();
      app.quit();
    }
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeAppAndWindow();
  }
});

