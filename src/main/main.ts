import { app, BrowserWindow, dialog, Tray, nativeImage } from "electron";
import path from "node:path";
import { mkdirSync, existsSync } from "fs";
import log from "electron-log";

// === Initialize electron-log first ===
log.initialize();

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
import { initializeDatabase } from "./db/client";
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

migrateUserData();

process.env.USER_DATA_PATH = app.getPath("userData");

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

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
let cachedCSPPolicy: string | null = null;

function getCSPPolicy(): string {
  // Return cached policy if already generated
  if (cachedCSPPolicy !== null) {
    return cachedCSPPolicy;
  }

  // CRITICAL: Ensure NODE_ENV is properly set in production builds
  // In production, NODE_ENV should be 'production' (not 'development' or undefined)
  const isDev = process.env.NODE_ENV === "development";
  
  // Additional safety check: if NODE_ENV is not explicitly set, assume production for security
  // This prevents accidental unsafe-eval in production if NODE_ENV is missing
  const isProduction = !isDev;

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';" // HMR требует unsafe-inline/eval
    : "script-src 'self';"; // Строгая политика в продакшене

  const connectSrc = isDev
    ? "connect-src 'self' https://api.rule34.xxx ws: ws://localhost:* http://localhost:*;" // WebSocket для HMR
    : "connect-src 'self' https://api.rule34.xxx;"; // Только необходимые источники в продакшене

  // NOTE: For desktop Electron app, 'unsafe-inline' for styles is acceptable
  // Nonce-based CSP requires nonce injection at HTML build time, which is complex with Vite
  // Hash-based CSP is also complex as it requires pre-computing hashes of all inline styles
  // For desktop app (not web), CSS injection risk is lower than in web applications
  // If you need stricter CSP, consider:
  // 1. Moving all styles to external CSS files (no inline styles)
  // 2. Using webRequest.onBeforeRequest to inject nonce into HTML body (complex)
  // 3. Modifying Vite build to inject nonce into HTML template
  const styleSrc = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;";

  cachedCSPPolicy =
    "default-src 'self'; " +
    scriptSrc +
    " " +
    styleSrc +
    "img-src 'self' https://*.rule34.xxx https://*.gelbooru.com data: blob:; " + // Картинки с R34 и Gelbooru
    "media-src 'self' https://*.rule34.xxx https://*.gelbooru.com; " + // Видео только с R34 и Gelbooru (безопасность)
    connectSrc +
    " " +
    "font-src 'self' https://fonts.gstatic.com;"; // Разрешаем загрузку шрифтов с Google Fonts

  // CRITICAL SECURITY: Assert that unsafe-eval is NOT in production build
  // This prevents accidental inclusion of unsafe-eval in production CSP
  // Check both isDev flag and actual CSP content for defense in depth
  if (isProduction && cachedCSPPolicy.includes("unsafe-eval")) {
    const errorMessage = "SECURITY VIOLATION: unsafe-eval found in production CSP policy!";
    logger.error(errorMessage, { 
      cspPolicy: cachedCSPPolicy,
      nodeEnv: process.env.NODE_ENV,
      isDev,
      isProduction,
    });
    throw new Error(errorMessage);
  }

  return cachedCSPPolicy;
}

/**
 * Асинхронная функция, которая запускается после app.ready.
 * Отвечает за инициализацию Worker и создание главного окна.
 */
async function initializeAppAndWindow() {
  let loadingWindow: BrowserWindow | null = null;

  try {
    // Setup Content Security Policy (cached once at initialization)
    const cspPolicy = getCSPPolicy();
    const isDev = process.env.NODE_ENV === "development";
    logger.info(
      `Main: CSP configured for ${isDev ? "development" : "production"} mode`
    );

    const MIGRATIONS_PATH = getMigrationsPath();
    logger.info(`Main: Migrations Path: ${MIGRATIONS_PATH}`);

    // Show loading window during database initialization
    loadingWindow = createLoadingWindow();
    loadingWindow.show();

    // Initialize database asynchronously (migrations may take time)
    await initializeDatabase();
    logger.info("✅ Main: Database initialized and ready.");
    
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
      show: false,
      title: `RuleDesk v${app.getVersion()}`,
      icon: windowIcon || windowIconPath, // Use nativeImage if loaded, otherwise fallback to path
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "../preload/bridge.cjs"),
        sandbox: true,
      },
    });

    // Set icon again after window creation to ensure it's applied (Windows sometimes needs this)
    if (windowIcon && !windowIcon.isEmpty()) {
      try {
        mainWindow.setIcon(windowIcon);
        logger.info(`[Main] Window icon set successfully via setIcon()`);
      } catch (error) {
        logger.error(`[Main] Failed to set window icon via setIcon():`, error);
      }
    }

    // Setup Content Security Policy for this specific window (not global)
    // This is more efficient than using session.defaultSession, as it only applies to this window's requests
    // CRITICAL: Only apply CSP to our application's requests, not to external resources
    // This prevents breaking third-party content (WebView, external APIs) while securing our app
    
    // Get application path to restrict CSP to app-specific files only
    // This prevents CSP from affecting other windows, WebView, or external local files
    const appPath = app.getAppPath();
    // Normalize path separators for URL pattern (Windows uses \, but URLs use /)
    const appPathNormalized = appPath.replace(/\\/g, "/");
    // Escape special characters in path for URL pattern matching
    const appPathEscaped = appPathNormalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // CRITICAL: Restrict CSP filter to application-specific paths only
    // This prevents CSP from affecting other windows, WebView, or external local files
    // Pattern: file://{appPath}/* for app files, http://localhost for dev server
    const cspUrlPatterns = [
      `file://${appPathEscaped}/*`, // Only app-specific local files (not all file:// URLs)
      "http://localhost/*", // Localhost with path (dev mode with Vite HMR)
      "http://127.0.0.1/*", // 127.0.0.1 with path (dev mode with Vite HMR)
    ];
    
    // Apply CSP headers to responses
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      {
        urls: cspUrlPatterns,
      },
      (details, callback) => {
        // Preserve existing security headers from server (if any)
        // Merge our CSP with existing headers (don't overwrite)
        const existingHeaders = details.responseHeaders || {};
        const existingCSP = existingHeaders["content-security-policy"] || existingHeaders["Content-Security-Policy"];
        
        callback({
          responseHeaders: {
            ...existingHeaders,
            "Content-Security-Policy": existingCSP 
              ? [`${existingCSP.join(", ")}, ${cspPolicy}`] 
              : [cspPolicy],
          },
        });
      }
    );

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
      const window = mainWindow;

      if (window) {
        window.show();
        updaterService.checkForUpdates();

        // Initialize IPC architecture (controllers + legacy handlers)
        // setupIpc is called inside registerAllHandlers now
        registerAllHandlers(syncService, updaterService, window);

        // Create system tray
        createTray(window);

        setTimeout(() => {
          logger.info("Main: DB maintenance skipped for now (direct DB mode)");
        }, 3000);
      }
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
      // Don't destroy tray on window close - allow app to run in background
    });

    // Clean up tray when app quits
    app.on("before-quit", () => {
      if (tray) {
        tray.destroy();
        tray = null;
      }
    });
  } catch (e) {
    // Close loading window if it's still open
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
    }

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

    // Tray click handler - show/hide window
    // Use 'click' on Windows/Linux, 'click' on macOS shows context menu, so we use 'click' for all
    tray.on("click", (_event, _bounds) => {
      try {
        // On macOS, click shows context menu, so we handle it differently
        if (process.platform === "darwin") {
          // On macOS, we might want to show context menu instead
          return;
        }

        // Check if window exists and is not destroyed
        if (!mainWindow) {
          logger.warn("[Tray] Main window is null");
          return;
        }

        if (mainWindow.isDestroyed()) {
          logger.warn("[Tray] Main window is destroyed");
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
          if (!mainWindow) {
            logger.warn("[Tray] Main window is null");
            return;
          }

          if (mainWindow.isDestroyed()) {
            logger.warn("[Tray] Main window is destroyed");
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
  // On macOS, keep app running even when all windows are closed
  // On other platforms, quit only if tray is not available
  if (process.platform !== "darwin") {
    // If tray exists, don't quit - allow running in background
    if (!tray) {
      app.quit();
    }
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeAppAndWindow();
  }
});

