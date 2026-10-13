import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { getDb } from "../../db/client";
import { settings, SETTINGS_ID } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";

/**
 * Auth Controller
 *
 * Handles authentication-related IPC operations:
 * - Logout (clear API key)
 */
// Query style: Drizzle Builder API only in this controller.
export class AuthController extends BaseController {
  /**
   * Setup IPC handlers for auth operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.APP.LOGOUT,
      z.tuple([]),
      this.logout.bind(this)
    );

    log.info("[AuthController] All handlers registered");
  }

  /**
   * Logout user by clearing API key
   *
   * @param _event - IPC event (unused)
   * @returns true if logout succeeded
   */
  private async logout(_event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      const db = getDb();
      
      // Clear API key atomically
      await db
        .update(settings)
        .set({ encryptedApiKey: "" })
        .where(eq(settings.id, SETTINGS_ID))
        .run();
      
      log.info("[AuthController] User logged out (API key cleared)");
      return true;
    } catch (error) {
      log.error("[AuthController] Logout failed:", error);
      throw error;
    }
  }
}
