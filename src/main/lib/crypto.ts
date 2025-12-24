import { safeStorage } from "electron";
import { logger } from "./logger";

/**
 * Encrypts a string using Electron's safeStorage.
 * @throws Error if encryption is unavailable or fails.
 */
export function encrypt(plainText: string): string {
  if (!plainText) return "";

  if (!safeStorage.isEncryptionAvailable()) {
    const error = "CRITICAL: Encryption is not available on this system.";
    logger.error(`[Crypto] ${error}`);
    throw new Error(error);
  }

  try {
    const buffer = safeStorage.encryptString(plainText);
    return buffer.toString("base64");
  } catch (error) {
    logger.error("[Crypto] Encryption failed:", error);
    throw new Error("Failed to encrypt data.");
  }
}

