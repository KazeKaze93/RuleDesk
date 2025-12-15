import { safeStorage } from "electron";
import { logger } from "../lib/logger";

export class SecureStorage {
  /**
   * Encrypts a string using Electron's safeStorage.
   * @throws Error if encryption is unavailable or fails.
   */
  public static encrypt(plainText: string): string {
    if (!plainText) return "";

    if (!safeStorage.isEncryptionAvailable()) {
      const error = "CRITICAL: Encryption is not available on this system.";
      logger.error(`[SecureStorage] ${error}`);
      throw new Error(error);
    }

    try {
      const buffer = safeStorage.encryptString(plainText);
      return buffer.toString("base64");
    } catch (error) {
      logger.error("[SecureStorage] Encryption failed:", error);
      throw new Error("Failed to encrypt data.");
    }
  }

  /**
   * Decrypts a base64 encoded string.
   * Returns the original string or null if decryption fails.
   */
  public static decrypt(encryptedBase64: string): string | null {
    if (!encryptedBase64) return null;

    if (!safeStorage.isEncryptionAvailable()) {
      logger.error("[SecureStorage] Cannot decrypt: Encryption unavailable.");
      return null;
    }

    try {
      const buffer = Buffer.from(encryptedBase64, "base64");
      return safeStorage.decryptString(buffer);
    } catch (error) {
      logger.error("[SecureStorage] Decryption failed:", error);
      return null; // Fail safe: return null, never return raw garbage
    }
  }
}
