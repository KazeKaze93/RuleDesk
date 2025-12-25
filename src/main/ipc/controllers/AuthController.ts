import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import type { SyncService } from "../../services/sync-service";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * Auth Controller
 *
 * Handles authentication-related IPC operations:
 * - Verify credentials
 * - Logout (clear API key)
 */
export class AuthController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  private getSyncService(): SyncService {
    return container.resolve(DI_TOKENS.SYNC_SERVICE);
  }

  /**
   * Setup IPC handlers for auth operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.APP.VERIFY_CREDS,
      z.tuple([]),
      this.verifyCredentials.bind(this)
    );
    this.handle(
      IPC_CHANNELS.APP.LOGOUT,
      z.tuple([]),
      this.logout.bind(this)
    );

    log.info("[AuthController] All handlers registered");
  }

  /**
   * Verify user credentials
   *
   * @param _event - IPC event (unused)
   * @returns true if credentials are valid, false otherwise
   */
  private async verifyCredentials(_event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      const syncService = this.getSyncService();
      return await syncService.checkCredentials();
    } catch (error) {
      log.error("[AuthController] Failed to verify credentials:", error);
      throw error;
    }
  }

  /**
   * Logout user by clearing API key
   *
   * @param _event - IPC event (unused)
   * @returns true if logout succeeded
   */
  private async logout(_event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      const db = this.getDb();
      
      // Clear API key atomically
      await db
        .update(settings)
        .set({ encryptedApiKey: "" })
        .where(eq(settings.id, 1));
      
      log.info("[AuthController] User logged out (API key cleared)");
      return true;
    } catch (error) {
      log.error("[AuthController] Logout failed:", error);
      throw error;
    }
  }
}

