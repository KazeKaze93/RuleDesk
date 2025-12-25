import { BrowserWindow } from "electron";
import log from "electron-log";

import { SystemController } from "./controllers/SystemController";
import { ArtistsController } from "./controllers/ArtistsController";
import { PostsController } from "./controllers/PostsController";
import { SettingsController } from "./controllers/SettingsController";
import { AuthController } from "./controllers/AuthController";
import { MaintenanceController } from "./controllers/MaintenanceController";
import { SyncService } from "../services/sync-service";
import { UpdaterService } from "../services/updater-service";
import { ProviderFactory } from "../services/providers/ProviderFactory";
import { getDb } from "../db/client";
import { container, DI_KEYS } from "../core/di/Container";

import { registerViewerHandlers } from "./handlers/viewer";
import { registerFileHandlers } from "./handlers/files";

/**
 * Setup IPC Handlers
 * 
 * Initializes DI Container and registers all IPC controllers.
 * Called once during application startup.
 */
export function setupIpc(): MaintenanceController {
  log.info("[IPC] Setting up IPC handlers...");

  // Register database in DI container
  const db = getDb();
  container.register(DI_KEYS.DB, db);
  log.info("[IPC] Database registered in DI container");

  // Register provider factory
  const providerFactory = new ProviderFactory();
  container.register(DI_KEYS.PROVIDER_FACTORY, providerFactory);
  log.info("[IPC] ProviderFactory registered in DI container");

  // Register core controllers
  const systemController = new SystemController();
  systemController.setup();

  const artistsController = new ArtistsController();
  artistsController.setup();

  const postsController = new PostsController();
  postsController.setup();

  const settingsController = new SettingsController();
  settingsController.setup();

  const authController = new AuthController();
  authController.setup();

  const maintenanceController = new MaintenanceController();
  maintenanceController.setup();

  log.info("[IPC] All controllers initialized successfully");
  
  return maintenanceController; // Return for window injection
}

/**
 * Register services in DI container (called after services are initialized)
 * 
 * @param syncService - Sync service instance
 */
export function registerServices(syncService: SyncService): void {
  container.register(DI_KEYS.SYNC_SERVICE, syncService);
  log.info("[IPC] SyncService registered in DI container");
}

/**
 * Set main window for MaintenanceController (needed for backup/restore UI feedback)
 * 
 * @param maintenanceController - MaintenanceController instance
 * @param mainWindow - Main browser window
 */
export function setMaintenanceWindow(
  maintenanceController: MaintenanceController,
  mainWindow: BrowserWindow
): void {
  maintenanceController.setMainWindow(mainWindow);
  log.info("[IPC] MaintenanceController window reference set");
}


// --- Main Registration Function ---
export const registerAllHandlers = (
  syncService: SyncService,
  _updaterService: UpdaterService,
  mainWindow: BrowserWindow
) => {
  log.info("[IPC] Registering all handlers...");

  // Initialize controllers and get MaintenanceController instance
  const maintenanceController = setupIpc();
  registerServices(syncService);
  setMaintenanceWindow(maintenanceController, mainWindow);

  // ⚠️ TODO: Migrate remaining handlers to controllers
  registerViewerHandlers();
  registerFileHandlers();

  log.info("[IPC] All handlers registered (controllers + legacy).");
};
