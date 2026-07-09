import { safeStorage } from "electron";
import { logger } from "../lib/logger";
import {
  decodeTestCredential,
  encodeTestCredential,
  isTestEncodedCredential,
  isTestRuntime,
} from "../lib/test-credential-cipher";

export class SecureStorage {
  /**
   * Encrypts a string using Electron's safeStorage.
   * @throws Error if encryption is unavailable or fails outside the test fallback path.
   */
  public static encrypt(plainText: string): string {
    if (!plainText) return "";

    if (!safeStorage.isEncryptionAvailable()) {
      if (isTestRuntime()) {
        logger.warn(
          "[SecureStorage] safeStorage unavailable in test mode; using test credential encoding"
        );
        return encodeTestCredential(plainText);
      }
      const error = "CRITICAL: Encryption is not available on this system.";
      logger.error(`[SecureStorage] ${error}`);
      throw new Error(error);
    }

    try {
      const buffer = safeStorage.encryptString(plainText);
      return buffer.toString("base64");
    } catch (error) {
      if (isTestRuntime()) {
        logger.warn(
          "[SecureStorage] safeStorage encrypt failed in test mode; using test credential encoding",
          error
        );
        return encodeTestCredential(plainText);
      }
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

    if (isTestRuntime() && isTestEncodedCredential(encryptedBase64)) {
      return decodeTestCredential(encryptedBase64);
    }

    if (!safeStorage.isEncryptionAvailable()) {
      logger.error("[SecureStorage] Cannot decrypt: Encryption unavailable.");
      return null;
    }

    try {
      const buffer = Buffer.from(encryptedBase64, "base64");
      return safeStorage.decryptString(buffer);
    } catch (error) {
      logger.error("[SecureStorage] Decryption failed:", error);
      return null;
    }
  }
}
