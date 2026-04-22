import { app, BrowserWindow, dialog, Tray, nativeImage, Menu, session } from "electron";
import path from "node:path";
import { mkdirSync, existsSync, writeFileSync } from "fs";
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
        // Also log to console for immediate visibility
        console.error(`[E2E Crash Log] ${type}:`, error);
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
    
    console.log(`[E2E] Crash logging enabled. Log file: ${crashLogPath}`);
  } catch (error) {
    // If crash logging setup fails, log to console
    console.error("[E2E] Failed to set up crash logging:", error);
  }
}

// === PORTABLE MODE LOGIC ===

// === PORTABLE MODE LOGIC ===
if (app.isPackaged) {
  const portableDataPath = path.join(path.dirname(process.execPath), "data");

  try {
    mkdirSync(portableDataPath, { recursive: true });

    app.setPath("userData", portableDataPath);

    log.info(`[PortableMode] Active. Path: ${portableDataPath}`);
  } catch (e) {
    log.error(
      "[PortableMode] Failed to init data folder. Fallback to default.",
      e
    );
  }
}

import { promises as fs } from "fs";
import { registerAllHandlers } from "./ipc/index";
import { initializeDatabase, closeDatabase, getDb } from "./db/client";
import { logger } from "./lib/logger";
import { updaterService } from "./services/updater-service";
import { syncService } from "./services/sync-service";
import { SyncScheduler } from "./services/sync-scheduler";
import { USER_DATA_DIR_NAME } from "./db/paths";
import { getAllProviderDomains } from "./providers";
import { eq } from "drizzle-orm";
import { settings, SETTINGS_ID } from "./db/schema";
import { container, DI_TOKENS } from "./core/di/Container";

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

function configureUserDataPath(): void {
  try {
    if (app.isPackaged) {
      return;
    }

    const neutralRoot =
      process.platform === "win32"
        ? process.env.LOCALAPPDATA || app.getPath("appData")
        : app.getPath("appData");
    const neutralUserDataPath = path.join(neutralRoot, USER_DATA_DIR_NAME);

    mkdirSync(neutralUserDataPath, { recursive: true });
    app.setPath("userData", neutralUserDataPath);
    void hideDirectoryOnWindows(neutralUserDataPath);
    logger.info(`[Main] userData path set to neutral directory: ${neutralUserDataPath}`);
  } catch (err) {
    logger.error("[Main] Failed to configure neutral userData path:", err);
  }
}

configureUserDataPath();

process.env.USER_DATA_PATH = app.getPath("userData");

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const syncScheduler = new SyncScheduler(syncService);
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
  const isDev = process.env.NODE_ENV === "development";
  const iconsFolder = isDev
    ? path.join(process.cwd(), "resources", "icons")
    : path.join(__dirname, "../../resources/icons");

  // Use PNG - nativeImage handles it better than ICO
  // For Windows taskbar, the .ico from package.json build config will be used automatically
  return path.join(iconsFolder, "icon.png");
}

/**
 * Gets the path to the tray icon.
 * Uses .png for all platforms as nativeImage handles it better than .ico
 */
function getTrayIconPath(): string {
  const isDev = process.env.NODE_ENV === "development";
  const iconsFolder = isDev
    ? path.join(process.cwd(), "resources", "icons")
    : path.join(__dirname, "../../resources/icons");

  // Use PNG for tray - nativeImage handles PNG better than ICO
  return path.join(iconsFolder, "icon.png");
}

/**
 * Создает простое окно загрузки для отображения во время миграций БД
 */
function createLoadingWindow(): BrowserWindow {
  const loadingWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // CRITICAL: Enable sandbox for Electron 39+ security
    },
  });

  loadingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .container {
          text-align: center;
        }
        .spinner {
          border: 3px solid rgba(255,255,255,0.1);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .text {
          font-size: 14px;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <div class="text">Initializing database...</div>
      </div>
    </body>
    </html>
  `)}`);

  loadingWindow.center();
  return loadingWindow;
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
  const mediaOrigins = ["'self'", "data:", "blob:", ...providerOrigins].join(" ");
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
  let loadingWindow: BrowserWindow | null = null;

  try {
    configureDynamicCspHeaders();
    const isDev = process.env.NODE_ENV === "development";
    logger.info(`Main: CSP configured from provider registry (${isDev ? "development" : "production"} mode)`);

    const MIGRATIONS_PATH = getMigrationsPath();
    logger.info(`Main: Migrations Path: ${MIGRATIONS_PATH}`);

    // Show loading window during database initialization (skip in test mode)
    if (!isTestMode) {
      loadingWindow = createLoadingWindow();
      loadingWindow.show();
    }

    // Initialize database asynchronously (migrations may take time)
    // Add extra logging around database initialization to catch silent crashes in CI
    logger.info("[Main] Starting database initialization...");
    try {
      await initializeDatabase();
      logger.info("✅ Main: Database initialized and ready.");
    } catch (error) {
      logger.error("[Main] FATAL: Database initialization failed:", error);
      // Re-throw to be caught by outer try-catch
      throw error;
    }
    
    // Start background backfill for media_type column (non-blocking)
    // This runs after migrations to avoid blocking app startup
    import("./db/backfill-media-type").then(({ backfillMediaType }) => {
      // Run backfill asynchronously without blocking UI
      backfillMediaType().catch((error) => {
        logger.error("[Main] Background media_type backfill failed:", error);
      });
    });

    // Close loading window
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
      loadingWindow = null;
    }

    // Get icon path and load using nativeImage for better compatibility
    const windowIconPath = getIconPath();
    logger.info(`[Main] Window icon path: ${windowIconPath}`);
    
    let windowIcon: Electron.NativeImage | null = null;
    
    // Check if icon file exists and load it
    if (!existsSync(windowIconPath)) {
      logger.error(`[Main] Window icon file not found: ${windowIconPath}`);
    } else {
      try {
        windowIcon = nativeImage.createFromPath(windowIconPath);
        if (windowIcon.isEmpty()) {
          logger.error(`[Main] Failed to load window icon from: ${windowIconPath}`);
          windowIcon = null;
        } else {
          const iconSize = windowIcon.getSize();
          logger.info(`[Main] Window icon loaded successfully, size: ${iconSize.width}x${iconSize.height}px`);
        }
      } catch (error) {
        logger.error(`[Main] Error loading window icon:`, error);
        windowIcon = null;
      }
    }

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

    mainWindow.webContents.on("did-finish-load", () => {
      logger.info("Renderer loaded");
    });

    if (process.env["ELECTRON_RENDERER_URL"]) {
      mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
      mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    }

    // Log window URL loading for debugging
    logger.info(`[Main] Loading window URL (test mode: ${isTestMode})`);

    // In test mode, skip ready-to-show listener and initialize IPC immediately
    // ready-to-show may not fire reliably in headless CI environments
    if (isTestMode) {
      logger.info("[Main] Test mode: Skipping ready-to-show listener, initializing IPC immediately");
      // Initialize IPC immediately so tests can interact with the app
      registerAllHandlers(syncService, updaterService, mainWindow);
      
      // Log window state for debugging
      logger.info(`[Main] Test mode: Window created, visible: ${mainWindow.isVisible()}, destroyed: ${mainWindow.isDestroyed()}`);
      
      // Ensure window is visible (it should already be with show: true, but double-check)
      mainWindow.webContents.once("did-finish-load", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          logger.info(`[Main] Test mode: did-finish-load fired, window visible: ${mainWindow.isVisible()}`);
          if (!mainWindow.isVisible()) {
            mainWindow.show();
            logger.info("[Main] Test mode: Window shown explicitly after did-finish-load");
          }
          logger.info("[Main] Test mode: Window ready for Playwright");
        }
      });
    } else {
      // Normal mode: wait for ready-to-show event
      mainWindow.once("ready-to-show", () => {
        const window = mainWindow;

        if (window) {
          window.show();
          updaterService.checkForUpdates();

          // Initialize IPC architecture (controllers + legacy handlers)
          // setupIpc is called inside registerAllHandlers now
          registerAllHandlers(syncService, updaterService, window);

          // Auto-sync on startup
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
          }, 2000); // 2s delay: let UI settle before starting sync

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
          } catch (error) {
            logger.error("[Main] Failed to start sync scheduler:", error);
          }

          // Create system tray
          createTray(window);

          setTimeout(() => {
            logger.info("Main: DB maintenance skipped for now (direct DB mode)");
          }, 3000);
        }
      });
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
      // Don't destroy tray on window close - allow app to run in background
    });

    // Clean up tray and database when app quits
    app.on("before-quit", () => {
      syncScheduler.stop();
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
    // Close loading window if it's still open
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
    }

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
          // Destroy tray first
          if (tray) {
            tray.destroy();
            tray = null;
          }
          // CRITICAL: Close database connection before quitting to prevent data corruption
          // SQLite requires explicit close() to ensure all transactions are committed
          closeDatabase();
          // Then quit the app
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

