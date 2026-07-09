import { safeStorage } from "electron";
import { logger } from "./logger";
import {
  encodeTestCredential,
  isTestRuntime,
} from "./test-credential-cipher";

/**
 * Encrypts a string using Electron's safeStorage.
 * In NODE_ENV=test, falls back to reversible test encoding when safeStorage is unavailable (headless CI).
 * @throws Error if encryption is unavailable or fails outside the test fallback path.
 */
export function encrypt(plainText: string): string {
  if (!plainText) return "";

  if (!safeStorage.isEncryptionAvailable()) {
    if (isTestRuntime()) {
      logger.warn(
        "[Crypto] safeStorage unavailable in test mode; using test credential encoding"
      );
      return encodeTestCredential(plainText);
    }
    const error = "CRITICAL: Encryption is not available on this system.";
    logger.error(`[Crypto] ${error}`);
    throw new Error(error);
  }

  try {
    const buffer = safeStorage.encryptString(plainText);
    return buffer.toString("base64");
  } catch (error) {
    if (isTestRuntime()) {
      logger.warn(
        "[Crypto] safeStorage encrypt failed in test mode; using test credential encoding",
        error
      );
      return encodeTestCredential(plainText);
    }
    logger.error("[Crypto] Encryption failed:", error);
    throw new Error("Failed to encrypt data.");
  }
}
