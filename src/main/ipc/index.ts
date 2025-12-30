import { BrowserWindow } from "electron";
import log from "electron-log";

import { SystemController } from "./controllers/SystemController";
import { ArtistsController } from "./controllers/ArtistsController";
import { PostsController } from "./controllers/PostsController";
import { SettingsController } from "./controllers/SettingsController";
import { AuthController } from "./controllers/AuthController";
import { MaintenanceController } from "./controllers/MaintenanceController";
import { ViewerController } from "./controllers/ViewerController";
import { FileController } from "./controllers/FileController";
import { SearchController } from "./controllers/SearchController";
import { SyncService } from "../services/sync-service";
import { UpdaterService } from "../services/updater-service";
import { getDb } from "../db/client";
import { container, DI_TOKENS } from "../core/di/Container";

/**
 * Setup IPC Handlers
 * 
 * Initializes DI Container and registers all IPC controllers.
 * Called once during application startup.
 * 
 * @returns Object with controllers that need window reference
 */
export function setupIpc(): { maintenanceController: MaintenanceController; fileController: FileController } {
  log.info("[IPC] Setting up IPC handlers...");

  // Register database in DI container (using type-safe tokens)
  const db = getDb();
  container.register(DI_TOKENS.DB, db);
  log.info("[IPC] Database registered in DI container");

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

  const viewerController = new ViewerController();
  viewerController.setup();

  const fileController = new FileController();
  fileController.setup();

  const searchController = new SearchController();
  searchController.setup();

  log.info("[IPC] All controllers initialized successfully");
  
  return { maintenanceController, fileController }; // Return for window injection
}

/**
 * Register services in DI container (called after services are initialized)
 * 
 * @param syncService - Sync service instance
 */
export function registerServices(syncService: SyncService): void {
  container.register(DI_TOKENS.SYNC_SERVICE, syncService);
  log.info("[IPC] SyncService registered in DI container");
}

/**
 * Set main window for controllers that need it (backup/restore, file dialogs)
 * 
 * @param controllers - Controllers that need window reference
 * @param mainWindow - Main browser window
 */
export function setControllerWindows(
  controllers: { maintenanceController: MaintenanceController; fileController: FileController },
  mainWindow: BrowserWindow
): void {
  controllers.maintenanceController.setMainWindow(mainWindow);
  controllers.fileController.setMainWindow(mainWindow);
  log.info("[IPC] Window references set for controllers");
}


// --- Main Registration Function ---
export const registerAllHandlers = (
  syncService: SyncService,
  _updaterService: UpdaterService,
  mainWindow: BrowserWindow
) => {
  log.info("[IPC] Registering all handlers...");

  // Initialize all controllers
  const controllers = setupIpc();
  registerServices(syncService);
  setControllerWindows(controllers, mainWindow);

  log.info("[IPC] All handlers registered (controllers only - migration complete).");
};
